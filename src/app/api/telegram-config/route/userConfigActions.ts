import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import {
  sendTestNotification,
  verifyTelegramBot,
  getSystemTelegramBotPublicInfo,
} from '@/src/features/telegram/server/telegramServerService';
import { logActivity } from '@/src/features/activity-logs/server/activityLogServerService';
import {
  findQldttxAccount,
  isQldttxAccountValid,
  findSlinkAccount,
  isSlinkAccountValid,
  resolveEffectiveTokenOrResponse,
} from './helpers';

export interface UserConfigActionParams {
  req: NextRequest;
  username: string;
  action: string;
  body: any;
}

export async function handleUserConfigAction({
  req,
  username,
  action,
  body,
}: UserConfigActionParams): Promise<NextResponse | null> {
  // 1. ACTION: SEND TEST NOTIFICATION
  if (action === 'TEST') {
    const customToken = body.botToken?.trim() || null;
    const chatId = body.chatId?.trim();
    const threadId = body.threadId ? String(body.threadId).trim() : null;

    if (!chatId) {
      return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhận thông báo' }, { status: 400 });
    }

    const tokenRes = await resolveEffectiveTokenOrResponse(customToken);
    if (tokenRes.errorResponse) return tokenRes.errorResponse;

    const student = await prisma.student.findUnique({
      where: { maSV: username },
    });

    const testResult = await sendTestNotification({
      botToken: tokenRes.token,
      chatId,
      threadId,
      userInfo: {
        username,
        fullName: student?.hoTen || username,
        maLop: student?.maLop,
      },
    });

    // Update test status in user's TelegramConfig
    await prisma.telegramConfig.upsert({
      where: { username },
      create: {
        username,
        botToken: customToken,
        chatId,
        threadId,
        lastTestedAt: new Date(),
        lastTestStatus: testResult.success ? 'SUCCESS' : 'FAILED',
        lastTestError: testResult.error || null,
        botUsername: testResult.botInfo?.username || null,
        botFirstName: testResult.botInfo?.firstName || null,
      },
      update: {
        lastTestedAt: new Date(),
        lastTestStatus: testResult.success ? 'SUCCESS' : 'FAILED',
        lastTestError: testResult.error || null,
        botUsername: testResult.botInfo?.username ?? undefined,
        botFirstName: testResult.botInfo?.firstName ?? undefined,
      },
    });

    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            testResult.error ||
            'Gửi tin nhắn thử nghiệm thất bại. Vui lòng kiểm tra lại Chat ID hoặc quyền của Bot.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi tin nhắn thử nghiệm thành công tới Chat ID: ${chatId}${threadId ? ` (Topic: ${threadId})` : ''}!`,
      messageId: testResult.messageId,
      botInfo: testResult.botInfo,
    });
  }

  // 2. ACTION: SAVE CONFIGURATION (Lưu cấu hình cho từng account)
  if (action === 'SAVE') {
    const customToken = body.botToken?.trim() || null;
    const chatId = body.chatId?.trim();
    const threadId = body.threadId ? String(body.threadId).trim() : null;
    const isEnabled = body.isEnabled !== undefined ? Boolean(body.isEnabled) : true;
    const notifyExamSchedule = body.notifyExamSchedule !== undefined ? Boolean(body.notifyExamSchedule) : true;
    const notifyClassActivity = body.notifyClassActivity !== undefined ? Boolean(body.notifyClassActivity) : true;
    const notifyQldtAnnouncements =
      body.notifyQldtAnnouncements !== undefined ? Boolean(body.notifyQldtAnnouncements) : true;
    const qldtCheckInterval = [1, 2, 5].includes(Number(body.qldtCheckInterval))
      ? Number(body.qldtCheckInterval)
      : 2;
    const notifySlinkAnnouncements =
      body.notifySlinkAnnouncements !== undefined ? Boolean(body.notifySlinkAnnouncements) : true;
    const slinkCheckInterval = [1, 2, 5].includes(Number(body.slinkCheckInterval))
      ? Number(body.slinkCheckInterval)
      : 2;
    const notifyClassSchedule = body.notifyClassSchedule !== undefined ? Boolean(body.notifyClassSchedule) : true;
    const classReminderBefore = [0, 30, 60].includes(Number(body.classReminderBefore))
      ? Number(body.classReminderBefore)
      : 30;

    if (!chatId) {
      return NextResponse.json({ error: 'Vui lòng nhập Chat ID nhận thông báo' }, { status: 400 });
    }

    // Kiểm tra trạng thái tài khoản QLDTTX
    const extAccount = await findQldttxAccount(username);
    const isQldttxValid = isQldttxAccountValid(extAccount);
    const safeNotifyClassSchedule = isQldttxValid ? notifyClassSchedule : false;
    const safeNotifyQldtAnnouncements = isQldttxValid ? notifyQldtAnnouncements : false;

    // Kiểm tra trạng thái tài khoản PTIT S-Link
    const slinkAccount = await findSlinkAccount(username);
    const isSlinkValid = isSlinkAccountValid(slinkAccount);
    const safeNotifySlinkAnnouncements = isSlinkValid ? notifySlinkAnnouncements : false;

    let botUsername: string | null = null;
    let botFirstName: string | null = null;

    if (customToken) {
      const verifyRes = await verifyTelegramBot(customToken);
      if (!verifyRes.success || !verifyRes.botInfo) {
        return NextResponse.json({ error: verifyRes.error || 'Token Bot riêng không hợp lệ' }, { status: 400 });
      }
      botUsername = verifyRes.botInfo.username || null;
      botFirstName = verifyRes.botInfo.firstName || null;
    } else {
      // Global System Bot
      const sysPublic = await getSystemTelegramBotPublicInfo();
      if (!sysPublic.isConfigured) {
        return NextResponse.json(
          {
            error:
              'Bot Hệ Thống chưa được Admin thiết lập trong cấu hình GlobalConfig (key: telegram_bot). Vui lòng liên hệ Admin hoặc nhập Bot Token riêng.',
          },
          { status: 400 }
        );
      }
      botUsername = sysPublic.botUsername || null;
      botFirstName = sysPublic.botFirstName || 'PTIT EduSync Official Bot';
    }

    const savedConfig = await prisma.telegramConfig.upsert({
      where: { username },
      create: {
        username,
        botToken: customToken,
        chatId,
        threadId,
        isEnabled,
        notifyExamSchedule,
        notifyClassActivity,
        notifyQldtAnnouncements: safeNotifyQldtAnnouncements,
        qldtCheckInterval,
        notifySlinkAnnouncements: safeNotifySlinkAnnouncements,
        slinkCheckInterval,
        notifyClassSchedule: safeNotifyClassSchedule,
        classReminderBefore,
        botUsername,
        botFirstName,
      },
      update: {
        botToken: customToken,
        chatId,
        threadId,
        isEnabled,
        notifyExamSchedule,
        notifyClassActivity,
        notifyQldtAnnouncements: safeNotifyQldtAnnouncements,
        qldtCheckInterval,
        notifySlinkAnnouncements: safeNotifySlinkAnnouncements,
        slinkCheckInterval,
        notifyClassSchedule: safeNotifyClassSchedule,
        classReminderBefore,
        botUsername: botUsername ?? undefined,
        botFirstName: botFirstName ?? undefined,
      },
    });

    await logActivity({
      req,
      action: 'SAVE_TELEGRAM_CONFIG',
      targetType: 'TELEGRAM_CONFIG',
      targetId: username,
      description: `Lưu cấu hình thông báo Telegram cho tài khoản ${username}`,
      metadata: {
        chatId,
        threadId,
        isEnabled,
        isCustomBot: !!customToken,
        botUsername,
        notifyClassSchedule: safeNotifyClassSchedule,
        notifyQldtAnnouncements: safeNotifyQldtAnnouncements,
        notifySlinkAnnouncements: safeNotifySlinkAnnouncements,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình thông báo Telegram thành công!',
      config: savedConfig,
    });
  }

  // 5. ACTION: TOGGLE ENABLE/DISABLE
  if (action === 'TOGGLE') {
    const existingConfig = await prisma.telegramConfig.findUnique({
      where: { username },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Chưa có cấu hình Telegram để bật/tắt' }, { status: 404 });
    }

    const newStatus = body.isEnabled !== undefined ? Boolean(body.isEnabled) : !existingConfig.isEnabled;
    const updated = await prisma.telegramConfig.update({
      where: { username },
      data: { isEnabled: newStatus },
    });

    await logActivity({
      req,
      action: 'TOGGLE_TELEGRAM_CONFIG',
      targetType: 'TELEGRAM_CONFIG',
      targetId: username,
      description: `${newStatus ? 'Bật' : 'Tắt'} nhận thông báo Telegram cho ${username}`,
    });

    return NextResponse.json({
      success: true,
      message: `Đã ${newStatus ? 'bật' : 'tắt'} nhận thông báo Telegram.`,
      config: updated,
    });
  }

  // 6. ACTION: DELETE CONFIGURATION (Hủy liên kết)
  if (action === 'DELETE') {
    await prisma.telegramConfig.deleteMany({
      where: { username },
    });

    await logActivity({
      req,
      action: 'DELETE_TELEGRAM_CONFIG',
      targetType: 'TELEGRAM_CONFIG',
      targetId: username,
      description: `Xóa cấu hình thông báo Telegram cho tài khoản ${username}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa cấu hình thông báo Telegram thành công!',
    });
  }

  return null;
}
