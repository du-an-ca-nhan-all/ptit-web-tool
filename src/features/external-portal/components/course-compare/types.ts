import { LoginUser } from '../../../../types';

export interface SemesterInfo {
  hoc_ky: number;
  ten_hoc_ky: string;
  totalCourses: number;
  totalCredits: number;
  ngay_bat_dau_hk?: string;
  ngay_ket_thuc_hk?: string;
}

export interface CourseCompareData {
  main: any;
  subAccount: any;
  allSubAccounts?: any[];
  semesters?: SemesterInfo[];
  selectedSemester?: string;
}

export interface CourseCompareProps {
  data: CourseCompareData | null;
  currentUser?: LoginUser | null;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  onReload?: () => void;
  embedded?: boolean;
  onSubTabChange?: (tab: 'COURSES' | 'COMPARE') => void;
}

export interface SelectedCourseInfo {
  type: 'missing' | 'diffGroup';
  courseCode: string;
  courseName: string;
  monitorGroup: string;
  myGroup?: string;
}

export interface PopupStats {
  totalAnalyzed: number;
  missingUsers: any[];
  groupMap: Map<string, any[]>;
}

export interface CourseComparisonResult {
  exactMatch: any[];
  diffGroup: { monitor: any; mine: any }[];
  missing: any[];
  extra: any[];
}
