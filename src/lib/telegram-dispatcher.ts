import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from './telegram-service';
import { fetchStudentAnnouncementsFromQLDTTX } from './qldttx-service';

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
// 3. EVENT: COURSE REGISTRATION & TUITION SYNCED (ĐKMH & Học Phí)
// ─────────────────────────────────────────────────────────────────────────────
export async function dispatchCourseRegistrationSynced(params: {
  username: string;
  courseList?: any[];
  tuitionFee?: number;
  totalCredits?: number;
  semesterName?: string;
}) {
  try {
    const { username, courseList = [], tuitionFee = 0, totalCredits = 0, semesterName } = params;

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

    if (!sub || !sub.isEnabled || !sub.notifyCourseRegistration) return { sent: false };

    let effectiveToken: string;
    try {
      const resolved = await resolveEffectiveBotToken(sub.botToken);
      effectiveToken = resolved.token;
    } catch {
      return { sent: false };
    }

    const studentName = sub.user?.student?.hoTen || sub.username;
    const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';
    const formattedTuition = tuitionFee > 0 ? `${tuitionFee.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ (hoặc đã hoàn thành)';

    let courseListHtml = '';
    courseList.slice(0, 10).forEach((c, idx) => {
      const name = c.tenMH || c.subjectName || c.name || 'Môn học';
      const credits = c.soTinChi || c.credits || '';
      courseListHtml += `\n${idx + 1}. <b>${name}</b> ${credits ? `(<code>${credits} TC</code>)` : ''}`;
    });
    if (courseList.length > 10) {
      courseListHtml += `\n... và ${courseList.length - 10} môn học khác.`;
    }

    const messageHtml = `📚 <b>KẾT QUẢ ĐĂNG KÝ MÔN HỌC & HỌC PHÍ</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🏷️ Học kỳ: <b>${semesterName || 'Học kỳ hiện tại'}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 Tổng số tín chỉ: <b>${totalCredits} TC</b> (${courseList.length} môn)\n💰 Tổng học phí tạm tính: <b>${formattedTuition}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH MÔN HỌC:</b>${courseListHtml || '\n(Không có môn học)'}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Đồng bộ lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;

    const sendRes = await sendTelegramMessage(effectiveToken, sub.chatId, messageHtml, {
      threadId: sub.threadId ? Number(sub.threadId) : undefined,
    });

    return { sent: sendRes.success };
  } catch (err) {
    console.error('dispatchCourseRegistrationSynced error:', err);
    return { error: err };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. EVENT: CLASS ACTIVITY / ENVELOPE / SETTLEMENT (Biến Động Lớp Học)
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

      // Find external account
      const extAccount = await prisma.externalAccount.findFirst({
        where: { username: sub.username },
      });

      if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
        continue;
      }

      totalChecked++;

      try {
        const { announcements } = await fetchStudentAnnouncementsFromQLDTTX({
          username: extAccount.extUsername,
          password: extAccount.extPassword,
          token: extAccount.token,
        });

        if (!announcements || announcements.length === 0) {
          // Update last check time
          await prisma.telegramConfig.update({
            where: { id: sub.id },
            data: { lastQldtCheckedAt: new Date() },
          });
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

          if (alreadyLogged && !options.forceCheck) {
            continue;
          }

          const studentName = sub.user?.student?.hoTen || sub.username;
          const cleanSummary = ann.summary ? ann.summary.slice(0, 350) : '';

          const messageHtml = `📢 <b>THÔNG BÁO MỚI TỪ CỔNG QLDTTX (PTTC1)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📌 <b>${ann.title}</b>\n\n${cleanSummary ? `📝 <i>${cleanSummary}...</i>\n\n` : ''}🏛️ Đơn vị gửi: <b>${ann.sender || 'Phòng Đào Tạo'}</b>\n🗓️ Ngày đăng: <b>${ann.publishDate || 'Gần đây'}</b>\n🔗 <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao">Xem chi tiết trên QLDTTX (/#/xemthongbao)</a>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Tự động quét định kỳ: ${intervalHours} tiếng/lần</i>`;

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
        });
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
  startDate: Date;
  endDate: Date;
}

function parseTkbDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length !== 3) return null;
  let [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) y += 2000;
  return new Date(y, m - 1, d);
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

    // Map PTIT periods to standard timestamps
    const periodTimes: Record<number, { start: string; end: string; startMin: number }> = {
      1: { start: '07:00', end: '07:45', startMin: 7 * 60 },
      2: { start: '07:50', end: '08:35', startMin: 7 * 60 + 50 },
      3: { start: '08:40', end: '09:25', startMin: 8 * 60 + 40 },
      4: { start: '09:30', end: '10:15', startMin: 9 * 60 + 30 },
      5: { start: '10:20', end: '11:05', startMin: 10 * 60 + 20 },
      6: { start: '11:10', end: '11:55', startMin: 11 * 60 + 10 },
      7: { start: '12:30', end: '13:15', startMin: 12 * 60 + 30 },
      8: { start: '13:20', end: '14:05', startMin: 13 * 60 + 20 },
      9: { start: '14:10', end: '14:55', startMin: 14 * 60 + 10 },
      10: { start: '15:00', end: '15:45', startMin: 15 * 60 },
      11: { start: '15:50', end: '16:35', startMin: 15 * 60 + 50 },
      12: { start: '16:40', end: '17:25', startMin: 16 * 60 + 40 },
      13: { start: '18:00', end: '18:45', startMin: 18 * 60 },
      14: { start: '18:50', end: '19:35', startMin: 18 * 60 + 50 },
      15: { start: '19:40', end: '20:25', startMin: 19 * 60 + 40 },
      16: { start: '20:30', end: '21:15', startMin: 20 * 60 + 30 },
    };

    const startTime = periodTimes[startPeriod]?.start || '18:00';
    const endTime = periodTimes[endPeriod]?.end || '20:30';
    const startMinutes = periodTimes[startPeriod]?.startMin || 18 * 60;

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
 * Lấy tất cả ca học của sinh viên vào ngày cụ thể
 */
export async function getStudentClassSessionsForDate(
  username: string,
  targetDateVN: Date
): Promise<ParsedClassSession[]> {
  let courseList: any[] = [];

  // 1. Thử lấy từ cơ sở dữ liệu CourseRegistration
  const dbCourseReg = await prisma.courseRegistration.findFirst({
    where: { username },
  });

  if (dbCourseReg && dbCourseReg.data) {
    try {
      const parsed = JSON.parse(dbCourseReg.data);
      courseList = parsed?.data?.ds_kqdkmh || parsed?.ds_kqdkmh || [];
    } catch {}
  }

  // 2. Nếu DB chưa có, tìm từ file public/dangky_mon_hoc/
  if (courseList.length === 0) {
    try {
      const baseDir = path.join(process.cwd(), 'public', 'dangky_mon_hoc');
      if (fs.existsSync(baseDir)) {
        const classDirs = fs.readdirSync(baseDir, { withFileTypes: true }).filter((d) => d.isDirectory());
        for (const cDir of classDirs) {
          const mainPath = path.join(baseDir, cDir.name, 'main.json');
          if (fs.existsSync(mainPath)) {
            const raw = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
            if (raw.username === username) {
              courseList = raw.data?.data?.ds_kqdkmh || raw.ds_kqdkmh || [];
              break;
            }
          }

          const subPath = path.join(baseDir, cDir.name, 'sub-accounts.json');
          if (fs.existsSync(subPath)) {
            const raw = JSON.parse(fs.readFileSync(subPath, 'utf8'));
            if (raw[username]) {
              courseList = raw[username].data?.data?.ds_kqdkmh || raw[username].ds_kqdkmh || [];
              break;
            }
          }
        }
      }
    } catch {}
  }

  const sessionsToday: ParsedClassSession[] = [];

  for (const item of courseList) {
    const toHoc = item.to_hoc;
    if (!toHoc || !toHoc.tkb) continue;

    const parsedTkb = parseTkbString(toHoc.tkb);
    for (const seg of parsedTkb) {
      if (isSessionOnDate(seg, targetDateVN)) {
        sessionsToday.push({
          subjectName: toHoc.ten_mon || 'Môn học',
          subjectCode: toHoc.ma_mon || '',
          group: toHoc.nhom_to || '',
          classCode: toHoc.lop || '',
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
  }

  // Sắp xếp ca học theo thời gian bắt đầu
  sessionsToday.sort((a, b) => a.startMinutes - b.startMinutes);
  return sessionsToday;
}

/**
 * Quét và gửi thông báo lịch học (Sáng 7h-10h gửi tổng hợp & trước giờ học 30p/1h gửi nhắc nhở)
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
    const isMorningWindow = (nowHourVN >= 7 && nowHourVN < 10) || options.forceMorningSummary;

    for (const sub of subscribers) {
      const studentName = sub.user?.student?.hoTen || sub.username;
      const sessionsToday = await getStudentClassSessionsForDate(sub.username, nowVN);

      if (sessionsToday.length === 0) {
        continue;
      }

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch {
        continue;
      }

      // ─────────────────────────────────────────────────────────────
      // 1. GỬI TỔNG HỢP LỊCH HỌC ĐẦU NGÀY (7h00 - 10h00 SÁNG)
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

        if (!morningLog || options.forceMorningSummary) {
          let scheduleItemsText = '';
          sessionsToday.forEach((ses, idx) => {
            scheduleItemsText += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}\n`;
          });

          const morningMessage = `📚 <b>THỜI KHÓA BIỂU HÔM NAY - PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📅 <b>${todayDowName}, ngày ${todayStr}</b>\n\n📌 Hôm nay bạn có <b>${sessionsToday.length}</b> ca học:${scheduleItemsText}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống sẽ tự động gửi thông báo nhắc nhở trước giờ vào lớp ${sub.classReminderBefore || 30} phút. Chúc bạn học tập tốt!</i>`;

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
                sessionInfo: `${sessionsToday.length} ca học`,
              },
              update: {
                sentAt: new Date(),
              },
            });
          } else if (sendRes.error) {
            errors.push(`${sub.username}: ${sendRes.error}`);
          }
        }
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
            const preMessage60 = `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 1 TIẾNG)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Vui lòng chuẩn bị tài liệu và kiểm tra đường truyền/phòng học trước giờ bắt đầu!</i>`;

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
            const preMessage30 = `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 30 PHÚT)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${sub.username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Hãy vào phòng học / Zoom / Teams đúng giờ nhé!</i>`;

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
 */
export async function findNearestStudentClassSchedule(
  username: string,
  maxDays: number = 10,
  options: {
    includeTodayIfEnded?: boolean;
  } = {}
): Promise<NearestClassScheduleResult> {
  const nowVN = getVietnamTime();
  const nowMinutesToday = nowVN.getHours() * 60 + nowVN.getMinutes();
  const dowMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  for (let offset = 0; offset <= maxDays; offset++) {
    const checkDate = new Date(nowVN.getFullYear(), nowVN.getMonth(), nowVN.getDate() + offset);
    const sessions = await getStudentClassSessionsForDate(username, checkDate);

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
 * Quét lịch học gần nhất trong 10 ngày tới. Nếu có thì lấy lịch gần nhất rồi gửi Telegram
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

      const nearest = await findNearestStudentClassSchedule(sub.username, maxDays);

      if (!nearest.found || !nearest.sessions || nearest.sessions.length === 0) {
        notFoundCount++;
        results.push({
          username: sub.username,
          found: false,
          message: `Không có ca học nào trong ${maxDays} ngày tới`,
        });
        continue;
      }

      let effectiveToken: string;
      try {
        const resolved = await resolveEffectiveBotToken(sub.botToken);
        effectiveToken = resolved.token;
      } catch (e: any) {
        errors.push(`${sub.username}: ${e.message}`);
        continue;
      }

      const offsetText =
        nearest.dayOffset === 0
          ? 'HÔM NAY'
          : nearest.dayOffset === 1
          ? 'NGÀY MAI'
          : `sau ${nearest.dayOffset} ngày nữa`;

      let sessionListHtml = '';
      nearest.sessions.forEach((ses, idx) => {
        sessionListHtml += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}\n`;
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



