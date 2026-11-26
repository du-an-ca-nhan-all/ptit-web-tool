import { escapeTelegramHtml } from '@/src/features/external-portal/server/slinkServerService';
import type {
  CreatedReminderMessageParams,
  PendingAlertMessageParams,
} from './types';

/**
 * Định dạng thời gian theo chuẩn Việt Nam (HH:mm - DD/MM/YYYY)
 */
export function formatDateTimeVN(date: Date): string {
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
 * Chuẩn hóa và format địa điểm / đường dẫn học online cho tin nhắn Telegram HTML.
 * Nếu là URL (hoặc chứa URL như Meet, Zoom, Teams...), sẽ được convert thành thẻ <a href="...">
 * để người dùng có thể bấm trực tiếp trên ứng dụng Telegram (thay vì thẻ <code> không bấm được).
 */
export function formatTelegramLocation(location?: string | null, isCourse = false): string {
  if (!location || !location.trim()) return '';
  const trimmed = location.trim();
  const label = isCourse ? '🏛️ Phòng / Link:' : '🏛️ Địa điểm / Link:';

  // 1. Toàn bộ chuỗi là URL bắt đầu bằng http:// hoặc https://
  if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
    return `${label} <a href="${escapeTelegramHtml(trimmed)}">${escapeTelegramHtml(trimmed)}</a>\n`;
  }

  // 2. URL bắt đầu bằng domain phổ biến (meet.google.com, zoom.us, teams.microsoft.com, ...)
  if (/^(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com|[a-zA-Z0-9-]+\.(?:edu|com|org|net|vn|io|app|me|gg|link)\b)[^\s]*$/i.test(trimmed)) {
    const fullUrl = `https://${trimmed}`;
    return `${label} <a href="${escapeTelegramHtml(fullUrl)}">${escapeTelegramHtml(trimmed)}</a>\n`;
  }

  // 3. Chuỗi chứa URL đan xen văn bản
  const urlRegex = /(https?:\/\/[^\s<>"]+|(?:\b(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com)[^\s<>"]+))/gi;
  if (urlRegex.test(trimmed)) {
    urlRegex.lastIndex = 0;
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(trimmed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeTelegramHtml(trimmed.slice(lastIndex, match.index)));
      }
      const rawUrl = match[0];
      const href = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;
      parts.push(`<a href="${escapeTelegramHtml(href)}">${escapeTelegramHtml(rawUrl)}</a>`);
      lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < trimmed.length) {
      parts.push(escapeTelegramHtml(trimmed.slice(lastIndex)));
    }

    return `${label} ${parts.join('')}\n`;
  }

  // 4. Địa điểm thông thường (ví dụ: Phòng 301 - A2)
  return `${label} <b>${escapeTelegramHtml(trimmed)}</b>\n`;
}

/**
 * Format dặn dò / ghi chú chi tiết cho tin nhắn Telegram HTML.
 * Giữ nguyên định dạng xuống dòng, escape HTML và tự động biến các liên kết thành thẻ <a href="..."> có thể click được.
 */
export function formatTelegramDescription(description?: string | null, prefix = '📝 Chi tiết:'): string {
  if (!description || !description.trim()) return '';
  const trimmed = description.trim();

  const urlRegex = /(https?:\/\/[^\s<>"]+|(?:\b(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com|drive\.google\.com|docs\.google\.com|github\.com)[^\s<>"]+))/gi;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(trimmed)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeTelegramHtml(trimmed.slice(lastIndex, match.index)));
    }
    const rawUrl = match[0];
    const href = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;
    parts.push(`<a href="${escapeTelegramHtml(href)}">${escapeTelegramHtml(rawUrl)}</a>`);
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < trimmed.length) {
    parts.push(escapeTelegramHtml(trimmed.slice(lastIndex)));
  }

  const content = parts.length > 0 ? parts.join('') : escapeTelegramHtml(trimmed);
  return `${prefix} <i>${content}</i>\n`;
}

/**
 * Xây dựng nội dung tin nhắn HTML Telegram cho mốc nhắc hẹn đến giờ
 */
export function buildPendingAlertMessageHtml({
  reminder,
  studentName,
  username,
  creatorName,
  formattedEventTime,
  reminderOffsetLabel,
}: PendingAlertMessageParams): string {
  const isPersonal = reminder.type === 'PERSONAL';

  if (isPersonal) {
    return `🔔 <b>[NHẮC HẸN CÁ NHÂN] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(username)}</code>)\n📌 Tiêu đề: <b>${escapeTelegramHtml(reminder.title)}</b>\n\n🗓️ Thời gian diễn ra: <b>${formattedEventTime}</b>\n⏰ Mốc báo: <b>${escapeTelegramHtml(reminderOffsetLabel)}</b>\n${formatTelegramLocation(reminder.location, false)}${formatTelegramDescription(reminder.description, '📝 Nội dung:')}━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Gửi tự động lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
  }

  // Nhắc hẹn môn học / tổ / lớp
  const subjectHeader = reminder.tenMon
    ? `${reminder.tenMon} (${reminder.maMon || ''})`
    : reminder.maMon || 'Môn học';

  return `📚 <b>[NHẮC HẸN MÔN HỌC] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(username)}</code>)\n📖 Môn: <b>${escapeTelegramHtml(subjectHeader)}</b>\n${reminder.nhomTo ? `🏷️ Nhóm/Tổ: <b>${escapeTelegramHtml(reminder.nhomTo)}</b>` : ''}${reminder.lop ? ` | Lớp: <b>${escapeTelegramHtml(reminder.lop)}</b>` : ''}\n${reminder.giangVien ? `👨‍🏫 Giảng viên: <b>${escapeTelegramHtml(reminder.giangVien)}</b>\n` : '\n'}📌 Nội dung nhắc: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời điểm: <b>${formattedEventTime}</b>\n⏰ Mốc báo: <b>${escapeTelegramHtml(reminderOffsetLabel)}</b>\n${formatTelegramLocation(reminder.location, true)}${formatTelegramDescription(reminder.description, '📝 Chi tiết:')}━━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Người tạo nhắc hẹn: <b>${escapeTelegramHtml(creatorName)}</b> (<code>${escapeTelegramHtml(reminder.creatorUsername)}</code>)\n💡 <i>Nhắc hẹn này được chia sẻ tự động đến tất cả bạn học cùng môn/tổ/lớp.</i>\n⏰ <i>Gửi lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
}

/**
 * Xây dựng nội dung tin nhắn HTML Telegram khi vừa tạo nhắc hẹn mới
 */
export function buildCreatedReminderMessageHtml({
  reminder,
  studentName,
  username,
  creatorName,
  formattedEventTime,
  offsetLabels,
}: CreatedReminderMessageParams): string {
  const isPersonal = reminder.type === 'PERSONAL';

  if (isPersonal) {
    return `🔔 <b>[ĐÃ TẠO NHẮC HẸN CÁ NHÂN] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Sinh viên: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(username)}</code>)\n📌 Tiêu đề: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời gian hẹn: <b>${formattedEventTime}</b>\n${formatTelegramLocation(reminder.location, false)}${formatTelegramDescription(reminder.description, '📝 Ghi chú:')}⏰ Các mốc sẽ báo trước: <b>${escapeTelegramHtml(offsetLabels || 'Đúng giờ')}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 <i>Lịch nhắc hẹn đã được lưu vào lịch cá nhân của bạn trên PTIT Web Tool. Hệ thống sẽ tiếp tục thông báo Telegram khi đến các mốc báo trước đã chọn.</i>\n⏰ <i>Tạo lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
  }

  const subjectHeader = reminder.tenMon
    ? `${reminder.tenMon} (${reminder.maMon || ''})`
    : reminder.maMon || 'Môn học';

  return `📢 <b>[LỊCH NHẮC HẸN MÔN HỌC MỚI ĐÃ ĐƯỢC TẠO] PTIT EDUSYNC</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Người nhận: <b>${escapeTelegramHtml(studentName)}</b> (<code>${escapeTelegramHtml(username)}</code>)\n📖 Môn học: <b>${escapeTelegramHtml(subjectHeader)}</b>\n${reminder.nhomTo ? `🏷️ Nhóm/Tổ: <b>${escapeTelegramHtml(reminder.nhomTo)}</b>` : ''}${reminder.lop ? ` | Lớp: <b>${escapeTelegramHtml(reminder.lop)}</b>` : ''}\n${reminder.giangVien ? `👨‍🏫 Giảng viên: <b>${escapeTelegramHtml(reminder.giangVien)}</b>\n` : '\n'}📌 Tiêu đề nhắc hẹn: <b>${escapeTelegramHtml(reminder.title)}</b>\n🗓️ Thời điểm diễn ra: <b>${formattedEventTime}</b>\n${formatTelegramLocation(reminder.location, true)}${formatTelegramDescription(reminder.description, '📝 Chi tiết:')}⏰ Các mốc sẽ nhắc trước: <b>${escapeTelegramHtml(offsetLabels || 'Đúng giờ')}</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Người tạo: <b>${escapeTelegramHtml(creatorName)}</b> (<code>${escapeTelegramHtml(reminder.creatorUsername)}</code>)\n💡 <i>Lịch nhắc hẹn này đã được tự động thêm vào lịch học & thời khóa biểu của bạn trên PTIT Web Tool. Hệ thống sẽ tự động gửi thông báo Telegram đến các bạn cùng lớp theo các mốc đã cài đặt.</i>\n⏰ <i>Tạo lúc: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</i>`;
}
