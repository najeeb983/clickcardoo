import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const excessCount = await prisma.excess.count({
      where: {
        bookingId: id,
      },
    })

    return NextResponse.json({ count: excessCount })
  } catch (err: any) {
    console.error('/api/bookings/[id]/excesses-count GET error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
