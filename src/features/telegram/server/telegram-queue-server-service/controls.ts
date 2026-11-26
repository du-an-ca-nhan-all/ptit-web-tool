import {
  MAX_GROUP_MSGS_PER_MINUTE,
  MAX_QUEUE_RETRIES_429,
  MAX_QUEUE_RETRIES_DEFAULT,
  MIN_GLOBAL_INTERVAL_MS,
  MIN_GROUP_CHAT_INTERVAL_MS,
  MIN_PER_CHAT_INTERVAL_MS,
} from './constants';
import { getQueueState } from './state';
import { TelegramQueueStats } from './types';
import { triggerWorker } from './worker';

/**
 * Get current Queue Statistics & live state
 */
export function getTelegramQueueStats(): TelegramQueueStats {
  const state = getQueueState();
  const now = Date.now();

  return {
    pending: state.queue.length,
    sending: state.activeSending.size,
    sentCount: state.sentCount,
    failedCount: state.failedCount,
    rateLimitPauses: state.rateLimitPauses,
    totalProcessed: state.sentCount + state.failedCount,
    isWorkerRunning: state.isWorkerRunning,
    isPaused: state.isPaused,
    minGlobalIntervalMs: MIN_GLOBAL_INTERVAL_MS,
    minPerChatIntervalMs: MIN_PER_CHAT_INTERVAL_MS,
    minGroupChatIntervalMs: MIN_GROUP_CHAT_INTERVAL_MS,
    maxGroupMsgsPerMinute: MAX_GROUP_MSGS_PER_MINUTE,
    maxRetriesDefault: MAX_QUEUE_RETRIES_DEFAULT,
    maxRetries429: MAX_QUEUE_RETRIES_429,
    lastSentAt: state.lastGlobalSendAt ? new Date(state.lastGlobalSendAt).toISOString() : null,
    rateLimitedUntil: state.globalRateLimitedUntil > now ? new Date(state.globalRateLimitedUntil).toISOString() : null,
    recentHistory: [...state.recentHistory],
  };
}

/**
 * Pause / Resume queue processing
 */
export function setTelegramQueuePaused(paused: boolean): { isPaused: boolean } {
  const state = getQueueState();
  state.isPaused = paused;
  if (!paused) {
    triggerWorker(0);
  }
  return { isPaused: state.isPaused };
}

/**
 * Clear all pending items in the queue
 */
export function clearTelegramQueue(): { clearedCount: number } {
  const state = getQueueState();
  const count = state.queue.length;

  for (const item of state.queue) {
    item.resolve?.({
      success: false,
      error: 'Hàng đợi Telegram đã bị hủy/xóa bởi Quản trị viên.',
    });
  }

  state.queue = [];
  return { clearedCount: count };
}

/**
 * Ensure worker is running if there are pending items (called periodically by Scheduler)
 */
export function ensureTelegramQueueWorkerLiveness() {
  const state = getQueueState();
  if (state.queue.length > 0 && !state.isWorkerRunning && !state.isPaused) {
    triggerWorker(0);
  }
}
