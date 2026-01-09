import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await (prisma.notification as any).findMany({
      where: { accountId: session.user?.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json(notifications)
  } catch (err: any) {
    console.error('/api/notifications GET error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accountId, type, title, message, bookingId, excessId } = body

    const notification = await (prisma.notification as any).create({
      data: {
        accountId,
        type,
        title,
        message,
        bookingId,
        excessId
      }
    })

    return NextResponse.json(notification)
  } catch (err: any) {
    console.error('/api/notifications POST error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    const updated = await (prisma.notification as any).update({
      where: { id },
      data: { isRead: true }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('/api/notifications PATCH error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
