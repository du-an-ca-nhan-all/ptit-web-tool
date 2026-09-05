import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '@/src/features/telegram/server/telegramServerService';
import { escapeTelegramHtml } from '@/src/features/external-portal/server/slinkServerService';
import { formatOffsetMinutes } from '../types/reminder.types';

/**
 * Định dạng thời gian theo chuẩn Việt Nam (HH:mm - DD/MM/YYYY)
 */
function formatDateTimeVN(date: Date): string {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dow = daysOfWeek[d.getDay()];

  return `${hours}:${minutes} ${dow} (${day}/${month}/${year})`;
}

/**
 * Quét và phát thông báo Telegram cho tất cả các mốc nhắc hẹn đã đến giờ
 */
export async function runPendingReminderAlerts(): Promise<{
  success: boolean;
  totalAlertsProcessed: number;
  totalMessagesSent: number;
  errors: string[];
}> {
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
        // Kiểm tra log đã gửi trước đó chưa (tránh gửi lặp)
        const alreadyLogged = await prisma.reminderNotificationLog.findUnique({
          where: {
            reminderId_offsetMinutes_username: {
              reminderId: reminder.id,
              offsetMinutes: alert.offsetMinutes,
              username: sub.username,
            },
          },
        });

        if (alreadyLogged && alreadyLogged.status === 'SUCCESS') {
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
        const isPersonal = reminder.type === 'PERSONAL';

        // Xây dựng nội dung tin nhắn HTML Telegram
        let messageHtml = '';

        if (isPersonal) {
          messageHtml = `🔔 <b>[NHẮC HẸN CÁ NHÂN] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 Tiêu đề: <b>${escapeTelegramHtml(reminder.title)}</b>\n\n🗓️ Thời gian diễn ra: <b>${formattedEventTime}</b>\n⏰ Mốc báo: <b>${escapeTelegramHtml(reminderOffsetLabel)}</b>\n${reminder.location ? `🏛️ Địa điểm / Link: <code>${escapeTelegramHtml(reminder.location)}</code>\n` : ''}${reminder.description ? `📝 Nội dung: <i>${escapeTelegramHtml(reminder.description)}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Gửi tự động lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
        } else {
          // Nhắc hẹn môn học / tổ / lớp
          const subjectHeader = reminder.tenMon
            ? `${reminder.tenMon} (${reminder.maMon || ''})`
            : reminder.maMon || 'Môn học';

          messageHtml = `📚 <b>[NHẮC HẸN MÔN HỌC] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📖 Môn: <b>${escapeTelegramHtml(subjectHeader)}</b>\n${reminder.nhomTo ? `🏷️ Nhóm/Tổ: <b>${escapeTelegramHtml(reminder.nhomTo)}</b>` : ''}${reminder.lop ? ` | Lớp: <b>${escapeTelegramHtml(reminder.lop)}</b>` : ''}\n${reminder.giangVien ? `👨‍🏫 Giảng viên: <b>${escapeTelegramHtml(reminder.giangVien)}</b>\n` : '\n'}📌 Nội dung nhắc: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời điểm: <b>${formattedEventTime}</b>\n⏰ Mốc báo: <b>${escapeTelegramHtml(reminderOffsetLabel)}</b>\n${reminder.location ? `🏛️ Phòng / Link: <code>${escapeTelegramHtml(reminder.location)}</code>\n` : ''}${reminder.description ? `📝 Chi tiết: <i>${escapeTelegramHtml(reminder.description)}</i>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Người tạo nhắc hẹn: <b>${escapeTelegramHtml(creatorName)}</b> (<code>${escapeTelegramHtml(reminder.creatorUsername)}</code>)\n💡 <i>Nhắc hẹn này được chia sẻ tự động đến tất cả bạn học cùng môn/tổ/lớp.</i>\n⏰ <i>Gửi lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
        }

        const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
          threadId: sub.threadId ? Number(sub.threadId) : undefined,
        });

        if (sendRes.success) {
          totalMessagesSent++;
          await prisma.reminderNotificationLog.upsert({
            where: {
              reminderId_offsetMinutes_username: {
                reminderId: reminder.id,
                offsetMinutes: alert.offsetMinutes,
                username: sub.username,
              },
            },
            create: {
              reminderId: reminder.id,
              alertId: alert.id,
              username: sub.username,
              offsetMinutes: alert.offsetMinutes,
              status: 'SUCCESS',
            },
            update: {
              sentAt: new Date(),
              status: 'SUCCESS',
            },
          }).catch(() => {});
        } else {
          const errMsg = sendRes.error || 'Lỗi gửi tin Telegram';
          errors.push(`${sub.username}: ${errMsg}`);
          await prisma.reminderNotificationLog.upsert({
            where: {
              reminderId_offsetMinutes_username: {
                reminderId: reminder.id,
                offsetMinutes: alert.offsetMinutes,
                username: sub.username,
              },
            },
            create: {
              reminderId: reminder.id,
              alertId: alert.id,
              username: sub.username,
              offsetMinutes: alert.offsetMinutes,
              status: 'FAILED',
              errorMessage: errMsg,
            },
            update: {
              status: 'FAILED',
              errorMessage: errMsg,
            },
          }).catch(() => {});
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
