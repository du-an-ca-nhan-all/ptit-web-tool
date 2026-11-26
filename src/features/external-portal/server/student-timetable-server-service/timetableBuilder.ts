import { parseTkbDate, parseTkbString } from '@/src/features/telegram/server/telegramDispatcher';
import { DOW_MAP } from './constants';
import type {
  BuilderContext,
  BuildTimetableResultParams,
  NormalizedSubjectFields,
  ProcessTkbStringItemParams,
  StudentTimetableCalendarResult,
  TimetableCalendarEvent,
  TimetableSubjectSummary,
} from './types';
export type { BuildTimetableResultParams, ProcessTkbStringItemParams } from './types';
import {
  extractSubjectFields,
  formatIsoDate,
  formatSemesterName,
  getShift,
  parseDayOfWeekNum,
  parsePeriodAndTime,
} from './utils';

function processTkbStringItem(params: ProcessTkbStringItemParams): void {
  const { item, tkbStr, fields, ctx } = params;
  const { subjectName, subjectCode, group, classCode, room, onlineLink, lecturer, colorIndex } =
    fields;
  const parsedSegments = parseTkbString(tkbStr);

  for (const seg of parsedSegments) {
    if (!seg.startDate || !seg.endDate) continue;

    // Cập nhật subject summary
    if (!ctx.subjectMap.has(subjectCode)) {
      ctx.subjectMap.set(subjectCode, {
        subjectCode,
        subjectName,
        group,
        classCode,
        room: seg.room || room,
        totalSessions: 0,
        startDate: formatIsoDate(seg.startDate),
        endDate: formatIsoDate(seg.endDate),
        dayOfWeekStr: seg.dayOfWeekStr,
        periodStr: seg.periodStr,
        colorIndex,
      });
    }

    // Tạo sự kiện cho từng ngày trong khoảng [startDate, endDate]
    const curDate = new Date(seg.startDate.getTime());
    const endDateObj = new Date(seg.endDate.getTime());

    while (curDate <= endDateObj) {
      const jsDay = curDate.getDay();
      const curDow = jsDay === 0 ? 8 : jsDay + 1;

      if (curDow === seg.dayOfWeekNum) {
        const dateStr = formatIsoDate(curDate);
        const eventKey = `${subjectCode}_${dateStr}_${seg.startPeriod}_${seg.room}`;

        if (!ctx.seenEventKeys.has(eventKey)) {
          ctx.seenEventKeys.add(eventKey);
          const ev: TimetableCalendarEvent = {
            id: `ev_${dateStr}_${subjectCode}_${seg.startPeriod}_${Math.random().toString(36).slice(2, 6)}`,
            date: dateStr,
            dayOfWeekStr: seg.dayOfWeekStr,
            dayOfWeekNum: seg.dayOfWeekNum,
            subjectName,
            subjectCode,
            group,
            classCode,
            periodStr: seg.periodStr,
            startPeriod: seg.startPeriod,
            endPeriod: seg.endPeriod,
            startTime: seg.startTime,
            endTime: seg.endTime,
            startMinutes: seg.startMinutes,
            room: seg.room || room,
            onlineLink: onlineLink || undefined,
            lecturer: lecturer || undefined,
            shift: getShift(seg.startPeriod, seg.startMinutes),
            colorIndex,
            rawSession: item,
          };
          ctx.events.push(ev);

          const subRec = ctx.subjectMap.get(subjectCode);
          if (subRec) subRec.totalSessions++;
        }
      }

      curDate.setDate(curDate.getDate() + 1);
    }
  }
}

function processDirectJsonItem(
  item: any,
  fields: NormalizedSubjectFields,
  ctx: BuilderContext
): void {
  const { subjectName, subjectCode, group, classCode, room, onlineLink, lecturer, colorIndex } =
    fields;

  let itemDate: Date | null = null;
  const rawDateStr = item.ngay_hoc || item.ngay_hoc_chuan || item.ngay_day || item.date;
  if (rawDateStr) {
    itemDate = parseTkbDate(String(rawDateStr));
  }

  const startRangeStr = item.tu_ngay || item.ngay_bat_dau || item.tuan_tu_ngay;
  const endRangeStr = item.den_ngay || item.ngay_ket_thuc || item.tuan_den_ngay;
  const startDate = startRangeStr ? parseTkbDate(String(startRangeStr)) : null;
  const endDate = endRangeStr ? parseTkbDate(String(endRangeStr)) : null;

  const dayOfWeekNum = parseDayOfWeekNum(item.thu_kieu_so ?? item.thu ?? item.day_of_week);
  const { startPeriod, endPeriod, startTime, endTime, startMinutes, periodStr } =
    parsePeriodAndTime(item);
  const dayOfWeekStr = item.thu_chu || DOW_MAP[dayOfWeekNum] || `Thứ ${dayOfWeekNum}`;

  const createEvent = (dateStr: string): TimetableCalendarEvent => ({
    id: `ev_${dateStr}_${subjectCode}_${startPeriod}_${Math.random().toString(36).slice(2, 6)}`,
    date: dateStr,
    dayOfWeekStr,
    dayOfWeekNum,
    subjectName,
    subjectCode,
    group,
    classCode,
    periodStr,
    startPeriod,
    endPeriod,
    startTime,
    endTime,
    startMinutes,
    room,
    onlineLink: onlineLink || undefined,
    lecturer: lecturer || undefined,
    shift: getShift(startPeriod, startMinutes),
    colorIndex,
    rawSession: item,
  });

  // Nếu có ngày học cụ thể
  if (itemDate) {
    const dateStr = formatIsoDate(itemDate);
    const eventKey = `${subjectCode}_${dateStr}_${startPeriod}_${room}`;

    if (!ctx.seenEventKeys.has(eventKey)) {
      ctx.seenEventKeys.add(eventKey);
      ctx.events.push(createEvent(dateStr));

      if (!ctx.subjectMap.has(subjectCode)) {
        ctx.subjectMap.set(subjectCode, {
          subjectCode,
          subjectName,
          group,
          classCode,
          room,
          totalSessions: 1,
          startDate: dateStr,
          endDate: dateStr,
          dayOfWeekStr,
          periodStr,
          colorIndex,
        });
      } else {
        ctx.subjectMap.get(subjectCode)!.totalSessions++;
      }
    }
  } else if (startDate && endDate) {
    // Lặp qua khoảng ngày
    const curDate = new Date(startDate.getTime());
    const endDateObj = new Date(endDate.getTime());

    if (!ctx.subjectMap.has(subjectCode)) {
      ctx.subjectMap.set(subjectCode, {
        subjectCode,
        subjectName,
        group,
        classCode,
        room,
        totalSessions: 0,
        startDate: formatIsoDate(startDate),
        endDate: formatIsoDate(endDate),
        dayOfWeekStr,
        periodStr,
        colorIndex,
      });
    }

    while (curDate <= endDateObj) {
      const jsDay = curDate.getDay();
      const curDow = jsDay === 0 ? 8 : jsDay + 1;

      if (curDow === dayOfWeekNum) {
        const dateStr = formatIsoDate(curDate);
        const eventKey = `${subjectCode}_${dateStr}_${startPeriod}_${room}`;

        if (!ctx.seenEventKeys.has(eventKey)) {
          ctx.seenEventKeys.add(eventKey);
          ctx.events.push(createEvent(dateStr));
          ctx.subjectMap.get(subjectCode)!.totalSessions++;
        }
      }

      curDate.setDate(curDate.getDate() + 1);
    }
  }
}

/**
 * Xây dựng đối tượng kết quả Thời Khóa Biểu từ danh sách rawList
 */
export function buildTimetableResultFromRawData(
  params: BuildTimetableResultParams
): StudentTimetableCalendarResult {
  const { cleanUsername, rawList, currentSemester, options } = params;
  const ctx: BuilderContext = {
    events: [],
    subjectMap: new Map<string, TimetableSubjectSummary>(),
    seenEventKeys: new Set<string>(),
  };
  const colorMap = new Map<string, number>();

  for (const item of rawList) {
    const fields = extractSubjectFields(item, colorMap);

    // XỬ LÝ 1: Chuỗi tkb trong to_hoc.tkb hoặc item.tkb (VD: "Thứ 2 (tiết 13->15) từ 02/03/2026 đến 18/05/2026 Ph.Online")
    const tkbStr = item.tkb || item.to_hoc?.tkb;
    if (tkbStr && typeof tkbStr === 'string') {
      processTkbStringItem({ item, tkbStr, fields, ctx });
    } else {
      // XỬ LÝ 2: Item dạng đối tượng JSON trực tiếp (có ngay_hoc hoặc tuan_tu_ngay)
      processDirectJsonItem(item, fields, ctx);
    }
  }

  // Sắp xếp các sự kiện theo ngày và giờ bắt đầu
  ctx.events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startMinutes - b.startMinutes;
  });

  // Lọc các ca học sắp diễn ra (từ ngày hôm nay)
  const todayStr = formatIsoDate(new Date());
  const upcomingEvents = ctx.events.filter((e) => e.date >= todayStr).slice(0, 20);

  const subjects = Array.from(ctx.subjectMap.values()).sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName)
  );
  const calculatedCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  const calculatedTuitionFee = subjects.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);

  const semesterName = options.semesterName || formatSemesterName(currentSemester);

  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName,
    isConfigured: options.isConfigured,
    hasLinkedAccount: options.isConfigured,
    isLiveSync: options.isLiveSync,
    isCachedDb: options.isCachedDb,
    lastSyncAt: options.lastSyncAt,
    totalCredits: calculatedCredits,
    tuitionFee: calculatedTuitionFee,
    totalEvents: ctx.events.length,
    uniqueSubjectsCount: subjects.length,
    subjects,
    events: ctx.events,
    upcomingEvents,
  };
}
