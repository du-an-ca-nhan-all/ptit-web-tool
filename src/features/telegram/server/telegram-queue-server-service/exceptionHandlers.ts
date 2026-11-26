import { MAX_QUEUE_RETRIES_429, MAX_QUEUE_RETRIES_DEFAULT } from './constants';
import { recordHistory } from './state';
import { TelegramQueueInternalState, TelegramQueueItem } from './types';
import { buildTextPreview, insertItemByPriority } from './utils';

export interface HandleSendExceptionParams {
  state: TelegramQueueInternalState;
  item: TelegramQueueItem;
  err: any;
  durationMs: number;
  completedAt: string;
}

export function handleSendException({
  state,
  item,
  err,
  durationMs,
  completedAt,
}: HandleSendExceptionParams) {
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
        textPreview: buildTextPreview(item.text),
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
    return;
  }

  const maxRetries = item.maxAttempts ?? MAX_QUEUE_RETRIES_DEFAULT;
  const currentGeneralRetries = item.retryCountGeneral || 0;

  if (currentGeneralRetries < maxRetries) {
    item.retryCountGeneral = currentGeneralRetries + 1;
    item.attempts++;
    item.status = 'PENDING';
    const backoffDelay = Math.min(30000, 1000 * Math.pow(1.5, Math.min(currentGeneralRetries, 8)));
    item.scheduledFor = Date.now() + Math.max(2000, backoffDelay);
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
      textPreview: buildTextPreview(item.text),
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
