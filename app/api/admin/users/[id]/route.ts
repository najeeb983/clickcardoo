import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const account = await (prisma.account as any).findUnique({
      where: { id },
      include: {
        bookings: { orderBy: { createdAt: 'desc' } },
        finances: { orderBy: { createdAt: 'desc' } },
        excessActions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(account)
  } catch (err: any) {
    console.error('/api/admin/users/[id] GET error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.id !== params.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, email, password, role } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (password !== undefined) updateData.passwordHash = await bcrypt.hash(password, 10)
    if (role !== undefined && session.user?.role === 'ADMIN') updateData.role = role

    const updated = await (prisma.account as any).update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ 
      id: updated.id, 
      name: updated.name, 
      email: updated.email, 
      role: updated.role 
    })
  } catch (err: any) {
    console.error('/api/admin/users/[id] PATCH error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
