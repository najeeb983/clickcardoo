'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Eye, EyeOff, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/components/translation-provider'

interface BankCard {
  id: string
  cardNumber: string
  cardHolderName: string
  expiryDate: string
  cvv?: string
  balance: number
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
}

export function BankCardsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userIdParam = searchParams.get('userId')
  const { toast } = useToast()
  const { t } = useTranslation()
  const [bankCards, setBankCards] = useState<BankCard[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTransactionOpen, setIsTransactionOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'withdraw' | 'deposit'>('withdraw')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [visibleCardNumbers, setVisibleCardNumbers] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
    balance: '',
    accountId: '',
  })
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
  })

  useEffect(() => {
    fetchBankCards()
  }, [userIdParam])

  useEffect(() => {
    if (isDialogOpen && session?.user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [isDialogOpen, session?.user?.role])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchBankCards = async () => {
    try {
      setIsLoading(true)
      let url = '/api/bank-cards'
      if (userIdParam) {
        url += `?userId=${userIdParam}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched bank cards:', data)
        const cards = Array.isArray(data) ? data : data.data || []
        console.log('Setting bank cards:', cards)
        setBankCards(cards)
      } else {
        toast({
          title: t('common.error'),
          description: 'فشل تحميل البطاقات البنكية',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching bank cards:', error)
      toast({
        title: t('common.error'),
        description: 'حدث خطأ أثناء تحميل البطاقات البنكية',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cardNumber || !formData.cardHolderName || !formData.expiryDate) {
      toast({
        title: t('common.error'),
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      })
      return
    }

    try {
      const body: any = {
        cardNumber: formData.cardNumber,
        cardHolderName: formData.cardHolderName,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv || undefined,
        balance: formData.balance ? parseFloat(formData.balance) : 0,
      }

      if (formData.accountId && session?.user?.role === 'ADMIN') {
        body.accountId = formData.accountId
      }

      const response = await fetch('/api/bank-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.details || 'فشل إضافة البطاقة'
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('Card added successfully:', responseData)
      
      toast({
        title: t('common.success'),
        description: 'تمت إضافة البطاقة البنكية بنجاح',
      })
      setIsDialogOpen(false)
      setFormData({ cardNumber: '', cardHolderName: '', expiryDate: '', cvv: '', balance: '', accountId: '' })
      console.log('Calling fetchBankCards after adding card...')
      await fetchBankCards()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/bank-cards/${cardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('فشل حذف البطاقة')
      }

      toast({
        title: t('common.success'),
        description: 'تم حذف البطاقة البنكية بنجاح',
      })
      setDeleteConfirm(null)
      fetchBankCards()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      })
    }
  }

  const toggleCardNumberVisibility = (cardId: string) => {
    const newVisible = new Set(visibleCardNumbers)
    if (newVisible.has(cardId)) {
      newVisible.delete(cardId)
    } else {
      newVisible.add(cardId)
    }
    setVisibleCardNumbers(newVisible)
  }

  const maskCardNumber = (cardNumber: string) => {
    const visible = cardNumber.slice(-4)
    return `**** **** **** ${visible}`
  }

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCardId || !transactionData.amount || !transactionData.description) {
      toast({
        title: t('common.error'),
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(transactionData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t('common.error'),
        description: 'المبلغ يجب أن يكون رقماً موجباً',
        variant: 'destructive',
      })
      return
    }

    try {
      const endpoint = transactionType === 'withdraw'
        ? `/api/bank-cards/${selectedCardId}/withdraw`
        : `/api/bank-cards/${selectedCardId}/deposit`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: transactionData.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'فشلت العملية')
      }

      toast({
        title: t('common.success'),
        description: transactionType === 'withdraw' ? 'تم السحب بنجاح' : 'تم الإيداع بنجاح',
      })
      setIsTransactionOpen(false)
      setTransactionData({ amount: '', description: '' })
      setSelectedCardId(null)
      fetchBankCards()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : 'حدث خطأ',
        variant: 'destructive',
      })
    }
  }

  if (isLoading && bankCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loader" />
          <p className="mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                <CardTitle>البطاقات البنكية</CardTitle>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة بطاقة جديدة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bankCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">لا توجد بطاقات بنكية</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bankCards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-1">رقم البطاقة</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-bold">
                                  {visibleCardNumbers.has(card.id)
                                    ? card.cardNumber
                                    : maskCardNumber(card.cardNumber)}
                                </p>
                                <button
                                  onClick={() => toggleCardNumberVisibility(card.id)}
                                  className="p-1 hover:bg-blue-200 rounded"
                                >
                                  {visibleCardNumbers.has(card.id) ? (
                                    <EyeOff className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">اسم حامل البطاقة</p>
                            <p className="font-semibold text-sm">{card.cardHolderName}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">تاريخ الانتهاء</p>
                              <p className="font-mono text-sm">{card.expiryDate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">الرصيد</p>
                              <p className="font-bold text-sm text-green-600">
                                {formatCurrency(Number(card.balance))}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <button
                              onClick={() => {
                                setSelectedCardId(card.id)
                                setTransactionType('withdraw')
                                setIsTransactionOpen(true)
                              }}
                              className="flex-1 px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded border border-amber-200 transition"
                            >
                              سحب
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCardId(card.id)
                                setTransactionType('deposit')
                                setIsTransactionOpen(true)
                              }}
                              className="flex-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded border border-green-200 transition"
                            >
                              إيداع
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(card.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة بطاقة بنكية جديدة</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل البطاقة البنكية
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCard} className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">رقم البطاقة</Label>
              <Input
                id="cardNumber"
                placeholder="1234567890123456"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="cardHolderName">اسم حامل البطاقة</Label>
              <Input
                id="cardHolderName"
                placeholder="محمد أحمد"
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">تاريخ الانتهاء (MM/YY)</Label>
                <Input
                  id="expiryDate"
                  placeholder="12/25"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="balance">الرصيد الأولي</Label>
              <Input
                id="balance"
                type="number"
                placeholder="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>
            {session?.user?.role === 'ADMIN' && (
              <div>
                <Label htmlFor="accountId">ربط بحساب المستخدم</Label>
                <Select value={formData.accountId || 'personal'} onValueChange={(value) => setFormData({ ...formData, accountId: value === 'personal' ? '' : value })}>
                  <SelectTrigger id="accountId">
                    <SelectValue placeholder="اختر حساب المستخدم (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">حسابي الشخصي</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة البطاقة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'withdraw' ? 'سحب من البطاقة' : 'إيداع إلى البطاقة'}
            </DialogTitle>
            <DialogDescription>
              {transactionType === 'withdraw'
                ? 'سحب مبلغ من رصيد البطاقة'
                : 'إضافة مبلغ إلى رصيد البطاقة'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={transactionData.amount}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, amount: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                placeholder="أدخل وصف العملية"
                value={transactionData.description}
                onChange={(e) =>
                  setTransactionData({ ...transactionData, description: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTransactionOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {transactionType === 'withdraw' ? 'سحب' : 'إيداع'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">تأكيد الحذف</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-6">
                هل أنت متأكد من رغبتك في حذف هذه البطاقة البنكية؟
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (deleteConfirm) {
                      handleDeleteCard(deleteConfirm)
                    }
                  }}
                >
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
