import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { getCurrentUserFromCookie, verifyAuthToken } from '@/src/lib/auth';
import {
  getOrFetchStudentSlinkOverview,
  getSlinkNotifications,
  getSlinkUserInfo,
  getValidSlinkTokenOrRefresh,
  markSlinkNotificationAsRead,
} from '@/src/features/external-portal/server/slinkServerService';
import { checkAndDispatchSlinkAnnouncements } from '@/src/features/telegram/server/telegramDispatcher';
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

// POST /api/slink/notifications
// Đánh dấu thông báo đã đọc hoặc kích hoạt kiểm tra gửi Telegram
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationId, targetUsername: requestedUsername, type } = body;
    const targetUsername = (authUser.isAdmin && requestedUsername) || authUser.username;

    // 1. ACTION: MARK SINGLE OR ALL NOTIFICATIONS AS READ
    if (action === 'MARK_READ' || action === 'MARK_ALL_READ') {
      const extAccount = await prisma.externalAccount.findFirst({
        where: {
          username: targetUsername.trim().toUpperCase(),
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        },
      });

      if (!extAccount) {
        return NextResponse.json(
          { error: 'Chưa liên kết tài khoản Cổng Thông Tin PTIT S-Link' },
          { status: 400 }
        );
      }

      const { token, isNew } = await getValidSlinkTokenOrRefresh({
        username: extAccount.extUsername,
        password: extAccount.extPassword,
        existingToken: extAccount.token,
      });

      if (isNew && token !== extAccount.token) {
        await prisma.externalAccount.update({
          where: { id: extAccount.id },
          data: {
            token,
            status: 'CONNECTED',
            lastSyncAt: new Date(),
          },
        }).catch(() => {});
      }

      const markType = action === 'MARK_ALL_READ' || type === 'ALL' ? 'ALL' : 'ONE';
      const markRes = await markSlinkNotificationAsRead(token, notificationId, markType);

      await logActivity({
        req,
        userId: authUser.id,
        username: authUser.username,
        userRole: authUser.role,
        action: 'SLINK_MARK_NOTIFICATION_READ',
        targetType: 'EXTERNAL_ACCOUNT',
        targetId: targetUsername,
        description: markType === 'ALL'
          ? `Đánh dấu tất cả thông báo S-Link là đã đọc`
          : `Đánh dấu thông báo S-Link (${notificationId}) là đã đọc`,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: markType === 'ALL' ? 'Đã đánh dấu tất cả thông báo là đã đọc' : 'Đã đánh dấu thông báo là đã đọc',
        data: markRes.data,
      });
    }

    // 2. ACTION: CHECK & DISPATCH SLINK ANNOUNCEMENTS TO TELEGRAM
    if (action === 'CHECK_DISPATCH') {
      const result = await checkAndDispatchSlinkAnnouncements({
        username: targetUsername,
        forceCheck: true,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Hành động ${action} không được hỗ trợ` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/slink/notifications error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Lỗi khi xử lý thông báo PTIT S-Link',
      },
      { status: 500 }
    );
  }
}
