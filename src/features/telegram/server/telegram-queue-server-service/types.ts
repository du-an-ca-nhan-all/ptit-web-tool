import { TelegramSendResult } from '../telegramServerService';

export type TelegramMessagePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' | 'BULK';

export interface TelegramQueueItemOptions {
  threadId?: string | number | null;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disableWebPagePreview?: boolean;
  caption?: string;
  sendImmediately?: boolean;
}

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
  minGroupChatIntervalMs: number;
  maxGroupMsgsPerMinute: number;
  maxRetriesDefault: number;
  maxRetries429: number;
  lastSentAt: string | null;
  rateLimitedUntil: string | null;
  recentHistory: TelegramQueueHistoryItem[];
}

export interface TelegramQueueItem {
  id: string;
  type: 'message' | 'document';
  botToken: string;
  chatId: string;
  text?: string;
  fileBuffer?: Buffer | Uint8Array;
  filename?: string;
  options?: TelegramQueueItemOptions;
  priority: TelegramMessagePriority;
  status: 'PENDING' | 'SENDING' | 'SUCCESS' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  retryCountGeneral?: number;
  retryCount429?: number;
  createdAt: number;
  scheduledFor: number;
  error?: string;
  resolve?: (res: TelegramSendResult) => void;
  reject?: (err: any) => void;
}

export interface TelegramQueueInternalState {
  queue: TelegramQueueItem[];
  activeSending: Set<string>;
  activeChats: Set<string>;
  isProcessingTick: boolean;
  lastSentAtByChat: Map<string, number>;
  recentGroupSendsByChat: Map<string, number[]>;
  consecutive429ByChat: Map<string, number>;
  lastGlobalSendAt: number;
  globalRateLimitedUntil: number;
  perChatRateLimitedUntil: Map<string, number>;
  sentCount: number;
  failedCount: number;
  rateLimitPauses: number;
  isWorkerRunning: boolean;
  isPaused: boolean;
  workerTimerId: NodeJS.Timeout | null;
  recentHistory: TelegramQueueHistoryItem[];
  itemCounter: number;
}
