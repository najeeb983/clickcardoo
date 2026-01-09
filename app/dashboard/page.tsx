import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClient } from './client'

async function getDashboardData(accountId: string) {
  const [totalBookings, activeBookings, totalRevenue, recentBookings] = await Promise.all([
    prisma.booking.count({
      where: { accountId },
    }),
    prisma.booking.count({
      where: {
        accountId,
        status: { in: ['CONFIRMED', 'PAID'] },
      },
    }),
    prisma.finance.aggregate({
      where: {
        accountId,
        type: 'CREDIT',
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.booking.findMany({
      where: { accountId },
      include: {
        account: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    totalBookings,
    activeBookings,
    totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
    recentBookings: recentBookings.map(booking => ({
      id: booking.id,
      customerName: booking.account.name,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalDue: Number(booking.dailyRate) * booking.rentalDays
    })),
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.id)

  return (
    <DashboardClient data={data} session={session} />
  )
}