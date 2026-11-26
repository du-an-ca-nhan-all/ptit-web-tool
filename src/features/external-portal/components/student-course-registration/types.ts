import { LoginUser } from '../../../../types';

export type RegisteredCoursesSubTab = 'COURSES' | 'COMPARE';

export interface SemesterInfo {
  hoc_ky: number;
  ten_hoc_ky: string;
  totalCourses: number;
  totalCredits: number;
  ngay_bat_dau_hk?: string;
  ngay_ket_thuc_hk?: string;
}

export interface ExternalAccountSummary {
  isConfigured: boolean;
  status: string;
  hasToken: boolean;
  lastSyncAt: string | null;
}

export interface RegistrationSummary {
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  lastPulledAt: string | null;
  hasRegistration: boolean;
  classCode: string;
  externalAccount: ExternalAccountSummary;
}

export interface CourseCompareData {
  main: any;
  subAccount: any;
  allSubAccounts?: any[];
  semesters?: SemesterInfo[];
}

export interface StudentCourseRegistrationProps {
  currentUser: LoginUser;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  initialSubTab?: RegisteredCoursesSubTab;
  courseCompareData?: CourseCompareData | null;
  onReloadCourseCompare?: () => void;
}
