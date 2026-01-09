'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useTranslation } from '@/components/translation-provider'

// Cross-window/component messaging helper (receiver)
function setupAppMessageListener(onMessage: (msg: any) => void) {
  const listeners: Array<() => void> = []

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('app-updates')
      const handler = (ev: MessageEvent) => onMessage(ev.data)
      channel.addEventListener('message', handler)
      listeners.push(() => channel.removeEventListener('message', handler))
      listeners.push(() => channel.close())
      return () => listeners.forEach((l) => l())
    }
  } catch (e) {
    // ignore
  }

  // storage event fallback
  const storageHandler = (ev: StorageEvent) => {
    if (ev.key !== 'app-updates') return
    try {
      const data = ev.newValue ? JSON.parse(ev.newValue) : null
      if (data) onMessage(data)
    } catch (e) {
      // ignore
    }
  }
  window.addEventListener('storage', storageHandler)
  listeners.push(() => window.removeEventListener('storage', storageHandler))

  // custom event fallback (same-window)
  const customHandler = (ev: any) => onMessage(ev.detail)
  window.addEventListener('app-updates', customHandler as EventListener)
  listeners.push(() => window.removeEventListener('app-updates', customHandler as EventListener))

  return () => listeners.forEach((l) => l())
}

interface Finance {
  id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  description: string
  reference?: string
  createdAt: string
  booking?: {
    customerName: string
    vehicleInfo?: string
  }
  excess?: {
    type: string
  }
  bankCard?: {
    id: string
    cardNumber: string
    cardHolderName: string
    balance: number
  }
}

interface FinanceSummary {
  totalCredit: number
  totalDebit: number
  balance: number
}

export function FinanceClient() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId')
  const [finances, setFinances] = useState<Finance[]>([])
  const [summary, setSummary] = useState<any>({
    totalCredit: 0,
    totalDebit: 0,
    totalExpenses: 0,
    totalDue: 0,
    balance: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchFinances()
  }, [typeFilter, userIdParam])

  // Listen for booking-created messages and refresh finances
  useEffect(() => {
    const cleanup = setupAppMessageListener((msg) => {
      try {
        if (msg && msg.event === 'booking-created') {
          // refresh finances to include the new booking finance record
          fetchFinances()
        }
      } catch (e) {
        console.warn('Error handling app-updates message', e)
      }
    })

    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  const fetchFinances = async () => {
    try {
      let url = typeFilter === 'all' 
        ? '/api/finance' 
        : `/api/finance?type=${typeFilter}`
      if (userIdParam) {
        url += url.includes('?') ? `&userId=${userIdParam}` : `?userId=${userIdParam}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFinances(data.finances)
        setSummary(data.summary)
      }
    } catch (error) {
      toast({
        title: t('errors.error'),
        description: t('finance.loadFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFinances = finances.filter((finance) =>
    finance.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    finance.booking?.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = [
    {
      title: t('finance.totalBalance'),
      value: formatCurrency(Number(summary.balance)),
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('finance.totalRevenue'),
      value: formatCurrency(Number(summary.totalCredit)),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('finance.totalExpenses'),
      value: formatCurrency(Number(summary.totalExpenses ?? summary.totalDebit)),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-gray-600 mt-1">{t('finance.subtitle')}</p>
        </div>
        <Button variant="outline">
          <Download className="ml-2 h-4 w-4" />
          {t('finance.export')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('finance.searchPlaceholder')}
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('finance.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('finance.allTransactions')}</SelectItem>
                <SelectItem value="CREDIT">{t('finance.revenue')}</SelectItem>
                <SelectItem value="DEBIT">{t('finance.expenses')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : filteredFinances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{t('finance.noRecords')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('finance.date')}</TableHead>
                  <TableHead>{t('finance.description')}</TableHead>
                  <TableHead>{t('finance.customer')}</TableHead>
                  <TableHead>{t('finance.reference')}</TableHead>
                  <TableHead>{t('finance.type')}</TableHead>
                  <TableHead className="text-left">{t('finance.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFinances.map((finance) => (
                  <TableRow key={finance.id}>
                    <TableCell className="text-sm text-gray-600">
                      {formatDateTime(finance.createdAt)}
                    </TableCell>
                    <TableCell>{finance.description}</TableCell>
                    <TableCell>
                      {finance.booking?.customerName || finance.bankCard?.cardHolderName || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {finance.reference || (finance.bankCard ? `بطاقة: ****${finance.bankCard.cardNumber.slice(-4)}` : '-')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          finance.type === 'CREDIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {finance.type === 'CREDIT' ? t('finance.revenue') : t('finance.expense')}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <span
                        className={`font-bold ${
                          finance.type === 'CREDIT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {finance.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(Number(finance.amount))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}