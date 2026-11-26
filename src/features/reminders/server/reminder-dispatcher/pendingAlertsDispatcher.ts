import { prisma } from '@/src/lib/prisma';
import {
  sendTelegramMessage,
  resolveEffectiveBotToken,
} from '@/src/features/telegram/server/telegramServerService';
import { formatOffsetMinutes } from '../../types/reminder.types';
import { buildPendingAlertMessageHtml, formatDateTimeVN } from './formatters';
import type { RunPendingAlertsResult } from './types';

/**
 * Quét và phát thông báo Telegram cho tất cả các mốc nhắc hẹn đã đến giờ
 */
export async function runPendingReminderAlerts(): Promise<RunPendingAlertsResult> {
  const now = new Date();
  const errors: string[] = [];
  let totalAlertsProcessed = 0;
  let totalMessagesSent = 0;

  try {
    // 1. Tìm các mốc cảnh báo đã đến giờ kích hoạt nhưng chưa phát (triggerTime <= now)
    const pendingAlerts = await prisma.reminderAlert.findMany({
      where: {
        triggerTime: { lte: now },
        isSent: false,
        reminder: {
          status: 'ACTIVE',
        },
      },
      include: {
        reminder: {
          include: {
            creator: {
              include: { student: true },
            },
            participants: {
              where: { isDismissed: false },
              include: {
                user: {
                  include: { student: true },
                },
              },
            },
          },
        },
      },
      take: 50, // Giới hạn mỗi lần quét để tránh nghẽn
    });

    if (pendingAlerts.length === 0) {
      return {
        success: true,
        totalAlertsProcessed: 0,
        totalMessagesSent: 0,
        errors: [],
      };
    }

    for (const alert of pendingAlerts) {
      totalAlertsProcessed++;
      const reminder = alert.reminder;
      if (!reminder) continue;

      // Danh sách người nhận (chỉ lấy sinh viên chưa ẩn nhắc hẹn)
      const participants = reminder.participants || [];
      const participantUsernames = participants.map((p) => p.username);

      if (participantUsernames.length === 0) {
        await prisma.reminderAlert.update({
          where: { id: alert.id },
          data: { isSent: true, sentAt: now },
        });
        continue;
      }

      // CHỈ LẤY CÁC USER ĐÃ CẤU HÌNH THÔNG BÁO TELEGRAM
      const telegramSubscribers = await prisma.telegramConfig.findMany({
        where: {
          username: { in: participantUsernames },
          isEnabled: true,
          chatId: { not: '' },
        },
        include: {
          user: {
            include: { student: true },
          },
        },
      });

      if (telegramSubscribers.length === 0) {
        // Không có user nào bật telegram, đánh dấu đã quét để tránh quét lặp
        await prisma.reminderAlert.update({
          where: { id: alert.id },
          data: { isSent: true, sentAt: now },
        });
        continue;
      }

      const creatorName = reminder.creator?.student?.hoTen || reminder.creatorUsername;
      const formattedEventTime = formatDateTimeVN(reminder.eventTime);
      const reminderOffsetLabel = alert.label || formatOffsetMinutes(alert.offsetMinutes);

      // Gửi tin nhắn đến từng sinh viên đủ điều kiện
      for (const sub of telegramSubscribers) {
        // ATOMIC LOCK: Tạo trước bản ghi với trạng thái 'SENDING'
        // Do có UNIQUE index (reminderId, offsetMinutes, username), nếu luồng khác đã bắt đầu hoặc đã gửi,
        // lệnh create() sẽ ném ngoại lệ -> bỏ qua ngay lập tức để chống gửi trùng lặp tuyệt đối.
        try {
          await prisma.reminderNotificationLog.create({
            data: {
              reminderId: reminder.id,
              alertId: alert.id,
              username: sub.username,
              offsetMinutes: alert.offsetMinutes,
              status: 'SENDING',
            },
          });
        } catch (dupErr) {
          continue;
        }

        let effectiveToken: string;
        try {
          const resolved = await resolveEffectiveBotToken(sub.botToken);
          effectiveToken = resolved.token;
        } catch (tokenErr: any) {
          errors.push(`${sub.username}: ${tokenErr.message}`);
          continue;
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

        const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
          threadId: sub.threadId ? Number(sub.threadId) : undefined,
        });

        if (sendRes.success) {
          totalMessagesSent++;
          await prisma.reminderNotificationLog
            .update({
              where: {
                reminderId_offsetMinutes_username: {
                  reminderId: reminder.id,
                  offsetMinutes: alert.offsetMinutes,
                  username: sub.username,
                },
              },
              data: {
                sentAt: new Date(),
                status: 'SUCCESS',
              },
            })
            .catch(() => {});
        } else {
          const errMsg = sendRes.error || 'Lỗi gửi tin Telegram';
          errors.push(`${sub.username}: ${errMsg}`);
          await prisma.reminderNotificationLog
            .update({
              where: {
                reminderId_offsetMinutes_username: {
                  reminderId: reminder.id,
                  offsetMinutes: alert.offsetMinutes,
                  username: sub.username,
                },
              },
              data: {
                status: 'FAILED',
                errorMessage: errMsg,
              },
            })
            .catch(() => {});
        }
      }

      // Đánh dấu mốc Alert này đã được phát xong
      await prisma.reminderAlert.update({
        where: { id: alert.id },
        data: {
          isSent: true,
          sentAt: new Date(),
        },
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
