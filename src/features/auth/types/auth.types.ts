import { LoginUser, StudentProfile, ExamRecord } from '../../../types';

export type { LoginUser, StudentProfile, ExamRecord };

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  roles?: string[];
  activeRole?: string;
  isAdmin: boolean;
  isMonitor: boolean;
  fullName?: string | null;
  phoneNumber?: string | null;
  lop?: string | null;
  impersonatedBy?: string | null;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RegistrationRequestItem {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  lop?: string | null;
  status: RegistrationStatus;
  note?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImpersonateSession {
  targetUsername: string;
  originalAdminUsername: string;
}
