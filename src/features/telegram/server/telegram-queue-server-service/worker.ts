import {
  sendRawTelegramDocument,
  sendRawTelegramMessage,
  TelegramSendResult,
} from '../telegramServerService';
import { MIN_GLOBAL_INTERVAL_MS } from './constants';
import { handleSendException } from './exceptionHandlers';
import { handleSendFailureResult, handleSendSuccess } from './resultHandlers';
import { getQueueState } from './state';
import { findReadyQueueItemIndex } from './utils';

/**
 * Trigger queue worker to process the next item
 */
export function triggerWorker(delayMs: number = 0) {
  const state = getQueueState();

  if (state.workerTimerId) {
    clearTimeout(state.workerTimerId);
    state.workerTimerId = null;
  }

  if (delayMs <= 0) {
    setImmediate(() => {
      processNextQueueItem().catch((err) => {
        console.error('[Telegram Queue Worker] Unhandled tick error:', err);
      });
    });
  } else {
    state.workerTimerId = setTimeout(() => {
      state.workerTimerId = null;
      processNextQueueItem().catch((err) => {
        console.error('[Telegram Queue Worker] Unhandled delayed tick error:', err);
      });
    }, delayMs);
  }
}

/**
 * Main worker loop tick
 */
async function processNextQueueItem() {
  const state = getQueueState();
  if (state.isPaused) {
    state.isWorkerRunning = false;
    return;
  }

  // Tránh chạy song song nhiều tick cùng lúc (ngăn race condition bắn đồng thời nhiều tin vào 1 chat)
  if (state.isProcessingTick) {
    return;
  }

  if (state.queue.length === 0) {
    state.isWorkerRunning = false;
    return;
  }

  state.isProcessingTick = true;
  state.isWorkerRunning = true;
  const now = Date.now();

  try {
    // 1. Check if global rate limit is active
    if (state.globalRateLimitedUntil > now) {
      const waitTime = state.globalRateLimitedUntil - now + 100;
      state.isProcessingTick = false;
      triggerWorker(waitTime);
      return;
    }

    // 2. Check global minimum interval
    const timeSinceLastGlobal = now - state.lastGlobalSendAt;
    if (timeSinceLastGlobal < MIN_GLOBAL_INTERVAL_MS) {
      const waitTime = MIN_GLOBAL_INTERVAL_MS - timeSinceLastGlobal;
      state.isProcessingTick = false;
      triggerWorker(waitTime);
      return;
    }

    // 3. Find the best ready item in the queue
    const { readyItemIndex, minWaitUntilNextReady } = findReadyQueueItemIndex(state, now);

    // If no item is ready right now, schedule next tick for the earliest ready item
    if (readyItemIndex === -1) {
      const safeDelay = Math.max(100, Math.min(minWaitUntilNextReady === Infinity ? 500 : minWaitUntilNextReady, 5000));
      state.isProcessingTick = false;
      triggerWorker(safeDelay);
      return;
    }

    // Extract the ready item and reserve timestamps IMMEDIATELY before awaiting network I/O
    const [item] = state.queue.splice(readyItemIndex, 1);
    item.status = 'SENDING';
    state.activeSending.add(item.id);
    state.activeChats.add(item.chatId);
    state.lastGlobalSendAt = now;
    state.lastSentAtByChat.set(item.chatId, now);

    const startTime = Date.now();

    try {
      let result: TelegramSendResult;

      if (item.type === 'message') {
        result = await sendRawTelegramMessage({
          botToken: item.botToken,
          chatId: item.chatId,
          text: item.text || '',
          options: item.options,
        });
      } else {
        result = await sendRawTelegramDocument({
          botToken: item.botToken,
          chatId: item.chatId,
          fileBuffer: item.fileBuffer || Buffer.alloc(0),
          filename: item.filename || 'file.bin',
          options: item.options,
        });
      }

      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      if (result.success) {
        handleSendSuccess({ state, item, result, durationMs, completedAt });
      } else {
        handleSendFailureResult({ state, item, result, durationMs, completedAt });
      }
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      handleSendException({ state, item, err, durationMs, completedAt });
    } finally {
      state.activeSending.delete(item.id);
      state.activeChats.delete(item.chatId);
    }
  } finally {
    state.isProcessingTick = false;
  }

  // Trigger next tick with minimum global delay
  if (state.queue.length > 0 && !state.isPaused) {
    triggerWorker(MIN_GLOBAL_INTERVAL_MS);
  } else {
    state.isWorkerRunning = false;
  }
}
