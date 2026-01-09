import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, FinanceType } from '@prisma/client'

const withdrawSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
})

export async function POST(
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
    const validatedData = withdrawSchema.parse(body)

    const bankCard = await prisma.bankCard.findUnique({
      where: { id },
    })

    if (!bankCard) {
      return NextResponse.json({ error: 'Bank card not found' }, { status: 404 })
    }

    if (bankCard.accountId !== session.user.id && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const currentBalance = new Prisma.Decimal(bankCard.balance)
    const newBalance = currentBalance.minus(validatedData.amount)
    if (newBalance.isNegative()) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const updatedCard = await prisma.bankCard.update({
      where: { id },
      data: {
        balance: newBalance,
      },
    })

    const financeRecord = await prisma.finance.create({
      data: {
        accountId: bankCard.accountId,
        bankCardId: id,
        amount: new Prisma.Decimal(validatedData.amount),
        type: FinanceType.DEBIT,
        description: validatedData.description,
        reference: `سحب من البطاقة`,
      },
    })

    return NextResponse.json({
      bankCard: updatedCard,
      finance: financeRecord,
    })
  } catch (error) {
    console.error('Error withdrawing from bank card:', error)
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
