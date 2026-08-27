import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getAuthUser, verifyPassword, hashPassword } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { changePasswordSchema, validateZod } from '@/src/features/auth/schemas/auth.schema';
import { getClientIp, checkRateLimit, createRateLimitExceededResponse } from '@/src/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`change-pass:${authUser.id}:${ip}`, 5, 60);
    if (!rateLimit.success) {
      return createRateLimitExceededResponse(
        'Bạn đã thử đổi mật khẩu quá nhiều lần. Vui lòng đợi 1 phút trước khi thử lại.',
        rateLimit.resetSeconds
      );
    }

    const body = await req.json();
    const validation = validateZod(changePasswordSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, fieldErrors: validation.fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản người dùng' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash, user.username);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }

    // Hash new password and save
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    await logActivity({
      req,
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action: 'CHANGE_PASSWORD',
      targetType: 'USER',
      targetId: user.username,
      description: `Người dùng ${user.username} đã thay đổi mật khẩu tài khoản thành công`,
      metadata: {
        username: user.username,
        role: user.role,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu tài khoản thành công!',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi đổi mật khẩu' }, { status: 500 });
  }
}
