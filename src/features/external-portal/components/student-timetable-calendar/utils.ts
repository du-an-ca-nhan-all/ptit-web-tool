import {
  TimetableCalendarEvent,
  StudentTimetableCalendarResult,
} from '../../server/studentTimetableServerService';
import { WEEKDAYS } from './constants';
import { MonthGridDay, SessionNumberInfo, WeekGridDay } from './types';

export function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatSyncDateTime(isoString?: string | null): string {
  if (!isoString) return 'Chưa đồng bộ';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

export function getRelativeSyncTime(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 10) return 'vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export function buildAllTimetableEvents(
  data: StudentTimetableCalendarResult | null
): TimetableCalendarEvent[] {
  const classEvents = data?.events || [];
  const reminderEvents: TimetableCalendarEvent[] = (data?.reminders || []).map((rem) => {
    const d = new Date(rem.eventTime);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const jsDay = d.getDay();
    const dowMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    return {
      id: `reminder-${rem.id}`,
      date: isoDate,
      dayOfWeekStr: dowMap[jsDay],
      dayOfWeekNum: jsDay === 0 ? 8 : jsDay + 1,
      subjectName: `${rem.type === 'PERSONAL' ? '🔔' : '📚'} [Nhắc hẹn] ${rem.title}`,
      subjectCode: rem.maMon || (rem.type === 'PERSONAL' ? 'CÁ NHÂN' : 'MÔN HỌC'),
      group: rem.nhomTo || '',
      classCode: rem.lop || '',
      periodStr: 'Nhắc hẹn',
      startPeriod: 0,
      endPeriod: 0,
      startTime: timeStr,
      endTime: '',
      startMinutes: d.getHours() * 60 + d.getMinutes(),
      room: rem.location || (rem.type === 'PERSONAL' ? 'Lịch cá nhân' : (rem.tenMon || 'Môn học')),
      shift: d.getHours() >= 18 ? 'EVENING' : d.getHours() >= 12 ? 'AFTERNOON' : 'MORNING',
      colorIndex: rem.type === 'PERSONAL' ? 6 : 8,
      rawSession: { isReminder: true, reminder: rem },
    };
  });

  return [...classEvents, ...reminderEvents];
}

export function buildEventSessionNumberMap(
  classEventsOnly: TimetableCalendarEvent[]
): Map<string, SessionNumberInfo> {
  const map = new Map<string, SessionNumberInfo>();
  const eventsBySubject = new Map<string, TimetableCalendarEvent[]>();
  for (const ev of classEventsOnly) {
    const code = ev.subjectCode || 'UNKNOWN';
    if (!eventsBySubject.has(code)) eventsBySubject.set(code, []);
    eventsBySubject.get(code)!.push(ev);
  }
  eventsBySubject.forEach((evts) => {
    evts.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : a.startMinutes - b.startMinutes));
    evts.forEach((ev, idx) => {
      map.set(ev.id, { current: idx + 1, total: evts.length });
    });
  });
  return map;
}

export function buildMonthGridDays(
  currentDate: Date,
  selectedDay: string,
  eventsByDate: Map<string, TimetableCalendarEvent[]>
): MonthGridDay[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday-based offset (0 = Mon, 6 = Sun)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

  const days: MonthGridDay[] = [];

  // Preceding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const iso = formatIso(d);
    days.push({
      date: d,
      dateStr: iso,
      isCurrentMonth: false,
      isToday: iso === formatIso(new Date()),
      isSelected: iso === selectedDay,
      events: eventsByDate.get(iso) || [],
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const iso = formatIso(d);
    days.push({
      date: d,
      dateStr: iso,
      isCurrentMonth: true,
      isToday: iso === formatIso(new Date()),
      isSelected: iso === selectedDay,
      events: eventsByDate.get(iso) || [],
    });
  }

  // Trailing days to fill standard 35 or 42 cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const iso = formatIso(d);
    days.push({
      date: d,
      dateStr: iso,
      isCurrentMonth: false,
      isToday: iso === formatIso(new Date()),
      isSelected: iso === selectedDay,
      events: eventsByDate.get(iso) || [],
    });
  }

  return days;
}

export function buildWeekDays(
  currentDate: Date,
  eventsByDate: Map<string, TimetableCalendarEvent[]>
): WeekGridDay[] {
  const cur = new Date(currentDate);
  let dayOfWeek = cur.getDay() - 1;
  if (dayOfWeek === -1) dayOfWeek = 6;

  const monday = new Date(cur);
  monday.setDate(cur.getDate() - dayOfWeek);

  const days: WeekGridDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = formatIso(d);
    days.push({
      date: d,
      dateStr: iso,
      weekday: WEEKDAYS[i].label,
      dayNum: d.getDate(),
      isToday: iso === formatIso(new Date()),
      events: eventsByDate.get(iso) || [],
    });
  }
  return days;
}
