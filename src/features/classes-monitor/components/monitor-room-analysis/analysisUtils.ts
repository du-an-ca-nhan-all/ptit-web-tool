import {
  AnalyzedExamRoom,
  AnalyzedStudentRecord,
  ExamDateTimeSortOrder,
  RoomCountOperator,
  SplitFilterMode,
  formatGroupLabel,
  matchesRoomCount,
  sortAnalyzedRecords,
  sortAnalyzedRooms,
} from '../../types/roomAnalysis.types';
import { SplitCounts, SubjectOption } from './types';

export function extractDistinctSubjects(analyzedRecords: AnalyzedStudentRecord[]): SubjectOption[] {
  const map = new Map<string, string>();
  for (const r of analyzedRecords) {
    if (r.maMH && !map.has(r.maMH)) {
      map.set(r.maMH, r.tenMH || r.maMH);
    }
  }
  return Array.from(map.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export function computeSplitCounts(subjectRecords: AnalyzedStudentRecord[]): SplitCounts {
  let sameGroup = 0;
  let diffGroup = 0;
  let sameRoom = 0;
  let noMonitor = 0;
  const splitStudentIds = new Set<string>();

  for (const r of subjectRecords) {
    if (r.splitStatus === 'SPLIT_SAME_GROUP') {
      sameGroup += 1;
      splitStudentIds.add(r.maSV);
    } else if (r.splitStatus === 'SPLIT_DIFF_GROUP') {
      diffGroup += 1;
      splitStudentIds.add(r.maSV);
    } else if (r.splitStatus === 'SAME_ROOM') {
      sameRoom += 1;
    } else {
      noMonitor += 1;
    }
  }

  return {
    total: subjectRecords.length,
    allSplit: sameGroup + diffGroup,
    uniqueSplitStudents: splitStudentIds.size,
    sameGroup,
    diffGroup,
    sameRoom,
    noMonitor,
  };
}

export function filterAndSortRecords(params: {
  subjectRecords: AnalyzedStudentRecord[];
  splitFilter: SplitFilterMode;
  roomCountOp: RoomCountOperator;
  roomCountN: number;
  searchQuery: string;
  examTimeSort: ExamDateTimeSortOrder;
}): AnalyzedStudentRecord[] {
  const { subjectRecords, splitFilter, roomCountOp, roomCountN, searchQuery, examTimeSort } =
    params;
  const q = searchQuery.trim().toLowerCase();

  const matched = subjectRecords.filter((r) => {
    if (splitFilter === 'ALL_SPLIT') {
      if (r.splitStatus !== 'SPLIT_SAME_GROUP' && r.splitStatus !== 'SPLIT_DIFF_GROUP') {
        return false;
      }
    } else if (splitFilter !== 'ALL' && r.splitStatus !== splitFilter) {
      return false;
    }

    if (!matchesRoomCount(r.scopeRoomCount, roomCountOp, roomCountN)) {
      return false;
    }

    if (q) {
      const groupStr = formatGroupLabel(r).toLowerCase();
      const hit =
        r.maSV.toLowerCase().includes(q) ||
        r.hoTen.toLowerCase().includes(q) ||
        r.mapThi.toLowerCase().includes(q) ||
        r.monitorRoom.toLowerCase().includes(q) ||
        r.maMH.toLowerCase().includes(q) ||
        r.tenMH.toLowerCase().includes(q) ||
        groupStr.includes(q);
      if (!hit) return false;
    }
    return true;
  });

  return sortAnalyzedRecords(matched, examTimeSort);
}

export function filterAndSortRooms(params: {
  analyzedRooms: AnalyzedExamRoom[];
  selectedSubject: string;
  onlyNonMonitorRooms: boolean;
  roomCountOp: RoomCountOperator;
  roomCountN: number;
  searchQuery: string;
  examTimeSort: ExamDateTimeSortOrder;
}): AnalyzedExamRoom[] {
  const {
    analyzedRooms,
    selectedSubject,
    onlyNonMonitorRooms,
    roomCountOp,
    roomCountN,
    searchQuery,
    examTimeSort,
  } = params;
  const q = searchQuery.trim().toLowerCase();

  const matched = analyzedRooms.filter((room) => {
    if (selectedSubject !== 'ALL' && room.maMH !== selectedSubject) return false;
    if (onlyNonMonitorRooms && room.isMonitorRoom) return false;
    if (!matchesRoomCount(room.scopeCount, roomCountOp, roomCountN)) return false;

    if (q) {
      const roomHit =
        room.mapThi.toLowerCase().includes(q) ||
        room.maMH.toLowerCase().includes(q) ||
        room.tenMH.toLowerCase().includes(q) ||
        room.monitorRoomForSubject.toLowerCase().includes(q) ||
        room.members.some(
          (m) =>
            m.maSV.toLowerCase().includes(q) ||
            m.hoTen.toLowerCase().includes(q) ||
            formatGroupLabel(m).toLowerCase().includes(q)
        );
      if (!roomHit) return false;
    }
    return true;
  });

  return sortAnalyzedRooms(matched, examTimeSort);
}
