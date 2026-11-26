import { LoginUser } from '../../../../types';

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RegistrationStatusFilter = RegistrationStatus | 'ALL';

export interface RegistrationItem {
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
}

export interface RegistrationCounts {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface ResetModalUser {
  username: string;
  fullName: string;
  lop: string;
}

export interface AdminRegistrationManagerProps {
  currentUser: LoginUser;
}
