import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { canAddExcess } from '@/lib/utils'

const excessSchema = z.object({
  bookingId: z.string(),
  type: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
  notes: z.string().optional(),
  imageIdentity: z.string().optional(),
  imageContract: z.string().optional(),
  imageLicense: z.string().optional(),
  imageInvoice: z.string().optional(),
  imageCompanySubscription: z.string().optional(),
  imageEvidence: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingIdParam = searchParams.get('bookingId')

    let bookingFilter: any = {}
    
    if (bookingIdParam) {
      bookingFilter = { id: bookingIdParam }
    } else {
      bookingFilter = { accountId: session.user.id }
    }

    const bookings = await prisma.booking.findMany({
      where: bookingFilter,
      include: { account: { select: { name: true } } }
    })

    if (bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id)
      
      const excesses = await prisma.excess.findMany({
        where: { bookingId: { in: bookingIds } },
        orderBy: { createdAt: 'desc' },
      })

      const processedExcesses = excesses.map(excess => {
        const booking = bookings.find(b => b.id === excess.bookingId)
        return {
          ...excess,
          booking: {
            id: booking?.id,
            contractId: booking?.contractId,
            bookingId: booking?.bookingId,
            startDate: booking?.startDate,
            endDate: booking?.endDate,
            rentalType: booking?.rentalType,
            customerName: booking?.account?.name || 'Unknown Customer',
          }
        }
      })

      return NextResponse.json(processedExcesses)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching excesses:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating excess with data:', body)
    
    let validatedData
    try {
      validatedData = excessSchema.parse(body)
    } catch (validationError) {
      console.error('Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        id: validatedData.bookingId,
        accountId: session.user.id,
      },
      select: {
        id: true,
        endDate: true,
        contractId: true,
        rentalType: true,
      }
    })

    console.log('Found booking:', booking)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if excess can be added (within 60 days of booking end)
    const canAdd = canAddExcess(booking.endDate)
    if (!canAdd) {
      return NextResponse.json(
        { error: 'Cannot add excess after 60 days from booking end date' },
        { status: 400 }
      )
    }

    // Create the excess with validated data
    const excess = await prisma.excess.create({
      data: {
        bookingId: validatedData.bookingId,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description || null,
        notes: validatedData.notes || null,
        imageIdentity: validatedData.imageIdentity || null,
        imageContract: validatedData.imageContract || null,
        imageLicense: validatedData.imageLicense || null,
        imageInvoice: validatedData.imageInvoice || null,
        imageCompanySubscription: validatedData.imageCompanySubscription || null,
        imageEvidence: validatedData.imageEvidence || [],
      }
    })

    console.log('Created excess:', excess)

    // Get current user info
    const user = await prisma.account.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true }
    })

    // Create action record for excess creation
    if (user) {
      await prisma.excessAction.create({
        data: {
          excessId: excess.id,
          accountId: user.id,
          actionType: 'CREATED',
          description: 'تم إنشاء التجاوز برقم الحجز ' + booking.contractId,
          details: 'تم إنشاء التجاوز بمبلغ ' + validatedData.amount + ' درهم اماراتي - ' + validatedData.type,
        }
      })
    }

    return NextResponse.json(excess, { status: 201 })
  } catch (error) {
    console.error('Error creating excess:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
