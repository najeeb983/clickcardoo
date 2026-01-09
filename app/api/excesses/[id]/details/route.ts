import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const excessId = params.id

    const excess = await prisma.excess.findUnique({
      where: { id: excessId },
      include: {
        booking: {
          include: {
            account: {
              select: { id: true, name: true }
            },
          },
        },
        actions: {
          include: {
            account: {
              select: { id: true, name: true }
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!excess) {
      return NextResponse.json(
        { error: 'Excess not found' },
        { status: 404 }
      )
    }

    // Authorization check: only owner or ADMIN can view
    if (excess.booking.accountId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Format documents
    const documents = [
      { type: 'identity', url: excess.imageIdentity, label: 'Identity Document' },
      { type: 'contract', url: excess.imageContract, label: 'Contract Document' },
      { type: 'license', url: excess.imageLicense, label: 'Driving License' },
      { type: 'invoice', url: excess.imageInvoice, label: 'Invoice Document' },
      { type: 'subscription', url: excess.imageCompanySubscription, label: 'Subscription' },
    ]

    return NextResponse.json({
      success: true,
      data: {
        excess: {
          id: excess.id,
          type: excess.type,
          amount: excess.amount,
          description: excess.description,
          status: excess.status,
          createdAt: excess.createdAt,
          updatedAt: excess.updatedAt,
        },
        booking: {
          id: excess.booking.id,
          contractId: excess.booking.contractId,
          startDate: excess.booking.startDate,
          endDate: excess.booking.endDate,
          rentalType: excess.booking.rentalType,
          customerName: excess.booking.account.name,
        },
        documents,
        actions: excess.actions.map(action => ({
          id: action.id,
          actionType: action.actionType,
          description: action.description,
          details: action.details,
          createdAt: action.createdAt,
          account: {
            id: action.account.id,
            name: action.account.name,
          },
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching excess details:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}