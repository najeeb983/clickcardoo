import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Temporary shim: some client-side prefetches may request
// /api/admin/users/create which doesn't exist. Return 204 for GET so
// the dev server doesn't log a 404. This keeps behavior unchanged.
export async function GET(request: Request) {
  try {
    // Optionally enforce ADMIN here if you prefer to restrict this API.
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('/api/admin/users/create GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
