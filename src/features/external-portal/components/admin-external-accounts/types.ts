import { LoginUser } from '../../../../types';

export interface ExternalAccountAdminItem {
  id: number;
  username: string; // Mã SV
  hoTen: string;
  maLop: string;
  soDienThoai: string;
  systemKey: string;
  systemName: string;
  systemUrl: string;
  extUsername: string;
  extPassword?: string;
  token?: string | null;
  hasToken?: boolean;
  refreshToken?: string | null;
  hasRefreshToken?: boolean;
  tokenExpiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
  lastTokenRefreshedAt?: string | null;
  status: string;
  lastSyncAt: string | null;
  syncMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminExternalAccountsProps {
  currentUser: LoginUser;
}

export type StatusFilter = 'ALL' | 'CONNECTED' | 'ERROR' | 'HAS_TOKEN';

export type ModalMode = 'ADD' | 'EDIT';

export type ModalTestStatus = 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';

export interface AccountFormData {
  username: string;
  extUsername: string;
  extPassword: string;
  refreshToken: string;
  systemKey: string;
  systemName: string;
  systemUrl: string;
}

export interface AccountMetrics {
  connectedCount: number;
  hasTokenCount: number;
  qldttxCount: number;
  qldttxTokenCount: number;
  lmsCount: number;
  lmsTokenCount: number;
  slinkCount: number;
  slinkTokenCount: number;
  coveragePercent: string;
}
