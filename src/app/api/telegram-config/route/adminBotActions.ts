import { NextRequest, NextResponse } from 'next/server';
import {
  sendTelegramMessage,
  getSystemTelegramBotPublicInfo,
  getSystemTelegramBotConfig,
  saveSystemTelegramBot,
  toggleSystemTelegramBot,
} from '@/src/features/telegram/server/telegramServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { saveTelegramAdminConfig } from '@/src/lib/globalConfig';
import { AuthUser, resolveEffectiveTokenOrResponse } from './helpers';

export interface AdminBotActionParams {
  req: NextRequest;
  authUser: AuthUser;
  action: string;
  body: any;
}

export async function handleAdminBotAction({
  req,
  authUser,
  action,
  body,
}: AdminBotActionParams): Promise<NextResponse | null> {
  // ─────────────────────────────────────────────────────────────
  // GLOBAL SYSTEM BOT ACTIONS (ADMIN ONLY)
  // ─────────────────────────────────────────────────────────────
  if (action === 'GET_SYSTEM_BOT') {
    const systemBotInfo = await getSystemTelegramBotPublicInfo();
    const systemBotConfig = authUser.isAdmin ? await getSystemTelegramBotConfig() : null;
    return NextResponse.json({
      success: true,
      systemBot: systemBotInfo,
      systemBotConfig,
    });
  }

  if (action === 'SAVE_SYSTEM_BOT') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền cấu hình Bot hệ thống toàn cục' },
        { status: 403 }
      );
    }

    const botToken = body.botToken?.trim();
    const description = body.description?.trim();

    if (!botToken) {
      return NextResponse.json({ error: 'Vui lòng nhập Telegram Bot Token' }, { status: 400 });
    }

    try {
      const saveRes = await saveSystemTelegramBot(botToken, description);

      await logActivity({
        req,
        action: 'SAVE_SYSTEM_TELEGRAM_BOT',
        targetType: 'TELEGRAM_GLOBAL_CONFIG',
        targetId: 'SYSTEM_BOT',
        description: `Admin ${authUser.username} cập nhật cấu hình Bot Telegram toàn cục (@${saveRes.config?.botUsername})`,
        metadata: {
          botUsername: saveRes.config?.botUsername,
          botFirstName: saveRes.config?.botFirstName,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã cấu hình thành công Bot hệ thống: @${saveRes.config?.botUsername} (${saveRes.config?.botFirstName})`,
        config: saveRes.config,
        systemBot: await getSystemTelegramBotPublicInfo(),
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Lỗi khi lưu cấu hình Bot hệ thống' }, { status: 400 });
    }
  }

  if (action === 'TOGGLE_SYSTEM_BOT') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền bật/tắt Bot hệ thống' },
        { status: 403 }
      );
    }

    const isActive = Boolean(body.isActive);
    try {
      const updatedConfig = await toggleSystemTelegramBot(isActive);

      await logActivity({
        req,
        action: 'TOGGLE_SYSTEM_TELEGRAM_BOT',
        targetType: 'TELEGRAM_GLOBAL_CONFIG',
        targetId: 'SYSTEM_BOT',
        description: `Admin ${authUser.username} ${isActive ? 'bật' : 'tắt'} Bot Telegram toàn cục`,
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${isActive ? 'kích hoạt' : 'tạm dừng'} Bot hệ thống thành công!`,
        config: updatedConfig,
        systemBot: await getSystemTelegramBotPublicInfo(),
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Lỗi khi cập nhật trạng thái Bot hệ thống' }, { status: 400 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION: SAVE ADMIN TELEGRAM CHANNEL / TOPIC CONFIG (telegram_admin)
  // ─────────────────────────────────────────────────────────────────────────────
  if (action === 'SAVE_ADMIN_CONFIG') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền cấu hình kênh thông báo Admin' },
        { status: 403 }
      );
    }

    const {
      chatId,
      threadId,
      botToken,
      isEnabled,
      notifyOnNewUser,
      notifyOnDbBackup,
      notifyOnDbRestore,
      notifyOnExamBatchImport,
    } = body;

    try {
      const savedConfig = await saveTelegramAdminConfig({
        chatId,
        threadId,
        botToken,
        isEnabled,
        notifyOnNewUser,
        notifyOnDbBackup,
        notifyOnDbRestore,
        notifyOnExamBatchImport,
      });

      await logActivity({
        req,
        action: 'SAVE_TELEGRAM_ADMIN_CONFIG',
        targetType: 'GLOBAL_CONFIG',
        targetId: 'telegram_admin',
        description: `Admin ${authUser.username} cập nhật cấu hình kênh thông báo Admin (Chat ID: ${chatId}${threadId ? `, Topic: ${threadId}` : ''})`,
        metadata: {
          chatId,
          threadId,
          isEnabled,
          notifyOnNewUser: savedConfig.notifyOnNewUser,
          notifyOnDbBackup: savedConfig.notifyOnDbBackup,
          notifyOnDbRestore: savedConfig.notifyOnDbRestore,
          notifyOnExamBatchImport: savedConfig.notifyOnExamBatchImport,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình kênh thông báo Quản trị viên (telegram_admin) thành công!',
        telegramAdmin: savedConfig,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Lỗi khi lưu cấu hình kênh Admin' }, { status: 400 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTION: TEST ADMIN TELEGRAM DESTINATION (PING TEST)
  // ─────────────────────────────────────────────────────────────────────────────
  if (action === 'TEST_ADMIN_TARGET') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền kiểm tra kết nối Admin' },
        { status: 403 }
      );
    }

    const { chatId, threadId, botToken } = body;
    if (!chatId || !chatId.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập Chat ID để kiểm tra kết nối' }, { status: 400 });
    }

    const tokenRes = await resolveEffectiveTokenOrResponse(botToken, 'Chưa cấu hình Bot Token');
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const now = new Date();
    const testMsg = `🔔 <b>KIỂM TRA KẾT NỐI KÊNH ADMIN (telegram_admin)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ <b>PTIT EduSync Security & Management Hub</b>\n👤 Thực hiện bởi: <b>${authUser.username}</b> (Admin)\n📌 Chat ID: <code>${chatId}</code>${threadId ? `\n🏷️ Thread/Topic: <code>${threadId}</code>` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <i>Kết nối hoạt động bình thường! Kênh này sẵn sàng tiếp nhận notice người đăng ký mới, sao lưu & xuất DB, phục hồi dữ liệu...</i>\n⏰ <i>Thời gian: ${now.toLocaleTimeString('vi-VN')} - ${now.toLocaleDateString('vi-VN')}</i>`;

    const sendRes = await sendTelegramMessage({
      botToken: tokenRes.token,
      chatId: chatId.trim(),
      text: testMsg,
      options: {
        threadId: threadId ? Number(threadId) : undefined,
        priority: 'HIGH',
      },
    });

    if (sendRes.success) {
      return NextResponse.json({
        success: true,
        message: 'Đã gửi tin nhắn thử nghiệm thành công tới kênh Telegram của Admin!',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: sendRes.error || 'Gửi tin nhắn thử nghiệm thất bại',
        },
        { status: 400 }
      );
    }
  }

  return null;
}
