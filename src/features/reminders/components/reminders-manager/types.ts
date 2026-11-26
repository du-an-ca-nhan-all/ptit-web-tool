import { ReminderType } from '../../types/reminder.types';
import { LoginUser } from '@/src/types';

export interface RemindersManagerProps {
  currentUser: LoginUser;
  onNavigateToTelegramConfig?: () => void;
  onNavigateToCalendar?: () => void;
}

export type ReminderTabFilter = 'ALL' | 'PERSONAL' | 'COURSE';
export type ReminderStatusFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export interface ReminderFormData {
  title: string;
  description: string;
  location: string;
  type: ReminderType;
  eventTime: string; // YYYY-MM-DDTHH:mm
  selectedCourseKey: string;
  customMaMon: string;
  customTenMon: string;
  customNhomTo: string;
  customLop: string;
  offsetMinutesList: number[];
  customOffsetVal: string;
  customOffsetUnit: 'minutes' | 'hours' | 'days';
}

export interface ReminderStats {
  total: number;
  personal: number;
  course: number;
  completed: number;
  active: number;
}
