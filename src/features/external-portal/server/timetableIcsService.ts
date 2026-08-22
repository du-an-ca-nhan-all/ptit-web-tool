import { TimetableCalendarEvent, StudentTimetableCalendarResult } from './studentTimetableServerService';

/**
 * Chuẩn hóa chuỗi text theo chuẩn RFC 5545 iCalendar (Escape các ký tự đặc biệt)
 */
function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

/**
 * Format ngày và giờ thành định dạng iCalendar DTSTART / DTEND: YYYYMMDDTHHmmss
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "HH:mm" (ví dụ: "19:00")
 */
function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, ''); // 20260822
  const [hours, minutes] = timeStr.split(':');
  const cleanTime = `${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`; // 190000
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Format thời điểm hiện tại sang chuẩn UTC iCalendar: YYYYMMDDTHHmmssZ
 */
function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Tạo nội dung file iCalendar (.ics) chuẩn RFC 5545 từ kết quả lịch học sinh viên
 */
export function generateStudentTimetableIcs(
  username: string,
  timetableData: StudentTimetableCalendarResult,
  options?: {
    studentFullName?: string;
    alarmMinutesBefore?: number;
  }
): string {
  const normUsername = username.trim().toUpperCase();
  const studentName = options?.studentFullName || timetableData.username || normUsername;
  const alarmMinutes = options?.alarmMinutesBefore ?? 30; // Mặc định báo trước 30 phút
  const nowUtc = formatIcsUtc(new Date());

  const calName = `Lịch Học PTIT - ${normUsername}`;
  const calDesc = `Thời khóa biểu & Lịch học cá nhân của sinh viên ${studentName} (${normUsername}) đồng bộ tự động từ Cổng Đào Tạo PTIT.`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PTIT Web Tool//Student Timetable Sync//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText(calDesc)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    // VTIMEZONE ASIA/HO_CHI_MINH
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Ho_Chi_Minh',
    'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:+07',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  const events = timetableData.events || [];

  if (events.length === 0) {
    // Nếu chưa có buổi học nào, tạo 1 event thông báo
    const dtStart = formatIcsDateTime(new Date().toISOString().slice(0, 10), '08:00');
    const dtEnd = formatIcsDateTime(new Date().toISOString().slice(0, 10), '09:00');
    lines.push(
      'BEGIN:VEVENT',
      `UID:NO-EVENTS-${normUsername}@ptit.webtool`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
      `SUMMARY:${escapeIcsText(`[PTIT] Chưa có lịch học - ${normUsername}`)}`,
      `DESCRIPTION:${escapeIcsText('Hệ thống chưa ghi nhận lịch học hoặc bạn chưa liên kết Cổng Quản Lý Đào Tạo.')}`,
      'STATUS:TENTATIVE',
      'SEQUENCE:0',
      'END:VEVENT'
    );
  } else {
    events.forEach((ev) => {
      const dtStart = formatIcsDateTime(ev.date, ev.startTime || '07:00');
      const dtEnd = formatIcsDateTime(ev.date, ev.endTime || '09:00');
      
      // Tạo UID duy nhất, ổn định để Google Calendar không bị trùng lịch khi đồng bộ lại
      const safeSubjectCode = (ev.subjectCode || 'SUBJ').replace(/[^a-zA-Z0-9]/g, '');
      const safeDate = ev.date.replace(/-/g, '');
      const uid = `TKB-${normUsername}-${safeSubjectCode}-${safeDate}-P${ev.startPeriod || 1}@ptit.webtool`;

      const summary = `${ev.subjectName || 'Môn học'}${ev.group ? ` (${ev.group})` : ''}`;
      
      const descParts: string[] = [
        `📚 Môn học: ${ev.subjectName} (${ev.subjectCode})`,
        ev.group ? `👥 Lớp/Nhóm: ${ev.classCode || ''} - Nhóm ${ev.group}` : `👥 Lớp: ${ev.classCode || ''}`,
        `⏰ Tiết học: ${ev.periodStr || `Tiết ${ev.startPeriod}-${ev.endPeriod}`} (${ev.startTime} - ${ev.endTime})`,
        `📍 Phòng học: ${ev.room || 'Chưa xếp phòng'}`,
        ev.lecturer ? `👨‍🏫 Giảng viên: ${ev.lecturer}` : '',
        ev.onlineLink ? `🔗 Link trực tuyến: ${ev.onlineLink}` : '',
        `\n🔄 Tự động đồng bộ từ PTIT Web Tool (${normUsername})`,
      ].filter(Boolean);

      const location = ev.onlineLink ? `Trực tuyến: ${ev.onlineLink}` : (ev.room || 'PTIT');

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
        `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
        `LOCATION:${escapeIcsText(location)}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE'
      );

      // Báo thức nhắc nhở (VALARM)
      if (alarmMinutes > 0) {
        lines.push(
          'BEGIN:VALARM',
          `TRIGGER:-PT${alarmMinutes}M`,
          'ACTION:DISPLAY',
          `DESCRIPTION:${escapeIcsText(`Nhắc nhở lịch học: ${ev.subjectName} (${ev.startTime})`)}`,
          'END:VALARM'
        );
      }

      lines.push('END:VEVENT');
    });
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
