import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookingStatus, FinanceType } from '@prisma/client'
import { z } from 'zod'

const bookingSchema = z.object({
  contractId: z.string().min(1),
  bookingId: z.string().optional(),
  insuranceAmount: z.number().positive(),
  rentalDays: z.number().int().positive(),
  rentalType: z.enum(['daily', 'weekly', 'monthly']),
  dailyRate: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    let accountId = session.user.id
    
    if (userId && (session.user?.role === 'ADMIN' || session.user?.role === 'EMPLOYEE')) {
      accountId = userId
    }

    const bookings = await prisma.booking.findMany({
      where: {
        accountId,
        ...(status && { status: status as any }),
      },
      include: {
        account: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Booking POST request received:', request.url);
    console.log('Request headers:', Object.fromEntries(Array.from(request.headers.entries())));
    
    // Check session
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Valid session' : 'No session');
    
    if (!session) {
      console.error('Authentication failed: No session found');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'لم يتم العثور على جلسة صالحة. يرجى تسجيل الدخول مرة أخرى.' 
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    if (!session.user || !session.user.id) {
      console.error('Authentication failed: Session missing user ID');
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'معرف المستخدم غير موجود في الجلسة. يرجى تسجيل الدخول مرة أخرى.' 
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Received booking data:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ 
        error: 'Bad Request',
        message: 'تنسيق JSON غير صالح في طلب الإنشاء.' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Validate data against schema
    let validatedData;
    try {
      validatedData = bookingSchema.parse(body);
      console.log('Validated data:', validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return NextResponse.json({ 
          error: 'Validation Error', 
          details: error.errors,
          message: 'خطأ في التحقق من صحة البيانات. يرجى التأكد من إدخال جميع الحقول المطلوبة بشكل صحيح.'
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      throw error;
    }

    // Validate dates
    try {
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      if (isNaN(startDate.getTime())) {
        console.error('Invalid start date:', validatedData.startDate);
        return NextResponse.json({ 
          error: 'Date Error', 
          message: 'تنسيق تاريخ البداية غير صالح. يجب أن يكون بتنسيق YYYY-MM-DD.' 
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      if (isNaN(endDate.getTime())) {
        console.error('Invalid end date:', validatedData.endDate);
        return NextResponse.json({ 
          error: 'Date Error', 
          message: 'تنسيق تاريخ النهاية غير صالح. يجب أن يكون بتنسيق YYYY-MM-DD.' 
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      // Check if end date is after start date
      if (endDate <= startDate) {
        console.error('End date must be after start date');
        return NextResponse.json({ 
          error: 'Date Error', 
          message: 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية.' 
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      console.log('Dates validated successfully');
    } catch (error) {
      console.error('Date validation error:', error);
      return NextResponse.json({ 
        error: 'Date Error', 
        message: 'خطأ في التحقق من صحة التواريخ. يرجى التأكد من إدخال التواريخ بشكل صحيح.' 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Create booking in database
    try {
      console.log('Creating booking in database...');
      
      // Test database connection first
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('Database connection test successful');
      } catch (dbConnError) {
        console.error('Database connection test failed:', dbConnError);
        return NextResponse.json({ 
          error: 'Database Error', 
          message: 'ظپط´ظ„ ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰ ظ„ط§ط­ظ‚ظ‹ط§.' 
        }, { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      // Create the booking with explicit status using the enum type
      const booking = await prisma.booking.create({
        data: {
          contractId: validatedData.contractId,
          bookingId: validatedData.bookingId,
          insuranceAmount: validatedData.insuranceAmount,
          rentalDays: validatedData.rentalDays,
          rentalType: validatedData.rentalType,
          dailyRate: validatedData.dailyRate,
          accountId: session.user.id,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          status: BookingStatus.PENDING, // Using the enum value directly
        },
      });
      
      console.log('Booking created successfully:', booking.id);

      // Create finance record with explicit type
      try {
        await prisma.finance.create({
          data: {
            accountId: session.user.id,
            bookingId: booking.id,
            amount: validatedData.dailyRate ,
            type: FinanceType.DEBIT, // حجز - مصروف/تكلفة إيجار, // Using the enum value directly
            description: `مصروف إيجار سيارة - ${validatedData.contractId}`,
          },
        });
        console.log('Finance record created successfully');
      } catch (financeError) {
        console.error('Error creating finance record:', financeError);
        
        // Log detailed error information
        const financeErrorMessage = financeError instanceof Error ? financeError.message : 'Unknown finance error';
        console.error('Detailed finance error message:', financeErrorMessage);
        
        // Check if it's an enum error
        if (financeErrorMessage.includes('invalid input value for enum') || 
            financeErrorMessage.includes('type "FinanceType"')) {
          console.error('Finance enum type error detected. This might require running /api/fix-db-schema');
        }
        
        // Continue even if finance record creation fails
      }

      return NextResponse.json(booking, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Check for specific database errors
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Detailed error message:', errorMessage);
      
      // Log the error stack trace if available
      if (dbError instanceof Error && dbError.stack) {
        console.error('Error stack trace:', dbError.stack);
      }
      
      if (errorMessage.includes('unique constraint')) {
        return NextResponse.json({ 
          error: 'Database Error', 
          message: 'هناك حجز موجود بالفعل بنفس المعرف. يرجى استخدام معرف مختلف.',
          details: errorMessage
        }, { 
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      // Check for enum value errors with more detailed information
      if (errorMessage.includes('invalid input value for enum') || 
          errorMessage.includes('enum_value_out_of_range') ||
          errorMessage.includes('type "BookingStatus"') ||
          errorMessage.includes('type "FinanceType"') ||
          errorMessage.includes('type "UserRole"')) {
        
        // Try to extract which enum is causing the issue
        let enumType = 'unknown';
        if (errorMessage.includes('BookingStatus')) enumType = 'BookingStatus';
        else if (errorMessage.includes('FinanceType')) enumType = 'FinanceType';
        else if (errorMessage.includes('UserRole')) enumType = 'UserRole';
        
        return NextResponse.json({ 
          error: 'Database Enum Error', 
          message: `ظ‚ظٹظ…ط© ط؛ظٹط± طµط§ظ„ط­ط© ظ„ط­ظ‚ظ„ ط§ظ„طھطµظ†ظٹظپ (${enumType}). ظٹط±ط¬ظ‰ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظ‚ظٹظ… ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ط§ ط£ظˆ ط§ط³طھط®ط¯ط§ظ… /api/fix-db-schema ظ„ط¥طµظ„ط§ط­ ط§ظ„ظ…ط´ظƒظ„ط©.`,
          details: errorMessage,
          enumType: enumType,
          suggestion: 'Try running /api/fix-db-schema to fix database enum types'
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      // Check for foreign key constraint errors
      if (errorMessage.includes('foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Database Error', 
          message: 'خطأ في العلاقة بين الجداول. تأكد من صحة المعرفات المستخدمة.',
          details: errorMessage
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      // Check for type conversion errors
      if (errorMessage.includes('cannot be cast') || 
          errorMessage.includes('invalid input syntax')) {
        return NextResponse.json({ 
          error: 'Database Error', 
          message: 'ط®ط·ط£ ظپظٹ ظ†ظˆط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ. طھط£ظƒط¯ ظ…ظ† ط¥ط¯ط®ط§ظ„ ط§ظ„ظ‚ظٹظ… ط¨ط§ظ„طھظ†ط³ظٹظ‚ ط§ظ„طµط­ظٹط­.',
          details: errorMessage
        }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }
      
      return NextResponse.json({ 
        error: 'Database Error', 
        message: 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط­ظپط¸ ط§ظ„ط­ط¬ط² ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰ ظ„ط§ط­ظ‚ظ‹ط§.',
        details: errorMessage
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error in POST handler:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'ط­ط¯ط« ط®ط·ط£ ط¯ط§ط®ظ„ظٹ ظپظٹ ط§ظ„ط®ط§ط¯ظ…. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰ ظ„ط§ط­ظ‚ظ‹ط§.' 
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}