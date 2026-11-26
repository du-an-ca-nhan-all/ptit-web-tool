import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashSHA512 } from '@/src/lib/auth';
import { registerSchema, validateZod } from '@/src/features/auth/schemas/auth.schema';
import { getClientIp, checkRateLimit, createRateLimitExceededResponse } from '@/src/lib/rate-limiter';
import { REGISTER_RATE_LIMIT } from './route/constants';
import { verifyQldttxCredentials } from './route/qldttxAuth';
import { executeAutoApproveRegistration } from './route/autoApproveRegistration';

// GET /api/auth/register?username=K25DTCN402
// Lookup student existence, name, and class for registration auto-display
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get('username');
    const username = rawUsername ? rawUsername.trim().toUpperCase() : '';

    if (!username || username.length < 3) {
      return NextResponse.json({ found: false, error: 'Mã sinh viên không hợp lệ' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { maSV: username },
      include: {
        user: {
          select: {
            passwordHash: true,
            isActive: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        found: false,
        error: `Mã sinh viên "${username}" không tồn tại trong hệ thống.`,
      });
    }

    const hasPassword = Boolean(
      student.user?.passwordHash && student.user.passwordHash.trim() !== ''
    );

    return NextResponse.json({
      found: true,
      student: {
        maSV: student.maSV,
        hoTen: student.hoTen || student.ten || student.maSV,
        maLop: student.maLop,
        soDienThoai: student.soDienThoai,
        hasPassword,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth/register
// Submit registration request with SHA-512 passwordHash & student validation
// Auto-approve & auto-configure ExternalAccount if password matches QLDTTX (QLHT)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 6 attempts per minute per IP
    const rateLimit = checkRateLimit(
      `register:${ip}`,
      REGISTER_RATE_LIMIT.maxAttempts,
      REGISTER_RATE_LIMIT.windowSeconds
    );
    if (!rateLimit.success) {
      return createRateLimitExceededResponse(
        'Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng đợi 1 phút trước khi thử lại.',
        rateLimit.resetSeconds
      );
    }

    const body = await req.json();
    const validation = validateZod(registerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, fieldErrors: validation.fieldErrors },
        { status: 400 }
      );
    }

    const { username: cleanUsername, password: cleanPassword, phoneNumber, note } = validation.data;

    // 1. Check if student exists in Student table (MANDATORY)
    const student = await prisma.student.findUnique({
      where: { maSV: cleanUsername },
    });

    if (!student) {
      return NextResponse.json(
        {
          error: `Mã sinh viên "${cleanUsername}" không tồn tại trong danh sách sinh viên trường. Vui lòng kiểm tra lại hoặc liên hệ Quản trị viên để được hỗ trợ.`,
        },
        { status: 400 }
      );
    }

    // 2. Check existing User account password status
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUser && existingUser.passwordHash && existingUser.passwordHash.trim() !== '') {
      return NextResponse.json(
        {
          error: 'Tài khoản này đã được kích hoạt mật khẩu. Nếu bạn quên mật khẩu, vui lòng liên hệ Quản trị viên để được đặt lại.',
        },
        { status: 400 }
      );
    }

    // 3. Extract info directly from Student record
    const finalFullName = String(student.hoTen || student.ten || cleanUsername).trim();
    const finalLop = student.maLop ? String(student.maLop).trim() : null;
    const finalPhone = String(phoneNumber || student.soDienThoai || '').trim();

    // 4. Hash password with SHA-512 (128 hex chars)
    const hashedPassword = hashSHA512(cleanPassword);

    // 5. Verify credentials against QLHT (Cổng QLDTTX PTTC1) - MANDATORY for auto-approval
    const { token: qldtToken, errorMsg: qlhtErrorMsg, isTimeout } = await verifyQldttxCredentials(
      cleanUsername,
      cleanPassword
    );

    if (!qldtToken) {
      if (isTimeout) {
        return NextResponse.json(
          {
            error:
              'Không thể kết nối đến Cổng QLDTTX (QLHT) để xác thực mật khẩu (quá thời gian chờ). Vui lòng thử lại sau ít phút.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error:
            'Mật khẩu không khớp với tài khoản Cổng QLDTTX (QLHT). Vui lòng nhập đúng mật khẩu đang dùng trên qldttx.pttc1.edu.vn để được kích hoạt tự động.',
          detail: qlhtErrorMsg || undefined,
        },
        { status: 400 }
      );
    }

    const regRequest = await executeAutoApproveRegistration({
      req,
      ip,
      student,
      cleanUsername,
      cleanPassword,
      hashedPassword,
      qldtToken,
      finalFullName,
      finalLop,
      finalPhone,
      note,
    });

    return NextResponse.json({
      success: true,
      autoApproved: true,
      message:
        'Đăng ký tài khoản thành công! Mật khẩu đã được xác thực với Cổng QLDTTX (QLHT), tài khoản của bạn đã được TỰ ĐỘNG KÍCH HOẠT và liên kết QLHT ngay lập tức. Bạn có thể đăng nhập ngay bây giờ!',
      request: {
        id: regRequest.id,
        username: regRequest.username,
        fullName: regRequest.fullName,
        lop: regRequest.lop,
        status: regRequest.status,
        createdAt: regRequest.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi gửi yêu cầu đăng ký tài khoản.' },
      { status: 500 }
    );
  }
}
