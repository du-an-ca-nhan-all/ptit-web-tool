import { LoginUser } from '../../../../types';

export interface SubscriberItem {
  id: number;
  username: string;
  fullName: string;
  maLop: string;
  soDienThoai: string;
  isCustomBot: boolean;
  botToken: string;
  rawBotToken?: string;
  chatId: string;
  threadId?: string | null;
  isEnabled: boolean;
  notifyExamSchedule: boolean;
  notifyClassActivity: boolean;
  notifyQldtAnnouncements?: boolean;
  qldtCheckInterval?: number;
  lastQldtCheckedAt?: string | null;
  notifySlinkAnnouncements?: boolean;
  slinkCheckInterval?: number;
  lastSlinkCheckedAt?: string | null;
  notifyClassSchedule?: boolean;
  classReminderBefore?: number;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  botUsername: string | null;
  botFirstName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTelegramBotManagerProps {
  currentUser: LoginUser;
}

export type AdminSubTab =
  | 'CONFIG'
  | 'SUBSCRIBERS'
  | 'REMINDERS'
  | 'BROADCAST'
  | 'BACKUP_ALERTS'
  | 'QUEUE';

export type SubscriberFilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'CUSTOM' | 'SYSTEM';

export type AdminDetectTarget = 'TEST' | 'BACKUP';

export const CLASS_REMINDER_DAY_OPTIONS = [7, 10, 14, 30] as const;
