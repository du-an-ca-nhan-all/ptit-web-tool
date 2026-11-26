import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  getSystemTelegramBotConfig,
  getTelegramQueueStats,
  clearTelegramQueue,
  setTelegramQueuePaused,
  enqueueBatchTelegramMessages,
} from '@/src/features/telegram/server/telegramServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import { AuthUser } from './helpers';

export async function handleAdminQueueAction(
  req: NextRequest,
  authUser: AuthUser,
  action: string,
  body: any
): Promise<NextResponse | null> {
  // ─────────────────────────────────────────────────────────────
  // GLOBAL TELEGRAM QUEUE ACTIONS (ADMIN ONLY)
  // ─────────────────────────────────────────────────────────────
  if (action === 'GET_QUEUE_STATS') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền xem thống kê hàng đợi' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      queueStats: getTelegramQueueStats(),
    });
  }

  if (action === 'CLEAR_QUEUE') {
    if (!authUser.isAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền xóa hàng đợi' }, { status: 403 });
    }

    const res = clearTelegramQueue();
    await logActivity({
      req,
      action: 'CLEAR_TELEGRAM_QUEUE',
      targetType: 'TELEGRAM_GLOBAL_CONFIG',
      targetId: 'QUEUE',
      description: `Admin ${authUser.username} đã xóa toàn bộ ${res.clearedCount} tin nhắn đang chờ trong hàng đợi Telegram`,
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa thành công ${res.clearedCount} tin nhắn trong hàng đợi Telegram!`,
      clearedCount: res.clearedCount,
      queueStats: getTelegramQueueStats(),
    });
  }

  if (action === 'TOGGLE_QUEUE_PAUSE') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền tạm dừng/tiếp tục hàng đợi' },
        { status: 403 }
      );
    }

    const isPaused = Boolean(body.isPaused);
    const res = setTelegramQueuePaused(isPaused);

    await logActivity({
      req,
      action: isPaused ? 'PAUSE_TELEGRAM_QUEUE' : 'RESUME_TELEGRAM_QUEUE',
      targetType: 'TELEGRAM_GLOBAL_CONFIG',
      targetId: 'QUEUE',
      description: `Admin ${authUser.username} đã ${isPaused ? 'tạm dừng' : 'tiếp tục'} hàng đợi Telegram`,
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${isPaused ? 'tạm dừng' : 'tiếp tục kích hoạt'} hàng đợi gửi tin Telegram!`,
      isPaused: res.isPaused,
      queueStats: getTelegramQueueStats(),
    });
  }

  if (action === 'BROADCAST') {
    if (!authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền phát thông báo toàn trường' },
        { status: 403 }
      );
    }

    const title = body.title?.trim();
    const content = body.content?.trim();
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo' },
        { status: 400 }
      );
    }

    const sysConfig = await getSystemTelegramBotConfig();
    if (!sysConfig || !sysConfig.botToken || !sysConfig.isActive) {
      return NextResponse.json(
        { error: 'Bot Hệ Thống chưa được cấu hình hoặc đang tạm dừng' },
        { status: 400 }
      );
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: { isEnabled: true },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Chưa có sinh viên nào kích hoạt nhận thông báo Telegram.',
        totalSent: 0,
        totalFailed: 0,
      });
    }

    const formattedBroadcast = `📢 <b>THÔNG BÁO TỪ QUẢN TRỊ VIÊN - PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 <b>${title}</b>\n\n${content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Gửi lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;

    // Batch enqueue into Global Telegram Queue
    const batchItems = subscribers.map((sub) => {
      let tokenToUse = sub.botToken?.trim();
      if (!tokenToUse) {
        tokenToUse = sysConfig.botToken;
      }

      return {
        botToken: tokenToUse,
        chatId: sub.chatId,
        text: formattedBroadcast,
        options: {
          threadId: sub.threadId ? Number(sub.threadId) : undefined,
        },
        priority: 'BULK' as const,
      };
    });

    const { queuedCount } = enqueueBatchTelegramMessages(batchItems);

    await logActivity({
      req,
      action: 'BROADCAST_TELEGRAM',
      targetType: 'TELEGRAM_GLOBAL_CONFIG',
      targetId: 'BROADCAST',
      description: `Admin đưa phát sóng Telegram "${title}" vào hàng đợi gửi dần tới ${queuedCount} tài khoản`,
      metadata: { title, queuedCount },
    });

    return NextResponse.json({
      success: true,
      message: `Đã đưa thông báo tới ${queuedCount} tài khoản vào hàng đợi gửi dần an toàn (không bị Rate Limit).`,
      totalSent: queuedCount,
      totalFailed: 0,
      queueStats: getTelegramQueueStats(),
    });
  }

  return null;
}
