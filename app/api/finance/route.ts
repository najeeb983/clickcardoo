import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    let accountId = session.user.id
    if (userId && (session.user?.role === 'ADMIN' || session.user?.role === 'EMPLOYEE')) {
      accountId = userId
    }

    const finances = await prisma.finance.findMany({
      where: {
        accountId,
        ...(type && { type: type as any }),
      },
      include: {
        booking: {
          include: {
            account: {
              select: { name: true },
            },
          },
        },
        excess: {
          select: {
            type: true,
          },
        },
        bankCard: {
          select: {
            id: true,
            cardNumber: true,
            cardHolderName: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totals = await prisma.finance.groupBy({
      by: ['type'],
      where: {
        accountId,
      },
      _sum: {
        amount: true,
      },
    })

    const totalCredit = totals.find((t) => t.type === 'CREDIT')?._sum?.amount || 0
    const totalDebit = totals.find((t) => t.type === 'DEBIT')?._sum?.amount || 0
    const balance = Number(totalCredit) - Number(totalDebit)

    // Map finances so the frontend can read `booking.customerName` and `booking.vehicleInfo`
    const financesForClient = finances.map((f) => {
      const booking = (f as any).booking
      const mappedBooking = booking
        ? {
            customerName: booking.account?.name || null,
            vehicleInfo: (booking as any).vehicleInfo || null,
            id: booking.id,
          }
        : null

      return {
        ...f,
        booking: mappedBooking,
      }
    })

    return NextResponse.json({
      finances: financesForClient,
      summary: {
        totalCredit,
        totalDebit,
        // totalExpenses: alias for totalDebit (إجمالي المصروفات)
        totalExpenses: totalDebit,
        // totalDue: مجموع المبالغ المستحقة من المستخدم (نوع CREDIT)
        totalDue: totalCredit,
        balance,
      },
    })
  } catch (error) {
    console.error('Error fetching finances:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}