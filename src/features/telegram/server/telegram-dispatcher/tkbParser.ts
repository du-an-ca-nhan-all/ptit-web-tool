import { PERIOD_TIMES } from './constants';
import type { ParsedTkbSegment } from './types';

export function parseTkbDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // 1. Dạng ISO: YYYY-MM-DDTHH:mm:ss hoặc YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.slice(0, 10).split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d);
    }
  }

  // 2. Dạng phân cách / hoặc - (DD/MM/YYYY hoặc YYYY/MM/DD)
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map(Number);
    if (parts[0].length === 4) {
      [y, m, d] = [parts[0], parts[1], parts[2]].map(Number);
    }
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }
  return null;
}

export function parseTkbString(tkbStr: string): Array<ParsedTkbSegment> {
  if (!tkbStr) return [];
  const rawSegments = tkbStr.split(/<hr\s*\/?>|\n|;/i).map((s) => s.trim()).filter(Boolean);
  const results: ParsedTkbSegment[] = [];

  for (const seg of rawSegments) {
    const parts = seg.split(',').map((p) => p.trim());
    if (parts.length < 4) continue;

    const dayOfWeekStr = parts[0];
    const periodStr = parts[1];
    const roomStr = parts[2];
    const dateRangeStr = parts.slice(3).join(',');

    let dayOfWeekNum = -1;
    const matchDow = dayOfWeekStr.match(/Thứ\s*(\d)|CN|Chủ\s*nhật/i);
    if (matchDow) {
      if (matchDow[1]) {
        dayOfWeekNum = parseInt(matchDow[1], 10);
      } else {
        dayOfWeekNum = 8;
      }
    }

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (dateRangeStr.includes('đến')) {
      const [startStr, endStr] = dateRangeStr.split('đến').map((s) => s.trim());
      startDate = parseTkbDate(startStr);
      endDate = parseTkbDate(endStr);
    } else {
      startDate = parseTkbDate(dateRangeStr);
      endDate = startDate;
    }

    if (!startDate || !endDate) continue;

    let startPeriod = 13;
    let endPeriod = 15;
    const matchPeriod = periodStr.match(/(\d+)(?:\s*->\s*|\s*-\s*)(\d+)?/);
    if (matchPeriod) {
      startPeriod = parseInt(matchPeriod[1], 10);
      endPeriod = matchPeriod[2] ? parseInt(matchPeriod[2], 10) : startPeriod;
    }

    const startTime = PERIOD_TIMES[startPeriod]?.start || '19:00';
    const endTime = PERIOD_TIMES[endPeriod]?.end || '21:50';
    const startMinutes = PERIOD_TIMES[startPeriod]?.startMin || 19 * 60;

    results.push({
      raw: seg,
      dayOfWeekStr,
      dayOfWeekNum,
      periodStr,
      startPeriod,
      endPeriod,
      startTime,
      endTime,
      startMinutes,
      room: roomStr.replace(/^Ph\s*/i, '').trim(),
      startDate,
      endDate,
    });
  }

  return results;
}

export function isSessionOnDate(
  session: { dayOfWeekNum: number; startDate: Date; endDate: Date },
  dateObj: Date
): boolean {
  const jsDay = dateObj.getDay();
  const dow = jsDay === 0 ? 8 : jsDay + 1;
  if (session.dayOfWeekNum !== dow) return false;

  const y = dateObj.getFullYear();
  const m = dateObj.getMonth();
  const d = dateObj.getDate();
  const targetTime = new Date(y, m, d).getTime();

  const start = new Date(session.startDate.getFullYear(), session.startDate.getMonth(), session.startDate.getDate()).getTime();
  const end = new Date(session.endDate.getFullYear(), session.endDate.getMonth(), session.endDate.getDate()).getTime();

  return targetTime >= start && targetTime <= end;
}
