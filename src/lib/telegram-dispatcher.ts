import { prisma } from './prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from './telegram-service';

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
