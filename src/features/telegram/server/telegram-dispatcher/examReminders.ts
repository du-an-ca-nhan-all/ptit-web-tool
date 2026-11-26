import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { formatDateVN, getVietnamTime, normalizeDateVN } from './dateUtils';

// ─────────────────────────────────────────────────────────────────────────────
// 5. SCHEDULED REMINDERS: NHẮC LỊCH THI TRƯỚC 1 NGÀY & 7H SÁNG HÔM THI (GIỜ VN)
// ─────────────────────────────────────────────────────────────────────────────
export async function runExamScheduleReminders(options: {
  forceAll?: boolean;
  targetDateStr?: string;
} = {}) {
  try {
    const nowVN = getVietnamTime();
    const todayStr = options.targetDateStr ? normalizeDateVN(options.targetDateStr) : formatDateVN(nowVN);

    // Calculate tomorrow date
    const tomorrowVN = new Date(nowVN.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatDateVN(tomorrowVN);

    // Query active subscribers for exam notifications
    const subscribers = await prisma.telegramConfig.findMany({
      where: {
        isEnabled: true,
        notifyExamSchedule: true,
      },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    let reminders1DaySent = 0;
    let remindersSameDaySent = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch (e: any) {
        continue;
      }

      const studentName = sub.user?.student?.hoTen || sub.username;
      const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';

      // Query active (non-postponed) exams for this student
      const allStudentExams = await prisma.examRecord.findMany({
        where: {
          maSV: sub.username,
          isPostponed: false,
        },
      });

      // ── MỐC 1: NHẮC TRƯỚC 1 NGÀY (Tomorrow's Exams) ──
      const tomorrowExams = allStudentExams.filter((ex) => {
        if (!ex.ngayThi) return false;
        return normalizeDateVN(ex.ngayThi) === tomorrowStr;
      });

      if (tomorrowExams.length > 0) {
        // Filter out exams that have already been reminded for 1_DAY_BEFORE
        const unreminded1DayExams: typeof tomorrowExams = [];
        for (const ex of tomorrowExams) {
          const logged = await prisma.examReminderLog.findUnique({
            where: {
              username_examRecordId_reminderType: {
                username: sub.username,
                examRecordId: ex.id,
                reminderType: '1_DAY_BEFORE',
              },
            },
          });
          if (!logged || options.forceAll) {
            unreminded1DayExams.push(ex);
          }
        }

        if (unreminded1DayExams.length > 0) {
          let examListHtml = '';
          unreminded1DayExams.forEach((ex, idx) => {
            examListHtml += `\n${idx + 1}. <b>${ex.tenMH || ex.maMH}</b> (<code>${ex.maMH}</code>)\n   ⏰ Ca thi: <b>${ex.gioThi || ''}</b> | 🏛️ Phòng: <code>${ex.mapThi || 'Chưa rõ'}</code>\n   🏷️ Số báo danh: <b>${ex.nhomThi || '-'}</b> | Tổ thi: <b>${ex.toThi || '-'}</b>`;
          });

          const messageHtml = `⏰ <b>[NHẮC LỊCH THI] NGÀY MAI BẠN CÓ CA THI!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày thi: <b>${tomorrowStr} (NGÀY MAI)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA THI NGÀY MAI (${unreminded1DayExams.length} môn):</b>${examListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 <i>Lời khuyên: Vui lòng chuẩn bị thẻ sinh viên, CCCD và có mặt trước giờ thi ít nhất 15 phút. Chúc bạn thi tốt!</i>\n⏰ <i>Nhắc nhở lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;

          const sendRes = await sendTelegramMessage({
            botToken: effectiveToken,
            chatId: sub.chatId,
            text: messageHtml,
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            reminders1DaySent++;
            // Log to prevent duplicate sending
            for (const ex of unreminded1DayExams) {
              await prisma.examReminderLog.upsert({
                where: {
                  username_examRecordId_reminderType: {
                    username: sub.username,
                    examRecordId: ex.id,
                    reminderType: '1_DAY_BEFORE',
                  },
                },
                create: {
                  username: sub.username,
                  examRecordId: ex.id,
                  reminderType: '1_DAY_BEFORE',
                  targetDate: tomorrowStr,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }
      }

      // ── MỐC 2: NHẮC 7:00 SÁNG HÔM THI (Today's Exams) ──
      const todayExams = allStudentExams.filter((ex) => {
        if (!ex.ngayThi) return false;
        return normalizeDateVN(ex.ngayThi) === todayStr;
      });

      if (todayExams.length > 0) {
        // Filter out exams that have already been reminded for SAME_DAY_MORNING
        const unremindedTodayExams: typeof todayExams = [];
        for (const ex of todayExams) {
          const logged = await prisma.examReminderLog.findUnique({
            where: {
              username_examRecordId_reminderType: {
                username: sub.username,
                examRecordId: ex.id,
                reminderType: 'SAME_DAY_MORNING',
              },
            },
          });
          if (!logged || options.forceAll) {
            unremindedTodayExams.push(ex);
          }
        }

        if (unremindedTodayExams.length > 0) {
          let examListHtml = '';
          unremindedTodayExams.forEach((ex, idx) => {
            examListHtml += `\n${idx + 1}. <b>${ex.tenMH || ex.maMH}</b>\n   ⏰ Giờ thi: <b>${ex.gioThi || ''}</b> | 🏛️ Phòng: <code>${ex.mapThi || 'Chưa rõ'}</code>\n   🏷️ Số báo danh: <b>${ex.nhomThi || '-'}</b> | Tổ thi: <b>${ex.toThi || '-'}</b>`;
          });

          const messageHtml = `☀️ <b>[LỊCH THI HÔM NAY - 7:00 SÁNG] CHÚC BẠN THI TỐT!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày thi: <b>${todayStr} (HÔM NAY)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA THI HÔM NAY (${unremindedTodayExams.length} môn):</b>${examListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🚀 <i>Nhắc nhở: Hãy kiểm tra kỹ phòng thi, mang đầy đủ giấy tờ tùy thân và đồ dùng thi cử!</i>\n⏰ <i>Tự động phát lúc: 7:00 AM (Giờ Việt Nam)</i>`;

          const sendRes = await sendTelegramMessage({
            botToken: effectiveToken,
            chatId: sub.chatId,
            text: messageHtml,
            options: {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            },
          });

          if (sendRes.success) {
            remindersSameDaySent++;
            // Log to prevent duplicate sending
            for (const ex of unremindedTodayExams) {
              await prisma.examReminderLog.upsert({
                where: {
                  username_examRecordId_reminderType: {
                    username: sub.username,
                    examRecordId: ex.id,
                    reminderType: 'SAME_DAY_MORNING',
                  },
                },
                create: {
                  username: sub.username,
                  examRecordId: ex.id,
                  reminderType: 'SAME_DAY_MORNING',
                  targetDate: todayStr,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }
      }
    }

    return {
      success: true,
      timestampVN: nowVN.toLocaleString('vi-VN'),
      todayStr,
      tomorrowStr,
      reminders1DaySent,
      remindersSameDaySent,
      totalSubscribers: subscribers.length,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('runExamScheduleReminders error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi chạy quét nhắc lịch thi',
    };
  }
}
