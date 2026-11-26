import { LoginUser, ExamRecord } from '../../types/auth.types';

export type AuthMode = 'LOGIN' | 'REGISTER';

export interface StudentLookupInfo {
  maSV: string;
  hoTen: string;
  maLop?: string | null;
  soDienThoai?: string | null;
  hasPassword?: boolean;
}

export interface LoginScreenProps {
  users?: LoginUser[];
  records?: ExamRecord[];
  initialError?: string | null;
  onLogin: (user: LoginUser) => void;
}
