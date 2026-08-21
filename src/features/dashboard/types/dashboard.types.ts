import { LoginUser, ExamBatchItem, ExamRecord } from '../../../types';
import { AnnouncementItem } from '../../announcements';

export interface NextExamCountdown {
  hasExam: boolean;
  exam?: {
    id?: number;
    subjectCode: string;
    subjectName: string;
    examDate: string; // DD/MM/YYYY
    examTime: string; // HH:mm
    room: string;
    examGroup?: string;
    examFormat?: string;
    studentGroup?: string; // SBD
    isPostponed?: boolean;
    batchName?: string;
    daysLeft: number;
    hoursLeft: number;
    minutesLeft: number;
    isToday: boolean;
    isTomorrow: boolean;
    isPassed: boolean;
    isoDateTime?: string;
  };
  totalUpcomingExams: number;
}

export interface AcademicSummary {
  hasData: boolean;
  gpa10?: number | null;
  gpa4?: number | null;
  creditsAccumulated?: number;
  creditsPassed?: number;
  creditsRegistered?: number;
  classification?: string | null;
  totalSubjects?: number;
  totalPassed?: number;
  totalFailed?: number;
  lastSyncAt?: string | null;
}

export interface ClassMonitorSummary {
  isMonitor: boolean;
  classCode: string;
  totalClassStudents: number;
  activeAccountsCount: number;
  studentsWithExamsCount: number;
  envelopesAssignedCount: number;
  totalClassRoomsCount: number;
}

export interface AdminSystemHealth {
  isAdmin: boolean;
  totalStudents: number;
  totalUsers: number;
  totalActiveBatches: number;
  pendingRegistrationsCount: number;
  isTelegramBotConfigured: boolean;
  telegramBotUsername?: string | null;
  recentActivityLogsCount: number;
  activeBatchName?: string | null;
}

export interface ExternalAccountStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSyncAt?: string | null;
  systemName?: string;
}

export interface TelegramSyncStatus {
  isConfigured: boolean;
  isEnabled: boolean;
  chatId?: string;
  botUsername?: string | null;
}

export interface DashboardData {
  user: LoginUser;
  nextExam: NextExamCountdown;
  upcomingExams: Array<{
    id?: number;
    subjectCode: string;
    subjectName: string;
    examDate: string;
    examTime: string;
    room: string;
    examGroup?: string;
    examFormat?: string;
    studentGroup?: string;
    isPostponed?: boolean;
  }>;
  academicSummary: AcademicSummary;
  classMonitorSummary?: ClassMonitorSummary;
  adminSystemHealth?: AdminSystemHealth;
  externalAccountStatus: ExternalAccountStatus;
  telegramStatus: TelegramSyncStatus;
  activeAnnouncements: AnnouncementItem[];
  activeBatch?: ExamBatchItem | null;
}
