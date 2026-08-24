import { TelegramConfigItem, SystemTelegramBotInfo, LoginUser } from '../../../types';

export interface ForumTopicItem {
  threadId: string;
  name: string;
  iconColor?: number;
  iconCustomEmojiId?: string;
  isGeneral?: boolean;
  lastMessageSnippet?: string;
  lastMessageDate?: string;
}

export type { TelegramConfigItem, SystemTelegramBotInfo, LoginUser };

export interface TelegramSubscriber {
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
  notifyClassSchedule?: boolean;
}

export type TelegramMessagePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BULK';

export interface TelegramQueueHistoryItem {
  id: string;
  type: 'message' | 'document';
  chatId: string;
  threadId?: string | number | null;
  priority: TelegramMessagePriority;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempts: number;
  textPreview?: string;
  filename?: string;
  error?: string;
  durationMs?: number;
  completedAt: string;
}

export interface TelegramQueueStats {
  pending: number;
  sending: number;
  sentCount: number;
  failedCount: number;
  rateLimitPauses: number;
  totalProcessed: number;
  isWorkerRunning: boolean;
  isPaused: boolean;
  minGlobalIntervalMs: number;
  minPerChatIntervalMs: number;
  lastSentAt: string | null;
  rateLimitedUntil: string | null;
  recentHistory: TelegramQueueHistoryItem[];
}

