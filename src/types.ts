export interface ExamRecord {
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
  MaLop: string;
  NgayThi: string;
  GioThi: string;
  SoPhutThi: string;
  MaDotThi: string;
  TenDotThi: string;
  [key: string]: any;
}

export interface ClassConfigItem {
  classCode: string;
  monitorPhone?: string;
  includedStudents?: string[];
  excludedStudents?: string[];
}

export interface ClassConfig {
  classes: ClassConfigItem[];
}

export interface LoginUser {
  id?: number;
  username: string; // Mã sinh viên
  role?: string;    // 'admin' | 'lop_truong' | 'admin,lop_truong' | 'sinh_vien'
  isAdmin?: boolean;
  isMonitor?: boolean;
  password_hash?: string;
  fullName?: string; // Lấy từ Student.hoTen
  phoneNumber?: string; // Lấy từ Student.soDienThoai
  lop?: string;      // Lấy từ Student.maLop
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
