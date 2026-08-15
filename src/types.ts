export interface ExamRecord {
  id?: number;
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
  ToThi?: string;
  MaLop: string;
  NgayThi: string;
  GioThi: string;
  SoPhutThi: string;
  MaDotThi: string;
  TenDotThi: string;
  batchCode?: string;
  isPostponed?: boolean; // true nếu không thi môn này hoặc hoãn thi (không chia tiền đầu người)
  [key: string]: any;
}

export interface ExamBatchItem {
  id: number;
  code: string;
  name: string;
  semester?: string | null;
  academicYear?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  description?: string | null;
  totalRecords?: number;
  totalStudents?: number;
  totalRooms?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginUser {
  id?: number;
  username: string; // Mã sinh viên
  role?: string;    // 'admin' | 'lop_truong' | 'admin,lop_truong' | 'sinh_vien'
  roles?: string[];  // Danh sách các vai trò user sở hữu: ['admin', 'lop_truong', 'sinh_vien']
  activeRole?: string; // Vai trò hiện đang kích hoạt sử dụng
  isAdmin?: boolean;
  isMonitor?: boolean;
  password_hash?: string;
  fullName?: string; // Lấy từ Student.hoTen
  phoneNumber?: string; // Lấy từ Student.soDienThoai
  lop?: string;      // Lấy từ Student.maLop
  impersonatedBy?: string | null; // Admin gốc đang giả lập tài khoản này
  student?: any;
}

export interface StudentProfile {
  id?: number;
  maSV: string;
  hoLot?: string;
  ten?: string;
  hoTen?: string;
  gioiTinh?: string;
  ngaySinh?: string;
  maLop?: string;
  trangThai?: string; // 'DANG_HOC' | 'BAO_LUU' | 'NGHI_HOC' | 'CHUYEN_LOP'
  soDienThoai?: string;
  ghiChu?: string;
}

export interface SessionClassCount {
  className: string;
  count: number;
}

export interface ExamSession {
  id: string; // MAPTHI|NgayThi|GioThi|TenMH
  room: string;
  date: string;
  time: string;
  subject: string;
  subjectCode: string;
  examFormat: string;
  classCounts: SessionClassCount[];
  totalStudents: number;
  records: ExamRecord[];
}

export interface ExternalAccountItem {
  id?: number;
  username: string;
  systemKey: string;
  systemName: string;
  systemUrl: string;
  extUsername: string;
  extPassword?: string;
  token?: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt?: string | null;
  syncMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const AVAILABLE_EXTERNAL_SYSTEMS = [
  {
    key: 'QLDTTX_PTTC1',
    name: 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
    url: 'https://qldttx.pttc1.edu.vn/',
    description: 'Hệ thống quản lý đào tạo trực tuyến / từ xa của Học viện Bưu chính Viễn thông Cơ sở 1.',
    placeholderUser: 'Nhập mã sinh viên (Ví dụ: K25DTCN402)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconKey: 'GraduationCap',
  },
];

export interface TelegramConfigItem {
  id?: number;
  username: string;
  botToken?: string | null;
  chatId: string;
  threadId?: string | null;
  isEnabled: boolean;
  notifyExamSchedule: boolean;
  notifyCourseRegistration: boolean;
  notifyClassActivity: boolean;
  notifyQldtAnnouncements?: boolean;
  qldtCheckInterval?: number;
  lastQldtCheckedAt?: string | null;
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
  botUsername?: string | null;
  botFirstName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemTelegramBotInfo {
  isConfigured: boolean;
  botUsername?: string | null;
  botFirstName?: string | null;
  botUrl?: string | null;
  addToGroupUrl?: string | null;
  addToChannelUrl?: string | null;
  updatedAt?: string | null;
}
