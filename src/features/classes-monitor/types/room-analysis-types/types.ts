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

export type ExamDateTimeSortOrder = 'DATE_ASC' | 'DATE_DESC';

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
