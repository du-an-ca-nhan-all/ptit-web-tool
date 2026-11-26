import { AUTH_ERROR_KEYWORDS, PERIOD_TIMES } from './constants';
import type { NormalizedSubjectFields } from './types';

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatSemesterName(semesterId: number): string {
  return `Học kỳ ${String(semesterId).slice(-1)} Năm học ${String(semesterId).slice(0, 4)}`;
}

export function getShift(
  startPeriod: number,
  startMinutes: number
): 'MORNING' | 'AFTERNOON' | 'EVENING' {
  if (startPeriod >= 13 || startMinutes >= 18 * 60) return 'EVENING';
  if (startPeriod >= 7 || startMinutes >= 12 * 60) return 'AFTERNOON';
  return 'MORNING';
}

export function getColorIndexForSubject(
  subjectCode: string,
  colorMap: Map<string, number>
): number {
  if (!colorMap.has(subjectCode)) {
    const nextIdx = colorMap.size % 9;
    colorMap.set(subjectCode, nextIdx);
  }
  return colorMap.get(subjectCode)!;
}

export function extractSubjectFields(
  item: any,
  colorMap: Map<string, number>
): NormalizedSubjectFields {
  const subjectName =
    item.ten_mon ||
    item.ten_mon_hoc ||
    item.ten_hp ||
    item.to_hoc?.ten_mon ||
    item.to_hoc?.ten_mon_hoc ||
    'Môn học';

  const subjectCode = (
    item.ma_mon ||
    item.ma_mon_hoc ||
    item.ma_hp ||
    item.to_hoc?.ma_mon ||
    item.to_hoc?.ma_mon_hoc ||
    'MH'
  ).toUpperCase();

  const group =
    item.ma_nhom ||
    item.nhom_to ||
    item.nhom ||
    item.nhom_hoc ||
    item.to_hoc?.nhom_to ||
    item.to_hoc?.nhom ||
    '01';

  const classCode =
    item.ten_lop ||
    item.lop ||
    item.ma_lop ||
    item.ma_lop_tc ||
    item.to_hoc?.lop ||
    '';

  const room = (
    item.phong ||
    item.ten_phong ||
    item.ma_phong ||
    item.phong_hoc ||
    item.to_hoc?.phong ||
    'Phòng học môn'
  )
    .toString()
    .replace(/^Ph\s*/i, '')
    .trim();

  const onlineLink =
    item.link_hoc_online || item.online_link || item.link_zoom || item.zoom_link || '';
  const lecturer = item.giang_vien || item.ten_giang_vien || item.gv || '';
  const colorIndex = getColorIndexForSubject(subjectCode, colorMap);

  return {
    subjectName,
    subjectCode,
    group,
    classCode,
    room,
    onlineLink,
    lecturer,
    colorIndex,
  };
}

export function parseDayOfWeekNum(rawThu: unknown): number {
  let dayOfWeekNum = 2;
  if (rawThu !== undefined && rawThu !== null) {
    const thuStr = String(rawThu).trim();
    if (
      thuStr === '8' ||
      thuStr.toLowerCase().includes('cn') ||
      thuStr.toLowerCase().includes('chủ')
    ) {
      dayOfWeekNum = 8;
    } else {
      const parsedNum = parseInt(thuStr.replace(/\D/g, ''), 10);
      if (parsedNum >= 2 && parsedNum <= 8) dayOfWeekNum = parsedNum;
      else if (parsedNum === 1) dayOfWeekNum = 8;
    }
  }
  return dayOfWeekNum;
}

export function parsePeriodAndTime(item: any): {
  startPeriod: number;
  endPeriod: number;
  startTime: string;
  endTime: string;
  startMinutes: number;
  periodStr: string;
} {
  const startPeriod =
    Number(item.tiet_bat_dau ?? item.tiet_bd ?? item.tiet_dau ?? item.start_period) || 13;
  let endPeriod = Number(item.tiet_ket_thuc ?? item.tiet_kt ?? item.end_period);
  if (!endPeriod || isNaN(endPeriod)) {
    const soTiet = Number(item.so_tiet) || 3;
    endPeriod = startPeriod + soTiet - 1;
  }

  const startTime = item.gio_bat_dau || item.gio_bd || PERIOD_TIMES[startPeriod]?.start || '19:00';
  const endTime = item.gio_ket_thuc || item.gio_kt || PERIOD_TIMES[endPeriod]?.end || '21:50';
  let startMinutes = PERIOD_TIMES[startPeriod]?.startMin || 19 * 60;
  if (item.gio_bat_dau || item.gio_bd) {
    const tm = String(item.gio_bat_dau || item.gio_bd).match(/(\d+)[h:](\d+)/i);
    if (tm) {
      startMinutes = parseInt(tm[1], 10) * 60 + parseInt(tm[2], 10);
    }
  }

  const periodStr = item.tiet_hoc || item.periodStr || `Tiết ${startPeriod}->${endPeriod}`;

  return { startPeriod, endPeriod, startTime, endTime, startMinutes, periodStr };
}

export function isQldttxAuthError(errMsg: string): boolean {
  return AUTH_ERROR_KEYWORDS.some((keyword) => errMsg.includes(keyword));
}

export function extractRawListFromCachedRecord(parsed: any): any[] {
  return (
    parsed?.rawList ||
    parsed?.data?.ds_thoi_khoa_bieu ||
    parsed?.data?.ds_tkb_tuan ||
    parsed?.data?.ds_kqdkmh ||
    parsed?.ds_kqdkmh ||
    (Array.isArray(parsed) ? parsed : []) ||
    []
  );
}

export function extractRawListFromCourseRegistration(parsed: any): any[] {
  return (
    parsed?.data?.ds_thoi_khoa_bieu ||
    parsed?.data?.ds_tkb_tuan ||
    parsed?.data?.ds_kqdkmh ||
    parsed?.ds_kqdkmh ||
    parsed?.data ||
    []
  );
}
