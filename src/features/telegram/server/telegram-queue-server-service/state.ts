import { MAX_HISTORY_ITEMS } from './constants';
import { TelegramQueueHistoryItem, TelegramQueueInternalState } from './types';

/**
 * Get or initialize the global singleton queue state
 */
export function getQueueState(): TelegramQueueInternalState {
  const g = globalThis as any;
  if (!g.__telegramQueueState) {
    g.__telegramQueueState = {
      queue: [],
      activeSending: new Set<string>(),
      activeChats: new Set<string>(),
      isProcessingTick: false,
      lastSentAtByChat: new Map<string, number>(),
      recentGroupSendsByChat: new Map<string, number[]>(),
      consecutive429ByChat: new Map<string, number>(),
      lastGlobalSendAt: 0,
      globalRateLimitedUntil: 0,
      perChatRateLimitedUntil: new Map<string, number>(),
      sentCount: 0,
      failedCount: 0,
      rateLimitPauses: 0,
      isWorkerRunning: false,
      isPaused: false,
      workerTimerId: null,
      recentHistory: [],
      itemCounter: 0,
    };
  }
  const state = g.__telegramQueueState as TelegramQueueInternalState;
  if (!state.activeChats) state.activeChats = new Set<string>();
  if (typeof state.isProcessingTick !== 'boolean') state.isProcessingTick = false;
  if (!state.recentGroupSendsByChat) state.recentGroupSendsByChat = new Map<string, number[]>();
  if (!state.consecutive429ByChat) state.consecutive429ByChat = new Map<string, number>();
  return state;
}

/**
 * Push an entry into recent history log
 */
export function recordHistory(entry: TelegramQueueHistoryItem) {
  const state = getQueueState();
  state.recentHistory.unshift(entry);
  if (state.recentHistory.length > MAX_HISTORY_ITEMS) {
    state.recentHistory.pop();
  }
}
