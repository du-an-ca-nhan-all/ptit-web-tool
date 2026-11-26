export interface SlinkCredentials {
  username: string;
  password?: string;
  token?: string | null;
  refreshToken?: string | null;
}

export interface SlinkFetchedGradesPayload {
  sinhVien: any;
  khoaNganh: any;
  chuongTrinhDaoTao: any;
  semesters: any[];
  courses: any[];
  statistics: any;
  newToken?: string;
  newRefreshToken?: string;
  tokenExpiresAt?: Date | null;
  refreshTokenExpiresAt?: Date | null;
  lastPulledAt: string;
}

export interface BuildSlinkGradeOptions {
  isConfigured: boolean;
  isLiveSync: boolean;
  isCachedDb: boolean;
  lastSyncAt: string | null;
}

export type GradeCountMap = Record<string, { count: number; credits: number }>;
