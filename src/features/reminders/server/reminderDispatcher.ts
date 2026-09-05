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
          await prisma.reminderNotificationLog.update({
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
          }).catch(() => {});
        } else {
          const errMsg = sendRes.error || 'Lỗi gửi tin Telegram';
          errors.push(`${sub.username}: ${errMsg}`);
          await prisma.reminderNotificationLog.update({
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

/**
 * Gửi thông báo Telegram ngay sau khi tạo lịch nhắc hẹn thành công:
 * - Với lịch CÁ NHÂN: Chỉ gửi thông báo cho chính người tạo (nếu đã cấu hình và bật Telegram).
 * - Với lịch MÔN HỌC: Gửi cho TẤT CẢ sinh viên học cùng môn/tổ/lớp (kể cả người tạo),
 *   những người đã cấu hình và bật Telegram hợp lệ.
 */
export async function sendReminderCreatedNotification(reminderId: number): Promise<{
  success: boolean;
  sentCount: number;
  recipientUsernames: string[];
  errors: string[];
}> {
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

          const studentName =
            sub.user?.student?.hoTen || sub.username;
          let messageHtml = '';

          if (isPersonal) {
            messageHtml = `🔔 <b>[ĐÃ TẠO NHẮC HẸN CÁ NHÂN] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 Tiêu đề: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời gian hẹn: <b>${formattedEventTime}</b>\n${reminder.location ? `🏛️ Địa điểm / Link: <code>${escapeTelegramHtml(reminder.location)}</code>\n` : ''}${reminder.description ? `📝 Ghi chú: <i>${escapeTelegramHtml(reminder.description)}</i>\n` : ''}⏰ Các mốc sẽ báo trước: <b>${escapeTelegramHtml(offsetLabels || 'Đúng giờ')}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 <i>Lịch nhắc hẹn đã được lưu vào lịch cá nhân của bạn trên PTIT Web Tool. Hệ thống sẽ tiếp tục thông báo Telegram khi đến các mốc báo trước đã chọn.</i>\n⏰ <i>Tạo lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
          } else {
            const subjectHeader = reminder.tenMon
              ? `${reminder.tenMon} (${reminder.maMon || ''})`
              : reminder.maMon || 'Môn học';

            messageHtml = `📢 <b>[LỊCH NHẮC HẸN MÔN HỌC MỚI ĐÃ ĐƯỢC TẠO] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Người nhận: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📖 Môn học: <b>${escapeTelegramHtml(subjectHeader)}</b>\n${reminder.nhomTo ? `🏷️ Nhóm/Tổ: <b>${escapeTelegramHtml(reminder.nhomTo)}</b>` : ''}${reminder.lop ? ` | Lớp: <b>${escapeTelegramHtml(reminder.lop)}</b>` : ''}\n${reminder.giangVien ? `👨‍🏫 Giảng viên: <b>${escapeTelegramHtml(reminder.giangVien)}</b>\n` : '\n'}📌 Tiêu đề nhắc hẹn: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời điểm diễn ra: <b>${formattedEventTime}</b>\n${reminder.location ? `🏛️ Phòng / Link: <code>${escapeTelegramHtml(reminder.location)}</code>\n` : ''}${reminder.description ? `📝 Chi tiết: <i>${escapeTelegramHtml(reminder.description)}</i>\n` : ''}⏰ Các mốc sẽ nhắc trước: <b>${escapeTelegramHtml(offsetLabels || 'Đúng giờ')}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Người tạo: <b>${escapeTelegramHtml(creatorName)}</b> (<code>${escapeTelegramHtml(reminder.creatorUsername)}</code>)\n💡 <i>Lịch nhắc hẹn này đã được tự động thêm vào lịch học & thời khóa biểu của bạn trên PTIT Web Tool. Hệ thống sẽ tự động gửi thông báo Telegram đến các bạn cùng lớp theo các mốc đã cài đặt.</i>\n⏰ <i>Tạo lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
          }

          const sendRes = await sendTelegramMessage(
            effectiveToken,
            sub.chatId,
            messageHtml,
            {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            }
          );

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
