import { ExamRecord, LoginUser } from '../../../types';

export type { ExamRecord, LoginUser };

export interface StudentItem {
  id?: number;
  maSV: string;
  hoLot?: string;
  ten?: string;
  hoTen: string;
  gioiTinh?: string;
  ngaySinh?: string;
  maLop: string;
  trangThai?: string;
  soDienThoai?: string | null;
  ghiChu?: string | null;
  examCount?: number;
  user?: {
    id: number;
    role: string;
    isActive: boolean;
    lastLogin?: string | null;
    hasPassword?: boolean;
  } | null;
  createdAt?: string;
}

export interface StudentExtraInfo {
  phone?: string;
  note?: string;
}

export interface ClassStats {
  students: number;
  subjects: number;
  totalExams: number;
}
