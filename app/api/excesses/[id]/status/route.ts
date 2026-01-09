import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ExcessStatus, FinanceType } from '@prisma/client'
import { logStatusChange } from '@/lib/action-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const excessId = params.id
    const body = await request.json()
    let { status, reason } = body

    // Accept 'REFUSED' as a synonym for 'DECLINED' (frontend may send 'REFUSED')
    if (status === 'REFUSED') status = 'DECLINED'

    if (!status || !['NEED_UPDATE', 'APPROVED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Fetch excess with booking and account info
    const excess = await prisma.excess.findUnique({
      where: { id: excessId },
      include: { booking: true },
    })

    if (!excess) {
      return NextResponse.json({ error: 'Excess not found' }, { status: 404 })
    }

    // Authorization: only ADMIN can change status to APPROVED or DECLINED.
    // Other users (owners) are allowed to create the excess and upload documents,
    // but cannot approve/refuse.
    const isOwner = excess.booking?.accountId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    if ((status === 'APPROVED' || status === 'DECLINED') && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can approve or refuse excesses' }, { status: 403 })
    }
    // If status is NEED_UPDATE, allow owner or admin
    if (status === 'NEED_UPDATE' && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const previousStatus = excess.status

    // Update status
    const updated = await prisma.excess.update({
      where: { id: excessId },
      data: { status: status as ExcessStatus },
    })

    // Log status change
    try {
      await logStatusChange(excessId, session.user.id, previousStatus, status, reason)
    } catch (e) {
      console.warn('Failed to log status change', e)
    }

    // If approved, create finance CREDIT record to add amount to user's balance
    if (status === 'APPROVED') {
      try {
        // Use booking.accountId as the recipient of the credit
        await prisma.finance.create({
          data: {
            accountId: excess.booking.accountId,
            bookingId: excess.bookingId,
            excessId: excess.id,
            amount: excess.amount,
            type: FinanceType.CREDIT,
            description: `تمت الموافقة على تجاوز - ${excess.type}`,
          },
        })
      } catch (financeErr) {
        console.error('Failed to create finance record on approval:', financeErr)
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating excess status:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}
