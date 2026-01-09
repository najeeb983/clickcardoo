import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma, FinanceType } from '@prisma/client'

const depositSchema = z.object({
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
    const validatedData = depositSchema.parse(body)

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
    const newBalance = currentBalance.plus(validatedData.amount)

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
        type: FinanceType.CREDIT,
        description: validatedData.description,
        reference: `إيداع إلى البطاقة`,
      },
    })

    return NextResponse.json({
      bankCard: updatedCard,
      finance: financeRecord,
    })
  } catch (error) {
    console.error('Error depositing to bank card:', error)
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
