import type { ParsedClassSession } from './types';

export function buildMorningSummaryMessage(params: {
  studentName: string;
  username: string;
  todayDowName: string;
  todayStr: string;
  sessionsToday: ParsedClassSession[];
  classReminderBefore?: number | null;
  nowVN: Date;
}): { morningMessage: string; sessionInfo: string } {
  const { studentName, username, todayDowName, todayStr, sessionsToday, classReminderBefore, nowVN } = params;

  if (sessionsToday.length === 0) {
    return {
      morningMessage: `📚 <b>THỜI KHÓA BIỂU HÔM NAY - PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n📅 <b>${todayDowName}, ngày ${todayStr}</b>\n\n📌 <i>Hôm nay bạn không có ca học nào trên thời khóa biểu cổng trường.</i>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ <i>Chúc bạn một ngày học tập và làm việc hiệu quả!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')}</i>`,
      sessionInfo: 'Không có ca học',
    };
  }

  let scheduleItemsText = '';
  sessionsToday.forEach((ses, idx) => {
    scheduleItemsText += `\n<b>${idx + 1}️⃣ ${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n   ⏰ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b> (<i>${ses.periodStr}</i>)\n   🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n   🔗 Link học: <a href="${ses.onlineLink}">Tham gia trực tuyến</a>` : ''}\n`;
  });

  return {
    morningMessage: `📚 <b>THỜI KHÓA BIỂU HÔM NAY - PTIT</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n📅 <b>${todayDowName}, ngày ${todayStr}</b>\n\n📌 Hôm nay bạn có <b>${sessionsToday.length}</b> ca học:${scheduleItemsText}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🔔 <i>Hệ thống sẽ tự động gửi thông báo nhắc nhở trước giờ vào lớp ${classReminderBefore || 30} phút. Chúc bạn học tập tốt!</i>\n⏰ <i>Quét lúc: ${nowVN.toLocaleTimeString('vi-VN')}</i>`,
    sessionInfo: `${sessionsToday.length} ca học`,
  };
}

export function buildPreClass60Message(params: {
  studentName: string;
  username: string;
  ses: ParsedClassSession;
}): string {
  const { studentName, username, ses } = params;
  return `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 1 TIẾNG)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n🔗 Link lớp học: <a href="${ses.onlineLink}">Bấm vào đây để vào học</a>` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Vui lòng chuẩn bị tài liệu và kiểm tra đường truyền/phòng học trước giờ bắt đầu!</i>`;
}

export function buildPreClass30Message(params: {
  studentName: string;
  username: string;
  ses: ParsedClassSession;
}): string {
  const { studentName, username, ses } = params;
  return `⏰ <b>NHẮC NHỞ: SẮP ĐẾN GIỜ VÀO LỚP HỌC (CÒN 30 PHÚT)!</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${studentName}</b> (<code>${username}</code>)\n📖 Môn học: <b>${ses.subjectName}</b> (<code>${ses.subjectCode}</code>)\n\n⏰ Bắt đầu lúc: <b>${ses.startTime}</b> (<i>${ses.periodStr}</i>)\n⏳ Thời gian: <b>${ses.startTime} - ${ses.endTime}</b>\n🚪 Phòng học: <b>${ses.room || 'Phòng học môn'}</b> ${ses.group ? `(Tổ: ${ses.group})` : ''}${ses.onlineLink ? `\n🔗 Link lớp học: <a href="${ses.onlineLink}">Bấm vào đây để vào học</a>` : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 <i>Hãy vào phòng học / Zoom / Teams đúng giờ nhé!</i>`;
}
