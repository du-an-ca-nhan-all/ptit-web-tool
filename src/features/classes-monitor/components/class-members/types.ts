import { ExamRecord, LoginUser } from '../../types/class.types';

export interface ClassMembersProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  currentUser?: LoginUser | null;
  loginUsers?: LoginUser[];
  onSelectStudentSchedule?: (studentId: string) => void;
  hasExamSchedule?: boolean;
  onImpersonate?: (username: string) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  onReloadMonitors?: () => void;
}

export interface StudentExtraInfo {
  phone?: string;
  note?: string;
}

export type GenderFilter = 'ALL' | 'NAM' | 'NU';

export type ActiveTab = 'ACTIVE' | 'EXCLUDED';

export type ExcludeType = 'BAO_LUU' | 'NGHI_HOC' | 'CHUYEN_LOP' | 'LOAI_BO';

export interface ToastMessage {
  text: string;
  type: 'success' | 'error';
}

export interface StudentContactFormData {
  phone: string;
  note: string;
}

export interface ResetPasswordStudent {
  username: string;
  fullName: string;
  lop: string;
}

export interface ClassMemberStats {
  total: number;
  maleCount: number;
  femaleCount: number;
  totalExams: number;
  avgExams: string;
}
