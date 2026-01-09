import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logDocumentUpload } from '@/lib/action-logger'
import { writeFile, mkdir } from 'fs/promises'
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
    console.log('Updating documents for excess:', excessId)

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

    const formData = await request.formData()
    const updateData: Record<string, string> = {}

    // Allowed document fields
    const allowedFields = ['imageIdentity', 'imageContract', 'imageLicense', 'imageInvoice', 'imageCompanySubscription']
    const uploadDir = join(process.cwd(), 'public', 'documents')

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Process each form field
    for (const field of allowedFields) {
      const file = formData.get(field) as File | null

      if (file && file.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `Invalid file type for ${field}. Allowed: JPG, PNG, PDF` },
            { status: 400 }
          )
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `File size exceeds 10MB for ${field}` },
            { status: 400 }
          )
        }

        try {
          // Generate unique filename
          const timestamp = Date.now()
          const ext = file.name.split('.').pop()
          const filename = `${excessId}-${field}-${timestamp}.${ext}`

          // Read file and save to public/documents
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const filepath = join(uploadDir, filename)

          await writeFile(filepath, buffer)
          console.log('File saved:', filename)

          // Store only filename in database
          updateData[field] = filename

          // تسجيل الإجراء - رفع المستند
          const documentLabel = documentTypeLabels[field] || field
          await logDocumentUpload(
            excessId,
            session.user.id,
            field,
            documentLabel,
            filename
          )
        } catch (fileError) {
          console.error('Error saving file:', fileError)
          return NextResponse.json(
            { error: `Failed to save file for ${field}` },
            { status: 500 }
          )
        }
      }
    }

    // Update excess with document filenames
    if (Object.keys(updateData).length > 0) {
      const updatedExcess = await prisma.excess.update({
        where: { id: excessId },
        data: {
          ...updateData,
          status: 'NEED_UPDATE',
        },
      })
      console.log('Updated excess documents:', updatedExcess)
      return NextResponse.json(updatedExcess)
    }

    return NextResponse.json({ success: true, data: excess })
  } catch (error) {
    console.error('Error updating excess documents:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}