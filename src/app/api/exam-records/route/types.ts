export interface FormattedExamRecord {
  id: number;
  MaSV: string;
  HoLotSV: string;
  TenSV: string;
  PHAI: string;
  NgaySinhC: string;
  NhomThi: string;
  MAPTHI: string;
  MaMH: string;
  TenMH: string;
  MaHTThi: string;
  NhomHoc: string;
  'To thi': string;
  ToThi: string;
  MaLop: string;
  NgayThi: string;
  GioThi: string;
  SoPhutThi: string;
  MaDotThi: string;
  TenDotThi: string;
  batchCode: string;
  studentStatus: string;
  isPostponed: boolean;
}

export interface ReviewMemberSummary {
  maSV: string;
  hoTen: string;
  maLop: string;
}

export interface EnrichedExamRecord extends FormattedExamRecord {
  roomTotalCount?: number;
  roomClassmateCount?: number;
  isUserInReviewBatch?: boolean;
  roomReviewSameClassCount?: number;
  roomReviewOtherClassCount?: number;
  roomReviewSameClassMembers?: ReviewMemberSummary[];
  roomReviewOtherClassMembers?: ReviewMemberSummary[];
}

export interface RoomCondition {
  batchCode?: string;
  maMH: string;
  ngayThi: string;
  gioThi: string;
  mapThi: string;
}

export interface RoomStudentInfo {
  maSV: string;
  hoTen: string;
  ten: string;
  maLop: string;
}

export interface PatchPostponedPayload {
  rawId: any;
  rawIds: any;
  rawIsPostponed: any;
  cleanMaSV: string;
  cleanMaMH: string;
  cleanMapThi: string;
  cleanNgayThi: string;
  cleanGioThi: string;
}

export interface PatchUpdateResult {
  updatedCount: number;
  targetDesc: string;
}
