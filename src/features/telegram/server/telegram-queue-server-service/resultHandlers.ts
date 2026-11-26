import { TelegramSendResult } from '../telegramServerService';
import {
  GROUP_WINDOW_MS,
  MAX_QUEUE_RETRIES_429,
  MAX_QUEUE_RETRIES_DEFAULT,
} from './constants';
import { recordHistory } from './state';
import { TelegramQueueInternalState, TelegramQueueItem } from './types';
import { buildTextPreview, insertItemByPriority, isGroupOrChannelChat } from './utils';

export interface HandleSendResultParams {
  state: TelegramQueueInternalState;
  item: TelegramQueueItem;
  result: TelegramSendResult;
  durationMs: number;
  completedAt: string;
}

export function handleSendSuccess({
  state,
  item,
  result,
  durationMs,
  completedAt,
}: HandleSendResultParams) {
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
    textPreview: buildTextPreview(item.text),
    filename: item.filename,
    durationMs,
    completedAt,
  });

  item.status = 'SUCCESS';
  item.resolve?.(result);
}

export function handleSendFailureResult({
  state,
  item,
  result,
  durationMs,
  completedAt,
}: HandleSendResultParams) {
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
      state.queue = insertItemByPriority(state.queue, item);

      recordHistory({
        id: item.id,
        type: item.type,
        chatId: item.chatId,
        threadId: item.options?.threadId,
        priority: item.priority,
        status: 'RETRYING',
        attempts: item.attempts,
        textPreview: buildTextPreview(item.text),
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
        textPreview: buildTextPreview(item.text),
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
    return;
  }

  // 2. Other errors: check if transient/retryable
  const isFatalError =
    errorCode === 400 ||
    errorCode === 401 ||
    errorCode === 403 ||
    rawDesc.toLowerCase().includes('chat not found') ||
    rawDesc.toLowerCase().includes('bot was blocked') ||
    rawDesc.toLowerCase().includes('unauthorized') ||
    rawDesc.toLowerCase().includes("can't parse");

  const maxRetries = item.maxAttempts ?? MAX_QUEUE_RETRIES_DEFAULT;
  const currentGeneralRetries = item.retryCountGeneral || 0;

  if (!isFatalError && currentGeneralRetries < maxRetries) {
    // Transient network / 5xx error: Exponential backoff
    item.retryCountGeneral = currentGeneralRetries + 1;
    item.attempts++;
    item.status = 'PENDING';
    const backoffDelay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(currentGeneralRetries, 8)));
    item.scheduledFor = Date.now() + backoffDelay;
    state.queue = insertItemByPriority(state.queue, item);

    recordHistory({
      id: item.id,
      type: item.type,
      chatId: item.chatId,
      threadId: item.options?.threadId,
      priority: item.priority,
      status: 'RETRYING',
      attempts: item.attempts,
      textPreview: buildTextPreview(item.text),
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
      textPreview: buildTextPreview(item.text),
      filename: item.filename,
      error: failReason,
      durationMs,
      completedAt,
    });

    item.resolve?.(result);
  }
}
