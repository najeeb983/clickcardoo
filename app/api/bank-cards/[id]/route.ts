import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBankCardSchema = z.object({
  cardNumber: z.string().min(13).max(19).optional(),
  cardHolderName: z.string().min(2).optional(),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/).optional(),
  cvv: z.string().optional(),
  balance: z.number().nonnegative().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const validatedData = updateBankCardSchema.parse(body)

    const bankCard = await prisma.bankCard.findUnique({
      where: { id },
    })

    if (!bankCard) {
      return NextResponse.json({ error: 'Bank card not found' }, { status: 404 })
    }

    if (bankCard.accountId !== session.user.id && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.bankCard.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating bank card:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
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
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    const bankCard = await prisma.bankCard.findUnique({
      where: { id },
    })

    if (!bankCard) {
      return NextResponse.json({ error: 'Bank card not found' }, { status: 404 })
    }

    if (bankCard.accountId !== session.user.id && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.bankCard.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bank card:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
