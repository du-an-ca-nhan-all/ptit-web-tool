import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { checkIsAdmin, getCurrentUserFromCookie, verifyAuthToken, hashSHA512 } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

async function getAuthUser(req: NextRequest) {
  let authUser = await getCurrentUserFromCookie();
  if (!authUser) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      authUser = await verifyAuthToken(token);
    }
  }
  return authUser;
}

function generateRandomPassword(length = 8): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const specials = '@#$%';
  
  let result = 'Pt';
  for (let i = 0; i < 4; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  for (let i = 0; i < 2; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

// POST /api/auth/reset-password (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const isAdmin = checkIsAdmin(authUser.role) || (authUser as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên hệ thống mới có quyền đặt lại mật khẩu cho người dùng' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, mode = 'CUSTOM', newPassword } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp Mã sinh viên / Tên đăng nhập của tài khoản cần reset mật khẩu' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toUpperCase();

    // 1. Check if user or student exists
    let user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: { student: true },
    });

    const student = await prisma.student.findUnique({
      where: { maSV: cleanUsername },
    });

    if (!user && !student) {
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản hoặc sinh viên với mã "${cleanUsername}" trong hệ thống` },
        { status: 404 }
      );
    }

    // If User not created yet, create it from Student
    if (!user && student) {
      user = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash: '',
          role: 'sinh_vien',
          isActive: true,
        },
        include: { student: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Không thể khởi tạo người dùng' }, { status: 500 });
    }

    let finalPassword = '';
    let finalHashed = '';
    let successMessage = '';

    if (mode === 'CLEAR') {
      // Clear passwordHash so user must register again
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: '', isActive: true },
      });

      // Clear any pending requests
      await prisma.registrationRequest.deleteMany({
        where: { username: cleanUsername },
      });

      successMessage = `Đã xóa mật khẩu của tài khoản ${cleanUsername}. Sinh viên có thể tự đăng ký lại mật khẩu mới.`;
    } else if (mode === 'GENERATE') {
      finalPassword = generateRandomPassword(8);
      finalHashed = hashSHA512(finalPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: finalHashed, isActive: true },
      });

      successMessage = `Đã tạo mật khẩu ngẫu nhiên mới cho tài khoản ${cleanUsername}!`;
    } else {
      // CUSTOM mode
      if (!newPassword || String(newPassword).trim().length < 6) {
        return NextResponse.json(
          { error: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự' },
          { status: 400 }
        );
      }

      finalPassword = String(newPassword).trim();
      finalHashed = hashSHA512(finalPassword);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: finalHashed, isActive: true },
      });

      successMessage = `Đã đặt lại mật khẩu thành công cho tài khoản ${cleanUsername}!`;
    }

    // Log Activity
    await logActivity({
      req,
      userId: authUser.id,
      username: authUser.username,
      userRole: authUser.role,
      action: 'ADMIN_RESET_PASSWORD',
      targetType: 'USER',
      targetId: cleanUsername,
      description: `Admin ${authUser.username} đã đặt lại mật khẩu cho tài khoản ${cleanUsername} (Chế độ: ${mode})`,
      metadata: {
        targetUsername: cleanUsername,
        mode,
        studentName: user.student?.hoTen || student?.hoTen,
        lop: user.student?.maLop || student?.maLop,
      },
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      username: cleanUsername,
      fullName: user.student?.hoTen || student?.hoTen || cleanUsername,
      lop: user.student?.maLop || student?.maLop || null,
      mode,
      newPassword: finalPassword || null,
    });
  } catch (error: any) {
    console.error('Admin reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi đặt lại mật khẩu cho người dùng' },
      { status: 500 }
    );
  }
}
