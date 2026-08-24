import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  getOrFetchStudentSlinkOverview,
  getSlinkNotifications,
  getSlinkUserInfo,
  getValidSlinkTokenOrRefresh,
} from '@/src/features/external-portal/server/slinkServerService';
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

// GET /api/slink/notifications
// Lấy danh sách thông báo và thông tin người dùng từ PTIT S-Link (Keycloak SSO)
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem thông tin' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const refresh = searchParams.get('refresh') === 'true';
    const targetUsername = (authUser.isAdmin && searchParams.get('username')) || authUser.username;

    const result = await getOrFetchStudentSlinkOverview(targetUsername, {
      page,
      limit,
      unreadOnly,
      forceRefresh: refresh,
    });

    if (result.isConfigured === false) {
      return NextResponse.json({
        isConfigured: false,
        message: 'Bạn chưa liên kết tài khoản Cổng Thông Tin PTIT S-Link.',
      });
    }

    if (refresh) {
      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SLINK_REFRESH_NOTIFICATIONS',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: targetUsername,
        description: `Làm mới danh sách thông báo từ PTIT S-Link`,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Fetch S-Link Notifications Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Lỗi khi lấy thông báo từ PTIT S-Link',
      },
      { status: 500 }
    );
  }
}
