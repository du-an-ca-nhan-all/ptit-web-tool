import { parseDateString } from '@/src/lib/date-utils';
import type {
  AnalyzedExamRoom,
  AnalyzedStudentRecord,
  ExamDateTimeSortOrder,
  RoomAnalysisRecord,
  RoomCountOperator,
  SplitRoomStatus,
} from './types';

export function normalizeStr(val?: string | null): string {
  return String(val || '').trim().toUpperCase();
}

export interface BuildRoomKeyParams {
  maMH: string;
  mapThi: string;
  ngayThi: string;
  gioThi: string;
}

export function buildRoomKey({ maMH, mapThi, ngayThi, gioThi }: BuildRoomKeyParams): string {
  return [normalizeStr(maMH), normalizeStr(mapThi), String(ngayThi || '').trim(), String(gioThi || '').trim()].join(
    '|'
  );
}

export function getExamTimestamp(ngayThi: string, gioThi: string): number {
  const dateStr = String(ngayThi || '').trim();
  if (!dateStr) return 0;

  const baseDate = parseDateString(dateStr);
  if (!baseDate) {
    const combined = parseDateString(`${dateStr} ${gioThi || ''}`.trim());
    return combined ? combined.getTime() : 0;
  }

  const timeStr = String(gioThi || '').trim();
  if (timeStr) {
    const hhmmMatch = timeStr.match(/(\d{1,2})\s*[gGhH:]\s*(\d{1,2})(?::(\d{1,2}))?/);
    if (hhmmMatch) {
      const hours = Number(hhmmMatch[1]);
      const minutes = Number(hhmmMatch[2]);
      const seconds = hhmmMatch[3] !== undefined ? Number(hhmmMatch[3]) : 0;
      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
        baseDate.setHours(hours, minutes, seconds, 0);
        return baseDate.getTime();
      }
    } else {
      const hourOnlyMatch = timeStr.match(/(\d{1,2})\s*[gGhH]\b/);
      if (hourOnlyMatch) {
        const hours = Number(hourOnlyMatch[1]);
        if (!isNaN(hours)) {
          baseDate.setHours(hours, 0, 0, 0);
          return baseDate.getTime();
        }
      }
    }
  }

  return baseDate.getTime();
}

export function compareExamDateTime(
  a: { ngayThi: string; gioThi: string },
  b: { ngayThi: string; gioThi: string },
  order: ExamDateTimeSortOrder = 'DATE_ASC'
): number {
  const tA = getExamTimestamp(a.ngayThi, a.gioThi);
  const tB = getExamTimestamp(b.ngayThi, b.gioThi);
  if (tA === tB) return 0;
  if (tA === 0) return 1;
  if (tB === 0) return -1;
  return order === 'DATE_ASC' ? tA - tB : tB - tA;
}

const SPLIT_STATUS_ORDER: Record<SplitRoomStatus, number> = {
  SPLIT_SAME_GROUP: 0,
  SPLIT_DIFF_GROUP: 1,
  SAME_ROOM: 2,
  NO_MONITOR_EXAM: 3,
};

export function sortAnalyzedRecords(
  records: AnalyzedStudentRecord[],
  order: ExamDateTimeSortOrder = 'DATE_ASC'
): AnalyzedStudentRecord[] {
  return [...records].sort((a, b) => {
    const timeCmp = compareExamDateTime(a, b, order);
    if (timeCmp !== 0) return timeCmp;
    const mhCmp = a.maMH.localeCompare(b.maMH);
    if (mhCmp !== 0) return mhCmp;
    if (SPLIT_STATUS_ORDER[a.splitStatus] !== SPLIT_STATUS_ORDER[b.splitStatus]) {
      return SPLIT_STATUS_ORDER[a.splitStatus] - SPLIT_STATUS_ORDER[b.splitStatus];
    }
    const rCmp = a.mapThi.localeCompare(b.mapThi);
    if (rCmp !== 0) return rCmp;
    const tenCmp = a.ten.localeCompare(b.ten, 'vi');
    if (tenCmp !== 0) return tenCmp;
    return a.maSV.localeCompare(b.maSV);
  });
}

export function sortAnalyzedRooms(
  rooms: AnalyzedExamRoom[],
  order: ExamDateTimeSortOrder = 'DATE_ASC'
): AnalyzedExamRoom[] {
  return [...rooms].sort((a, b) => {
    const timeCmp = compareExamDateTime(a, b, order);
    if (timeCmp !== 0) return timeCmp;
    const mhCmp = a.maMH.localeCompare(b.maMH);
    if (mhCmp !== 0) return mhCmp;
    if (a.isMonitorRoom !== b.isMonitorRoom) return a.isMonitorRoom ? -1 : 1;
    return a.mapThi.localeCompare(b.mapThi);
  });
}

/**
 * Xác định 2 bản ghi thi cùng môn có cùng tổ/nhóm học hay không.
 * Ưu tiên so sánh Nhóm học + Tổ thi; nếu không có thì so sánh Nhóm thi.
 */
export function isSameGroupWithMonitor(
  studentRec: Pick<RoomAnalysisRecord, 'nhomHoc' | 'toThi' | 'nhomThi'>,
  monitorRec: Pick<RoomAnalysisRecord, 'nhomHoc' | 'toThi' | 'nhomThi'>
): boolean {
  const sNhomHoc = normalizeStr(studentRec.nhomHoc);
  const mNhomHoc = normalizeStr(monitorRec.nhomHoc);
  const sToThi = normalizeStr(studentRec.toThi);
  const mToThi = normalizeStr(monitorRec.toThi);
  const sNhomThi = normalizeStr(studentRec.nhomThi);
  const mNhomThi = normalizeStr(monitorRec.nhomThi);

  let comparedAny = false;

  if (sNhomHoc && mNhomHoc) {
    comparedAny = true;
    if (sNhomHoc !== mNhomHoc) return false;
  }

  if (sToThi && mToThi) {
    comparedAny = true;
    if (sToThi !== mToThi) return false;
  }

  if (!comparedAny && sNhomThi && mNhomThi) {
    comparedAny = true;
    if (sNhomThi !== mNhomThi) return false;
  }

  return comparedAny;
}

export function matchesRoomCount(
  count: number,
  operator: RoomCountOperator,
  threshold: number
): boolean {
  if (operator === 'ALL' || isNaN(threshold)) return true;
  switch (operator) {
    case 'LT':
      return count < threshold;
    case 'LTE':
      return count <= threshold;
    case 'GT':
      return count > threshold;
    case 'GTE':
      return count >= threshold;
    case 'EQ':
      return count === threshold;
    default:
      return true;
  }
}

export function formatGroupLabel(rec: Pick<RoomAnalysisRecord, 'nhomHoc' | 'toThi' | 'nhomThi'>): string {
  const parts: string[] = [];
  if (rec.nhomHoc) parts.push(`Nhóm ${rec.nhomHoc}`);
  if (rec.toThi) parts.push(`Tổ ${rec.toThi}`);
  if (!rec.nhomHoc && !rec.toThi && rec.nhomThi) parts.push(`Nhóm thi ${rec.nhomThi}`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}
