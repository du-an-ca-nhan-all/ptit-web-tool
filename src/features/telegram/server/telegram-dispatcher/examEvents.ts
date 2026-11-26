import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';

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
