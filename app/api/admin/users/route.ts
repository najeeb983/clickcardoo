import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function isPrismaUnknownFieldError(err: any, fieldName = 'active') {
  const msg = String(err?.message || err)
  return msg.includes(`Unknown field \`${fieldName}\``) || msg.includes('PrismaClientValidationError')
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('/api/admin/users called, session user id =', session?.user?.id)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try selecting `active`. If the generated Prisma client doesn't know
    // about that field yet (migration/generate not run), fall back to a
    // query without `active` so the endpoint still works in dev.
    try {
      const users = await (prisma.account as any).findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          active: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(users)
    } catch (err: any) {
      // If the error indicates `active` isn't known, run a safe query
      // without `active` and return `active: null` for each user so the
      // frontend can handle the unknown state.
      if (isPrismaUnknownFieldError(err, 'active')) {
        const users = await (prisma.account as any).findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        })
        const withActiveNull = users.map((u: any) => ({ ...u, active: null }))
        return NextResponse.json(withActiveNull)
      }

      throw err
    }
  } catch (err: any) {
    console.error('/api/admin/users GET error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error', details: err?.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, password, role = 'EMPLOYEE', active = true } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)

  try {
    const created = await (prisma.account as any).create({
      data: {
        name: name || '',
        email,
        passwordHash: hashed,
        role,
        active,
      },
    })
    return NextResponse.json({ id: created.id, email: created.email })
  } catch (err: any) {
    // If `active` isn't supported by the generated client, retry without it.
    if (isPrismaUnknownFieldError(err, 'active')) {
      const created = await (prisma.account as any).create({
        data: {
          name: name || '',
          email,
          passwordHash: hashed,
          role,
        },
      })
      return NextResponse.json({ id: created.id, email: created.email })
    }
    console.error('/api/admin/users POST error:', err?.stack || err?.message || err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, action } = body
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  if (action === 'toggle-active') {
    const user = await (prisma.account as any).findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // If `active` isn't present on the model (undefined/null), inform the
    // caller that the feature requires the Prisma client/schema to be
    // updated and generated locally.
    if (typeof user.active === 'undefined' || user.active === null) {
      return NextResponse.json({
        error: 'Active field not available. Run Prisma migration and `npx prisma generate`, then restart dev.',
      }, { status: 400 })
    }

    const updated = await (prisma.account as any).update({ where: { id }, data: { active: !user.active } })
    return NextResponse.json({ id: updated.id, active: (updated as any).active })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await (prisma.account as any).delete({ where: { id } })
  return NextResponse.json({ success: true })
}
