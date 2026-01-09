import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBookingSchema = z.object({
  contractId: z.string().min(1).optional(),
  bookingId: z.string().optional(),
  insuranceAmount: z.number().positive().optional(),
  rentalDays: z.number().int().positive().optional(),
  rentalType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  dailyRate: z.number().positive().optional(),
  status: z.enum(['PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        accountId: session.user.id,
      },
      include: {
        excesses: true,
        finances: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateBookingSchema.parse(body)

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        accountId: session.user.id,
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
        ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if booking exists and belongs to user
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        accountId: session.user.id,
      },
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Find excess ids related to this booking
    const excesses = await prisma.excess.findMany({ where: { bookingId: params.id }, select: { id: true } })
    const excessIds = excesses.map((e) => e.id)

    // Build transaction steps: delete excess actions, finances (for booking and excesses), excesses, then booking
    const tx: any[] = []

    if (excessIds.length > 0) {
      tx.push(prisma.excessAction.deleteMany({ where: { excessId: { in: excessIds } } }))
      tx.push(prisma.finance.deleteMany({ where: { excessId: { in: excessIds } } }))
    }

    // Delete finances linked directly to the booking
    tx.push(prisma.finance.deleteMany({ where: { bookingId: params.id } }))

    // Delete excess records for the booking
    tx.push(prisma.excess.deleteMany({ where: { bookingId: params.id } }))

    // Finally delete the booking
    tx.push(prisma.booking.delete({ where: { id: params.id } }))

    await prisma.$transaction(tx)

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}