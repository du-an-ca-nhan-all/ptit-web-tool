import type {
  TimetableCalendarEvent,
  TimetableSubjectSummary,
} from '../server/studentTimetableServerService';

export interface TimetableProgressStats {
  total: number;
  completed: number;
  remaining: number;
  percentage: number; // 0 -> 100%
}

export interface SubjectProgressItem {
  subjectCode: string;
  subjectName: string;
  group: string;
  classCode: string;
  room: string;
  colorIndex: number;
  stats: TimetableProgressStats;
  isFinished: boolean;
}

/**
 * Kiểm tra xem một ca học cụ thể đã kết thúc hay chưa.
 * So sánh dựa trên ngày và giờ kết thúc ca học theo giờ địa phương của người dùng.
 */
export function isEventCompleted(event: TimetableCalendarEvent, now: Date = new Date()): boolean {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayIso = `${y}-${m}-${d}`;

  // 1. Ngày trước hôm nay -> Chắc chắn đã học
  if (event.date < todayIso) return true;
  // 2. Ngày sau hôm nay -> Chắc chắn chưa học
  if (event.date > todayIso) return false;

  // 3. Trong cùng ngày hôm nay -> Tính theo phút kết thúc ca học
  let endMin = 0;
  if (event.endTime) {
    const match = String(event.endTime).match(/(\d+)[h:](\d+)/i);
    if (match) {
      endMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
  }

  if (!endMin) {
    if (event.startMinutes) {
      const soTiet =
        event.endPeriod && event.startPeriod
          ? Math.max(1, event.endPeriod - event.startPeriod + 1)
          : 3;
      endMin = event.startMinutes + soTiet * 50;
    } else {
      endMin = 21 * 60 + 50; // Mặc định ca tối tan 21:50
    }
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= endMin;
}

/**
 * Tính toán thống kê tiến độ học tập từ danh sách sự kiện thời khóa biểu.
 * Invariant: total = completed + remaining
 */
export function calculateTimetableProgress(
  events: TimetableCalendarEvent[],
  now: Date = new Date()
): TimetableProgressStats {
  // Lọc chỉ tính các ca học chính khóa, loại trừ các nhắc hẹn cá nhân được gắn vào lịch
  const classEvents = events.filter((ev) => !ev.rawSession?.isReminder);
  const total = classEvents.length;

  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      percentage: 0,
    };
  }

  let completed = 0;
  for (const ev of classEvents) {
    if (isEventCompleted(ev, now)) {
      completed++;
    }
  }

  const remaining = Math.max(0, total - completed);
  const percentage = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    remaining,
    percentage,
  };
}

/**
 * Tổng hợp tiến độ theo từng môn học trong kỳ.
 */
export function deriveSubjectsProgress(
  events: TimetableCalendarEvent[],
  subjects: TimetableSubjectSummary[] = [],
  now: Date = new Date()
): SubjectProgressItem[] {
  const classEvents = events.filter((ev) => !ev.rawSession?.isReminder);

  // Nhóm các ca học theo mã môn học
  const eventsBySubject = new Map<string, TimetableCalendarEvent[]>();
  for (const ev of classEvents) {
    const code = ev.subjectCode || 'UNKNOWN';
    if (!eventsBySubject.has(code)) {
      eventsBySubject.set(code, []);
    }
    eventsBySubject.get(code)!.push(ev);
  }

  const result: SubjectProgressItem[] = [];
  const seenCodes = new Set<string>();

  // 1. Duyệt qua danh sách subjects từ backend
  for (const sub of subjects) {
    const subEvents = eventsBySubject.get(sub.subjectCode) || [];
    const stats = calculateTimetableProgress(subEvents, now);
    seenCodes.add(sub.subjectCode);

    result.push({
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      group: sub.group,
      classCode: sub.classCode,
      room: sub.room,
      colorIndex: sub.colorIndex,
      stats,
      isFinished: stats.total > 0 && stats.remaining === 0,
    });
  }

  // 2. Dự phòng các môn học có sự kiện trong events nhưng chưa có trong subjects
  eventsBySubject.forEach((subEvents, code) => {
    if (!seenCodes.has(code)) {
      const first = subEvents[0];
      const stats = calculateTimetableProgress(subEvents, now);
      result.push({
        subjectCode: code,
        subjectName: first?.subjectName || code,
        group: first?.group || '',
        classCode: first?.classCode || '',
        room: first?.room || '',
        colorIndex: first?.colorIndex || 0,
        stats,
        isFinished: stats.total > 0 && stats.remaining === 0,
      });
    }
  });

  // Sắp xếp: Các môn còn buổi học lên trước, các môn đã học xong xuống sau, cùng loại xếp theo alphabet tên môn
  return result.sort((a, b) => {
    if (a.isFinished !== b.isFinished) {
      return a.isFinished ? 1 : -1;
    }
    return a.subjectName.localeCompare(b.subjectName, 'vi');
  });
}
