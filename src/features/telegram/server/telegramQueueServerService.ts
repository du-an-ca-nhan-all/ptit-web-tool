import {
  sendRawTelegramMessage,
  sendRawTelegramDocument,
  TelegramSendResult,
  TelegramBotInfo,
} from './telegramServerService';

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
  createdAt: number;
  scheduledFor: number;
  error?: string;
  resolve?: (res: TelegramSendResult) => void;
  reject?: (err: any) => void;
}

export interface TelegramQueueInternalState {
  queue: TelegramQueueItem[];
  activeSending: Set<string>;
  lastSentAtByChat: Map<string, number>;
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

// Priority weights: higher numbers = sent first
const PRIORITY_WEIGHTS: Record<TelegramMessagePriority, number> = {
  CRITICAL: 100,
  HIGH: 50,
  NORMAL: 20,
  LOW: 10,
  BULK: 1,
};

// Telegram API limits:
// Global limit: max 30 msg/sec per bot. We use 50ms interval (~20 msg/sec max).
const MIN_GLOBAL_INTERVAL_MS = 50;
// Per chat limit: max 1 msg/sec per chat. We use 1100ms interval for safety.
const MIN_PER_CHAT_INTERVAL_MS = 1100;
// Maximum recent history kept in memory
const MAX_HISTORY_ITEMS = 100;

/**
 * Get or initialize the global singleton queue state
 */
function getQueueState(): TelegramQueueInternalState {
  const g = globalThis as any;
  if (!g.__telegramQueueState) {
    g.__telegramQueueState = {
      queue: [],
      activeSending: new Set<string>(),
      lastSentAtByChat: new Map<string, number>(),
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
  return g.__telegramQueueState;
}

/**
 * Push an entry into recent history log
 */
function recordHistory(entry: TelegramQueueHistoryItem) {
  const state = getQueueState();
  state.recentHistory.unshift(entry);
  if (state.recentHistory.length > MAX_HISTORY_ITEMS) {
    state.recentHistory.pop();
  }
}

/**
 * Insert item into queue sorted by priority (high to low) and scheduled time (early to late)
 */
function insertItemByPriority(queue: TelegramQueueItem[], item: TelegramQueueItem) {
  const itemWeight = PRIORITY_WEIGHTS[item.priority] || 20;

  let insertIdx = queue.length;
  for (let i = 0; i < queue.length; i++) {
    const qItem = queue[i];
    const qWeight = PRIORITY_WEIGHTS[qItem.priority] || 20;

    if (itemWeight > qWeight) {
      insertIdx = i;
      break;
    } else if (itemWeight === qWeight) {
      if (item.scheduledFor < qItem.scheduledFor) {
        insertIdx = i;
        break;
      }
    }
  }
  queue.splice(insertIdx, 0, item);
}

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

  if (state.queue.length === 0) {
    state.isWorkerRunning = false;
    return;
  }

  state.isWorkerRunning = true;
  const now = Date.now();

  // 1. Check if global rate limit is active
  if (state.globalRateLimitedUntil > now) {
    const waitTime = state.globalRateLimitedUntil - now + 50;
    triggerWorker(waitTime);
    return;
  }

  // 2. Check global minimum interval
  const timeSinceLastGlobal = now - state.lastGlobalSendAt;
  if (timeSinceLastGlobal < MIN_GLOBAL_INTERVAL_MS) {
    const waitTime = MIN_GLOBAL_INTERVAL_MS - timeSinceLastGlobal;
    triggerWorker(waitTime);
    return;
  }

  // 3. Find the best ready item in the queue:
  // Must satisfy:
  // - scheduledFor <= now
  // - Not currently sending to this chat (state.activeSending)
  // - Chat rate limit cool-down has passed
  // - At least MIN_PER_CHAT_INTERVAL_MS passed since last message to this chatId
  let readyItemIndex = -1;
  let minWaitUntilNextReady = Infinity;

  for (let i = 0; i < state.queue.length; i++) {
    const item = state.queue[i];

    if (item.scheduledFor > now) {
      minWaitUntilNextReady = Math.min(minWaitUntilNextReady, item.scheduledFor - now);
      continue;
    }

    const chatRateLimitUntil = state.perChatRateLimitedUntil.get(item.chatId) || 0;
    if (chatRateLimitUntil > now) {
      minWaitUntilNextReady = Math.min(minWaitUntilNextReady, chatRateLimitUntil - now);
      continue;
    }

    const lastSentToChat = state.lastSentAtByChat.get(item.chatId) || 0;
    const timeSinceChatSent = now - lastSentToChat;
    if (timeSinceChatSent < MIN_PER_CHAT_INTERVAL_MS) {
      const waitChat = MIN_PER_CHAT_INTERVAL_MS - timeSinceChatSent;
      minWaitUntilNextReady = Math.min(minWaitUntilNextReady, waitChat);
      continue;
    }

    // Found ready item!
    readyItemIndex = i;
    break;
  }

  // If no item is ready right now, schedule next tick for the earliest ready item
  if (readyItemIndex === -1) {
    const safeDelay = Math.max(50, Math.min(minWaitUntilNextReady === Infinity ? 500 : minWaitUntilNextReady, 5000));
    triggerWorker(safeDelay);
    return;
  }

  // Extract the ready item
  const [item] = state.queue.splice(readyItemIndex, 1);
  item.status = 'SENDING';
  state.activeSending.add(item.id);

  const startTime = Date.now();

  try {
    let result: TelegramSendResult;

    if (item.type === 'message') {
      result = await sendRawTelegramMessage(
        item.botToken,
        item.chatId,
        item.text || '',
        item.options
      );
    } else {
      result = await sendRawTelegramDocument(
        item.botToken,
        item.chatId,
        item.fileBuffer || Buffer.alloc(0),
        item.filename || 'file.bin',
        item.options
      );
    }

    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();

    if (result.success) {
      // SUCCESS
      state.sentCount++;
      state.lastGlobalSendAt = Date.now();
      state.lastSentAtByChat.set(item.chatId, Date.now());

      recordHistory({
        id: item.id,
        type: item.type,
        chatId: item.chatId,
        threadId: item.options?.threadId,
        priority: item.priority,
        status: 'SUCCESS',
        attempts: item.attempts + 1,
        textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
        filename: item.filename,
        durationMs,
        completedAt,
      });

      item.status = 'SUCCESS';
      item.resolve?.(result);
    } else {
      // HANDLE ERROR
      const errorCode = result.errorCode;
      const rawDesc = result.rawResponse?.description || result.error || '';
      const retryAfter = result.rawResponse?.parameters?.retry_after;

      // 1. Rate limited by Telegram (HTTP 429 Too Many Requests)
      if (errorCode === 429 || typeof retryAfter === 'number') {
        const pauseSeconds = Math.max(retryAfter || 5, 2);
        const pauseMs = pauseSeconds * 1000 + 500;

        state.rateLimitPauses++;
        state.globalRateLimitedUntil = Date.now() + pauseMs;
        state.perChatRateLimitedUntil.set(item.chatId, Date.now() + pauseMs);

        console.warn(
          `⚠️ [Telegram Queue] Hit rate limit 429 on chat ${item.chatId}. Pausing queue for ${pauseSeconds}s (Retry-After)`
        );

        if (item.attempts + 1 < item.maxAttempts) {
          item.attempts++;
          item.status = 'PENDING';
          item.scheduledFor = Date.now() + pauseMs;
          insertItemByPriority(state.queue, item);

          recordHistory({
            id: item.id,
            type: item.type,
            chatId: item.chatId,
            threadId: item.options?.threadId,
            priority: item.priority,
            status: 'RETRYING',
            attempts: item.attempts,
            textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
            filename: item.filename,
            error: `Rate limit 429 (Tạm dừng ${pauseSeconds}s rồi thử lại)`,
            durationMs,
            completedAt,
          });

          // Schedule next worker tick after pause
          triggerWorker(pauseMs + 50);
          return;
        } else {
          // Max attempts reached on 429
          state.failedCount++;
          item.status = 'FAILED';
          recordHistory({
            id: item.id,
            type: item.type,
            chatId: item.chatId,
            threadId: item.options?.threadId,
            priority: item.priority,
            status: 'FAILED',
            attempts: item.attempts + 1,
            textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
            filename: item.filename,
            error: `Rate limit 429: Đã thử lại ${item.maxAttempts} lần không thành công`,
            durationMs,
            completedAt,
          });
          item.resolve?.(result);
        }
      } else {
        // 2. Other errors: check if transient/retryable
        const isFatalError =
          errorCode === 400 ||
          errorCode === 401 ||
          errorCode === 403 ||
          rawDesc.toLowerCase().includes('chat not found') ||
          rawDesc.toLowerCase().includes('bot was blocked') ||
          rawDesc.toLowerCase().includes('unauthorized') ||
          rawDesc.toLowerCase().includes('can\'t parse');

        if (!isFatalError && item.attempts + 1 < item.maxAttempts) {
          // Transient network / 5xx error: Exponential backoff
          item.attempts++;
          item.status = 'PENDING';
          const backoffDelay = Math.min(30000, 1000 * Math.pow(2, item.attempts));
          item.scheduledFor = Date.now() + backoffDelay;
          insertItemByPriority(state.queue, item);

          recordHistory({
            id: item.id,
            type: item.type,
            chatId: item.chatId,
            threadId: item.options?.threadId,
            priority: item.priority,
            status: 'RETRYING',
            attempts: item.attempts,
            textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
            filename: item.filename,
            error: `${result.error || 'Lỗi mạng'} (Thử lại lần ${item.attempts}/${item.maxAttempts})`,
            durationMs,
            completedAt,
          });

          triggerWorker(MIN_GLOBAL_INTERVAL_MS);
          return;
        } else {
          // Permanent failure or exhausted retries
          state.failedCount++;
          item.status = 'FAILED';

          recordHistory({
            id: item.id,
            type: item.type,
            chatId: item.chatId,
            threadId: item.options?.threadId,
            priority: item.priority,
            status: 'FAILED',
            attempts: item.attempts + 1,
            textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
            filename: item.filename,
            error: result.error || 'Gửi thất bại',
            durationMs,
            completedAt,
          });

          item.resolve?.(result);
        }
      }
    }
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();

    if (item.attempts + 1 < item.maxAttempts) {
      item.attempts++;
      item.status = 'PENDING';
      item.scheduledFor = Date.now() + 2000;
      insertItemByPriority(state.queue, item);

      recordHistory({
        id: item.id,
        type: item.type,
        chatId: item.chatId,
        threadId: item.options?.threadId,
        priority: item.priority,
        status: 'RETRYING',
        attempts: item.attempts,
        textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
        filename: item.filename,
        error: `Ngoại lệ: ${err.message || 'Lỗi không xác định'}`,
        durationMs,
        completedAt,
      });
    } else {
      state.failedCount++;
      item.status = 'FAILED';

      recordHistory({
        id: item.id,
        type: item.type,
        chatId: item.chatId,
        threadId: item.options?.threadId,
        priority: item.priority,
        status: 'FAILED',
        attempts: item.attempts + 1,
        textPreview: item.text ? item.text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined,
        filename: item.filename,
        error: `Ngoại lệ: ${err.message || 'Lỗi không xác định'}`,
        durationMs,
        completedAt,
      });

      item.resolve?.({
        success: false,
        error: `Lỗi ngoại lệ khi gửi: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  } finally {
    state.activeSending.delete(item.id);
  }

  // Trigger next tick immediately with minimum global delay
  triggerWorker(MIN_GLOBAL_INTERVAL_MS);
}

/**
 * Enqueue a Telegram Text Message
 */
export function enqueueTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  options?: TelegramQueueItemOptions,
  priority: TelegramMessagePriority = 'NORMAL',
  maxAttempts: number = 3
): Promise<TelegramSendResult> {
  const state = getQueueState();
  state.itemCounter++;
  const id = `tg_msg_${Date.now()}_${state.itemCounter}`;

  return new Promise<TelegramSendResult>((resolve, reject) => {
    const item: TelegramQueueItem = {
      id,
      type: 'message',
      botToken: botToken.trim(),
      chatId: String(chatId).trim(),
      text,
      options,
      priority,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: Math.max(1, maxAttempts),
      createdAt: Date.now(),
      scheduledFor: Date.now(),
      resolve,
      reject,
    };

    insertItemByPriority(state.queue, item);
    triggerWorker(0);
  });
}

/**
 * Enqueue a Telegram Document / File
 */
export function enqueueTelegramDocument(
  botToken: string,
  chatId: string,
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  options?: TelegramQueueItemOptions,
  priority: TelegramMessagePriority = 'NORMAL',
  maxAttempts: number = 3
): Promise<TelegramSendResult> {
  const state = getQueueState();
  state.itemCounter++;
  const id = `tg_doc_${Date.now()}_${state.itemCounter}`;

  return new Promise<TelegramSendResult>((resolve, reject) => {
    const item: TelegramQueueItem = {
      id,
      type: 'document',
      botToken: botToken.trim(),
      chatId: String(chatId).trim(),
      fileBuffer,
      filename,
      options,
      priority,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: Math.max(1, maxAttempts),
      createdAt: Date.now(),
      scheduledFor: Date.now(),
      resolve,
      reject,
    };

    insertItemByPriority(state.queue, item);
    triggerWorker(0);
  });
}

/**
 * Enqueue a batch of Telegram messages (non-blocking, fire-and-forget for background jobs)
 */
export function enqueueBatchTelegramMessages(
  items: Array<{
    botToken: string;
    chatId: string;
    text: string;
    options?: TelegramQueueItemOptions;
    priority?: TelegramMessagePriority;
  }>
): { queuedCount: number; itemIds: string[] } {
  const state = getQueueState();
  const itemIds: string[] = [];

  for (const it of items) {
    state.itemCounter++;
    const id = `tg_batch_${Date.now()}_${state.itemCounter}`;
    itemIds.push(id);

    const queueItem: TelegramQueueItem = {
      id,
      type: 'message',
      botToken: it.botToken.trim(),
      chatId: String(it.chatId).trim(),
      text: it.text,
      options: it.options,
      priority: it.priority || 'LOW',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 3,
      createdAt: Date.now(),
      scheduledFor: Date.now(),
    };

    insertItemByPriority(state.queue, queueItem);
  }

  triggerWorker(0);
  return { queuedCount: items.length, itemIds };
}

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
