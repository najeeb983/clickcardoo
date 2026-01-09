import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logDocumentDelete } from '@/lib/action-logger'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface DocumentTypeInfo {
  [key: string]: string
}

const documentTypeLabels: DocumentTypeInfo = {
  imageIdentity: 'صورة الهوية',
  imageContract: 'صورة العقد',
  imageLicense: 'صورة رخصة القيادة',
  imageInvoice: 'صورة الفاتورة',
  imageCompanySubscription: 'صورة اشتراك الشركة',
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const excessId = params.id
    const { documentType } = await request.json()

    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Check if excess exists and belongs to user
    const excess = await prisma.excess.findFirst({
      where: {
        id: excessId,
        booking: {
          accountId: session.user.id,
        },
      },
      include: {
        booking: true,
      },
    })

    if (!excess) {
      return NextResponse.json({ error: 'Excess not found' }, { status: 404 })
    }

    // Get current document value
    const currentValue = excess[documentType as keyof typeof excess] as string | null
    if (!currentValue) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from filesystem
    const uploadDir = join(process.cwd(), 'public', 'documents')
    const filePath = join(uploadDir, currentValue)

    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
        console.log('File deleted:', currentValue)
      } catch (fileError) {
        console.error('Error deleting file:', fileError)
      }
    }

    // Update excess to remove document reference
    const updateData: Record<string, null> = {}
    updateData[documentType] = null

    const updatedExcess = await prisma.excess.update({
      where: { id: excessId },
      data: updateData,
    })

    // تسجيل الإجراء - حذف المستند
    const documentLabel = documentTypeLabels[documentType] || documentType
    await logDocumentDelete(
      excessId,
      session.user.id,
      documentType,
      documentLabel
    )

    return NextResponse.json({
      success: true,
      data: updatedExcess,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}