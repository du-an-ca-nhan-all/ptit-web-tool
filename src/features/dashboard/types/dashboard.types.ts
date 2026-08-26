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

export interface GradeDistributionSummary {
  aCount: number; // A+, A
  bCount: number; // B+, B
  cCount: number; // C+, C
  dCount: number; // D+, D
  fCount: number; // F / KĐ
}

export interface LatestSemesterSummary {
  name: string;
  gpa4?: number | null;
  gpa10?: number | null;
  credits?: number;
}

export interface AcademicSourceSummary {
  source: 'SLINK' | 'QLHT';
  sourceName: string;
  portalUrl: string;
  hasData: boolean;
  isConfigured?: boolean;
  isConnected?: boolean;
  gpa10?: number | null;
  gpa4?: number | null;
  creditsAccumulated?: number;
  creditsPassed?: number;
  creditsRegistered?: number;
  classification?: string | null;
  totalSubjects?: number;
  totalPassed?: number;
  totalFailed?: number;
  totalInProgress?: number;
  passRate?: number;
  creditPassRate?: number;
  lastSyncAt?: string | null;
  tenKhoaNganh?: string | null;
  maKhoaNganh?: string | null;
  totalSemesters?: number;
  latestSemester?: LatestSemesterSummary | null;
  gradeDistribution?: GradeDistributionSummary | null;
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
  totalInProgress?: number;
  passRate?: number;
  lastSyncAt?: string | null;
  slink?: AcademicSourceSummary;
  qlht?: AcademicSourceSummary;
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

export interface StudentMonitorFlowSummary {
  isConfigured: boolean;
  isEnabled: boolean;
  classCode: string;
  monitorUsername: string;
  monitorFullName?: string;
  monitorPhone?: string;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction: boolean;
  note?: string | null;
  lastActionAt?: string | null;
  lastActionType?: string | null;
  lastActionResult?: string | null;
  lastActionMessage?: string | null;
  isExternalAccountReady: boolean;
  recentQueueItem?: {
    flowAction: string;
    ma_mon?: string | null;
    ten_mon?: string | null;
    nhom_to?: string | null;
    status: string;
    resultMessage?: string | null;
    createdAt: string;
    finishedAt?: string | null;
  } | null;
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

export interface TimetableEventItem {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeekStr: string;
  subjectName: string;
  subjectCode: string;
  group?: string;
  classCode?: string;
  periodStr: string;
  startTime: string;
  endTime: string;
  room: string;
  onlineLink?: string;
  lecturer?: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  isToday?: boolean;
}

export interface TimetableSummary {
  hasData: boolean;
  semesterName?: string;
  totalSubjects: number;
  totalEvents: number;
  todayEvents: TimetableEventItem[];
  upcomingEvents: TimetableEventItem[];
  lastSyncAt?: string | null;
}

export interface LmsCourseHighlightItem {
  id: string;
  courseCode: string;
  courseName: string;
  fullName: string;
  progressPercent: number;
  completedActivities: number;
  totalActivities: number;
  grade?: string | null;
  isCompleted: boolean;
  category?: string;
  url?: string;
}

export interface LmsDashboardSummary {
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  userFullName?: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  notStartedCourses: number;
  completedActivities: number;
  dueActivities: number;
  totalActivities: number;
  overallProgressPercent: number;
  courses: LmsCourseHighlightItem[];
  highlightCourses: LmsCourseHighlightItem[];
  lastSyncAt?: string | null;
  isCachedDb?: boolean;
  isLiveSync?: boolean;
  syncWarning?: string;
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
  timetableSummary: TimetableSummary;
  lmsSummary?: LmsDashboardSummary;
  classMonitorSummary?: ClassMonitorSummary;
  studentMonitorFlowSummary?: StudentMonitorFlowSummary;
  adminSystemHealth?: AdminSystemHealth;
  externalAccountStatus: ExternalAccountStatus;
  lmsAccountStatus?: ExternalAccountStatus;
  slinkAccountStatus?: ExternalAccountStatus;
  telegramStatus: TelegramSyncStatus;
  activeAnnouncements: AnnouncementItem[];
  activeBatch?: ExamBatchItem | null;
}
