import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  getSystemTelegramBotPublicInfo,
  getSystemTelegramBotConfig,
  getTelegramQueueStats,
} from '@/src/features/telegram/server/telegramServerService';
import { getTelegramAdminConfig } from '@/src/lib/globalConfig';
import { getAuthUser, findQldttxAccount, findSlinkAccount } from './helpers';

export async function handleGetTelegramConfig(req: NextRequest): Promise<NextResponse> {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const targetUsername = searchParams.get('targetUsername')?.trim();

    const systemBotPublic = await getSystemTelegramBotPublicInfo();

    // If Admin requests full list of subscribers
    if (view === 'all') {
      if (!authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Chỉ Quản trị viên mới có quyền xem danh sách tất cả tài khoản' },
          { status: 403 }
        );
      }

      const allConfigs = await prisma.telegramConfig.findMany({
        include: {
          user: {
            include: {
              student: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const systemBotFull = await getSystemTelegramBotConfig();
      const telegramAdmin = await getTelegramAdminConfig();

      const formattedConfigs = allConfigs.map((cfg) => {
        const student = cfg.user?.student;
        return {
          id: cfg.id,
          username: cfg.username,
          fullName: student?.hoTen || cfg.username,
          maLop: student?.maLop || 'Chưa phân lớp',
          soDienThoai: student?.soDienThoai || '',
          isCustomBot: !!cfg.botToken,
          botToken: cfg.botToken ? `${cfg.botToken.substring(0, 10)}...${cfg.botToken.slice(-5)}` : '',
          rawBotToken: cfg.botToken,
          chatId: cfg.chatId,
          threadId: cfg.threadId,
          isEnabled: cfg.isEnabled,
          notifyExamSchedule: cfg.notifyExamSchedule,
          notifyClassActivity: cfg.notifyClassActivity,
          notifyQldtAnnouncements: cfg.notifyQldtAnnouncements,
          qldtCheckInterval: cfg.qldtCheckInterval,
          lastQldtCheckedAt: cfg.lastQldtCheckedAt ? cfg.lastQldtCheckedAt.toISOString() : null,
          notifySlinkAnnouncements: cfg.notifySlinkAnnouncements,
          slinkCheckInterval: cfg.slinkCheckInterval,
          lastSlinkCheckedAt: cfg.lastSlinkCheckedAt ? cfg.lastSlinkCheckedAt.toISOString() : null,
          notifyClassSchedule: cfg.notifyClassSchedule,
          classReminderBefore: cfg.classReminderBefore,
          lastTestedAt: cfg.lastTestedAt ? cfg.lastTestedAt.toISOString() : null,
          lastTestStatus: cfg.lastTestStatus,
          lastTestError: cfg.lastTestError,
          botUsername: cfg.botUsername,
          botFirstName: cfg.botFirstName,
          createdAt: cfg.createdAt.toISOString(),
          updatedAt: cfg.updatedAt.toISOString(),
        };
      });

      return NextResponse.json({
        success: true,
        configs: formattedConfigs,
        totalConfigs: formattedConfigs.length,
        systemBot: systemBotPublic,
        systemBotConfig: systemBotFull,
        telegramAdmin,
        queueStats: getTelegramQueueStats(),
      });
    }

    // Target specific username (if admin) or own user
    let usernameToQuery = authUser.username;
    if (targetUsername && targetUsername !== authUser.username) {
      if (!authUser.isAdmin) {
        return NextResponse.json(
          { error: 'Không có quyền truy cập cấu hình của tài khoản khác' },
          { status: 403 }
        );
      }
      usernameToQuery = targetUsername;
    }

    const config = await prisma.telegramConfig.findUnique({
      where: { username: usernameToQuery },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    const extAccount = await findQldttxAccount(usernameToQuery);
    const isQldttxConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));
    const qldttxStatus = {
      isConfigured: isQldttxConfigured,
      status: extAccount?.status || 'DISCONNECTED',
      syncMessage: extAccount?.syncMessage || null,
      lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
    };

    const slinkAccount = await findSlinkAccount(usernameToQuery);
    const isSlinkConfigured = !!(slinkAccount && (slinkAccount.token || slinkAccount.refreshToken));
    const slinkStatus = {
      isConfigured: isSlinkConfigured,
      status: slinkAccount?.status || 'DISCONNECTED',
      syncMessage: slinkAccount?.syncMessage || null,
      lastSyncAt: slinkAccount?.lastSyncAt ? slinkAccount.lastSyncAt.toISOString() : null,
    };

    const systemBotFull = authUser.isAdmin ? await getSystemTelegramBotConfig() : null;

    return NextResponse.json({
      success: true,
      systemBot: systemBotPublic,
      systemBotConfig: systemBotFull,
      qldttxStatus,
      slinkStatus,
      config: config
        ? {
            id: config.id,
            username: config.username,
            isCustomBot: !!config.botToken,
            botToken: config.botToken || null,
            chatId: config.chatId,
            threadId: config.threadId,
            isEnabled: config.isEnabled,
            notifyExamSchedule: config.notifyExamSchedule,
            notifyClassActivity: config.notifyClassActivity,
            notifyQldtAnnouncements: config.notifyQldtAnnouncements,
            qldtCheckInterval: config.qldtCheckInterval,
            lastQldtCheckedAt: config.lastQldtCheckedAt ? config.lastQldtCheckedAt.toISOString() : null,
            notifySlinkAnnouncements: config.notifySlinkAnnouncements,
            slinkCheckInterval: config.slinkCheckInterval,
            lastSlinkCheckedAt: config.lastSlinkCheckedAt ? config.lastSlinkCheckedAt.toISOString() : null,
            notifyClassSchedule: config.notifyClassSchedule,
            classReminderBefore: config.classReminderBefore,
            lastTestedAt: config.lastTestedAt ? config.lastTestedAt.toISOString() : null,
            lastTestStatus: config.lastTestStatus,
            lastTestError: config.lastTestError,
            botUsername: config.botUsername,
            botFirstName: config.botFirstName,
            createdAt: config.createdAt.toISOString(),
            updatedAt: config.updatedAt.toISOString(),
          }
        : null,
    });
  } catch (err: any) {
    console.error('GET /api/telegram-config error:', err);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi lấy cấu hình Telegram', details: err.message },
      { status: 500 }
    );
  }
}
