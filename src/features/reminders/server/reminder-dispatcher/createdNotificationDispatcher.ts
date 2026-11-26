import { prisma } from '@/src/lib/prisma';
import {
  sendTelegramMessage,
  resolveEffectiveBotToken,
} from '@/src/features/telegram/server/telegramServerService';
import { formatOffsetMinutes } from '../../types/reminder.types';
import { buildCreatedReminderMessageHtml, formatDateTimeVN } from './formatters';
import type { SendReminderCreatedResult } from './types';

/**
 * Gửi thông báo Telegram ngay sau khi tạo lịch nhắc hẹn thành công:
 * - Với lịch CÁ NHÂN: Chỉ gửi thông báo cho chính người tạo (nếu đã cấu hình và bật Telegram).
 * - Với lịch MÔN HỌC: Gửi cho TẤT CẢ sinh viên học cùng môn/tổ/lớp (kể cả người tạo),
 *   những người đã cấu hình và bật Telegram hợp lệ.
 */
export async function sendReminderCreatedNotification(
  reminderId: number
): Promise<SendReminderCreatedResult> {
  const errors: string[] = [];
  let sentCount = 0;

  try {
    const reminder = await prisma.reminderItem.findUnique({
      where: { id: reminderId },
      include: {
        creator: {
          include: { student: true },
        },
        alerts: {
          orderBy: { offsetMinutes: 'desc' },
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
    });

    if (!reminder) {
      return {
        success: false,
        sentCount: 0,
        recipientUsernames: [],
        errors: ['Không tìm thấy lịch nhắc hẹn'],
      };
    }

    const isPersonal = reminder.type === 'PERSONAL';

    // 1. Xác định danh sách username người nhận thông báo
    let targetUsernames: string[] = [];
    if (isPersonal) {
      targetUsernames = [reminder.creatorUsername];
    } else {
      // Môn học: Gửi cho tất cả bạn học cùng lớp/tổ đã được map vào reminder
      targetUsernames = (reminder.participants || []).map((p) => p.username);
      // Đảm bảo có creator trong danh sách
      if (!targetUsernames.includes(reminder.creatorUsername)) {
        targetUsernames.push(reminder.creatorUsername);
      }
    }

    // Khử trùng lặp username
    targetUsernames = Array.from(new Set(targetUsernames));

    if (targetUsernames.length === 0) {
      return { success: true, sentCount: 0, recipientUsernames: [], errors: [] };
    }

    // 2. CHỈ LẤY CÁC USER ĐÃ CẤU HÌNH VÀ BẬT THÔNG BÁO TELEGRAM
    const telegramSubscribers = await prisma.telegramConfig.findMany({
      where: {
        username: { in: targetUsernames },
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
      return { success: true, sentCount: 0, recipientUsernames: [], errors: [] };
    }

    const creatorName =
      reminder.creator?.student?.hoTen ||
      reminder.creatorUsername;
    const formattedEventTime = formatDateTimeVN(reminder.eventTime);
    const offsetLabels = (reminder.alerts || [])
      .map((a) => a.label || formatOffsetMinutes(a.offsetMinutes))
      .join(', ');

    // 3. Gửi tin nhắn Telegram theo batch (tránh tắc nghẽn và tuân thủ rate limit)
    const BATCH_SIZE = 10;
    for (let i = 0; i < telegramSubscribers.length; i += BATCH_SIZE) {
      const batch = telegramSubscribers.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (sub) => {
          // ATOMIC LOCK: Tạo trước bản ghi log với trạng thái 'SENDING'
          // Do có UNIQUE index (reminderId, offsetMinutes, username), nếu luồng khác đã tạo hoặc gửi,
          // lệnh create() sẽ ném ngoại lệ -> bỏ qua ngay lập tức để chống gửi trùng lặp tuyệt đối.
          try {
            await prisma.reminderNotificationLog.create({
              data: {
                reminderId: reminder.id,
                alertId: null,
                username: sub.username,
                offsetMinutes: -1,
                status: 'SENDING',
              },
            });
          } catch (dupErr) {
            return;
          }

          let effectiveToken: string;
          try {
            const resolved = await resolveEffectiveBotToken(sub.botToken);
            effectiveToken = resolved.token;
          } catch (tokenErr: any) {
            errors.push(`${sub.username}: ${tokenErr.message}`);
            return;
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const messageHtml = buildCreatedReminderMessageHtml({
            reminder,
            studentName,
            username: sub.username,
            creatorName,
            formattedEventTime,
            offsetLabels,
          });

          const sendRes = await sendTelegramMessage({
            botToken: effectiveToken,
            chatId: sub.chatId,
            text: messageHtml,
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            sentCount++;
            await prisma.reminderNotificationLog
              .update({
                where: {
                  reminderId_offsetMinutes_username: {
                    reminderId: reminder.id,
                    offsetMinutes: -1,
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
            const errMsg = sendRes.error || 'Lỗi gửi Telegram';
            errors.push(`${sub.username}: ${errMsg}`);
            await prisma.reminderNotificationLog
              .update({
                where: {
                  reminderId_offsetMinutes_username: {
                    reminderId: reminder.id,
                    offsetMinutes: -1,
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
        })
      );
    }

    return {
      success: true,
      sentCount,
      recipientUsernames: telegramSubscribers.map((s) => s.username),
      errors,
    };
  } catch (err: any) {
    console.error('[sendReminderCreatedNotification] Lỗi gửi thông báo tạo nhắc hẹn:', err);
    return {
      success: false,
      sentCount,
      recipientUsernames: [],
      errors: [err.message || String(err)],
    };
  }
}
