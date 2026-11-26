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
  minGroupChatIntervalMs: number;
  maxGroupMsgsPerMinute: number;
  maxRetriesDefault: number;
  maxRetries429: number;
  lastSentAt: string | null;
  rateLimitedUntil: string | null;
  recentHistory: TelegramQueueHistoryItem[];
}

// Tối đa retry cho lỗi thông thường (mạng, timeout, 5xx, ngoại lệ): 20 lần
export const MAX_QUEUE_RETRIES_DEFAULT = 20;

// Tối đa retry khi gặp mã lỗi HTTP 429 (Too Many Requests / Rate Limit): 1000 lần
export const MAX_QUEUE_RETRIES_429 = 1000;

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

// Priority weights: higher numbers = sent first
const PRIORITY_WEIGHTS: Record<TelegramMessagePriority, number> = {
  CRITICAL: 100,
  HIGH: 50,
  NORMAL: 20,
  LOW: 10,
  BULK: 1,
};

// Telegram API limits:
// 1. Global limit: max 30 msg/sec per bot -> dùng 60ms (~16 msg/sec)
const MIN_GLOBAL_INTERVAL_MS = 60;
// 2. Private chat (chatId > 0): max 1 msg/sec -> dùng 1100ms
const MIN_PER_CHAT_INTERVAL_MS = 1100;
// 3. Group / Supergroup / Channel (chatId < 0, vd: -100...):
//    Telegram giới hạn tối đa 20 msg/phút cho cùng 1 nhóm -> dùng 3200ms (~18.7 msg/phút)
//    + sliding window tối đa 18 msg trong 60 giây để tránh 429 khi gửi dồn dập.
const MIN_GROUP_CHAT_INTERVAL_MS = 3200;
const GROUP_WINDOW_MS = 60_000;
const MAX_GROUP_MSGS_PER_MINUTE = 18;
// Maximum recent history kept in memory
const MAX_HISTORY_ITEMS = 100;

function isGroupOrChannelChat(chatId: string): boolean {
  return String(chatId || '').trim().startsWith('-');
}

function getEffectiveChatIntervalMs(chatId: string, consecutive429: number): number {
  const base = isGroupOrChannelChat(chatId) ? MIN_GROUP_CHAT_INTERVAL_MS : MIN_PER_CHAT_INTERVAL_MS;
  if (consecutive429 <= 0) return base;
  // Adaptive backoff nhẹ cho chat vừa dính 429: +1.5s mỗi lần liên tiếp (tối đa +9s)
  return base + Math.min(consecutive429, 6) * 1500;
}

/**
 * Get or initialize the global singleton queue state
 */
function getQueueState(): TelegramQueueInternalState {
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

    // 3. Find the best ready item in the queue:
    // Must satisfy:
    // - scheduledFor <= now
    // - Not currently sending to this chatId (state.activeChats)
    // - Chat rate limit cool-down has passed
    // - At least effective per-chat interval (1.1s private / 3.2s+ group) passed since last message to this chatId
    // - For group/supergroup/channel: sliding window <= 18 messages / 60s
    let readyItemIndex = -1;
    let minWaitUntilNextReady = Infinity;

    for (let i = 0; i < state.queue.length; i++) {
      const item = state.queue[i];

      if (item.scheduledFor > now) {
        minWaitUntilNextReady = Math.min(minWaitUntilNextReady, item.scheduledFor - now);
        continue;
      }

      if (state.activeChats.has(item.chatId)) {
        minWaitUntilNextReady = Math.min(minWaitUntilNextReady, 250);
        continue;
      }

      const chatRateLimitUntil = state.perChatRateLimitedUntil.get(item.chatId) || 0;
      if (chatRateLimitUntil > now) {
        minWaitUntilNextReady = Math.min(minWaitUntilNextReady, chatRateLimitUntil - now);
        continue;
      }

      const consecutive429 = state.consecutive429ByChat.get(item.chatId) || 0;
      const requiredChatInterval = getEffectiveChatIntervalMs(item.chatId, consecutive429);
      const lastSentToChat = state.lastSentAtByChat.get(item.chatId) || 0;
      const timeSinceChatSent = now - lastSentToChat;
      if (timeSinceChatSent < requiredChatInterval) {
        const waitChat = requiredChatInterval - timeSinceChatSent;
        minWaitUntilNextReady = Math.min(minWaitUntilNextReady, waitChat);
        continue;
      }

      // Enforce sliding window 18 msg / 60s cho Group/Supergroup/Channel (-100...)
      if (isGroupOrChannelChat(item.chatId)) {
        const rawTimestamps = state.recentGroupSendsByChat.get(item.chatId) || [];
        const activeWindow = rawTimestamps.filter((ts) => now - ts < GROUP_WINDOW_MS);
        state.recentGroupSendsByChat.set(item.chatId, activeWindow);

        if (activeWindow.length >= MAX_GROUP_MSGS_PER_MINUTE) {
          const oldestTs = activeWindow[0];
          const waitWindow = Math.max(500, GROUP_WINDOW_MS - (now - oldestTs) + 200);
          minWaitUntilNextReady = Math.min(minWaitUntilNextReady, waitWindow);
          continue;
        }
      }

      // Found ready item!
      readyItemIndex = i;
      break;
    }

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
        const doneAt = Date.now();
        state.sentCount++;
        state.lastGlobalSendAt = doneAt;
        state.lastSentAtByChat.set(item.chatId, doneAt);

        // Giảm dần adaptive backoff khi gửi thành công
        const prev429 = state.consecutive429ByChat.get(item.chatId) || 0;
        if (prev429 > 0) {
          state.consecutive429ByChat.set(item.chatId, prev429 - 1);
        }

        // Ghi nhận vào sliding window 60s cho group/supergroup
        if (isGroupOrChannelChat(item.chatId)) {
          const timestamps = state.recentGroupSendsByChat.get(item.chatId) || [];
          timestamps.push(doneAt);
          state.recentGroupSendsByChat.set(
            item.chatId,
            timestamps.filter((ts) => doneAt - ts < GROUP_WINDOW_MS)
          );
        }

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
        if (errorCode === 429 || typeof retryAfter === 'number' || rawDesc.toLowerCase().includes('too many requests')) {
          let pauseSeconds = typeof retryAfter === 'number' ? retryAfter : 0;
          if (!pauseSeconds) {
            const match = rawDesc.match(/retry after (\d+)/i);
            if (match && match[1]) {
              pauseSeconds = parseInt(match[1], 10);
            }
          }
          pauseSeconds = Math.max(pauseSeconds || 5, 3);
          const pauseMs = pauseSeconds * 1000 + 1500; // Thêm 1.5s đệm an toàn tránh đụng lại 429 ngay lập tức

          const prev429 = state.consecutive429ByChat.get(item.chatId) || 0;
          state.consecutive429ByChat.set(item.chatId, Math.min(prev429 + 1, 6));

          state.rateLimitPauses++;
          // Chỉ tạm dừng chat bị 429 theo đúng Retry-After; global chỉ giãn nhẹ 1s để không chặn các chat cá nhân khác
          state.perChatRateLimitedUntil.set(item.chatId, Date.now() + pauseMs);
          state.globalRateLimitedUntil = Math.max(state.globalRateLimitedUntil, Date.now() + 1000);

          console.warn(
            `⚠️ [Telegram Queue] Hit rate limit 429 on chat ${item.chatId}. Pausing chat for ${pauseSeconds}s (+1.5s buffer, streak=${prev429 + 1})`
          );

          const current429Retries = item.retryCount429 || 0;

          if (current429Retries < MAX_QUEUE_RETRIES_429) {
            item.retryCount429 = current429Retries + 1;
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
              error: `Rate limit 429 (Tạm dừng chat ${pauseSeconds}s, thử lại lần ${item.retryCount429}/${MAX_QUEUE_RETRIES_429})`,
              durationMs,
              completedAt,
            });
          } else {
            // Max attempts reached on 429 (1000 retries)
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
              error: `Rate limit 429: Đã thử lại tối đa ${MAX_QUEUE_RETRIES_429} lần không thành công`,
              durationMs,
              completedAt,
            });
            item.resolve?.({
              ...result,
              error: `Rate limit 429: Đã thử lại tối đa ${MAX_QUEUE_RETRIES_429} lần không thành công`,
            });
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

          const maxRetries = item.maxAttempts ?? MAX_QUEUE_RETRIES_DEFAULT;
          const currentGeneralRetries = item.retryCountGeneral || 0;

          if (!isFatalError && currentGeneralRetries < maxRetries) {
            // Transient network / 5xx error: Exponential backoff
            item.retryCountGeneral = currentGeneralRetries + 1;
            item.attempts++;
            item.status = 'PENDING';
            const backoffDelay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(currentGeneralRetries, 8)));
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
              error: `${result.error || 'Lỗi mạng'} (Thử lại lần ${item.retryCountGeneral}/${maxRetries})`,
              durationMs,
              completedAt,
            });
          } else {
            // Permanent failure or exhausted retries
            state.failedCount++;
            item.status = 'FAILED';

            const failReason = isFatalError
              ? (result.error || 'Lỗi không thể gửi')
              : `${result.error || 'Gửi thất bại'}: Đã thử lại tối đa ${maxRetries} lần không thành công`;

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
              error: failReason,
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

      const isErr429 =
        err?.status === 429 ||
        (typeof err?.message === 'string' &&
          (err.message.includes('429') || err.message.toLowerCase().includes('too many requests')));

      if (isErr429) {
        let pauseSeconds = 5;
        const match = typeof err?.message === 'string' ? err.message.match(/retry after (\d+)/i) : null;
        if (match && match[1]) {
          pauseSeconds = Math.max(parseInt(match[1], 10), 3);
        }
        const pauseMs = pauseSeconds * 1000 + 1500;

        const prev429 = state.consecutive429ByChat.get(item.chatId) || 0;
        state.consecutive429ByChat.set(item.chatId, Math.min(prev429 + 1, 6));

        state.rateLimitPauses++;
        state.perChatRateLimitedUntil.set(item.chatId, Date.now() + pauseMs);
        state.globalRateLimitedUntil = Math.max(state.globalRateLimitedUntil, Date.now() + 1000);

        const current429Retries = item.retryCount429 || 0;
        if (current429Retries < MAX_QUEUE_RETRIES_429) {
          item.retryCount429 = current429Retries + 1;
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
            error: `Ngoại lệ 429: ${err.message || 'Too Many Requests'} (Tạm dừng chat ${pauseSeconds}s, thử lại lần ${item.retryCount429}/${MAX_QUEUE_RETRIES_429})`,
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
            error: `Ngoại lệ 429: Đã thử lại tối đa ${MAX_QUEUE_RETRIES_429} lần không thành công`,
            durationMs,
            completedAt,
          });

          item.resolve?.({
            success: false,
            error: `Lỗi 429: Đã thử lại tối đa ${MAX_QUEUE_RETRIES_429} lần không thành công`,
          });
        }
      } else {
        const maxRetries = item.maxAttempts ?? MAX_QUEUE_RETRIES_DEFAULT;
        const currentGeneralRetries = item.retryCountGeneral || 0;

        if (currentGeneralRetries < maxRetries) {
          item.retryCountGeneral = currentGeneralRetries + 1;
          item.attempts++;
          item.status = 'PENDING';
          const backoffDelay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(currentGeneralRetries, 8)));
          item.scheduledFor = Date.now() + Math.max(2000, backoffDelay);
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
            error: `Ngoại lệ: ${err.message || 'Lỗi không xác định'} (Thử lại lần ${item.retryCountGeneral}/${maxRetries})`,
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
            error: `Ngoại lệ: ${err.message || 'Lỗi không xác định'} (Đã thử lại tối đa ${maxRetries} lần không thành công)`,
            durationMs,
            completedAt,
          });

          item.resolve?.({
            success: false,
            error: `Lỗi ngoại lệ khi gửi: ${err.message || 'Lỗi không xác định'}`,
          });
        }
      }
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

/**
 * Enqueue a Telegram Text Message
 */
export function enqueueTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  options?: TelegramQueueItemOptions,
  priority: TelegramMessagePriority = 'NORMAL',
  maxAttempts: number = MAX_QUEUE_RETRIES_DEFAULT
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
      retryCountGeneral: 0,
      retryCount429: 0,
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
  maxAttempts: number = MAX_QUEUE_RETRIES_DEFAULT
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
      retryCountGeneral: 0,
      retryCount429: 0,
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
    maxAttempts?: number;
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
      maxAttempts: it.maxAttempts ?? MAX_QUEUE_RETRIES_DEFAULT,
      retryCountGeneral: 0,
      retryCount429: 0,
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
