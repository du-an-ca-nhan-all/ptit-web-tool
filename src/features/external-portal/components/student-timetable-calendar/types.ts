import { LoginUser } from '../../../../types';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';

export interface StudentTimetableCalendarProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
  onNavigateToReminders?: () => void;
}

export type CalendarViewMode = 'MONTH' | 'WEEK' | 'AGENDA';

export type TimetableErrorType =
  | 'NOT_CONFIGURED'
  | 'INVALID_CREDENTIALS'
  | 'SERVER_ERROR'
  | null;

export interface SyncFeedback {
  type: 'success' | 'error';
  message: string;
}

export interface SessionNumberInfo {
  current: number;
  total: number;
}

export interface MonthGridDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: TimetableCalendarEvent[];
}

export interface WeekGridDay {
  date: Date;
  dateStr: string;
  weekday: string;
  dayNum: number;
  isToday: boolean;
  events: TimetableCalendarEvent[];
}
