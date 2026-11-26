import { prisma } from '@/src/lib/prisma';
import {
  sendTelegramMessage,
  resolveEffectiveBotToken,
} from '@/src/features/telegram/server/telegramServerService';
import { formatOffsetMinutes } from '../../types/reminder.types';
import { buildPendingAlertMessageHtml, formatDateTimeVN } from './formatters';
import type { RunPendingAlertsResult } from './types';

async function dispatchAlertToSubscriber(params: {
  reminder: any;
  alert: any;
  sub: any;
  creatorName: string;
  formattedEventTime: string;
  reminderOffsetLabel: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { reminder, alert, sub, creatorName, formattedEventTime, reminderOffsetLabel } = params;
  const logKey = {
    reminderId: reminder.id,
    offsetMinutes: alert.offsetMinutes,
    username: sub.username,
  };

  try {
    await prisma.reminderNotificationLog.create({
      data: { ...logKey, alertId: alert.id, status: 'SENDING' },
    });
  } catch {
    return { sent: false };
  }

  let effectiveToken: string;
  try {
    const resolved = await resolveEffectiveBotToken(sub.botToken);
    effectiveToken = resolved.token;
  } catch (tokenErr: any) {
    return { sent: false, error: `${sub.username}: ${tokenErr.message}` };
  }

  const studentName = sub.user?.student?.hoTen || sub.username;
  const messageHtml = buildPendingAlertMessageHtml({
    reminder,
    studentName,
    username: sub.username,
    creatorName,
    formattedEventTime,
    reminderOffsetLabel,
  });

  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text: messageHtml,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });

  if (sendRes.success) {
    await prisma.reminderNotificationLog
      .update({
        where: { reminderId_offsetMinutes_username: logKey },
        data: { sentAt: new Date(), status: 'SUCCESS' },
      })
      .catch((err) => console.warn('[pendingAlertsDispatcher] Non-fatal async error:', err));
    return { sent: true };
  }

  const errMsg = sendRes.error || 'Lỗi gửi tin Telegram';
  await prisma.reminderNotificationLog
    .update({
      where: { reminderId_offsetMinutes_username: logKey },
      data: { status: 'FAILED', errorMessage: errMsg },
    })
    .catch((err) => console.warn('[pendingAlertsDispatcher] Non-fatal async error:', err));
  return { sent: false, error: `${sub.username}: ${errMsg}` };
}

/**
 * Quét và phát thông báo Telegram cho tất cả các mốc nhắc hẹn đã đến giờ
 */
export async function runPendingReminderAlerts(): Promise<RunPendingAlertsResult> {
  const now = new Date();
  const errors: string[] = [];
  let totalAlertsProcessed = 0;
  let totalMessagesSent = 0;

  try {
    const pendingAlerts = await prisma.reminderAlert.findMany({
      where: {
        triggerTime: { lte: now },
        isSent: false,
        reminder: { status: 'ACTIVE' },
      },
      include: {
        reminder: {
          include: {
            creator: { include: { student: true } },
            participants: {
              where: { isDismissed: false },
              include: { user: { include: { student: true } } },
            },
          },
        },
      },
      take: 50,
    });

    if (pendingAlerts.length === 0) {
      return { success: true, totalAlertsProcessed: 0, totalMessagesSent: 0, errors: [] };
    }

    for (const alert of pendingAlerts) {
      totalAlertsProcessed++;
      const reminder = alert.reminder;
      if (!reminder) continue;

      const participantUsernames = (reminder.participants || []).map((p) => p.username);
      if (participantUsernames.length === 0) {
        await prisma.reminderAlert.update({
          where: { id: alert.id },
          data: { isSent: true, sentAt: now },
        });
        continue;
      }

      const telegramSubscribers = await prisma.telegramConfig.findMany({
        where: {
          username: { in: participantUsernames },
          isEnabled: true,
          chatId: { not: '' },
        },
        include: { user: { include: { student: true } } },
      });

      if (telegramSubscribers.length === 0) {
        await prisma.reminderAlert.update({
          where: { id: alert.id },
          data: { isSent: true, sentAt: now },
        });
        continue;
      }

      const creatorName = reminder.creator?.student?.hoTen || reminder.creatorUsername;
      const formattedEventTime = formatDateTimeVN(reminder.eventTime);
      const reminderOffsetLabel = alert.label || formatOffsetMinutes(alert.offsetMinutes);

      const alertDispatchResults = await Promise.all(
        telegramSubscribers.map((sub) =>
          dispatchAlertToSubscriber({
            reminder,
            alert,
            sub,
            creatorName,
            formattedEventTime,
            reminderOffsetLabel,
          })
        )
      );
      totalMessagesSent += alertDispatchResults.filter((r) => r.sent).length;
      errors.push(...alertDispatchResults.map((r) => r.error).filter((e): e is string => Boolean(e)));

      await prisma.reminderAlert.update({
        where: { id: alert.id },
        data: { isSent: true, sentAt: new Date() },
      });
    }

    return {
      success: true,
      totalAlertsProcessed,
      totalMessagesSent,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('[runPendingReminderAlerts] Lỗi quét và phát thông báo nhắc hẹn:', err);
    return {
      success: false,
      totalAlertsProcessed,
      totalMessagesSent,
      errors: [err.message || String(err)],
    };
  }
}
