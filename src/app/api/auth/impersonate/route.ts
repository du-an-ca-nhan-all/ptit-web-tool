import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getAuthUser, createAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này' }, { status: 401 });
    }

    // Only actual admin or already impersonating admin can impersonate
    const isActualAdmin = authUser.isAdmin || !!authUser.impersonatedBy;
    if (!isActualAdmin) {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên (Admin) mới có quyền đăng nhập với tư cách người dùng khác' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUsername } = body;

    if (!targetUsername) {
      return NextResponse.json({ error: 'Mã người dùng (targetUsername) là bắt buộc' }, { status: 400 });
    }

    const cleanUsername = String(targetUsername).trim().toUpperCase();

    // 1. Find user in database
    let targetUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: { student: true },
    });

    // If not found in User, check if exists in Student table and auto-create User
    if (!targetUser) {
      const studentRecord = await prisma.student.findUnique({
        where: { maSV: cleanUsername },
      });

      if (studentRecord) {
        targetUser = await prisma.user.create({
          data: {
            username: cleanUsername,
            passwordHash: '',
            role: 'sinh_vien',
          },
          include: { student: true },
        });
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản hoặc sinh viên có mã: ${cleanUsername}` },
        { status: 404 }
      );
    }

    // Original admin who initiated the impersonation
    const originalAdmin = authUser.impersonatedBy || authUser.username;

    const isAdmin = checkIsAdmin(targetUser.role);
    const isMonitor = checkIsMonitor(targetUser.role);

    const targetPayload = {
      id: targetUser.id,
      username: targetUser.username,
      role: targetUser.role,
      isAdmin,
      isMonitor,
      fullName: targetUser.student?.hoTen || targetUser.student?.ten || targetUser.username,
      phoneNumber: targetUser.student?.soDienThoai || null,
      lop: targetUser.student?.maLop || null,
      impersonatedBy: originalAdmin,
    };

    await logActivity({
      req,
      userId: authUser.id,
      username: originalAdmin,
      userRole: authUser.role,
      action: 'IMPERSONATE',
      targetType: 'USER',
      targetId: targetUser.username,
      description: `Admin ${originalAdmin} đăng nhập với tư cách sinh viên ${targetPayload.fullName} (${targetPayload.username})`,
      metadata: {
        adminUsername: originalAdmin,
        targetUsername: targetUser.username,
        targetFullName: targetPayload.fullName,
        targetRole: targetUser.role,
        targetLop: targetPayload.lop,
      },
    });

    const token = await createAuthToken(targetPayload);

    const response = NextResponse.json({
      success: true,
      message: `Đã đăng nhập thành công với tư cách sinh viên ${targetPayload.fullName} (${targetPayload.username})`,
      user: targetPayload,
      token,
      impersonatedBy: originalAdmin,
    });

    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi chuyển tài khoản' }, { status: 500 });
  }
}
