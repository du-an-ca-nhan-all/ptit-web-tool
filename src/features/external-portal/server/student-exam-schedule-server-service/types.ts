export interface StudentQldtExamItem {
  id: string;
  stt: number;
  maMon: string;
  tenMon: string;
  dotThi: string;
  kyThi: string;
  ngayThi: string; // DD/MM/YYYY
  gioBatDau: string; // HH:mm
  soPhut: string;
  hinhThucThi: string;
  maPhong: string;
  maCoSo: string;
  diaDiemThi: string;
  ghepPhong: string;
  nhomThi: string;
  toThi: string;
  ghepThi: string;
  siSo: number;
  camThi: string;
  ghiChu: string;
  isPostponed: boolean;
  dateIso: string; // YYYY-MM-DD
  daysUntil: number; // âm: đã thi, 0: hôm nay, dương: sắp thi
  rawItem?: any;
}

export interface StudentQldtSemester {
  hocKy: number;
  tenHocKy: string;
  ngayBatDauHk?: string;
  ngayKetThucHk?: string;
}

export interface StudentQldtExamScheduleResult {
  success: boolean;
  username: string;
  semesterId: number;
  semesterName?: string;
  semesters: StudentQldtSemester[];
  exams: StudentQldtExamItem[];
  upcomingExams: StudentQldtExamItem[];
  pastExams: StudentQldtExamItem[];
  totalExams: number;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  isCachedDb?: boolean;
  lastSyncAt: string | null;
  noticeNoTuitionFee?: string;
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}
