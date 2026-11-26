import { LoginUser } from '../../types/class.types';

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
  // Admin-only fields:
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

export interface ClassSummary {
  classCode: string;
  count: number;
}

export interface ResetTarget {
  username: string;
  fullName: string;
  lop: string;
}

export interface AllStudentsListProps {
  currentUser?: LoginUser | null;
  onSelectStudentSchedule?: (studentId: string) => void;
  onImpersonate?: (username: string) => void;
  onClassClick?: (classCode: string) => void;
}
