import fs from 'fs';
import path from 'path';
import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from './telegramServerService';
import {
  getGlobalConfig,
  GLOBAL_CONFIG_KEYS,
  BackupTelegramConfigValue,
  TelegramAdminConfigValue,
  getTelegramAdminConfig,
} from '@/src/lib/globalConfig';
import {
  fetchStudentAnnouncementsFromQLDTTX,
  fetchStudentTimetableFromQLDTTX,
} from '@/src/features/external-portal/server/qldttxServerService';
import {
  getSlinkNotifications,
  getValidSlinkTokenOrRefresh,
  markSlinkNotificationAsRead,
  cleanHtml,
  formatSlinkDate,
  escapeTelegramHtml,
} from '@/src/features/external-portal/server/slinkServerService';
import { parseDateString } from '@/src/lib/date-utils';

/**
 * Normalizes date string into DD/MM/YYYY format
 */
export function normalizeDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    } else {
      // DD/MM/YYYY
      const [d, m, y] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
}

/**
 * Gets current Vietnam Time (Asia/Ho_Chi_Minh, UTC+7)
 */
export function getVietnamTime(): Date {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

/**
 * Formats a Date object to DD/MM/YYYY string in Vietnam Time
 */
export function formatDateVN(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. EVENT: EXAM SCHEDULE UPDATED (Khi Admin import lịch thi mới)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchExamScheduleUpdated(params: {
  usernames?: string[];
  batchCode?: string;
  batchName?: string;
  totalRecords?: number;
}) {
  try {
    const { usernames, batchCode, batchName } = params;

    // Find subscribers who want exam notifications
    const whereSubscribers: any = {
      isEnabled: true,
      notifyExamSchedule: true,
    };
    if (usernames && usernames.length > 0) {
      whereSubscribers.username = { in: usernames };
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereSubscribers,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    if (subscribers.length === 0) return { totalSent: 0 };

    let sentCount = 0;
    for (const sub of subscribers) {
      // Query upcoming exams for this student
      const exams = await prisma.examRecord.findMany({
        where: {
          maSV: sub.username,
          ...(batchCode ? { batchCode } : {}),
        },
        orderBy: [{ ngayThi: 'asc' }, { gioThi: 'asc' }],
      });

      if (exams.length === 0) continue;

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch {
        continue;
      }

      const studentName = sub.user?.student?.hoTen || sub.username;
      const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';

      let examListHtml = '';
      exams.forEach((ex, idx) => {
        const postponedBadge = ex.isPostponed ? ' ❌ <i>(Hoãn thi)</i>' : '';
        examListHtml += `\n${idx + 1}. <b>${ex.tenMH || ex.maMH}</b>${postponedBadge}\n   🗓️ Ngày: <b>${ex.ngayThi || 'Chưa xếp'}</b> | Ca: <b>${ex.gioThi || ''}</b>\n   🏛️ Phòng: <code>${ex.mapThi || 'Chưa rõ'}</code> | SBD: <b>${ex.nhomThi || '-'}</b>`;
      });

      const messageHtml = `📅 <b>CẬP NHẬT LỊCH THI MỚI - PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🏷️ Đợt thi: <b>${batchName || batchCode || 'Đợt thi chính thức'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH MÔN THI (${exams.length} môn):</b>${examListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Cập nhật lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;

      const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
        threadId: sub.threadId ? Number(sub.threadId) : undefined,
      });

      if (sendRes.success) sentCount++;
    }

    return { totalSent: sentCount };
  } catch (err) {
    console.error('dispatchExamScheduleUpdated error:', err);
    return { error: err };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EVENT: EXAM POSTPONED (Khi môn thi được đánh dấu hoãn thi)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchExamPostponed(params: {
  username: string;
  subjectCode?: string;
  subjectName?: string;
  isPostponed: boolean;
  examDate?: string;
  examTime?: string;
  examRoom?: string;
}) {
  try {
    const { username, subjectCode, subjectName, isPostponed, examDate, examTime, examRoom } = params;

    const sub = await prisma.telegramConfig.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!sub || !sub.isEnabled || !sub.notifyExamSchedule) return { sent: false };

    let effectiveToken: string;
    try {
      const resolved = await resolveEffectiveBotToken(sub.botToken);
      effectiveToken = resolved.token;
    } catch {
      return { sent: false };
    }

    const studentName = sub.user?.student?.hoTen || sub.username;
    const statusText = isPostponed
      ? '❌ <b>ĐÃ ĐƯỢC ĐÁNH DẤU HOÃN THI / KHÔNG THI</b>'
      : '✅ <b>ĐÃ ĐƯỢC MỞ LẠI LỊCH THI BÌNH THƯỜNG</b>';

    const messageHtml = `⚠️ <b>BIẾN ĐỘNG LỊCH THI - PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n📚 Môn thi: <b>${subjectName || subjectCode || 'Môn học'}</b> (<code>${subjectCode || ''}</code>)\n📌 Trạng thái: ${statusText}\n${examDate ? `🗓️ Ngày thi: <b>${examDate}</b> | Ca: <b>${examTime || ''}</b>\n` : ''}${examRoom ? `🏛️ Phòng thi: <code>${examRoom}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Vui lòng kiểm tra lại lịch thi trên hệ thống hoặc liên hệ Lớp trưởng/Cố vấn học tập nếu có thắc mắc.</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
      threadId: sub.threadId ? Number(sub.threadId) : undefined,
    });

    return { sent: sendRes.success };
  } catch (err) {
    console.error('dispatchExamPostponed error:', err);
    return { error: err };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EVENT: CLASS ACTIVITY / ENVELOPE / SETTLEMENT (Biến Động Lớp Học)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchClassActivityAnnouncement(params: {
  classCode: string;
  title: string;
  message: string;
  authorName?: string;
}) {
  try {
    const { classCode, title, message, authorName } = params;

    // Find all students in this class with Telegram enabled
    const classStudents = await prisma.student.findMany({
      where: { maLop: classCode },
      select: { maSV: true },
    });

    const studentUsernames = classStudents.map((s) => s.maSV);
    if (studentUsernames.length === 0) return { totalSent: 0 };

    const subscribers = await prisma.telegramConfig.findMany({
      where: {
        username: { in: studentUsernames },
        isEnabled: true,
        notifyClassActivity: true,
      },
    });

    if (subscribers.length === 0) return { totalSent: 0 };

    let sentCount = 0;
    for (const sub of subscribers) {
      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch {
        continue;
      }

      const messageHtml = `👥 <b>THÔNG BÁO LỚP HỌC: ${classCode}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 <b>${title}</b>\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Người gửi: <b>${authorName || 'Ban cán sự lớp'}</b>\n⏰ <i>Gửi lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;

      const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
        threadId: sub.threadId ? Number(sub.threadId) : undefined,
      });

      if (sendRes.success) sentCount++;
    }

    return { totalSent: sentCount };
  } catch (err) {
    console.error('dispatchClassActivityAnnouncement error:', err);
    return { error: err };
  }
}

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
    let errors: string[] = [];

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

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
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

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
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

// ─────────────────────────────────────────────────────────────────────────────
// 6. QLDTTX ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG QLDTTX (/#/xemthongbao)
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchQldtAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = {
      isEnabled: true,
      notifyQldtAnnouncements: true,
    };
    if (options.username) {
      whereCond.username = options.username;
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    let totalChecked = 0;
    let totalAnnouncementsDispatched = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const intervalHours = sub.qldtCheckInterval || 2;

      // Check if enough time has elapsed
      if (!options.forceCheck && sub.lastQldtCheckedAt) {
        const elapsedHours = (Date.now() - new Date(sub.lastQldtCheckedAt).getTime()) / (1000 * 60 * 60);
        if (elapsedHours < intervalHours) {
          continue;
        }
      }

      // Find external account for QLDTTX
      const extAccount =
        (await prisma.externalAccount.findFirst({
          where: {
            username: sub.username.toUpperCase(),
            systemKey: 'QLDTTX_PTTC1',
          },
        })) ||
        (await prisma.externalAccount.findFirst({
          where: { username: sub.username },
        }));

      if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
        continue;
      }

      totalChecked++;

      try {
        const { announcements, newToken } = await fetchStudentAnnouncementsFromQLDTTX({
          username: extAccount.extUsername,
          password: extAccount.extPassword,
          token: extAccount.token,
        });

        if (newToken && newToken !== extAccount.token) {
          await prisma.externalAccount.update({
            where: { id: extAccount.id },
            data: {
              token: newToken,
              status: 'CONNECTED',
              lastSyncAt: new Date(),
              syncMessage: `Đã tự động làm mới Token QLDTTX lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            },
          }).catch(() => {});
        }

        if (!announcements || announcements.length === 0) {
          // Update last check time
          await prisma.telegramConfig.update({
            where: { id: sub.id },
            data: { lastQldtCheckedAt: new Date() },
          }).catch(() => {});
          continue;
        }

        let effectiveToken: string;
        try {
          const resolved = await resolveEffectiveBotToken(sub.botToken);
          effectiveToken = resolved.token;
        } catch {
          continue;
        }

        for (const ann of announcements) {
          // Check if already dispatched
          const alreadyLogged = await prisma.qldtAnnouncementLog.findUnique({
            where: {
              username_announcementId: {
                username: sub.username,
                announcementId: ann.id,
              },
            },
          });

          if (alreadyLogged) {
            continue;
          }

          // Bỏ qua các thông báo cũ đã đọc từ hơn 7 ngày trước để tránh gửi dồn dập lịch sử cũ
          const rawDate = ann.publishDate;
          if (rawDate && ann.isRead === true) {
            const notifDate = parseDateString(rawDate);
            if (notifDate && !isNaN(notifDate.getTime())) {
              const diffMs = Date.now() - notifDate.getTime();
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
              if (diffMs > SEVEN_DAYS_MS) {
                // Đánh dấu log để không xử lý lại
                await prisma.qldtAnnouncementLog.upsert({
                  where: {
                    username_announcementId: {
                      username: sub.username,
                      announcementId: ann.id,
                    },
                  },
                  create: {
                    username: sub.username,
                    announcementId: ann.id,
                    title: ann.title,
                    publishDate: ann.publishDate,
                  },
                  update: {},
                }).catch(() => {});
                continue;
              }
            }
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ QLDTTX');
          const rawSummary = ann.summary || ann.content || '';
          const cleanedSummary = cleanHtml(rawSummary);
          const cleanSummary = cleanedSummary ? (cleanedSummary.length > 350 ? cleanedSummary.slice(0, 350) + '...' : cleanedSummary) : '';
          const senderDisplay = cleanHtml(ann.sender || 'Phòng Đào Tạo / Giảng Viên');

          // Định dạng ngày hiển thị
          let dateDisplay = 'Gần đây';
          if (ann.publishDate) {
            try {
              const d = new Date(ann.publishDate);
              if (!isNaN(d.getTime())) {
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const mo = String(d.getMonth() + 1).padStart(2, '0');
                const yy = d.getFullYear();
                dateDisplay = `${hh}:${mm} - ${dd}/${mo}/${yy}`;
              } else {
                dateDisplay = ann.publishDate;
              }
            } catch {
              dateDisplay = ann.publishDate;
            }
          }

          const unreadBadge = !ann.isRead ? ' 🔴 <i>(Chưa đọc)</i>' : '';
          const mustReadBadge = ann.isMustRead ? ' ⚠️ <b>(Bắt buộc xem)</b>' : '';

          const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ CỔNG QLDTTX (PTTC1)</b>${unreadBadge}${mustReadBadge}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao">Xem chi tiết trên Cổng QLDTTX (/#/xemthongbao)</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });

          if (sendRes.success) {
            totalAnnouncementsDispatched++;
            await prisma.qldtAnnouncementLog.upsert({
              where: {
                username_announcementId: {
                  username: sub.username,
                  announcementId: ann.id,
                },
              },
              create: {
                username: sub.username,
                announcementId: ann.id,
                title: ann.title,
                publishDate: ann.publishDate,
              },
              update: {
                sentAt: new Date(),
              },
            });
          }
        }

        // Update last checked at
        await prisma.telegramConfig.update({
          where: { id: sub.id },
          data: { lastQldtCheckedAt: new Date() },
        }).catch(() => {});
      } catch (err: any) {
        errors.push(`${sub.username}: ${err.message}`);
      }
    }

    return {
      success: true,
      totalSubscribers: subscribers.length,
      totalChecked,
      totalAnnouncementsDispatched,
      errors: errors.slice(0, 5),
    };
  } catch (err: any) {
    console.error('checkAndDispatchQldtAnnouncements error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi kiểm tra thông báo QLDTTX',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.5 PTIT S-LINK ANNOUNCEMENTS: KIỂM TRA THÔNG BÁO MỚI TỪ CỔNG S-LINK (https://slink.ptit.edu.vn/)
// VÀ TỰ ĐỘNG ĐÁNH DẤU LÀ ĐÃ ĐỌC SAU KHI GỬI THÀNH CÔNG VỀ TELEGRAM
// ─────────────────────────────────────────────────────────────────────────────
export async function checkAndDispatchSlinkAnnouncements(options: {
  username?: string;
  forceCheck?: boolean;
} = {}) {
  try {
    const whereCond: any = {
      isEnabled: true,
      notifySlinkAnnouncements: true,
    };
    if (options.username) {
      whereCond.username = options.username;
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    let totalChecked = 0;
    let totalAnnouncementsDispatched = 0;
    let totalMarkedRead = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const intervalHours = sub.slinkCheckInterval || 2;

      // Check if enough time has elapsed
      if (!options.forceCheck && sub.lastSlinkCheckedAt) {
        const elapsedHours = (Date.now() - new Date(sub.lastSlinkCheckedAt).getTime()) / (1000 * 60 * 60);
        if (elapsedHours < intervalHours) {
          continue;
        }
      }

      // Find S-Link external account
      const extAccount = await prisma.externalAccount.findFirst({
        where: {
          username: sub.username,
          OR: [
            { systemKey: 'SLINK_PTIT' },
            { systemUrl: { contains: 'slink.ptit.edu.vn' } },
          ],
        },
      });

      if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
        continue;
      }

      totalChecked++;

      try {
        const { token, isNew } = await getValidSlinkTokenOrRefresh({
          username: extAccount.extUsername,
          password: extAccount.extPassword,
          existingToken: extAccount.token,
        });

        if (isNew && token !== extAccount.token) {
          await prisma.externalAccount.update({
            where: { id: extAccount.id },
            data: {
              token,
              status: 'CONNECTED',
              lastSyncAt: new Date(),
              syncMessage: `Đã tự động làm mới Token S-Link lúc ${new Date().toLocaleTimeString('vi-VN')}`,
            },
          }).catch(() => {});
        }

        // Chỉ lấy các thông báo đang CHƯA ĐỌC trên Cổng S-Link (unreadOnly = true)
        const notifRes = await getSlinkNotifications(token, 1, 30, true);
        const rawAnnouncements = notifRes?.data?.result || [];

        // Lọc kỹ lại đảm bảo chỉ gửi thông báo đang được đánh dấu là chưa đọc trên S-Link (!item.read)
        const announcements = rawAnnouncements.filter((ann: any) => ann && !ann.read && !ann.isRead);

        if (announcements.length === 0) {
          await prisma.telegramConfig.update({
            where: { id: sub.id },
            data: { lastSlinkCheckedAt: new Date() },
          }).catch(() => {});
          continue;
        }

        let effectiveToken: string;
        try {
          const resolved = await resolveEffectiveBotToken(sub.botToken);
          effectiveToken = resolved.token;
        } catch {
          continue;
        }

        for (const ann of announcements) {
          // Bỏ qua nếu thông báo đã được đánh dấu đọc trên S-Link
          if (ann.read === true || ann.isRead === true) {
            continue;
          }

          const notifId = String(ann.id || ann._id || '');
          if (!notifId) continue;

          // Bỏ qua thông báo nếu đã có từ hơn 3 ngày trước (> 3 ngày)
          const rawDate = ann.createdAt || ann.created_at || ann.publishDate || ann.publishedAt || ann.date;
          if (rawDate) {
            const notifDate = parseDateString(rawDate);
            if (notifDate && !isNaN(notifDate.getTime())) {
              const diffMs = Date.now() - notifDate.getTime();
              const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
              if (diffMs > THREE_DAYS_MS) {
                // Bỏ qua thông báo cũ hơn 3 ngày trước
                continue;
              }
            }
          }

          // Check if already dispatched
          const alreadyLogged = await prisma.slinkAnnouncementLog.findUnique({
            where: {
              username_announcementId: {
                username: sub.username,
                announcementId: notifId,
              },
            },
          });

          if (alreadyLogged && !options.forceCheck) {
            continue;
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const cleanTitle = cleanHtml(ann.title || 'Thông báo mới từ PTIT S-Link');
          const rawContent = ann.content || ann.description || '';
          const cleaned = cleanHtml(rawContent);
          const cleanSummary = cleaned ? (cleaned.length > 400 ? cleaned.slice(0, 400) + '...' : cleaned) : '';
          const senderDisplay = cleanHtml(ann.senderName || ann.sender || 'Cổng PTIT S-Link');
          const dateDisplay = formatSlinkDate(ann.createdAt || rawDate);

          const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ PTIT S-LINK</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(sub.username)}</code>)\n📌 <b>${escapeTelegramHtml(cleanTitle)}</b>\n\n${cleanSummary ? `📝 <i>${escapeTelegramHtml(cleanSummary)}</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${escapeTelegramHtml(senderDisplay)}</b>\n🗓️ Thời gian: <b>${escapeTelegramHtml(dateDisplay)}</b>\n🔗 <a href="https://slink.ptit.edu.vn/">Mở cổng PTIT S-Link</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });

          if (sendRes.success) {
            totalAnnouncementsDispatched++;

            // 1. Lưu log để tránh gửi lặp
            await prisma.slinkAnnouncementLog.upsert({
              where: {
                username_announcementId: {
                  username: sub.username,
                  announcementId: notifId,
                },
              },
              create: {
                username: sub.username,
                announcementId: notifId,
                title: ann.title,
                publishDate: ann.createdAt || (rawDate ? String(rawDate) : undefined),
              },
              update: {
                sentAt: new Date(),
              },
            });

            // 2. Sau khi đã gửi thành công, tiến hành đánh dấu thông báo đó là đã đọc trên S-Link
            try {
              await markSlinkNotificationAsRead(token, notifId, 'ONE');
              totalMarkedRead++;
            } catch (markErr: any) {
              console.warn(`[checkAndDispatchSlinkAnnouncements] Đánh dấu đã đọc thông báo S-Link (${notifId}) thất bại:`, markErr?.message);
            }
          }
        }

        // Update last checked time
        await prisma.telegramConfig.update({
          where: { id: sub.id },
          data: { lastSlinkCheckedAt: new Date() },
        }).catch(() => {});
      } catch (err: any) {
        errors.push(`${sub.username}: ${err.message}`);
      }
    }

    return {
      success: true,
      totalSubscribers: subscribers.length,
      totalChecked,
      totalAnnouncementsDispatched,
      totalMarkedRead,
      errors: errors.slice(0, 5),
    };
  } catch (err: any) {
    console.error('checkAndDispatchSlinkAnnouncements error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi kiểm tra thông báo PTIT S-Link',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CLASS SCHEDULE & TIMETABLE (THỜI KHÓA BIỂU & NHẮC LỊCH HỌC)
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedClassSession {
  subjectName: string;
  subjectCode: string;
  group?: string;
  classCode?: string;
  dayOfWeekStr: string;
  dayOfWeekNum: number; // 2..7 = Thứ 2..Thứ 7, 8 = Chủ nhật
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  startMinutes: number; // Phút tính từ 00:00 của ngày
  room: string;
  onlineLink?: string;
  startDate: Date;
  endDate: Date;
}

export function parseTkbDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  
  // 1. Dạng ISO: YYYY-MM-DDTHH:mm:ss hoặc YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }

  // 2. Dạng phân cách / hoặc - (DD/MM/YYYY hoặc YYYY/MM/DD)
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (parts[0].length === 4) {
      [y, m, d] = [parts[0], parts[1], parts[2]].map(Number);
    }
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }
  return null;
}

export function parseTkbString(tkbStr: string): Array<{
  raw: string;
  dayOfWeekStr: string;
  dayOfWeekNum: number;
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  startMinutes: number;
  room: string;
  startDate: Date;
  endDate: Date;
}> {
  if (!tkbStr) return [];
  const rawSegments = tkbStr.split(/<hr\s*\/?>|\n|;/i).map((s) => s.trim()).filter(Boolean);
  const results: any[] = [];

  for (const seg of rawSegments) {
    const parts = seg.split(',').map((p) => p.trim());
    if (parts.length < 4) continue;

    const dayOfWeekStr = parts[0];
    const periodStr = parts[1];
    const roomStr = parts[2];
    const dateRangeStr = parts.slice(3).join(',');

    let dayOfWeekNum = -1;
    const matchDow = dayOfWeekStr.match(/Thứ\s*(\d)|CN|Chủ\s*nhật/i);
    if (matchDow) {
      if (matchDow[1]) {
        dayOfWeekNum = parseInt(matchDow[1], 10);
      } else {
        dayOfWeekNum = 8;
      }
    }

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (dateRangeStr.includes('đến')) {
      const [startStr, endStr] = dateRangeStr.split('đến').map((s) => s.trim());
      startDate = parseTkbDate(startStr);
      endDate = parseTkbDate(endStr);
    } else {
      startDate = parseTkbDate(dateRangeStr);
      endDate = startDate;
    }

    if (!startDate || !endDate) continue;

    let startPeriod = 13;
    let endPeriod = 15;
    const matchPeriod = periodStr.match(/(\d+)(?:\s*->\s*|\s*-\s*)(\d+)?/);
    if (matchPeriod) {
      startPeriod = parseInt(matchPeriod[1], 10);
      endPeriod = matchPeriod[2] ? parseInt(matchPeriod[2], 10) : startPeriod;
    }

    // Map PTIT periods to standard timestamps (Hệ đào tạo Từ Xa PTIT ca tối từ 19:00 - 21:50)
    const periodTimes: Record<number, { start: string; end: string; startMin: number }> = {
      1: { start: '07:00', end: '07:50', startMin: 7 * 60 },
      2: { start: '07:55', end: '08:45', startMin: 7 * 60 + 55 },
      3: { start: '08:50', end: '09:40', startMin: 8 * 60 + 50 },
      4: { start: '09:45', end: '10:35', startMin: 9 * 60 + 45 },
      5: { start: '10:40', end: '11:30', startMin: 10 * 60 + 40 },
      6: { start: '11:35', end: '12:25', startMin: 11 * 60 + 35 },
      7: { start: '12:30', end: '13:20', startMin: 12 * 60 + 30 },
      8: { start: '13:25', end: '14:15', startMin: 13 * 60 + 25 },
      9: { start: '14:20', end: '15:10', startMin: 14 * 60 + 20 },
      10: { start: '15:15', end: '16:05', startMin: 15 * 60 + 15 },
      11: { start: '16:10', end: '17:00', startMin: 16 * 60 + 10 },
      12: { start: '17:05', end: '17:55', startMin: 17 * 60 + 5 },
      13: { start: '19:00', end: '19:50', startMin: 19 * 60 },
      14: { start: '20:00', end: '20:50', startMin: 20 * 60 },
      15: { start: '21:00', end: '21:50', startMin: 21 * 60 },
      16: { start: '21:55', end: '22:45', startMin: 21 * 60 + 55 },
    };

    const startTime = periodTimes[startPeriod]?.start || '19:00';
    const endTime = periodTimes[endPeriod]?.end || '21:50';
    const startMinutes = periodTimes[startPeriod]?.startMin || 19 * 60;

    results.push({
      raw: seg,
      dayOfWeekStr,
      dayOfWeekNum,
      periodStr,
      startPeriod,
      endPeriod,
      startTime,
      endTime,
      startMinutes,
      room: roomStr.replace(/^Ph\s*/i, '').trim(),
      startDate,
      endDate,
    });
  }

  return results;
}

function isSessionOnDate(
  session: { dayOfWeekNum: number; startDate: Date; endDate: Date },
  dateObj: Date
): boolean {
  const jsDay = dateObj.getDay();
  const dow = jsDay === 0 ? 8 : jsDay + 1;
  if (session.dayOfWeekNum !== dow) return false;

  const y = dateObj.getFullYear();
  const m = dateObj.getMonth();
  const d = dateObj.getDate();
  const targetTime = new Date(y, m, d).getTime();

  const start = new Date(session.startDate.getFullYear(), session.startDate.getMonth(), session.startDate.getDate()).getTime();
  const end = new Date(session.endDate.getFullYear(), session.endDate.getMonth(), session.endDate.getDate()).getTime();

  return targetTime >= start && targetTime <= end;
}

/**
 * Phân tích 1 phần tử lịch học từ API QLDTTX (w-locdstkbtuanusertheohocky) hoặc DB
 */
export function parseSessionFromApiItem(item: any, targetDateVN: Date): ParsedClassSession[] {
  const results: ParsedClassSession[] = [];
  if (!item) return results;

  const subjectName =
    item.ten_mon ||
    item.ten_mon_hoc ||
    item.ten_hp ||
    item.to_hoc?.ten_mon ||
    item.ten_mon_hoc_tieng_anh ||
    'Môn học';

  const subjectCode =
    item.ma_mon ||
    item.ma_mon_hoc ||
    item.ma_hp ||
    item.to_hoc?.ma_mon ||
    '';

  const group =
    item.ma_nhom ||
    item.nhom_to ||
    item.nhom ||
    item.nhom_hoc ||
    item.to_hoc?.nhom_to ||
    item.to_hoc?.nhom ||
    '';

  const classCode =
    item.ten_lop ||
    item.lop ||
    item.ma_lop ||
    item.ma_lop_tc ||
    item.to_hoc?.lop ||
    '';

  const room = (
    item.phong ||
    item.ten_phong ||
    item.ma_phong ||
    item.phong_hoc ||
    item.to_hoc?.phong ||
    ''
  )
    .toString()
    .replace(/^Ph\s*/i, '')
    .trim();

  const onlineLink = item.link_hoc_online || item.online_link || item.link_zoom || '';

  // 1. Trường hợp item có chứa chuỗi TKB chuẩn (to_hoc.tkb hoặc tkb)
  const tkbStr = item.tkb || item.to_hoc?.tkb;
  if (tkbStr && typeof tkbStr === 'string') {
    const parsedSegments = parseTkbString(tkbStr);
    for (const seg of parsedSegments) {
      if (isSessionOnDate(seg, targetDateVN)) {
        results.push({
          subjectName,
          subjectCode,
          group: group || seg.raw,
          classCode,
          dayOfWeekStr: seg.dayOfWeekStr,
          dayOfWeekNum: seg.dayOfWeekNum,
          periodStr: seg.periodStr,
          startPeriod: seg.startPeriod,
          endPeriod: seg.endPeriod,
          startTime: seg.startTime,
          endTime: seg.endTime,
          startMinutes: seg.startMinutes,
          room: seg.room || room || 'Phòng học môn',
          onlineLink: onlineLink || undefined,
          startDate: seg.startDate,
          endDate: seg.endDate,
        });
      }
    }
    if (results.length > 0) return results;
  }

  // 2. Trường hợp item có các trường ngày / thứ cụ thể
  const targetYear = targetDateVN.getFullYear();
  const targetMonth = targetDateVN.getMonth();
  const targetDay = targetDateVN.getDate();

  // Kiểm tra ngày học cụ thể
  let itemDate: Date | null = null;
  const rawDateStr = item.ngay_hoc || item.ngay_hoc_chuan || item.ngay_day || item.date;
  if (rawDateStr) {
    itemDate = parseTkbDate(String(rawDateStr));
  }

  // Kiểm tra khoảng thời gian (tu_ngay -> den_ngay)
  const startRangeStr = item.tu_ngay || item.ngay_bat_dau || item.tuan_tu_ngay;
  const endRangeStr = item.den_ngay || item.ngay_ket_thuc || item.tuan_den_ngay;
  let startDate = startRangeStr ? parseTkbDate(String(startRangeStr)) : null;
  let endDate = endRangeStr ? parseTkbDate(String(endRangeStr)) : null;

  // Xác định thứ trong tuần
  let dayOfWeekNum = -1;
  const rawThu = item.thu_kieu_so ?? item.thu ?? item.day_of_week;
  if (rawThu !== undefined && rawThu !== null) {
    const thuStr = String(rawThu).trim();
    if (thuStr === '8' || thuStr.toLowerCase().includes('cn') || thuStr.toLowerCase().includes('chủ')) {
      dayOfWeekNum = 8;
    } else {
      const parsedNum = parseInt(thuStr.replace(/\D/g, ''), 10);
      if (parsedNum >= 2 && parsedNum <= 7) {
        dayOfWeekNum = parsedNum;
      } else if (parsedNum === 1 || parsedNum === 8) {
        dayOfWeekNum = 8;
      }
    }
  }

  let matchesDate = false;
  if (itemDate) {
    matchesDate =
      itemDate.getFullYear() === targetYear &&
      itemDate.getMonth() === targetMonth &&
      itemDate.getDate() === targetDay;
  } else if (startDate && endDate && dayOfWeekNum > 0) {
    matchesDate = isSessionOnDate({ dayOfWeekNum, startDate, endDate }, targetDateVN);
  }

  if (!matchesDate) return [];

  // Tiết học
  let startPeriod = Number(item.tiet_bat_dau ?? item.tiet_bd ?? item.tiet_dau ?? item.start_period) || 13;
  let endPeriod = Number(item.tiet_ket_thuc ?? item.tiet_kt ?? item.end_period);
  if (!endPeriod || isNaN(endPeriod)) {
    const soTiet = Number(item.so_tiet) || 3;
    endPeriod = startPeriod + soTiet - 1;
  }

  const periodStr = item.tiet_hoc || item.periodStr || `Tiết ${startPeriod}->${endPeriod}`;

  const periodTimes: Record<number, { start: string; end: string; startMin: number }> = {
    1: { start: '07:00', end: '07:50', startMin: 7 * 60 },
    2: { start: '07:55', end: '08:45', startMin: 7 * 60 + 55 },
    3: { start: '08:50', end: '09:40', startMin: 8 * 60 + 50 },
    4: { start: '09:45', end: '10:35', startMin: 9 * 60 + 45 },
    5: { start: '10:40', end: '11:30', startMin: 10 * 60 + 40 },
    6: { start: '11:35', end: '12:25', startMin: 11 * 60 + 35 },
    7: { start: '12:30', end: '13:20', startMin: 12 * 60 + 30 },
    8: { start: '13:25', end: '14:15', startMin: 13 * 60 + 25 },
    9: { start: '14:20', end: '15:10', startMin: 14 * 60 + 20 },
    10: { start: '15:15', end: '16:05', startMin: 15 * 60 + 15 },
    11: { start: '16:10', end: '17:00', startMin: 16 * 60 + 10 },
    12: { start: '17:05', end: '17:55', startMin: 17 * 60 + 5 },
    13: { start: '19:00', end: '19:50', startMin: 19 * 60 },
    14: { start: '20:00', end: '20:50', startMin: 20 * 60 },
    15: { start: '21:00', end: '21:50', startMin: 21 * 60 },
    16: { start: '21:55', end: '22:45', startMin: 21 * 60 + 55 },
  };

  const startTime = item.gio_bat_dau || item.gio_bd || periodTimes[startPeriod]?.start || '19:00';
  const endTime = item.gio_ket_thuc || item.gio_kt || periodTimes[endPeriod]?.end || '21:50';

  let startMinutes = periodTimes[startPeriod]?.startMin || 19 * 60;
  if (item.gio_bat_dau || item.gio_bd) {
    const timeMatch = String(item.gio_bat_dau || item.gio_bd).match(/(\d+)[h:](\d+)/i);
    if (timeMatch) {
      startMinutes = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    }
  }

  const dowMap: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  const jsDay = targetDateVN.getDay();
  const actualDowNum = jsDay === 0 ? 8 : jsDay + 1;
  const dayOfWeekStr = item.thu_chu || dowMap[dayOfWeekNum > 0 ? dayOfWeekNum : actualDowNum] || `Thứ ${actualDowNum}`;

  results.push({
    subjectName,
    subjectCode,
    group,
    classCode,
    dayOfWeekStr,
    dayOfWeekNum: dayOfWeekNum > 0 ? dayOfWeekNum : actualDowNum,
    periodStr,
    startPeriod,
    endPeriod,
    startTime,
    endTime,
    startMinutes,
    room: room || 'Phòng học môn',
    onlineLink: onlineLink || undefined,
    startDate: startDate || itemDate || targetDateVN,
    endDate: endDate || itemDate || targetDateVN,
  });

  return results;
}

/**
 * Lấy toàn bộ danh sách ca học trong học kỳ của sinh viên từ API cổng QLDTTX
 * (https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky)
 * và fallback sang cơ sở dữ liệu CourseRegistration nếu cần.
 */
export async function getStudentAllSemesterSessions(username: string): Promise<any[]> {
  // 1. Thử gọi trực tiếp API QLDTTX nếu sinh viên đã cấu hình tài khoản ExternalAccount
  try {
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username,
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    if (extAccount && (extAccount.token || extAccount.extPassword)) {
      const fetched = await fetchStudentTimetableFromQLDTTX({
        username: extAccount.extUsername || username,
        password: extAccount.extPassword,
        token: extAccount.token,
      });

      // Cập nhật token mới nếu có làm mới
      if (fetched.newToken && fetched.newToken !== extAccount.token) {
        await prisma.externalAccount
          .update({
            where: { id: extAccount.id },
            data: {
              token: fetched.newToken,
              lastSyncAt: new Date(),
              status: 'CONNECTED',
              syncMessage: 'Đã cập nhật Token QLDTTX từ API TKB.',
            },
          })
          .catch(() => {});
      }

      if (Array.isArray(fetched.rawList) && fetched.rawList.length > 0) {
        // Lưu vào DB StudentTimetableRecord
        await prisma.studentTimetableRecord
          .upsert({
            where: { username },
            create: {
              username,
              rawData: JSON.stringify(fetched),
              semesterId: fetched.currentSemester || null,
              totalEvents: fetched.rawList.length,
              lastPulledAt: new Date(),
            },
            update: {
              rawData: JSON.stringify(fetched),
              semesterId: fetched.currentSemester || null,
              totalEvents: fetched.rawList.length,
              lastPulledAt: new Date(),
            },
          })
          .catch(() => {});

        return fetched.rawList;
      }
    }
  } catch (apiErr: any) {
    console.warn(`[getStudentAllSemesterSessions] Không thể gọi API TKB QLDTTX cho ${username}:`, apiErr?.message || apiErr);
  }

  // 2. Fallback sang bảng StudentTimetableRecord trong CSDL
  try {
    const cachedRecord = await prisma.studentTimetableRecord.findUnique({
      where: { username },
    });

    if (cachedRecord && cachedRecord.rawData) {
      const parsed = JSON.parse(cachedRecord.rawData);
      const list =
        parsed?.rawList ||
        parsed?.data?.ds_thoi_khoa_bieu ||
        parsed?.data?.ds_tkb_tuan ||
        parsed?.data?.ds_kqdkmh ||
        parsed?.ds_kqdkmh ||
        [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (dbErr: any) {
    console.error(`[getStudentAllSemesterSessions] Lỗi truy vấn DB StudentTimetableRecord cho ${username}:`, dbErr);
  }

  // 3. Fallback sang bảng CourseRegistration trong CSDL
  try {
    const dbCourseReg = await prisma.courseRegistration.findFirst({
      where: { username },
    });

    if (dbCourseReg && dbCourseReg.data) {
      const parsed = JSON.parse(dbCourseReg.data);
      const list =
        parsed?.data?.ds_thoi_khoa_bieu ||
        parsed?.data?.ds_tkb_tuan ||
        parsed?.data?.ds_kqdkmh ||
        parsed?.ds_kqdkmh ||
        [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (dbErr: any) {
    console.error(`[getStudentAllSemesterSessions] Lỗi truy vấn DB CourseRegistration cho ${username}:`, dbErr);
  }

  return [];
}

/**
 * Lấy tất cả ca học của sinh viên vào ngày cụ thể.
 * Tự động phân tích từ danh sách TKB học kỳ (API QLDTTX hoặc DB fallback).
 */
export async function getStudentClassSessionsForDate(
  username: string,
  targetDateVN: Date,
  cachedRawList?: any[]
): Promise<ParsedClassSession[]> {
  const rawList = cachedRawList || (await getStudentAllSemesterSessions(username));
  const sessionsToday: ParsedClassSession[] = [];

  for (const item of rawList) {
    const toHoc = item.to_hoc;
    if (toHoc && toHoc.tkb) {
      const parsedTkb = parseTkbString(toHoc.tkb);
      for (const seg of parsedTkb) {
        if (isSessionOnDate(seg, targetDateVN)) {
          sessionsToday.push({
            subjectName: toHoc.ten_mon || toHoc.ten_mon_hoc || 'Môn học',
            subjectCode: toHoc.ma_mon || toHoc.ma_mon_hoc || '',
            group: toHoc.nhom_to || toHoc.nhom || '',
            classCode: toHoc.lop || toHoc.ma_lop || '',
            dayOfWeekStr: seg.dayOfWeekStr,
            dayOfWeekNum: seg.dayOfWeekNum,
            periodStr: seg.periodStr,
            startPeriod: seg.startPeriod,
            endPeriod: seg.endPeriod,
            startTime: seg.startTime,
            endTime: seg.endTime,
            startMinutes: seg.startMinutes,
            room: seg.room,
            startDate: seg.startDate,
            endDate: seg.endDate,
          });
        }
      }
    } else {
      const parsedDirect = parseSessionFromApiItem(item, targetDateVN);
      sessionsToday.push(...parsedDirect);
    }
  }

  // Khử trùng lặp ca học nếu xuất hiện nhiều lần
  const uniqueSessions: ParsedClassSession[] = [];
  const seenKeys = new Set<string>();

  for (const s of sessionsToday) {
    const key = `${s.subjectCode}_${s.startPeriod}_${s.room}_${s.dayOfWeekNum}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueSessions.push(s);
    }
  }

  // Sắp xếp ca học theo thời gian bắt đầu
  uniqueSessions.sort((a, b) => a.startMinutes - b.startMinutes);
  return uniqueSessions;
}

/**
 * Quét và gửi thông báo lịch học (Sáng 7h-10h gửi tổng hợp & trước giờ học 30p/1h gửi nhắc nhở)
 * Hỗ trợ forceCheck để kiểm tra và gửi trực tiếp kết quả (dù có hay không có ca học) đến Telegram.
 */
export async function runClassScheduleReminders(options: {
  forceCheck?: boolean;
  username?: string;
  forceMorningSummary?: boolean;
  forcePreClassAlert?: boolean;
} = {}) {
  try {
    const nowVN = getVietnamTime();
    const todayStr = normalizeDateVN(
      `${String(nowVN.getDate()).padStart(2, '0')}/${String(nowVN.getMonth() + 1).padStart(2, '0')}/${nowVN.getFullYear()}`
    );
    const nowHourVN = nowVN.getHours();
    const nowMinutesToday = nowHourVN * 60 + nowVN.getMinutes();

    const dowMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const todayDowName = dowMap[nowVN.getDay()];

    const whereCond: any = {
      isEnabled: true,
      notifyClassSchedule: true,
    };
    if (options.username) {
      whereCond.username = options.username;
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    let morningSummariesSent = 0;
    let preClassAlertsSent = 0;
    const errors: string[] = [];

    // Is current time within the morning review window (7h00 -> 10h00 VN Time)?
    const isMorningWindow = (nowHourVN >= 7 && nowHourVN < 10) || options.forceMorningSummary || options.forceCheck;

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;

      // 1. Gọi API QLDTTX để lấy TKB học kỳ
      const rawSemesterList = await getStudentAllSemesterSessions(sub.username);
      const sessionsToday = await getStudentClassSessionsForDate(sub.username, nowVN, rawSemesterList);

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch {
        continue;
      }

      // ─────────────────────────────────────────────────────────────
      // 1. GỬI TỔNG HỢP LỊCH HỌC ĐẦU NGÀY (7h00 - 10h00 SÁNG HOẶC KIỂM TRA THỦ CÔNG)
      // Kể cả khi hôm nay không có ca học nào vẫn gửi thông báo báo không có ca học
      // ─────────────────────────────────────────────────────────────
      if (isMorningWindow) {
        const morningLog = await prisma.classScheduleReminderLog.findUnique({
          where: {
            username_courseCode_reminderType_targetDate: {
              username: sub.username,
              courseCode: 'DAILY_SUMMARY',
              reminderType: 'MORNING_DAILY_SUMMARY',
              targetDate: todayStr,
            },
          },
        });

        if (!morningLog || options.forceMorningSummary || options.forceCheck) {
          let morningMessage = '';
          let sessionInfo = '';

          if (sessionsToday.length === 0) {
            morningMessage = `📚 <b>THỜI KHÓA BIỂU HÔM NAY - PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📅 <b>${todayDowName}, ngày ${todayStr}</b>\n\n📌 <i>Hôm nay bạn không có ca học nào trên thời khóa biểu cổng trường.</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ <i>Chúc bạn một ngày học tập và làm việc hiệu quả!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')}</i>`;
            sessionInfo = 'Không có ca học';
          } else {
            let scheduleItemsText = '';
            sessionsToday.forEach((ses, idx) => {
              scheduleItemsText += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n   🔗 Link học: <a href="${ses.onlineLink}">Tham gia trực tuyến</a>` : ''}\n`;
            });

            morningMessage = `📚 <b>THỜI KHÓA BIỂU HÔM NAY - PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📅 <b>${todayDowName}, ngày ${todayStr}</b>\n\n📌 Hôm nay bạn có <b>${sessionsToday.length}</b> ca học:${scheduleItemsText}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống sẽ tự động gửi thông báo nhắc nhở trước giờ vào lớp ${sub.classReminderBefore || 30} phút. Chúc bạn học tập tốt!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')}</i>`;
            sessionInfo = `${sessionsToday.length} ca học`;
          }

          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, morningMessage, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });

          if (sendRes.success) {
            morningSummariesSent++;
            await prisma.classScheduleReminderLog.upsert({
              where: {
                username_courseCode_reminderType_targetDate: {
                  username: sub.username,
                  courseCode: 'DAILY_SUMMARY',
                  reminderType: 'MORNING_DAILY_SUMMARY',
                  targetDate: todayStr,
                },
              },
              create: {
                username: sub.username,
                courseCode: 'DAILY_SUMMARY',
                reminderType: 'MORNING_DAILY_SUMMARY',
                targetDate: todayStr,
                sessionInfo,
              },
              update: {
                sentAt: new Date(),
                sessionInfo,
              },
            });
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }
      }

      // Nếu không có ca học nào trong hôm nay -> Bỏ qua bước nhắc trước giờ học
      if (sessionsToday.length === 0) {
        continue;
      }

      // ─────────────────────────────────────────────────────────────
      // 2. NHẮC NHỞ TRƯỚC GIỜ VÀO HỌC (30 PHÚT HOẶC 1 TIẾNG)
      // ─────────────────────────────────────────────────────────────
      const reminderConfig = sub.classReminderBefore ?? 30; // 30, 60 hoặc 0 (cả hai)

      for (const ses of sessionsToday) {
        const minutesUntilStart = ses.startMinutes - nowMinutesToday;
        const sessionKey = `${ses.subjectCode}_${ses.startPeriod}`;

        // Kiểm tra điều kiện nhắc 60 phút
        const shouldCheck60M =
          (reminderConfig === 60 || reminderConfig === 0) &&
          ((minutesUntilStart > 30 && minutesUntilStart <= 65) || options.forcePreClassAlert);

        if (shouldCheck60M) {
          const log60 = await prisma.classScheduleReminderLog.findUnique({
            where: {
              username_courseCode_reminderType_targetDate: {
                username: sub.username,
                courseCode: sessionKey,
                reminderType: 'BEFORE_CLASS_60M',
                targetDate: todayStr,
              },
            },
          });

          if (!log60 || options.forcePreClassAlert) {
            const preMessage60 = `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 1 TIẾNG)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n🔗 Link lớp học: <a href="${ses.onlineLink}">Bấm vào đây để vào học</a>` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Vui lòng chuẩn bị tài liệu và kiểm tra đường truyền/phòng học trước giờ bắt đầu!</i>`;

            const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, preMessage60, {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            });

            if (sendRes.success) {
              preClassAlertsSent++;
              await prisma.classScheduleReminderLog.upsert({
                where: {
                  username_courseCode_reminderType_targetDate: {
                    username: sub.username,
                    courseCode: sessionKey,
                    reminderType: 'BEFORE_CLASS_60M',
                    targetDate: todayStr,
                  },
                },
                create: {
                  username: sub.username,
                  courseCode: sessionKey,
                  reminderType: 'BEFORE_CLASS_60M',
                  targetDate: todayStr,
                  sessionInfo: `${ses.startTime} - ${ses.room}`,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          }
        }

        // Kiểm tra điều kiện nhắc 30 phút
        const shouldCheck30M =
          (reminderConfig === 30 || reminderConfig === 0) &&
          ((minutesUntilStart > 0 && minutesUntilStart <= 35) || options.forcePreClassAlert);

        if (shouldCheck30M) {
          const log30 = await prisma.classScheduleReminderLog.findUnique({
            where: {
              username_courseCode_reminderType_targetDate: {
                username: sub.username,
                courseCode: sessionKey,
                reminderType: 'BEFORE_CLASS_30M',
                targetDate: todayStr,
              },
            },
          });

          if (!log30 || options.forcePreClassAlert) {
            const preMessage30 = `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 30 PHÚT)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n🔗 Link lớp học: <a href="${ses.onlineLink}">Bấm vào đây để vào học</a>` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Hãy vào phòng học / Zoom / Teams đúng giờ nhé!</i>`;

            const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, preMessage30, {
              threadId: sub.threadId ? Number(sub.threadId) : undefined,
            });

            if (sendRes.success) {
              preClassAlertsSent++;
              await prisma.classScheduleReminderLog.upsert({
                where: {
                  username_courseCode_reminderType_targetDate: {
                    username: sub.username,
                    courseCode: sessionKey,
                    reminderType: 'BEFORE_CLASS_30M',
                    targetDate: todayStr,
                  },
                },
                create: {
                  username: sub.username,
                  courseCode: sessionKey,
                  reminderType: 'BEFORE_CLASS_30M',
                  targetDate: todayStr,
                  sessionInfo: `${ses.startTime} - ${ses.room}`,
                },
                update: {
                  sentAt: new Date(),
                },
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      timestampVN: nowVN.toLocaleString('vi-VN'),
      todayStr,
      todayDowName,
      morningSummariesSent,
      preClassAlertsSent,
      totalSubscribers: subscribers.length,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('runClassScheduleReminders error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi quét nhắc lịch học',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SCAN NEAREST UPCOMING CLASS IN 10 DAYS (QUÉT LỊCH HỌC GẦN NHẤT TRONG 10 NGÀY TỚI)
// ─────────────────────────────────────────────────────────────────────────────

export interface NearestClassScheduleResult {
  found: boolean;
  maxDays: number;
  date?: Date;
  dateStr?: string;
  dowName?: string;
  dayOffset?: number;
  sessions?: ParsedClassSession[];
}

/**
 * Quét tìm ngày học gần nhất có trong maxDays ngày tới (mặc định 10 ngày)
 * Sử dụng rawList từ API QLDTTX để quét toàn bộ ngày trong 1 lần gọi duy nhất.
 */
export async function findNearestStudentClassSchedule(
  username: string,
  maxDays: number = 10,
  options: {
    includeTodayIfEnded?: boolean;
    cachedRawList?: any[];
  } = {}
): Promise<NearestClassScheduleResult> {
  const nowVN = getVietnamTime();
  const nowMinutesToday = nowVN.getHours() * 60 + nowVN.getMinutes();
  const dowMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  // Lấy danh sách TKB học kỳ qua API QLDTTX (hoặc dùng cached nếu đã truyền)
  const rawList = options.cachedRawList || (await getStudentAllSemesterSessions(username));

  for (let offset = 0; offset <= maxDays; offset++) {
    const checkDate = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate() + offset);
    const sessions = await getStudentClassSessionsForDate(username, checkDate, rawList);

    if (sessions && sessions.length > 0) {
      if (offset === 0 && !options.includeTodayIfEnded) {
        // Kiểm tra xem hôm nay còn ca học nào chưa kết thúc không
        const hasUpcomingSession = sessions.some((s) => {
          const sessionEndMinutes = s.startMinutes + ((s.endPeriod - s.startPeriod + 1) * 45 || 135);
          return sessionEndMinutes >= nowMinutesToday;
        });

        // Nếu hôm nay tất cả các ca học đều đã qua thì tiếp tục tìm các ngày kế tiếp trong 10 ngày tới
        if (!hasUpcomingSession) {
          continue;
        }
      }

      const dateStr = formatDateVN(checkDate);
      const dowName = dowMap[checkDate.getDay()];
      return {
        found: true,
        maxDays,
        date: checkDate,
        dateStr,
        dowName,
        dayOffset: offset,
        sessions,
      };
    }
  }

  return {
    found: false,
    maxDays,
  };
}

/**
 * Quét lịch học gần nhất trong 10 ngày tới và gửi thông báo Telegram
 * Tự động gọi API QLDTTX để lấy dữ liệu mới nhất.
 */
export async function dispatchNearestClassScheduleNotification(options: {
  username?: string;
  maxDays?: number;
  forceSend?: boolean;
} = {}) {
  try {
    const maxDays = options.maxDays || 10;
    const nowVN = getVietnamTime();

    const whereCond: any = {
      isEnabled: true,
      notifyClassSchedule: true,
    };
    if (options.username) {
      whereCond.username = options.username;
    }

    const subscribers = await prisma.telegramConfig.findMany({
      where: whereCond,
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    if (subscribers.length === 0) {
      return {
        success: true,
        totalSubscribers: 0,
        totalSent: 0,
        message: 'Không tìm thấy tài khoản nào bật nhận thông báo lịch học Telegram.',
      };
    }

    let sentCount = 0;
    let notFoundCount = 0;
    const results: any[] = [];
    const errors: string[] = [];

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;
      const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';

      // 1. Gọi API QLDTTX lấy TKB học kỳ
      const rawSemesterList = await getStudentAllSemesterSessions(sub.username);

      // 2. Tìm ngày học gần nhất
      const nearest = await findNearestStudentClassSchedule(sub.username, maxDays, {
        cachedRawList: rawSemesterList,
      });

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch (e: any) {
        errors.push(`${sub.username}: ${e.message}`);
        continue;
      }

      // 3. Nếu không có lịch học trong 10 ngày tới
      if (!nearest.found || !nearest.sessions || nearest.sessions.length === 0) {
        notFoundCount++;
        if (options.forceSend) {
          const empty10DaysMsg = `📚 <b>[LỊCH HỌC 10 NGÀY TỚI] THỜI KHÓA BIỂU PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n\n📌 <i>Đã quét thời khóa biểu cổng trường: Trong ${maxDays} ngày tới bạn không có ca học nào trên hệ thống.</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;
          
          const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, empty10DaysMsg, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });

          if (sendRes.success) {
            sentCount++;
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }

        results.push({
          username: sub.username,
          found: false,
          message: `Không có ca học nào trong ${maxDays} ngày tới`,
        });
        continue;
      }

      // 4. Nếu có lịch học gần nhất -> Gửi thông báo chi tiết
      const offsetText =
        nearest.dayOffset === 0
          ? 'HÔM NAY'
          : nearest.dayOffset === 1
          ? 'NGÀY MAI'
          : `sau ${nearest.dayOffset} ngày nữa`;

      let sessionListHtml = '';
      nearest.sessions.forEach((ses, idx) => {
        sessionListHtml += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n   🔗 Link học: <a href="${ses.onlineLink}">Tham gia trực tuyến</a>` : ''}\n`;
      });

      const messageHtml = `📚 <b>[LỊCH HỌC GẦN NHẤT] THỜI KHÓA BIỂU PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày học gần nhất: <b>${nearest.dowName}, ngày ${nearest.dateStr}</b> (<i>${offsetText}</i>)\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA HỌC (${nearest.sessions.length} ca):</b>${sessionListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống tự động quét lịch học trong ${maxDays} ngày tới. Chúc bạn học tập tốt!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;

      const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
        threadId: sub.threadId ? Number(sub.threadId) : undefined,
      });

      if (sendRes.success) {
        sentCount++;
        results.push({
          username: sub.username,
          found: true,
          dateStr: nearest.dateStr,
          dowName: nearest.dowName,
          dayOffset: nearest.dayOffset,
          sessionsCount: nearest.sessions.length,
          sessions: nearest.sessions,
        });
      } else {
        errors.push(`${sub.username}: ${sendRes.error}`);
      }
    }

    return {
      success: true,
      maxDays,
      totalSubscribers: subscribers.length,
      totalSent: sentCount,
      notFoundCount,
      results,
      errors: errors.slice(0, 10),
    };
  } catch (err: any) {
    console.error('dispatchNearestClassScheduleNotification error:', err);
    return {
      success: false,
      error: err.message || 'Lỗi khi quét lịch học gần nhất',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. EVENT: NEW USER REGISTRATION NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchNewUserRegistered(params: {
  username: string;
  fullName: string;
  lop?: string | null;
  phoneNumber?: string | null;
  note?: string | null;
  status?: string;
  ip?: string | null;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnNewUser === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Admin telegram notification is disabled or not configured' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective telegram bot token found' };
    }

    const nowVN = getVietnamTime();
    const isAutoApproved = params.status === 'APPROVED' || (params.note && params.note.includes('Tự động duyệt'));
    const statusBadge = isAutoApproved
      ? '⚡ <b>TỰ ĐỘNG KÍCH HOẠT & LIÊN KẾT QLHT (Mật khẩu khớp Cổng QLDTTX)</b>'
      : params.status === 'APPROVED'
      ? '✅ <b>Đã được phê duyệt</b>'
      : '⏳ <b>Đang chờ Admin xét duyệt thủ công</b>';

    const messageHtml = `✨ <b>[THÔNG BÁO] ${isAutoApproved ? 'TỰ ĐỘNG KÍCH HOẠT TÀI KHOẢN MỚI' : 'CÓ NGƯỜI ĐĂNG KÝ TÀI KHOẢN MỚI'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Họ và tên: <b>${params.fullName}</b>\n🎓 Mã sinh viên: <code>${params.username}</code>\n🏫 Lớp học: <b>${params.lop || 'Chưa phân lớp'}</b>\n📱 Số điện thoại: <code>${params.phoneNumber || 'Chưa cập nhật'}</code>\n📝 Trạng thái: ${statusBadge}\n${params.note ? `💬 Ghi chú: <i>${params.note}</i>\n` : ''}${params.ip ? `🌐 Địa chỉ IP: <code>${params.ip}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>Cổng quản trị PTIT EduSync</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, adminConfig.chatId, messageHtml, {
      threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchNewUserRegistered error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. EVENT: DATABASE BACKUP / EXPORT NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchDatabaseExportOrBackup(params: {
  action: 'AUTO_BACKUP' | 'MANUAL_SNAPSHOT' | 'EXPORT_SQL' | 'EXPORT_JSON' | 'DOWNLOAD_BACKUP';
  filename?: string;
  fileSize?: number;
  adminUsername?: string;
  description?: string;
  tableStats?: Record<string, number>;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnDbBackup === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Backup notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const actionTitles = {
      AUTO_BACKUP: '⏰ TỰ ĐỘNG SAO LƯU DATABASE ĐỊNH KỲ (10H SÁNG)',
      MANUAL_SNAPSHOT: '💾 TẠO BẢN SNAPSHOT SAO LƯU THỦ CÔNG',
      EXPORT_SQL: '📤 XUẤT TOÀN BỘ CƠ SỞ DỮ LIỆU SANG SQL DUMP (.sql)',
      EXPORT_JSON: '📤 XUẤT TOÀN BỘ CƠ SỞ DỮ LIỆU SANG JSON (.json)',
      DOWNLOAD_BACKUP: '📥 TẢI VỀ BẢN SAO LƯU CƠ SỞ DỮ LIỆU',
    };

    const actionTitle = actionTitles[params.action] || '💾 SAO LƯU & XUẤT DỮ LIỆU DATABASE';
    const sizeStr = params.fileSize ? `${(params.fileSize / 1024).toFixed(1)} KB` : '';

    let statsHtml = '';
    if (params.tableStats && Object.keys(params.tableStats).length > 0) {
      const topTables = Object.entries(params.tableStats).slice(0, 6);
      statsHtml = `\n📊 <b>Dung lượng dữ liệu chính:</b>\n` + topTables.map(([tbl, cnt]) => `   • ${tbl}: <b>${cnt.toLocaleString('vi-VN')}</b> bản ghi`).join('\n');
    }

    const messageHtml = `💾 <b>[HỆ THỐNG] ${actionTitle}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${params.filename ? `📁 Tên file: <code>${params.filename}</code>\n` : ''}${sizeStr ? `📦 Kích thước: <b>${sizeStr}</b>\n` : ''}${params.adminUsername ? `👤 Người thực hiện: <b>${params.adminUsername}</b> (Admin)\n` : ''}${params.description ? `📝 Chi tiết: <i>${params.description}</i>\n` : ''}${statsHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>Cơ sở dữ liệu PostgreSQL - PTIT EduSync</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, adminConfig.chatId, messageHtml, {
      threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchDatabaseExportOrBackup error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. EVENT: DATABASE RESTORE NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchDatabaseRestore(params: {
  filename: string;
  adminUsername: string;
  format?: string;
  success: boolean;
  error?: string;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnDbRestore === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Restore notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const statusStr = params.success ? '✅ PHỤC HỒI THÀNH CÔNG' : '❌ PHỤC HỒI THẤT BẠI';

    const messageHtml = `🔄 <b>[CẢNH BÁO] PHỤC HỒI CƠ SỞ DỮ LIỆU (DATABASE RESTORE)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📁 File nguồn: <code>${params.filename}</code>\n👤 Quản trị viên: <b>${params.adminUsername}</b>\n🏷️ Định dạng: <b>${params.format || 'PostgreSQL'}</b>\n📊 Kết quả: <b>${statusStr}</b>\n${params.error ? `⚠️ Chi tiết lỗi: <code>${params.error}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>PTIT EduSync Security Monitor</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, adminConfig.chatId, messageHtml, {
      threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchDatabaseRestore error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. EVENT: EXAM BATCH IMPORT NOTIFICATION TO ADMIN (Dùng telegram_admin)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchExamBatchImportedToAdmin(params: {
  batchCode: string;
  batchName: string;
  adminUsername: string;
  totalRecords: number;
  totalStudents: number;
}) {
  try {
    const adminConfig = await getTelegramAdminConfig();
    if (!adminConfig || !adminConfig.isEnabled || adminConfig.notifyOnExamBatchImport === false || !adminConfig.chatId) {
      return { sent: false, reason: 'Exam batch import notification is disabled' };
    }

    const { token: effectiveToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
    if (!effectiveToken) {
      return { sent: false, reason: 'No effective bot token' };
    }

    const nowVN = getVietnamTime();
    const messageHtml = `📥 <b>[THÔNG BÁO] IMPORT ĐỢT THI MỚI THÀNH CÔNG</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🏷️ Đợt thi: <b>${params.batchName}</b> (<code>${params.batchCode}</code>)\n👤 Người import: <b>${params.adminUsername}</b> (Admin)\n📊 Tổng số bản ghi thi: <b>${params.totalRecords.toLocaleString('vi-VN')}</b>\n👥 Tổng số sinh viên liên quan: <b>${params.totalStudents.toLocaleString('vi-VN')}</b> sinh viên\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>\n🛡️ <i>PTIT EduSync System Notice</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, adminConfig.chatId, messageHtml, {
      threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
    });

    return { sent: sendRes.success, error: sendRes.error };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchExamBatchImportedToAdmin error:', err);
    return { sent: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. EVENT: QLDTTX PERSONAL EXAM SCHEDULE CHANGED (Khi phát hiện biến động lịch thi từ QLDTTX)
// ─────────────────────────────────────────────────────────────────────────────
export interface QldtExamChangeItem {
  maMon: string;
  tenMon: string;
  type: 'NEW' | 'CANCELLED' | 'MODIFIED';
  diffs: Array<{
    field: string;
    label: string;
    oldVal: string;
    newVal: string;
  }>;
}

export async function dispatchQldtExamScheduleChanges(params: {
  username: string;
  semesterName?: string;
  changes: QldtExamChangeItem[];
}) {
  try {
    const { username, semesterName, changes } = params;
    if (!changes || changes.length === 0) return { sent: false };

    const sub = await prisma.telegramConfig.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
    });

    const studentName = sub?.user?.student?.hoTen || username;
    const maLop = sub?.user?.student?.maLop || 'Chưa cập nhật';
    const nowVN = getVietnamTime();
    const timeStr = `${nowVN.getHours().toString().padStart(2, '0')}:${nowVN.getMinutes().toString().padStart(2, '0')} ${nowVN.getDate().toString().padStart(2, '0')}/${(nowVN.getMonth() + 1).toString().padStart(2, '0')}/${nowVN.getFullYear()}`;

    // Xây dựng danh sách thay đổi chi tiết dạng HTML
    let changeListHtml = '';
    changes.forEach((c, idx) => {
      if (c.type === 'NEW') {
        changeListHtml += `\n\n${idx + 1}. 🆕 <b>[${c.maMon}] ${c.tenMon}</b> <i>(Môn thi mới xếp lịch)</i>`;
      } else if (c.type === 'CANCELLED') {
        changeListHtml += `\n\n${idx + 1}. ❌ <b>[${c.maMon}] ${c.tenMon}</b> <i>(Đã huỷ / rút khỏi lịch thi)</i>`;
      } else {
        changeListHtml += `\n\n${idx + 1}. 🔄 <b>[${c.maMon}] ${c.tenMon}</b> <i>(Thay đổi thông tin ca thi)</i>`;
      }

      c.diffs.forEach((d) => {
        if (c.type === 'NEW') {
          if (d.newVal) changeListHtml += `\n   • ${d.label}: <b>${d.newVal}</b>`;
        } else if (c.type === 'CANCELLED') {
          if (d.oldVal) changeListHtml += `\n   • ${d.label} trước đó: <s>${d.oldVal}</s>`;
        } else {
          changeListHtml += `\n   • ${d.label}: <s>${d.oldVal || 'Chưa có'}</s> ➡️ <b>${d.newVal || 'Chưa xếp'}</b>`;
        }
      });
    });

    const userMessageHtml = `⚠️ <b>BIẾN ĐỘNG LỊCH THI CÁ NHÂN TỪ CỔNG QLDTTX</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n🏫 Lớp: <b>${maLop}</b>\n🏷️ Học kỳ: <b>${semesterName || 'Học kỳ hiện tại'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống tự động quét và phát hiện <b>${changes.length} biến động</b> trong lịch thi của bạn:</i>${changeListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động phát hiện lúc: ${timeStr}</i>\n👉 <i>Vui lòng vào ứng dụng hoặc Cổng QLDTTX để kiểm tra lại phòng thi & giờ thi chính xác!</i>`;

    let userSent = false;
    if (sub && sub.isEnabled && sub.notifyExamSchedule !== false) {
      try {
        const { token: effectiveToken } = await resolveEffectiveBotToken(sub.botToken);
        if (effectiveToken && sub.chatId) {
          const res = await sendTelegramMessage(effectiveToken, sub.chatId, userMessageHtml, {
            threadId: sub.threadId ? Number(sub.threadId) : undefined,
          });
          userSent = res.success;
        }
      } catch (subErr) {
        console.warn(`[TelegramDispatcher] Gửi báo đổi lịch thi cho ${username} thất bại:`, subErr);
      }
    }

    // Báo thêm cho Admin Channel nếu admin bật thông báo
    try {
      const adminConfig = await getTelegramAdminConfig();
      if (adminConfig && adminConfig.isEnabled && adminConfig.chatId) {
        const { token: adminToken } = await resolveEffectiveBotToken(adminConfig.botToken || undefined);
        if (adminToken) {
          const adminNoticeHtml = `🔔 <b>[BIẾN ĐỘNG LỊCH THI QLDTTX] SINH VIÊN: ${username}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> | Lớp: <b>${maLop}</b>\n📊 Số môn biến động: <b>${changes.length}</b> môn${changeListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Thời gian quét: ${timeStr}</i>`;
          await sendTelegramMessage(adminToken, adminConfig.chatId, adminNoticeHtml, {
            threadId: adminConfig.threadId ? Number(adminConfig.threadId) : undefined,
          });
        }
      }
    } catch {}

    return { sent: userSent, totalChanges: changes.length };
  } catch (err: any) {
    console.error('[TelegramDispatcher] dispatchQldtExamScheduleChanges error:', err);
    return { sent: false, error: err.message };
  }
}





