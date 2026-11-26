import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from './route/helpers';
import { handleGetTelegramConfig } from './route/getHandler';
import { handleAdminBotAction } from './route/adminBotActions';
import { handleAdminQueueAction } from './route/adminQueueActions';
import { handleUserConfigAction } from './route/userConfigActions';
import { handleUserCheckAction } from './route/userCheckActions';
import { handleUserChatAction } from './route/userChatActions';

// GET /api/telegram-config?view=all OR /api/telegram-config?targetUsername=K25...
export async function GET(req: NextRequest) {
  return handleGetTelegramConfig(req);
}

// POST /api/telegram-config
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetUsername } = body;

    // Target username check: Normal users can only configure their own account, admin can configure anyone
    let username = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Bạn không có quyền thao tác cấu hình của tài khoản khác' },
          { status: 403 }
        );
      }
      username = targetUsername;
    }

    const adminBotRes = await handleAdminBotAction(req, authUser, action, body);
    if (adminBotRes) return adminBotRes;

    const adminQueueRes = await handleAdminQueueAction(req, authUser, action, body);
    if (adminQueueRes) return adminQueueRes;

    const userConfigRes = await handleUserConfigAction(req, username, action, body);
    if (userConfigRes) return userConfigRes;

    const userCheckRes = await handleUserCheckAction(req, username, action, body);
    if (userCheckRes) return userCheckRes;

    const userChatRes = await handleUserChatAction(req, username, action, body);
    if (userChatRes) return userChatRes;

    return NextResponse.json({ error: `Hành động ${action} không được hỗ trợ` }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/telegram-config error:', err);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi xử lý cấu hình Telegram', details: err.message },
      { status: 500 }
    );
  }
}
