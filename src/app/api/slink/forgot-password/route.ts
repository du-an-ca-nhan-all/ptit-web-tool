import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import { requestSlinkPasswordReset } from '@/src/features/external-portal/server/slinkServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';

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

// POST /api/slink/forgot-password
// Tự động gọi hệ thống PTIT Keycloak SSO để gửi yêu cầu đặt lại mật khẩu S-Link qua Email sinh viên
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { username, email, identifier } = body;

    let targetIdentifier = (identifier || email || username || '').trim();

    // Nếu không truyền identifier nhưng đã đăng nhập, tự động tìm thông tin tài khoản S-Link hoặc MSV của user
    if (!targetIdentifier && authUser) {
      const slinkAccount = await prisma.externalAccount.findFirst({
        where: {
          username: authUser.username,
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        },
      });

      if (slinkAccount?.extUsername) {
        targetIdentifier = slinkAccount.extUsername.trim();
      } else {
        targetIdentifier = authUser.username.trim();
      }
    }

    if (!targetIdentifier) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp Mã sinh viên (MSV) hoặc Email sinh viên (...@stu.ptit.edu.vn).' },
        { status: 400 }
      );
    }

    // Phân quyền: nếu người dùng đang đăng nhập và truyền một username khác mà không phải Admin / Monitor
    if (
      authUser &&
      targetIdentifier.toUpperCase() !== authUser.username.toUpperCase() &&
      !targetIdentifier.toLowerCase().includes(authUser.username.toLowerCase()) &&
      !authUser.isAdmin &&
      !authUser.isMonitor
    ) {
      return NextResponse.json(
        { error: 'Bạn không có quyền gửi yêu cầu đặt lại mật khẩu cho sinh viên khác' },
        { status: 403 }
      );
    }

    // Thực hiện tự động gửi yêu cầu đặt lại mật khẩu đến Keycloak SSO S-Link
    const result = await requestSlinkPasswordReset(targetIdentifier);

    // Ghi log hoạt động nếu có phiên đăng nhập
    if (authUser) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SLINK_FORGOT_PASSWORD',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: targetIdentifier,
        description: `Gửi yêu cầu đặt lại mật khẩu PTIT S-Link cho định danh [${targetIdentifier}]`,
        metadata: { targetIdentifier, result },
      }).catch((e) => console.warn('[ActivityLog] Lỗi ghi log forgot-password:', e.message));
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      sentTo: result.sentTo,
      instructions: [
        '1. Mở Hòm thư sinh viên (Microsoft Outlook / PTIT Email)',
        '2. Mở email từ PTIT Slink SSO (slink@ptit.edu.vn)',
        '3. Nhấp vào liên kết "Link to reset credentials" (hiệu lực trong 5 phút)',
        '4. Nhập mật khẩu mới và hoàn tất đặt lại mật khẩu',
      ],
      outlookUrl: 'https://outlook.office.com/mail/',
    });
  } catch (error: any) {
    console.error('API /api/slink/forgot-password Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi gửi yêu cầu đặt lại mật khẩu PTIT S-Link' },
      { status: 500 }
    );
  }
}
