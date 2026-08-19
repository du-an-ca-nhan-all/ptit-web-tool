import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getAuthUser, createAuthToken, checkIsAdmin, checkIsMonitor } from '@/src/lib/auth';
import { logActivity } from '@/src/lib/activityLog';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    if (!authUser.impersonatedBy) {
      return NextResponse.json(
        { error: 'Tài khoản hiện tại không trong trạng thái giả lập (impersonation)' },
        { status: 400 }
      );
    }

    const adminUsername = authUser.impersonatedBy.toUpperCase();

    // Find original admin user
    const adminUser = await prisma.user.findUnique({
      where: { username: adminUsername },
      include: { student: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: `Không tìm thấy tài khoản quản trị viên gốc: ${adminUsername}` },
        { status: 404 }
      );
    }

    const isAdmin = checkIsAdmin(adminUser.role);
    const isMonitor = checkIsMonitor(adminUser.role);

    const adminPayload = {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      isAdmin,
      isMonitor,
      fullName: adminUser.student?.hoTen || adminUser.student?.ten || adminUser.username,
      phoneNumber: adminUser.student?.soDienThoai || null,
      lop: adminUser.student?.maLop || null,
      impersonatedBy: null,
    };

    await logActivity({
      req,
      userId: adminUser.id,
      username: adminUsername,
      userRole: adminUser.role,
      action: 'REVERT_IMPERSONATE',
      targetType: 'USER',
      targetId: authUser.username,
      description: `Admin ${adminUsername} đã thoát chế độ giả lập từ tài khoản ${authUser.username} và trở về tài khoản Admin`,
      metadata: { fromUsername: authUser.username },
    });

    const token = await createAuthToken(adminPayload);

    const response = NextResponse.json({
      success: true,
      message: `Đã trở về tài khoản Quản Trị Viên: ${adminPayload.fullName} (${adminPayload.username})`,
      user: adminPayload,
      token,
    });

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
    console.error('Revert impersonate error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi quay về tài khoản Admin' }, { status: 500 });
  }
}
