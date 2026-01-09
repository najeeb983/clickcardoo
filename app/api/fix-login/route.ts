import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // 1. Check database connection
    await prisma.$queryRaw`SELECT 1`

    // 2. Check if any account exists
    const accountCount = await prisma.account.count()

    if (accountCount === 0) {
      // Create a default admin account if none exists
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      const admin = await prisma.account.create({
        data: {
          name: 'Admin',
          email: 'admin@cardoo.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          active: true,
        },
      })

      return NextResponse.json({
        status: 'success',
        message: 'تم إنشاء حساب مسؤول افتراضي بنجاح (admin@cardoo.com / admin123). يرجى تغيير كلمة المرور فوراً.',
      })
    }

    return NextResponse.json({
      status: 'success',
      message: 'قاعدة البيانات متصلة ويوجد حسابات مسجلة بالفعل. تأكد من إعداد NEXTAUTH_URL و NEXTAUTH_SECRET بشكل صحيح في ملف .env',
    })
  } catch (error: any) {
    console.error('Fix login error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'فشل الاتصال بقاعدة البيانات: ' + (error.message || 'خطأ غير معروف'),
    }, { status: 500 })
  }
}
