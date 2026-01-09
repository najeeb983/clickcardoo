import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

const bankCardSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  cardHolderName: z.string().min(2),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.string().optional(),
  balance: z.number().nonnegative().optional(),
  accountId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let accountId = session.user.id
    if (userId && ['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      accountId = userId
    }

    const bankCards = await (prisma as any).$queryRaw(
      Prisma.sql`
        SELECT id, account_id as "accountId", card_number as "cardNumber", card_holder_name as "cardHolderName", expiry_date as "expiryDate", cvv, balance, created_at as "createdAt", updated_at as "updatedAt"
        FROM "BankCard"
        WHERE account_id = ${accountId}
        ORDER BY created_at DESC
      `
    )

    console.log('Bank cards fetched for accountId:', accountId, 'count:', bankCards?.length || 0)
    console.log('Bank cards data:', bankCards)
    return NextResponse.json(bankCards)
  } catch (error) {
    console.error('Error fetching bank cards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    console.log('POST /api/bank-cards body:', body)
    const validatedData = bankCardSchema.parse(body)
    console.log('Validated data:', validatedData)

    let targetAccountId = session.user.id
    if (validatedData.accountId && session.user?.role === 'ADMIN') {
      targetAccountId = validatedData.accountId
    }

    console.log('Creating bank card for accountId:', targetAccountId)
    
    const id = randomUUID()
    
    const result = await (prisma as any).$queryRaw(
      Prisma.sql`
        INSERT INTO "BankCard" (id, account_id, card_number, card_holder_name, expiry_date, cvv, balance, created_at, updated_at)
        VALUES (${id}, ${targetAccountId}, ${validatedData.cardNumber}, ${validatedData.cardHolderName}, ${validatedData.expiryDate}, ${validatedData.cvv || null}, ${validatedData.balance || 0}, NOW(), NOW())
        RETURNING id, account_id as "accountId", card_number as "cardNumber", card_holder_name as "cardHolderName", expiry_date as "expiryDate", cvv, balance, created_at as "createdAt", updated_at as "updatedAt"
      `
    )
    
    const bankCard = Array.isArray(result) ? result[0] : result
    console.log('Bank card created:', bankCard)
    return NextResponse.json(bankCard, { status: 201 })
  } catch (error) {
    console.error('Error creating bank card:', error)
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error details:', errorMessage)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}
