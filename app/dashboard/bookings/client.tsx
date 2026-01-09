'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { isValidDateFormat } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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

// Cross-window/component messaging helper
function sendAppMessage(message: any) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('app-updates')
      channel.postMessage(message)
      channel.close()
      return
    }

    // Fallback: localStorage + CustomEvent
    try {
      localStorage.setItem('app-updates', JSON.stringify({ ...message, _ts: Date.now() }))
    } catch (e) {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('app-updates', { detail: message }))
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

interface Booking {
  id: string
  contractId: string
  bookingId?: string
  accountId: string
  account?: {
    name: string
  }
  insuranceAmount: number
  rentalDays: number
  rentalType: string
  dailyRate: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
}

interface BookingExcessCount {
  [bookingId: string]: number
}

export function BookingsClient() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const userIdParam = searchParams.get('userId')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bookingExcessCounts, setBookingExcessCounts] = useState<BookingExcessCount>({})
  const [formData, setFormData] = useState({
    contractId: '',
    bookingId: '',
    insuranceAmount: '',
    rentalDays: '',
    rentalType: 'daily',
    dailyRate: '',
    startDate: '',
    endDate: '',
  })
  
  // Function to calculate end date automatically
  const calculateEndDate = (startDate: string, rentalType: string, duration: string) => {
    if (!startDate || !duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return '';
    }
    
    try {
      const start = new Date(startDate);
      const durationNum = Number(duration);
      
      if (isNaN(start.getTime())) {
        return '';
      }
      
      const end = new Date(start);
      
      if (rentalType === 'daily') {
        // Add days considering start date is included in duration
        // So subtract 1 from days
        end.setDate(start.getDate() + durationNum - 1);
      } else if (rentalType === 'monthly') {
        // Add months considering start date is included in duration
        // Add months then subtract one day from end date
        end.setMonth(start.getMonth() + durationNum);
        end.setDate(end.getDate() - 1);
      }
      
      // Format date as YYYY-MM-DD
      return end.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating end date:', error);
      return '';
    }
  }
  
  // Function to calculate required amount automatically
  const calculateRequiredAmount = (rentalType: string, duration: string, insuranceAmount: string) => {
    if (!duration || !insuranceAmount || isNaN(Number(duration)) || isNaN(Number(insuranceAmount)) || Number(duration) <= 0 || Number(insuranceAmount) <= 0) {
      return '';
    }
    
    try {
      const durationNum = Number(duration);
      const insuranceNum = Number(insuranceAmount);
      let requiredAmount = 0;
      
      if (rentalType === 'daily') {
        // Calculate required amount for daily rental
        if (durationNum <= 3) {
          // 1 to 3 days: 2.4% × insurance amount
          requiredAmount = insuranceNum * 0.024;
        } else if (durationNum < 13) {
          // More than 3 and less than 13 days: 0.8% × insurance amount × number of days
          requiredAmount = insuranceNum * 0.008 * durationNum;
        } else if (durationNum < 31) {
          // More than 12 and less than 31 days: insurance amount × 10%
          requiredAmount = insuranceNum * 0.1;
        } else {
          // More than 30 days: (number of days - 30) × 10% × insurance amount + 100
          requiredAmount = (durationNum - 30) * 0.1 * insuranceNum / 30 + 100;
        }
      } else if (rentalType === 'monthly') {
        // Calculate required amount for monthly rental: number of months × 5% × insurance amount
        requiredAmount = durationNum * 0.05 * insuranceNum;
      }
      
      // Round amount to 2 decimal places
      return requiredAmount.toFixed(2);
    } catch (error) {
      console.error('Error calculating required amount:', error);
      return '';
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, userIdParam])
  
  // Update end date when start date, rental type, or rental days change
  useEffect(() => {
    if (formData.startDate && formData.rentalDays) {
      const endDate = calculateEndDate(formData.startDate, formData.rentalType, formData.rentalDays);
      if (endDate) {
        setFormData(prev => ({ ...prev, endDate }));
      }
    }
  }, [formData.startDate, formData.rentalType, formData.rentalDays])
  
  // Update required amount when rental type, rental days, or insurance amount change
  useEffect(() => {
    if (formData.rentalDays && formData.insuranceAmount) {
      const dailyRate = calculateRequiredAmount(formData.rentalType, formData.rentalDays, formData.insuranceAmount);
      if (dailyRate) {
        setFormData(prev => ({ ...prev, dailyRate }));
      }
    }
  }, [formData.rentalType, formData.rentalDays, formData.insuranceAmount])

  const fetchBookings = async () => {
    try {
      let url = '/api/bookings?'
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      if (userIdParam) {
        params.append('userId', userIdParam)
      }
      
      const queryString = params.toString()
      url += queryString
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
        loadExcessCounts(data.map((b: Booking) => b.id))
      }
    } catch (error) {
      toast({
        title: t('errors.error'),
        description: t('bookings.loadFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadExcessCounts = async (bookingIds: string[]) => {
    try {
      const counts: BookingExcessCount = {}
      for (const bookingId of bookingIds) {
        try {
          const res = await fetch(`/api/bookings/${bookingId}/excesses-count`)
          if (res.ok) {
            const data = await res.json()
            counts[bookingId] = data.count
          }
        } catch { }
      }
      setBookingExcessCounts(counts)
    } catch (err) { }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.contractId) {
        toast({
          title: t('errors.error'),
          description: t('bookings.contractIdRequired'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.insuranceAmount || isNaN(parseFloat(formData.insuranceAmount))) {
        toast({
          title: t('errors.error'),
          description: t('bookings.insuranceAmountMustBeNumber'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.rentalDays || isNaN(parseInt(formData.rentalDays))) {
        toast({
          title: t('errors.error'),
          description: t('bookings.rentalDaysMustBeNumber'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.dailyRate || isNaN(parseFloat(formData.dailyRate))) {
        toast({
          title: t('errors.error'),
          description: t('bookings.dailyRateMustBeNumber'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.startDate) {
        toast({
          title: t('errors.error'),
          description: t('bookings.startDateRequired'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!formData.endDate) {
        toast({
          title: t('errors.error'),
          description: t('bookings.endDateRequired'),
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Ensure dates are in ISO format (YYYY-MM-DD)
      let startDate = formData.startDate;
      let endDate = formData.endDate;
      
      // Try to fix date format if needed
      if (!isValidDateFormat(startDate)) {
        // Try to parse the date and convert to YYYY-MM-DD
        try {
          const parsedDate = new Date(startDate);
          if (!isNaN(parsedDate.getTime())) {
            startDate = parsedDate.toISOString().split('T')[0];
            console.log('Fixed start date format:', startDate);
          } else {
            toast({
              title: t('errors.error'),
              description: t('bookings.invalidStartDateFormat'),
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } catch (dateError) {
          console.error('Date parsing error:', dateError);
          toast({
            title: t('errors.error'),
            description: t('bookings.invalidStartDateFormat'),
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }
      
      if (!isValidDateFormat(endDate)) {
        // Try to parse the date and convert to YYYY-MM-DD
        try {
          const parsedDate = new Date(endDate);
          if (!isNaN(parsedDate.getTime())) {
            endDate = parsedDate.toISOString().split('T')[0];
            console.log('Fixed end date format:', endDate);
          } else {
            toast({
              title: t('errors.error'),
              description: t('bookings.invalidEndDateFormat'),
              variant: 'destructive',
            });
            setIsLoading(false);
            return;
          }
        } catch (dateError) {
          console.error('Date parsing error:', dateError);
          toast({
            title: t('errors.error'),
            description: t('bookings.invalidEndDateFormat'),
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }
      
      const requestData = {
        contractId: formData.contractId,
        bookingId: formData.bookingId || undefined,
        insuranceAmount: parseFloat(formData.insuranceAmount),
        rentalDays: parseInt(formData.rentalDays),
        rentalType: formData.rentalType,
        dailyRate: parseFloat(formData.dailyRate),
        startDate: startDate,
        endDate: endDate,
      };
      
      console.log('Submitting booking data:', requestData);
      
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      try {
        // Submit the booking
        response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestData),
          credentials: 'include', // Include cookies for authentication
          signal: controller.signal,
          cache: 'no-store' // Prevent caching
        });
        
        clearTimeout(timeoutId);
        
        // Log response status and headers for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(Array.from(response.headers.entries())));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', fetchError);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(t('errors.requestTimeout'));
        }
        throw fetchError;
      }
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Booking created successfully:', responseData);
        
        toast({
          title: t('common.success'),
          description: t('bookings.createSuccess'),
        })
        setIsDialogOpen(false)
        fetchBookings()
        // notify other parts of the app (finance) to refresh totals
        try {
          const amount = Number(requestData.dailyRate) * Number(requestData.rentalDays)
          sendAppMessage({ event: 'booking-created', amount })
        } catch (e) {
          console.warn('Failed to send app message after booking creation', e)
        }
        resetForm()
      } else {
        let errorMessage = t('bookings.createFailed');
        try {
          const errorData = await response.json();
          console.error('Booking creation failed:', errorData);
          
          if (errorData.error === 'Unauthorized') {
            errorMessage = t('errors.unauthorized');
          } else if (errorData.error === 'Validation Error') {
            errorMessage = t('errors.validationError') + ': ' + 
              (errorData.details?.map((e: any) => e.message).join(', ') || t('errors.checkData'));
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
          // Try to get the text response if JSON parsing fails
          try {
            const textResponse = await response.text();
            console.error('Raw response:', textResponse);
            errorMessage = `${t('errors.responseError')}: ${response.status} ${response.statusText}`;
          } catch (textError) {
            console.error('Error getting response text:', textError);
          }
        }
        
        toast({
          title: t('errors.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t('errors.error'),
        description: error instanceof Error ? error.message : t('bookings.createFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('bookings.confirmDelete'))) return

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: t('common.success'),
          description: t('bookings.deleteSuccess'),
        })
        fetchBookings()
      }
    } catch (error) {
      toast({
        title: t('errors.error'),
        description: t('bookings.deleteFailed'),
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      contractId: '',
      bookingId: '',
      insuranceAmount: '',
      rentalDays: '',
      rentalType: 'daily',
      dailyRate: '',
      startDate: '',
      endDate: '',
    })
  }

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      booking.contractId.toLowerCase().includes(query) ||
      (booking.bookingId && booking.bookingId.toLowerCase().includes(query)) ||
      (booking.account?.name && booking.account.name.toLowerCase().includes(query))
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('bookings.title')}</h1>
          {userIdParam && (
            <p className="text-sm text-gray-500 mt-2">عرض حجوزات مستخدم معين</p>
          )}
        </div>
        {!userIdParam && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('bookings.newBooking')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder={t('common.search')}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('bookings.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('bookings.allBookings')}</SelectItem>
                  <SelectItem value="PENDING">{t('bookings.pending')}</SelectItem>
                  <SelectItem value="CONFIRMED">{t('bookings.confirmed')}</SelectItem>
                  <SelectItem value="PAID">{t('bookings.paid')}</SelectItem>
                  <SelectItem value="COMPLETED">{t('bookings.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? t('bookings.noSearchResults') : t('bookings.noBookings')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bookings.customerName')}</TableHead>
                    <TableHead>{t('bookings.contractId')}</TableHead>
                    <TableHead>{t('bookings.bookingId')}</TableHead>
                    <TableHead>{t('bookings.startDate')}</TableHead>
                    <TableHead>{t('bookings.endDate')}</TableHead>
                    <TableHead>{t('bookings.rentalDays')}</TableHead>
                    <TableHead>{t('bookings.insuranceAmount')}</TableHead>
                    <TableHead>{t('bookings.amount')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.account?.name || '-'}</TableCell>
                      <TableCell>{booking.contractId}</TableCell>
                      <TableCell>{booking.bookingId || '-'}</TableCell>
                      <TableCell>{formatDate(booking.startDate)}</TableCell>
                      <TableCell>{formatDate(booking.endDate)}</TableCell>
                      <TableCell>{booking.rentalDays} {booking.rentalType === 'daily' ? t('bookings.days') : t('bookings.months')}</TableCell>
                      <TableCell>{formatCurrency(booking.insuranceAmount)}</TableCell>
                      <TableCell>{formatCurrency(booking.dailyRate)}</TableCell>
                      <TableCell>{formatDate(booking.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {bookingExcessCounts[booking.id] > 0 && (
                            <a href={`/dashboard/excesses?bookingId=${booking.id}`}>
                              <Button variant="ghost" size="icon" title="التجاوزات">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              </Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('bookings.newBooking')}</DialogTitle>
            <DialogDescription>
              {t('bookings.fillBookingDetails')}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1: Contract ID and Booking ID */}
              <div className="space-y-2">
                <Label htmlFor="contractId">{t('bookings.contractId')} *</Label>
                <Input
                  id="contractId"
                  value={formData.contractId}
                  onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingId">{t('bookings.bookingId')} ({t('common.optional')})</Label>
                <Input
                  id="bookingId"
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                />
              </div>
              
              {/* Row 2: Rental Type and Rental Days */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rentalType">{t('bookings.rentalType')} *</Label>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`text-sm ${formData.rentalType === 'daily' ? 'font-medium' : 'text-gray-500'}`}>
                      {t('bookings.daily')}
                    </span>
                    <Switch
                      checked={formData.rentalType === 'monthly'}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, rentalType: checked ? 'monthly' : 'daily' })
                      }
                    />
                    <span className={`text-sm ${formData.rentalType === 'monthly' ? 'font-medium' : 'text-gray-500'}`}>
                      {t('bookings.monthly')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentalDays">
                  {formData.rentalType === 'daily' ? t('bookings.numberOfDays') : t('bookings.numberOfMonths')} *
                </Label>
                <Input
                  id="rentalDays"
                  type="number"
                  min="1"
                  value={formData.rentalDays}
                  onChange={(e) => setFormData({ ...formData, rentalDays: e.target.value })}
                  required
                />
              </div>
              
              {/* Row 3: Start Date and End Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">{t('bookings.startDate')} *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t('bookings.endDate')} ({t('bookings.calculatedAutomatically')})</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              {/* Row 4: Insurance Amount and Daily Rate */}
              <div className="space-y-2">
                <Label htmlFor="insuranceAmount">{t('bookings.insuranceAmount')} ({t('common.currency')}) *</Label>
                <Input
                  id="insuranceAmount"
                  type="number"
                  step="0.01"
                  value={formData.insuranceAmount}
                  onChange={(e) => setFormData({ ...formData, insuranceAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyRate">{t('bookings.requiredAmount')} ({t('common.currency')}) *</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  value={formData.dailyRate}
                  readOnly
                  className="bg-gray-50"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="button" 
                disabled={isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}