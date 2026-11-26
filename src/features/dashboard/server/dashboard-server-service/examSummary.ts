import { parseDateString } from '@/src/lib/date-utils';
import { DashboardData, NextExamCountdown } from '../../types/dashboard.types';

/**
 * Calculates time difference and exam status relative to now
 */
export function parseExamDateTime(ngayThi?: string | null, gioThi?: string | null): Date | null {
  if (!ngayThi) return null;
  const baseDate = parseDateString(ngayThi);
  if (!baseDate) return null;

  if (gioThi) {
    const match = gioThi.trim().match(/^(\d{1,2})[gGhH:](\d{1,2})/);
    if (match) {
      const h = Number(match[1]);
      const m = Number(match[2]);
      if (!isNaN(h) && !isNaN(m)) {
        baseDate.setHours(h, m, 0, 0);
        return baseDate;
      }
    }
  }

  baseDate.setHours(7, 30, 0, 0); // Default morning exam slot
  return baseDate;
}

export function buildExamSummaries(
  rawExams: any[],
  now: Date
): {
  nextExam: NextExamCountdown;
  upcomingExams: DashboardData['upcomingExams'];
} {
  // Parse & sort upcoming exams
  const parsedExamsList = rawExams.map((ex) => {
    const examDt = parseExamDateTime(ex.ngayThi, ex.gioThi);
    const diffMs = examDt ? examDt.getTime() - now.getTime() : -1;
    const isPassed = diffMs < 0;
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const daysLeft = Math.floor(diffSeconds / (24 * 3600));
    const hoursLeft = Math.floor((diffSeconds % (24 * 3600)) / 3600);
    const minutesLeft = Math.floor((diffSeconds % 3600) / 60);

    const isToday =
      examDt !== null &&
      examDt.getDate() === now.getDate() &&
      examDt.getMonth() === now.getMonth() &&
      examDt.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      examDt !== null &&
      examDt.getDate() === tomorrow.getDate() &&
      examDt.getMonth() === tomorrow.getMonth() &&
      examDt.getFullYear() === tomorrow.getFullYear();

    return {
      id: ex.id,
      subjectCode: ex.maMH || '',
      subjectName: ex.tenMH || 'Môn thi chưa rõ',
      examDate: ex.ngayThi || '',
      examTime: ex.gioThi || '',
      room: ex.mapThi || 'Chưa xếp phòng',
      examGroup: ex.nhomHoc || ex.toThi || '',
      examFormat: ex.maHTThi || '',
      studentGroup: ex.nhomThi || '',
      isPostponed: Boolean(ex.isPostponed),
      batchName: ex.examBatch?.name || ex.tenDotThi || '',
      examDateTime: examDt,
      diffMs,
      daysLeft,
      hoursLeft,
      minutesLeft,
      isToday,
      isTomorrow,
      isPassed,
      isoDateTime: examDt ? examDt.toISOString() : undefined,
    };
  });

  // Filter future non-passed exams, prioritize non-postponed
  const futureExams = parsedExamsList
    .filter((e) => !e.isPassed)
    .sort((a, b) => {
      if (a.isPostponed !== b.isPostponed) {
        return a.isPostponed ? 1 : -1;
      }
      return (a.examDateTime?.getTime() || 0) - (b.examDateTime?.getTime() || 0);
    });

  const nextExamItem = futureExams[0];

  const nextExam: NextExamCountdown = {
    hasExam: Boolean(nextExamItem),
    exam: nextExamItem,
    totalUpcomingExams: futureExams.length,
  };

  const upcomingExams = futureExams.map((e) => ({
    id: e.id,
    subjectCode: e.subjectCode,
    subjectName: e.subjectName,
    examDate: e.examDate,
    examTime: e.examTime,
    room: e.room,
    examGroup: e.examGroup,
    examFormat: e.examFormat,
    studentGroup: e.studentGroup,
    isPostponed: e.isPostponed,
  }));

  return { nextExam, upcomingExams };
}
