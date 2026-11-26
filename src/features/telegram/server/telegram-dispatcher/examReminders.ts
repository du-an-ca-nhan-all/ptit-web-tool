import { prisma } from '@/src/lib/prisma';
import { sendTelegramMessage, resolveEffectiveBotToken } from '../telegramServerService';
import { formatDateVN, getVietnamTime, normalizeDateVN } from './dateUtils';

type ExamReminderKind = '1_DAY_BEFORE' | 'SAME_DAY_MORNING';

async function filterUnremindedExams(params: {
  username: string;
  exams: any[];
  reminderType: ExamReminderKind;
  forceAll?: boolean;
}) {
  const { username, exams, reminderType, forceAll } = params;
  const unreminded: any[] = [];
  for (const ex of exams) {
    const logged = await prisma.examReminderLog.findUnique({
      where: {
        username_examRecordId_reminderType: { username, examRecordId: ex.id, reminderType },
      },
    });
    if (!logged || forceAll) unreminded.push(ex);
  }
  return unreminded;
}

async function logDispatchedExamReminders(params: {
  username: string;
  exams: any[];
  reminderType: ExamReminderKind;
  targetDate: string;
}) {
  const { username, exams, reminderType, targetDate } = params;
  for (const ex of exams) {
    await prisma.examReminderLog.upsert({
      where: {
        username_examRecordId_reminderType: { username, examRecordId: ex.id, reminderType },
      },
      create: { username, examRecordId: ex.id, reminderType, targetDate },
      update: { sentAt: new Date() },
    });
  }
}

function buildExamReminderHtml(params: {
  kind: ExamReminderKind;
  studentName: string;
  username: string;
  classCode: string;
  dateStr: string;
  exams: any[];
  nowVN: Date;
}): string {
  const { kind, studentName, username, classCode, dateStr, exams, nowVN } = params;
  if (kind === '1_DAY_BEFORE') {
    const examListHtml = exams
      .map(
        (ex, idx) =>
          `\n${idx + 1}. <b>${ex.tenMH || ex.maMH}</b> (<code>${ex.maMH}</code>)\n   ⏰ Ca thi: <b>${ex.gioThi || ''}</b> | 🏛️ Phòng: <code>${ex.mapThi || 'Chưa rõ'}</code>\n   🏷️ Số báo danh: <b>${ex.nhomThi || '-'}</b> | Tổ thi: <b>${ex.toThi || '-'}</b>`
      )
      .join('');
    return `⏰ <b>[NHẮC LỊCH THI] NGÀY MAI BẠN CÓ CA THI!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày thi: <b>${dateStr} (NGÀY MAI)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA THI NGÀY MAI (${exams.length} môn):</b>${examListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 <i>Lời khuyên: Vui lòng chuẩn bị thẻ sinh viên, CCCD và có mặt trước giờ thi ít nhất 15 phút. Chúc bạn thi tốt!</i>\n⏰ <i>Nhắc nhở lúc: ${nowVN.toLocaleTimeString('vi-VN')} - ${nowVN.toLocaleDateString('vi-VN')}</i>`;
  }

  const examListHtml = exams
    .map(
      (ex, idx) =>
        `\n${idx + 1}. <b>${ex.tenMH || ex.maMH}</b>\n   ⏰ Giờ thi: <b>${ex.gioThi || ''}</b> | 🏛️ Phòng: <code>${ex.mapThi || 'Chưa rõ'}</code>\n   🏷️ Số báo danh: <b>${ex.nhomThi || '-'}</b> | Tổ thi: <b>${ex.toThi || '-'}</b>`
    )
    .join('');
  return `☀️ <b>[LỊCH THI HÔM NAY - 7:00 SÁNG] CHÚC BẠN THI TỐT!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n🏫 Lớp: <b>${classCode}</b>\n🗓️ Ngày thi: <b>${dateStr} (HÔM NAY)</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 <b>DANH SÁCH CA THI HÔM NAY (${exams.length} môn):</b>${examListHtml}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🚀 <i>Nhắc nhở: Hãy kiểm tra kỹ phòng thi, mang đầy đủ giấy tờ tùy thân và đồ dùng thi cử!</i>\n⏰ <i>Tự động phát lúc: 7:00 AM (Giờ Việt Nam)</i>`;
}

async function dispatchExamReminderBatch(params: {
  sub: any;
  effectiveToken: string;
  exams: any[];
  kind: ExamReminderKind;
  dateStr: string;
  nowVN: Date;
  forceAll?: boolean;
}): Promise<{ sent: boolean; error?: string }> {
  const { sub, effectiveToken, exams, kind, dateStr, nowVN, forceAll } = params;
  if (exams.length === 0) return { sent: false };

  const unreminded = await filterUnremindedExams({
    username: sub.username,
    exams,
    reminderType: kind,
    forceAll,
  });
  if (unreminded.length === 0) return { sent: false };

  const studentName = sub.user?.student?.hoTen || sub.username;
  const classCode = sub.user?.student?.maLop || 'Chưa cập nhật';
  const messageHtml = buildExamReminderHtml({
    kind,
    studentName,
    username: sub.username,
    classCode,
    dateStr,
    exams: unreminded,
    nowVN,
  });

  const sendRes = await sendTelegramMessage({
    botToken: effectiveToken,
    chatId: sub.chatId,
    text: messageHtml,
    options: { threadId: sub.threadId ? Number(sub.threadId) : undefined },
  });

  if (!sendRes.success) {
    return { sent: false, error: sendRes.error ? `${sub.username}: ${sendRes.error}` : undefined };
  }

  await logDispatchedExamReminders({
    username: sub.username,
    exams: unreminded,
    reminderType: kind,
    targetDate: dateStr,
  });
  return { sent: true };
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
    const tomorrowVN = new Date(nowVN.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = formatDateVN(tomorrowVN);

    const subscribers = await prisma.telegramConfig.findMany({
      where: { isEnabled: true, notifyExamSchedule: true },
      include: { user: { include: { student: true } } },
    });

    let reminders1DaySent = 0;
    let remindersSameDaySent = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      const effectiveToken = await resolveEffectiveBotToken(sub.botToken)
        .then((res) => res.token)
        .catch(() => null);
      if (!effectiveToken) continue;

      const allStudentExams = await prisma.examRecord.findMany({
        where: { maSV: sub.username, isPostponed: false },
      });

      const tomorrowExams = allStudentExams.filter((ex) => ex.ngayThi && normalizeDateVN(ex.ngayThi) === tomorrowStr);
      const res1Day = await dispatchExamReminderBatch({
        sub,
        effectiveToken,
        exams: tomorrowExams,
        kind: '1_DAY_BEFORE',
        dateStr: tomorrowStr,
        nowVN,
        forceAll: options.forceAll,
      });
      if (res1Day.sent) reminders1DaySent++;
      if (res1Day.error) errors.push(res1Day.error);

      const todayExams = allStudentExams.filter((ex) => ex.ngayThi && normalizeDateVN(ex.ngayThi) === todayStr);
      const resSameDay = await dispatchExamReminderBatch({
        sub,
        effectiveToken,
        exams: todayExams,
        kind: 'SAME_DAY_MORNING',
        dateStr: todayStr,
        nowVN,
        forceAll: options.forceAll,
      });
      if (resSameDay.sent) remindersSameDaySent++;
      if (resSameDay.error) errors.push(resSameDay.error);
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
