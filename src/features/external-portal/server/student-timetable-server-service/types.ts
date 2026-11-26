export interface TimetableCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeekStr: string; // "Thứ 2", "Thứ 3", ... "Chủ Nhật"
  dayOfWeekNum: number; // 2..8
  subjectName: string;
  subjectCode: string;
  group: string;
  classCode: string;
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string; // "19:00"
  endTime: string; // "21:50"
  startMinutes: number;
  room: string;
  onlineLink?: string;
  lecturer?: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  colorIndex: number;
  rawSession?: any;
}

export interface TimetableSubjectSummary {
  subjectCode: string;
  subjectName: string;
  group: string;
  classCode: string;
  room: string;
  credits?: number;
  tuitionFee?: number;
  totalSessions: number;
  startDate: string;
  endDate: string;
  dayOfWeekStr: string;
  periodStr: string;
  colorIndex: number;
}

export interface StudentTimetableCalendarResult {
  success: boolean;
  username: string;
  semesterId: number;
  semesterName?: string;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  isCachedDb?: boolean;
  lastSyncAt: string | null;
  totalCredits?: number;
  tuitionFee?: number;
  totalEvents: number;
  uniqueSubjectsCount: number;
  subjects: TimetableSubjectSummary[];
  events: TimetableCalendarEvent[];
  upcomingEvents: TimetableCalendarEvent[];
  reminders?: import('@/src/features/reminders').ReminderItemDto[];
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}

export interface BuildTimetableOptions {
  isConfigured: boolean;
  isLiveSync: boolean;
  isCachedDb: boolean;
  lastSyncAt: string | null;
  semesterName?: string;
}

export interface NormalizedSubjectFields {
  subjectName: string;
  subjectCode: string;
  group: string;
  classCode: string;
  room: string;
  onlineLink: string;
  lecturer: string;
  colorIndex: number;
}
