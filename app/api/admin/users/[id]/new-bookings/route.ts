import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const newBookingsCount = await prisma.booking.count({
      where: {
        accountId: id,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    return NextResponse.json({ count: newBookingsCount })
  } catch (err: any) {
    console.error('/api/admin/users/[id]/new-bookings GET error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
