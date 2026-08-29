import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { hashSHA512 } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { loginAndGetToken } from '@/src/features/external-portal/server/qldttxServerService';
import { forgotPasswordQlhtSchema, validateZod } from '@/src/features/auth/schemas/auth.schema';
import { getClientIp, checkRateLimit, createRateLimitExceededResponse } from '@/src/lib/rate-limiter';

// POST /api/auth/forgot-password
// Reset password by verifying student credentials against QLDTTX (QLHT)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 6 attempts per minute per IP to prevent spamming QLHT
    const rateLimit = checkRateLimit(`forgot-password:${ip}`, 6, 60);
    if (!rateLimit.success) {
      return createRateLimitExceededResponse(
        'Bạn đã thử quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.',
        rateLimit.resetSeconds
      );
    }

    const body = await req.json();
    const validation = validateZod(forgotPasswordQlhtSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, fieldErrors: validation.fieldErrors },
        { status: 400 }
      );
    }

    const { username: cleanUsername, qlhtPassword: cleanPassword } = validation.data;

    // 1. Check if student or user exists in system
    const student = await prisma.student.findUnique({
      where: { maSV: cleanUsername },
      include: { user: true },
    });

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: { student: true },
    });

    if (!student && !user) {
      return NextResponse.json(
        {
          error: `Mã sinh viên "${cleanUsername}" không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc liên hệ Quản trị viên.`,
        },
        { status: 404 }
      );
    }

    // 2. Authenticate against QLHT (Cổng QLDTTX PTTC1) with safe 8s timeout
    let qldtToken: string | null = null;

    try {
      const tokenPromise = loginAndGetToken({
        username: cleanUsername,
        password: cleanPassword,
      });
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('QLDTTX login timeout')), 8000)
      );

      const tokenRes = await Promise.race([tokenPromise, timeoutPromise]);
      if (tokenRes && tokenRes.startsWith('Bearer ')) {
        qldtToken = tokenRes;
      }
    } catch {
      qldtToken = null;
    }

    // If QLHT login fails
    if (!qldtToken) {
      return NextResponse.json(
        {
          error:
            'Mật khẩu Cổng QLHT không chính xác hoặc không thể đăng nhập vào cổng trường (https://qldttx.pttc1.edu.vn/). Vui lòng kiểm tra lại mật khẩu QLHT của bạn.',
        },
        { status: 400 }
      );
    }

    // 3. QLHT verification succeeded -> Hash password with SHA-512
    const hashedPassword = hashSHA512(cleanPassword);
    const finalFullName = String(
      student?.hoTen || student?.ten || user?.student?.hoTen || user?.student?.ten || cleanUsername
    ).trim();
    const finalLop = student?.maLop || user?.student?.maLop || null;

    // 4. Update / Upsert User password and activate account
    await prisma.user.upsert({
      where: { username: cleanUsername },
      create: {
        username: cleanUsername,
        passwordHash: hashedPassword,
        role: user?.role || 'sinh_vien',
        isActive: true,
      },
      update: {
        passwordHash: hashedPassword,
        isActive: true,
      },
    });

    // 5. Update / Upsert ExternalAccount for QLDTTX_PTTC1
    await prisma.externalAccount.upsert({
      where: {
        username_systemKey: {
          username: cleanUsername,
          systemKey: 'QLDTTX_PTTC1',
        },
      },
      create: {
        username: cleanUsername,
        systemKey: 'QLDTTX_PTTC1',
        systemName: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
        systemUrl: 'https://qldttx.pttc1.edu.vn/',
        extUsername: cleanUsername,
        extPassword: cleanPassword,
        token: qldtToken,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        syncMessage: 'Đã tự động xác thực và cập nhật qua Cổng QLDTTX khi khôi phục mật khẩu',
      },
      update: {
        systemName: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
        systemUrl: 'https://qldttx.pttc1.edu.vn/',
        extUsername: cleanUsername,
        extPassword: cleanPassword,
        token: qldtToken,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        syncMessage: 'Đã tự động xác thực và cập nhật qua Cổng QLDTTX khi khôi phục mật khẩu',
      },
    });

    // 6. If any pending registration requests exist, mark them APPROVED
    await prisma.registrationRequest.updateMany({
      where: {
        username: cleanUsername,
        status: 'PENDING',
      },
      data: {
        passwordHash: hashedPassword,
        status: 'APPROVED',
        reviewedBy: 'TỰ ĐỘNG (QLHT FORGOT PASS)',
        reviewedAt: new Date(),
        note: 'Đã tự động duyệt khi khôi phục mật khẩu qua Cổng QLHT',
      },
    });

    // 7. Log activity
    await logActivity({
      req,
      username: cleanUsername,
      action: 'FORGOT_PASSWORD_RESET_QLHT',
      targetType: 'USER',
      targetId: cleanUsername,
      description: `Sinh viên ${cleanUsername} (${finalFullName} - Lớp ${finalLop || 'Chưa rõ'}) đã khôi phục mật khẩu thành công qua xác thực Cổng QLHT`,
      metadata: {
        username: cleanUsername,
        fullName: finalFullName,
        lop: finalLop,
        autoReset: true,
        hasToken: true,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        'Đặt lại mật khẩu thành công! Mật khẩu tài khoản của bạn đã được tự động cập nhật theo Mật khẩu Cổng QLHT. Bạn có thể đăng nhập ngay bây giờ!',
      username: cleanUsername,
      fullName: finalFullName,
      lop: finalLop,
    });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi thực hiện đặt lại mật khẩu.' },
      { status: 500 }
    );
  }
}
