import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import {
  calculateTimetableProgress,
  deriveSubjectsProgress,
} from '@/src/features/external-portal/utils/timetableProgress';
import { TimetableSummary } from '../../types/dashboard.types';

type TimetableCalendarResult = Awaited<ReturnType<typeof getStudentTimetableCalendar>> | null;

export function buildTimetableSummary(
  timetableRes: TimetableCalendarResult,
  now: Date
): TimetableSummary {
  let timetableSummary: TimetableSummary = {
    hasData: false,
    semesterName: undefined,
    totalSubjects: 0,
    totalEvents: 0,
    completedEvents: 0,
    remainingEvents: 0,
    progressPercentage: 0,
    todayEvents: [],
    upcomingEvents: [],
    lastSyncAt: null,
  };

  if (timetableRes && timetableRes.success && Array.isArray(timetableRes.events) && timetableRes.events.length > 0) {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    const progress = calculateTimetableProgress(timetableRes.events, now);
    const subjectsProgressList = deriveSubjectsProgress(timetableRes.events, timetableRes.subjects, now);

    const subjectProgressMap = new Map<string, (typeof subjectsProgressList)[0]>();
    for (const item of subjectsProgressList) {
      subjectProgressMap.set(item.subjectCode, item);
    }

    // Tính số thứ tự buổi học cho từng môn
    const eventsBySubject = new Map<string, typeof timetableRes.events>();
    for (const ev of timetableRes.events) {
      const code = ev.subjectCode || 'UNKNOWN';
      if (!eventsBySubject.has(code)) eventsBySubject.set(code, []);
      eventsBySubject.get(code)!.push(ev);
    }
    const eventSessionMap = new Map<string, number>();
    eventsBySubject.forEach((evts) => {
      evts.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : a.startMinutes - b.startMinutes));
      evts.forEach((ev, idx) => eventSessionMap.set(ev.id, idx + 1));
    });

    const todayEvts = timetableRes.events
      .filter((e) => e.date === todayIso)
      .map((e) => {
        const subProg = subjectProgressMap.get(e.subjectCode);
        return {
          id: e.id,
          date: e.date,
          dayOfWeekStr: e.dayOfWeekStr,
          subjectName: e.subjectName,
          subjectCode: e.subjectCode,
          group: e.group,
          classCode: e.classCode,
          periodStr: e.periodStr,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room,
          onlineLink: e.onlineLink,
          lecturer: e.lecturer,
          shift: e.shift,
          isToday: true,
          sessionNumber: eventSessionMap.get(e.id),
          subjectProgress: subProg ? subProg.stats : undefined,
        };
      });

    const upcomingEvts = timetableRes.events
      .filter((e) => e.date > todayIso)
      .slice(0, 5)
      .map((e) => {
        const subProg = subjectProgressMap.get(e.subjectCode);
        return {
          id: e.id,
          date: e.date,
          dayOfWeekStr: e.dayOfWeekStr,
          subjectName: e.subjectName,
          subjectCode: e.subjectCode,
          group: e.group,
          classCode: e.classCode,
          periodStr: e.periodStr,
          startTime: e.startTime,
          endTime: e.endTime,
          room: e.room,
          onlineLink: e.onlineLink,
          lecturer: e.lecturer,
          shift: e.shift,
          isToday: false,
          sessionNumber: eventSessionMap.get(e.id),
          subjectProgress: subProg ? subProg.stats : undefined,
        };
      });

    timetableSummary = {
      hasData: true,
      semesterName: timetableRes.semesterName,
      totalSubjects: timetableRes.uniqueSubjectsCount,
      totalEvents: timetableRes.totalEvents,
      completedEvents: progress.completed,
      remainingEvents: progress.remaining,
      progressPercentage: progress.percentage,
      todayEvents: todayEvts,
      upcomingEvents: upcomingEvts,
      subjectsProgress: subjectsProgressList.map((s) => ({
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        group: s.group,
        total: s.stats.total,
        completed: s.stats.completed,
        remaining: s.stats.remaining,
        percentage: s.stats.percentage,
        isFinished: s.isFinished,
      })),
      lastSyncAt: timetableRes.lastSyncAt,
    };
  }

  return timetableSummary;
}
