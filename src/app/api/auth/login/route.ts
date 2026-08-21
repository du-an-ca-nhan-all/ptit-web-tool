import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { verifyPassword, createAuthToken, checkIsAdmin, checkIsMonitor, getUserRoles } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' },
        { status: 400 }
      );
    }

    const normalizedUsername = String(username).trim().toUpperCase();

    // 1. Check in User table with Student profile
    let user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: { student: true },
    });

    if (user) {
      if (!user.passwordHash || user.passwordHash.trim() === '') {
        return NextResponse.json(
          { error: 'Tài khoản chưa được kích hoạt mật khẩu. Vui lòng bấm "Đăng Ký Tài Khoản" để tạo mật khẩu và gửi yêu cầu kích hoạt.' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash, user.username);
      if (!isValid) {
        await logActivity({
          req,
          userId: user.id,
          username: user.username,
          userRole: user.role,
          action: 'LOGIN_FAILED',
          targetType: 'AUTH',
          targetId: user.username,
          description: `Đăng nhập thất bại cho tài khoản ${user.username}: Sai mật khẩu`,
        });
        return NextResponse.json(
          { error: 'Tài khoản hoặc mật khẩu không chính xác' },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Tài khoản của bạn đang bị tạm khoá. Vui lòng liên hệ Quản trị viên.' },
          { status: 403 }
        );
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const isAdmin = checkIsAdmin(user.role);
      const isMonitor = checkIsMonitor(user.role);
      const roles = getUserRoles(user.role);

      const authPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        roles,
        isAdmin,
        isMonitor,
        fullName: user.student?.hoTen || user.student?.ten || user.username,
        phoneNumber: user.student?.soDienThoai || null,
        lop: user.student?.maLop || null,
      };

      await logActivity({
        req,
        userId: user.id,
        username: user.username,
        userRole: user.role,
        action: 'LOGIN',
        targetType: 'AUTH',
        targetId: user.username,
        description: `Người dùng ${user.username} (${authPayload.fullName}) đăng nhập thành công`,
      });

      const token = await createAuthToken(authPayload);
      const response = NextResponse.json({
        success: true,
        user: authPayload,
        token,
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // 2. Check if student exists in Student database
    const student = await prisma.student.findUnique({
      where: { maSV: normalizedUsername },
    });

    if (student) {
      return NextResponse.json(
        { error: 'Tài khoản sinh viên chưa được đăng ký mật khẩu. Vui lòng bấm "Đăng Ký Tài Khoản" để khởi tạo.' },
        { status: 401 }
      );
    }

    await logActivity({
      req,
      username: normalizedUsername,
      action: 'LOGIN_FAILED',
      targetType: 'AUTH',
      targetId: normalizedUsername,
      description: `Đăng nhập thất bại: Không tìm thấy tài khoản hoặc sinh viên ${normalizedUsername}`,
    });

    return NextResponse.json(
      { error: 'Tài khoản hoặc mật khẩu không chính xác' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập: ' + error.message },
      { status: 500 }
    );
  }
}
