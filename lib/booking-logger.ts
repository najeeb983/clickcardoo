import prisma from './prisma'

export type BookingAction = 
  | 'BOOKING_CREATED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_PAYMENT_RECEIVED'

export interface LogBookingActionParams {
  bookingId: string
  accountId: string
  actionType: BookingAction
  description: string
  amount?: number
  details?: string
}

/**
 * تسجيل إجراء متعلق بالحجز في سجل المالي
 * @param params معاملات تسجيل الحجز
 */
export async function logBookingAction(params: LogBookingActionParams) {
  try {
    const financeRecord = await prisma.finance.create({
      data: {
        bookingId: params.bookingId,
        accountId: params.accountId,
        amount: params.amount || 0,
        type: params.actionType === 'BOOKING_PAYMENT_RECEIVED' ? 'CREDIT' : 'DEBIT',
        description: params.description,
        reference: `BOOKING-${params.actionType}`,
      },
    })

    console.log('[Booking Logger] تم تسجيل إجراء الحجز:', {
      bookingId: params.bookingId,
      actionType: params.actionType,
      amount: params.amount,
    })

    return financeRecord
  } catch (error) {
    console.error('[Booking Logger] خطأ في تسجيل الإجراء:', error)
  }
}

/**
 * تسجيل إنشاء حجز جديد
 */
export async function logBookingCreated(
  bookingId: string,
  accountId: string,
  contractId: string,
  amount: number
) {
  return logBookingAction({
    bookingId,
    accountId,
    actionType: 'BOOKING_CREATED',
    description: `مصروف إيجار سيارة - عقد ${contractId}`,
    amount,
    details: `تم إنشاء حجز جديد برقم عقد ${contractId} بقيمة ${amount} درهم`,
  })
}