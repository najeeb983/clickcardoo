import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

function extractFilename(url: string): string {
  try {
    if (url.includes('/')) {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const parts = pathname.split('/')
      const filename = parts[parts.length - 1]
      return filename ? decodeURIComponent(filename) : 'document'
    }
    return decodeURIComponent(url)
  } catch {
    return decodeURIComponent(url)
  }
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

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
    const documentType = request.nextUrl.searchParams.get('type')

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    const excess = await prisma.excess.findUnique({
      where: { id: excessId },
      include: {
        booking: {
          select: { accountId: true }
        }
      }
    })

    if (!excess) {
      return NextResponse.json(
        { error: 'Excess not found' },
        { status: 404 }
      )
    }

    if (excess.booking.accountId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const documentMap: Record<string, keyof typeof excess> = {
      'identity': 'imageIdentity',
      'contract': 'imageContract',
      'license': 'imageLicense',
      'invoice': 'imageInvoice',
      'subscription': 'imageCompanySubscription',
    }

    const dbField = documentMap[documentType]
    if (!dbField) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    const fileUrl = excess[dbField] as string | null
    console.log('Download requested for type:', documentType, 'Value:', fileUrl ? fileUrl.substring(0, 100) : 'null')

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Handle URL files (http/https)
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        const response = await fetch(fileUrl, {
          headers: { 'User-Agent': 'Cardoo/1.0' }
        })

        if (!response.ok) {
          console.error('Failed to fetch file:', response.status)
          return NextResponse.json(
            { error: 'Failed to fetch file from URL', status: response.status },
            { status: 500 }
          )
        }

        const arrayBuffer = await response.arrayBuffer()
        const filename = extractFilename(fileUrl)

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': response.headers.get('content-type') || getMimeType(filename),
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        })
      } catch (fetchError) {
        console.error('Error fetching file:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch file', details: String(fetchError) },
          { status: 500 }
        )
      }
    }

    // Handle local files stored in public/documents
    const filepath = join(process.cwd(), 'public', 'documents', fileUrl)
    
    console.log('Reading local file from:', filepath)

    if (!existsSync(filepath)) {
      console.error('File not found:', filepath)
      return NextResponse.json(
        { error: 'File not found on server', filename: fileUrl },
        { status: 404 }
      )
    }

    try {
      const buffer = await readFile(filepath)
      const filename = extractFilename(fileUrl)
      const mimeType = getMimeType(filename)

      // Convert Buffer to Uint8Array for NextResponse
      const uint8Array = new Uint8Array(buffer)

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      })
    } catch (readError) {
      console.error('Error reading file:', readError)
      return NextResponse.json(
        { error: 'Failed to read file', details: String(readError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}