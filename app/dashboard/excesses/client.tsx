'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Eye, Trash2, AlertCircle, Upload, CheckCircle, XCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useTranslation } from '@/components/translation-provider'

interface Excess {
  id: string
  bookingId: string
  type: string
  amount: number
  description?: string
  notes?: string
  status: 'NEED_UPDATE' | 'APPROVED' | 'DECLINED'
  createdAt: string
  booking: {
    id?: string
    bookingId?: string
    customerName: string
    vehicleInfo?: string
    endDate: string
    contractId: string
  }
}

interface Booking {
  id: string
  customerName: string
  vehicleInfo?: string
  endDate: string
  contractId: string
  account?: {
    name: string
  }
}

interface DocumentFile {
  type: string
  label: string
  url: string | null
}

export function ExcessesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')
  const { toast } = useToast()
  const { t } = useTranslation()
  const [excesses, setExcesses] = useState<Excess[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [currentExcessId, setCurrentExcessId] = useState('')
  const [currentExcessData, setCurrentExcessData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    bookingId: '',
    type: 'traffic_violation',
    amount: '',
    description: '',
    notes: '',
  })
  const [uploadData, setUploadData] = useState({
    imageIdentity: null as File | null,
    imageContract: null as File | null,
    imageLicense: null as File | null,
    imageInvoice: null as File | null,
    imageCompanySubscription: null as File | null,
  })
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExcesses()
      fetchBookings()
    }, 500)
    // fetch session to determine role
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role === 'ADMIN') setIsAdmin(true)
      })
      .catch(() => {})
    return () => clearTimeout(timer)
  }, [bookingIdParam])

  const fetchExcesses = async () => {
    try {
      let url = '/api/excesses'
      if (bookingIdParam) {
        url += `?bookingId=${bookingIdParam}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setExcesses(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Error fetching excesses:', error)
      setExcesses([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.bookingId || !formData.amount) {
      toast({
        title: t('common.error'),
        description: t('excesses.fillRequiredFields'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/excesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: formData.bookingId,
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          notes: formData.notes,
        }),
      })

      if (!response.ok) throw new Error('Failed to create excess')

      toast({
        title: t('common.success'),
        description: t('excesses.createSuccess'),
      })
      setIsDialogOpen(false)
      setTimeout(() => {
        fetchExcesses()
      }, 1000)
      setFormData({
        bookingId: '',
        type: 'traffic_violation',
        amount: '',
        description: '',
        notes: '',
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadDocuments = async (excessId: string) => {
    setCurrentExcessId(excessId)
    try {
      const response = await fetch('/api/excesses/' + excessId + '/details')
      if (response.ok) {
        const result = await response.json()
        setCurrentExcessData(result.data)
      }
    } catch (err) {
      console.error('Error fetching excess data:', err)
      setCurrentExcessData(null)
    }
    setIsUploadDialogOpen(true)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if at least one file is selected
    if (!Object.values(uploadData).some(file => file !== null)) {
      toast({
        title: t('common.error'),
        description: 'Please select at least one file to upload',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Add files to FormData
      if (uploadData.imageIdentity) {
        formDataToSend.append('imageIdentity', uploadData.imageIdentity)
      }
      if (uploadData.imageContract) {
        formDataToSend.append('imageContract', uploadData.imageContract)
      }
      if (uploadData.imageLicense) {
        formDataToSend.append('imageLicense', uploadData.imageLicense)
      }
      if (uploadData.imageInvoice) {
        formDataToSend.append('imageInvoice', uploadData.imageInvoice)
      }
      if (uploadData.imageCompanySubscription) {
        formDataToSend.append('imageCompanySubscription', uploadData.imageCompanySubscription)
      }

      const response = await fetch('/api/excesses/' + currentExcessId + '/documents', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload documents')
      }

      toast({
        title: t('common.success'),
        description: 'Documents uploaded successfully',
      })
      setIsUploadDialogOpen(false)
      setUploadData({
        imageIdentity: null,
        imageContract: null,
        imageLicense: null,
        imageInvoice: null,
        imageCompanySubscription: null,
      })
      fetchExcesses()
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('common.error'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderDocumentField = (fieldKey: string, label: string) => {
    const currentFile = currentExcessData?.documents?.find((d: any) => d.type === fieldKey.replace('image', '').toLowerCase())
    const fileName = currentFile?.url

    return (
      <div className="space-y-2" key={fieldKey}>
        <Label htmlFor={fieldKey}>{label}</Label>
        <div className="flex gap-2">
          <Input
            id={fieldKey}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setUploadData({ 
                  ...uploadData, 
                  [fieldKey]: file 
                })
                setUploadProgress({
                  ...uploadProgress,
                  [fieldKey]: true
                })
              }
            }}
          />
          {uploadData[fieldKey as keyof typeof uploadData] && (
            <span className="text-sm text-green-600 py-2">
              {(uploadData[fieldKey as keyof typeof uploadData] as File)?.name}
            </span>
          )}
        </div>
        {fileName && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs font-medium text-green-700 mb-2">
              Previously uploaded file
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-green-600 truncate" title={fileName || ''}>
                {fileName}
              </span>
              <a href={'/documents/' + fileName} download>
                <Button size="sm" variant="outline" className="h-7 gap-1">
                  <Download className="w-3 h-3" />
                  <span className="text-xs">{t('common.download')}</span>
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Broadcast helper to notify finance UI to refresh (approval creates CREDIT)
  function sendAppMessage(message: any) {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('app-updates')
        channel.postMessage(message)
        channel.close()
        return
      }
    } catch (e) {
      // ignore
    }
    try {
      localStorage.setItem('app-updates', JSON.stringify({ ...message, _ts: Date.now() }))
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('app-updates', { detail: message }))
    } catch (e) {}
  }

  const handleChangeStatus = async (excessId: string, newStatus: 'APPROVED' | 'DECLINED') => {
    if (!confirm(newStatus === 'APPROVED' ? t('excesses.confirmApprove') : t('excesses.confirmRefuse'))) return
    setIsLoading(true)
    try {
      const resp = await fetch('/api/excesses/' + excessId + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      toast({ title: t('common.success'), description: newStatus === 'APPROVED' ? t('excesses.approved') : t('excesses.refused') })
      // Refresh list
      fetchExcesses()
      // If approved, notify finance to refresh (a CREDIT record is created)
      if (newStatus === 'APPROVED') {
        const approvedExcess = excesses.find((e) => e.id === excessId)
        if (approvedExcess) sendAppMessage({ event: 'excess-approved', amount: approvedExcess.amount })
      }
    } catch (error) {
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : String(error), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && excesses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loader" />
          <p className="mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const filteredExcesses = excesses.filter((excess) =>
    excess.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    excess.booking?.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <CardTitle>{t('excesses.title')}</CardTitle>
              <Button
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('excesses.addNew')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('excesses.id')}</TableHead>
                  <TableHead>{bookingIdParam ? t('admin.contractId') : t('excesses.customer')}</TableHead>
                  <TableHead>{t('excesses.type')}</TableHead>
                  <TableHead>{t('excesses.amount')}</TableHead>
                  <TableHead>{t('excesses.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExcesses.map((excess) => (
                  <TableRow key={excess.id}>
                    <TableCell className="font-medium">{excess.id}</TableCell>
                    <TableCell>{bookingIdParam ? (excess.booking?.contractId || excess.booking?.bookingId || 'N/A') : excess.booking?.customerName || 'Unknown'}</TableCell>
                    <TableCell>{excess.type}</TableCell>
                    <TableCell>{formatCurrency(excess.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={excess.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {excess.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/dashboard/excesses/' + excess.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUploadDocuments(excess.id)}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          {excess.status !== 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleChangeStatus(excess.id, 'APPROVED')}
                              title={t('excesses.approve')}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {excess.status !== 'DECLINED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleChangeStatus(excess.id, 'DECLINED')}
                              title={t('excesses.refuse')}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('excesses.createNew')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="booking">{t('excesses.booking')}</Label>
              <Select value={formData.bookingId} onValueChange={(value) => setFormData({ ...formData, bookingId: value })}>
                <SelectTrigger id="booking">
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.contractId} - {booking.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">{t('excesses.type')}</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic_violation">Traffic Violation</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="scratches">Scratches</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="late_return">Late Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">{t('excesses.amount')}</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t('common.description')}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('common.notes')}</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload JPG, PNG, or PDF files (max 10MB each)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {renderDocumentField('imageIdentity', 'Identity Document')}
            {renderDocumentField('imageContract', 'Contract Document')}
            {renderDocumentField('imageLicense', 'Driving License')}
            {renderDocumentField('imageInvoice', 'Invoice Document')}
            {renderDocumentField('imageCompanySubscription', 'Subscription Document')}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : 'Upload Files'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}