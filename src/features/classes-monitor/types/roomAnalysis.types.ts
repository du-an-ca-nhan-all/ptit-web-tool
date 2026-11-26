import { parseDateString } from '@/src/lib/date-utils';

export interface RoomAnalysisRecord {
  id: number;
  maSV: string;
  hoLot: string;
  ten: string;
  hoTen: string;
  soDienThoai: string;
  maLop: string;
  maMH: string;
  tenMH: string;
  mapThi: string;
  ngayThi: string;
  gioThi: string;
  soPhutThi: string;
  maHTThi: string;
  nhomHoc: string;
  toThi: string;
  nhomThi: string;
  isPostponed: boolean;
  isReviewRegistered: boolean;
  reviewNote: string;
  roomTotalCount: number;
}

export interface ReferenceStudentInfo {
  maSV: string;
  hoTen: string;
  maLop: string;
  isMonitor: boolean;
  examCount: number;
}

export interface ReferenceCandidate {
  maSV: string;
  hoTen: string;
  ten: string;
  isMonitor: boolean;
  examCount: number;
}

export type StudentScope = 'CLASS' | 'REVIEW';

export type SplitRoomStatus =
  | 'SPLIT_SAME_GROUP'
  | 'SPLIT_DIFF_GROUP'
  | 'SAME_ROOM'
  | 'NO_MONITOR_EXAM';

export type SplitFilterMode =
  | 'ALL_SPLIT'
  | 'SPLIT_SAME_GROUP'
  | 'SPLIT_DIFF_GROUP'
  | 'SAME_ROOM'
  | 'NO_MONITOR_EXAM'
  | 'ALL';

export type RoomCountOperator = 'ALL' | 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ';

export interface AnalyzedStudentRecord extends RoomAnalysisRecord {
  roomKey: string;
  splitStatus: SplitRoomStatus;
  monitorRoom: string;
  monitorDate: string;
  monitorTime: string;
  monitorNhomHoc: string;
  monitorToThi: string;
  monitorNhomThi: string;
  scopeRoomCount: number;
  classRoomCount: number;
  reviewRoomCount: number;
}

export interface AnalyzedExamRoom {
  roomKey: string;
  maMH: string;
  tenMH: string;
  mapThi: string;
  ngayThi: string;
  gioThi: string;
  soPhutThi: string;
  maHTThi: string;
  isMonitorRoom: boolean;
  monitorRoomForSubject: string;
  monitorDateForSubject: string;
  monitorTimeForSubject: string;
  hasMonitorExamForSubject: boolean;
  scopeCount: number;
  classCount: number;
  reviewCount: number;
  roomTotalCount: number;
  splitSameGroupCount: number;
  splitDiffGroupCount: number;
  members: AnalyzedStudentRecord[];
}

export function normalizeStr(val?: string | null): string {
  return String(val || '').trim().toUpperCase();
}

export function buildRoomKey(maMH: string, mapThi: string, ngayThi: string, gioThi: string): string {
  return [normalizeStr(maMH), normalizeStr(mapThi), String(ngayThi || '').trim(), String(gioThi || '').trim()].join(
    '|'
  );
}

export function getExamTimestamp(ngayThi: string, gioThi: string): number {
  const parsed = parseDateString(`${ngayThi || ''} ${gioThi || ''}`.trim());
  if (parsed) return parsed.getTime();
  return 0;
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

export function analyzeClassRooms(params: {
  allClassRecords: RoomAnalysisRecord[];
  referenceRecords: RoomAnalysisRecord[];
  scope: StudentScope;
  hidePostponed: boolean;
}): {
  analyzedRecords: AnalyzedStudentRecord[];
  analyzedRooms: AnalyzedExamRoom[];
} {
  const { allClassRecords, referenceRecords, scope, hidePostponed } = params;

  const activeClassRecords = hidePostponed
    ? allClassRecords.filter((r) => !r.isPostponed)
    : allClassRecords;

  const activeRefRecords = hidePostponed
    ? referenceRecords.filter((r) => !r.isPostponed)
    : referenceRecords;

  // Map monitor's exam records by subject code
  const monitorBySubject = new Map<string, RoomAnalysisRecord[]>();
  for (const ref of activeRefRecords) {
    const subj = normalizeStr(ref.maMH);
    if (!subj) continue;
    if (!monitorBySubject.has(subj)) {
      monitorBySubject.set(subj, []);
    }
    monitorBySubject.get(subj)!.push(ref);
  }

  // Pre-count class & review students per room
  const classRoomStudents = new Map<string, Set<string>>();
  const reviewRoomStudents = new Map<string, Set<string>>();
  for (const rec of activeClassRecords) {
    const rKey = buildRoomKey(rec.maMH, rec.mapThi, rec.ngayThi, rec.gioThi);
    if (!classRoomStudents.has(rKey)) classRoomStudents.set(rKey, new Set());
    classRoomStudents.get(rKey)!.add(rec.maSV);

    if (rec.isReviewRegistered) {
      if (!reviewRoomStudents.has(rKey)) reviewRoomStudents.set(rKey, new Set());
      reviewRoomStudents.get(rKey)!.add(rec.maSV);
    }
  }

  // Filter by selected scope (CLASS vs REVIEW)
  const scopedRecords =
    scope === 'REVIEW'
      ? activeClassRecords.filter((r) => r.isReviewRegistered)
      : activeClassRecords;

  const analyzedRecords: AnalyzedStudentRecord[] = scopedRecords.map((rec) => {
    const subj = normalizeStr(rec.maMH);
    const rKey = buildRoomKey(rec.maMH, rec.mapThi, rec.ngayThi, rec.gioThi);
    const monitorList = monitorBySubject.get(subj) || [];

    const classRoomCount = classRoomStudents.get(rKey)?.size ?? 0;
    const reviewRoomCount = reviewRoomStudents.get(rKey)?.size ?? 0;
    const scopeRoomCount = scope === 'REVIEW' ? reviewRoomCount : classRoomCount;

    if (monitorList.length === 0) {
      return {
        ...rec,
        roomKey: rKey,
        splitStatus: 'NO_MONITOR_EXAM',
        monitorRoom: '',
        monitorDate: '',
        monitorTime: '',
        monitorNhomHoc: '',
        monitorToThi: '',
        monitorNhomThi: '',
        scopeRoomCount,
        classRoomCount,
        reviewRoomCount,
      };
    }

    // Check if student is in the exact same room/date/time as any of monitor's exams for this subject
    const sameRoomMatch = monitorList.find(
      (m) => buildRoomKey(m.maMH, m.mapThi, m.ngayThi, m.gioThi) === rKey
    );

    if (sameRoomMatch) {
      return {
        ...rec,
        roomKey: rKey,
        splitStatus: 'SAME_ROOM',
        monitorRoom: sameRoomMatch.mapThi,
        monitorDate: sameRoomMatch.ngayThi,
        monitorTime: sameRoomMatch.gioThi,
        monitorNhomHoc: sameRoomMatch.nhomHoc,
        monitorToThi: sameRoomMatch.toThi,
        monitorNhomThi: sameRoomMatch.nhomThi,
        scopeRoomCount,
        classRoomCount,
        reviewRoomCount,
      };
    }

    // Otherwise, student is split into a different room!
    // Check if they share the same group/team with any of monitor's exams for this subject
    const sameGroupMatch = monitorList.find((m) => isSameGroupWithMonitor(rec, m));
    const primaryMonitor = sameGroupMatch || monitorList[0];

    return {
      ...rec,
      roomKey: rKey,
      splitStatus: sameGroupMatch ? 'SPLIT_SAME_GROUP' : 'SPLIT_DIFF_GROUP',
      monitorRoom: primaryMonitor.mapThi,
      monitorDate: primaryMonitor.ngayThi,
      monitorTime: primaryMonitor.gioThi,
      monitorNhomHoc: primaryMonitor.nhomHoc,
      monitorToThi: primaryMonitor.toThi,
      monitorNhomThi: primaryMonitor.nhomThi,
      scopeRoomCount,
      classRoomCount,
      reviewRoomCount,
    };
  });

  // Sort analyzed records: date/time asc -> subject -> split severity -> room -> student name
  const statusOrder: Record<SplitRoomStatus, number> = {
    SPLIT_SAME_GROUP: 0,
    SPLIT_DIFF_GROUP: 1,
    SAME_ROOM: 2,
    NO_MONITOR_EXAM: 3,
  };

  analyzedRecords.sort((a, b) => {
    const tA = getExamTimestamp(a.ngayThi, a.gioThi);
    const tB = getExamTimestamp(b.ngayThi, b.gioThi);
    if (tA !== tB) return tA - tB;
    const mhCmp = a.maMH.localeCompare(b.maMH);
    if (mhCmp !== 0) return mhCmp;
    if (statusOrder[a.splitStatus] !== statusOrder[b.splitStatus]) {
      return statusOrder[a.splitStatus] - statusOrder[b.splitStatus];
    }
    const rCmp = a.mapThi.localeCompare(b.mapThi);
    if (rCmp !== 0) return rCmp;
    const tenCmp = a.ten.localeCompare(b.ten, 'vi');
    if (tenCmp !== 0) return tenCmp;
    return a.maSV.localeCompare(b.maSV);
  });

  // Group into rooms
  const roomMap = new Map<string, AnalyzedExamRoom>();
  for (const rec of analyzedRecords) {
    if (!roomMap.has(rec.roomKey)) {
      const subj = normalizeStr(rec.maMH);
      const monitorList = monitorBySubject.get(subj) || [];
      const primaryMonitor = monitorList[0];
      const isMonitorRoom = monitorList.some(
        (m) => buildRoomKey(m.maMH, m.mapThi, m.ngayThi, m.gioThi) === rec.roomKey
      );

      roomMap.set(rec.roomKey, {
        roomKey: rec.roomKey,
        maMH: rec.maMH,
        tenMH: rec.tenMH,
        mapThi: rec.mapThi,
        ngayThi: rec.ngayThi,
        gioThi: rec.gioThi,
        soPhutThi: rec.soPhutThi,
        maHTThi: rec.maHTThi,
        isMonitorRoom,
        monitorRoomForSubject: primaryMonitor?.mapThi || '',
        monitorDateForSubject: primaryMonitor?.ngayThi || '',
        monitorTimeForSubject: primaryMonitor?.gioThi || '',
        hasMonitorExamForSubject: monitorList.length > 0,
        scopeCount: rec.scopeRoomCount,
        classCount: rec.classRoomCount,
        reviewCount: rec.reviewRoomCount,
        roomTotalCount: rec.roomTotalCount,
        splitSameGroupCount: 0,
        splitDiffGroupCount: 0,
        members: [],
      });
    }

    const room = roomMap.get(rec.roomKey)!;
    // Avoid duplicate maSV inside the same room
    if (!room.members.some((m) => m.maSV === rec.maSV)) {
      room.members.push(rec);
      if (rec.splitStatus === 'SPLIT_SAME_GROUP') room.splitSameGroupCount += 1;
      if (rec.splitStatus === 'SPLIT_DIFF_GROUP') room.splitDiffGroupCount += 1;
    }
  }

  const analyzedRooms = Array.from(roomMap.values())
    .map((room) => ({
      ...room,
      members: room.members.sort((a, b) => {
        const tenCmp = a.ten.localeCompare(b.ten, 'vi');
        if (tenCmp !== 0) return tenCmp;
        return a.maSV.localeCompare(b.maSV);
      }),
    }))
    .sort((a, b) => {
      const tA = getExamTimestamp(a.ngayThi, a.gioThi);
      const tB = getExamTimestamp(b.ngayThi, b.gioThi);
      if (tA !== tB) return tA - tB;
      const mhCmp = a.maMH.localeCompare(b.maMH);
      if (mhCmp !== 0) return mhCmp;
      if (a.isMonitorRoom !== b.isMonitorRoom) return a.isMonitorRoom ? -1 : 1;
      return a.mapThi.localeCompare(b.mapThi);
    });

  return { analyzedRecords, analyzedRooms };
}
