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
  username: string;
  role?: string;
  password_hash?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  lop?: string;
}

export interface LoginConfig {
  users: LoginUser[];
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
