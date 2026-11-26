import { TelegramSendResult } from './telegramServerService';
import { MAX_QUEUE_RETRIES_DEFAULT } from './telegram-queue-server-service/constants';
import { getQueueState } from './telegram-queue-server-service/state';
import {
  TelegramMessagePriority,
  TelegramQueueItem,
  TelegramQueueItemOptions,
} from './telegram-queue-server-service/types';
import { insertItemByPriority } from './telegram-queue-server-service/utils';
import { triggerWorker } from './telegram-queue-server-service/worker';

export type {
  TelegramMessagePriority,
  TelegramQueueHistoryItem,
  TelegramQueueInternalState,
  TelegramQueueItem,
  TelegramQueueItemOptions,
  TelegramQueueStats,
} from './telegram-queue-server-service/types';

export {
  MAX_QUEUE_RETRIES_429,
  MAX_QUEUE_RETRIES_DEFAULT,
} from './telegram-queue-server-service/constants';

export { triggerWorker } from './telegram-queue-server-service/worker';

export {
  clearTelegramQueue,
  ensureTelegramQueueWorkerLiveness,
  getTelegramQueueStats,
  setTelegramQueuePaused,
} from './telegram-queue-server-service/controls';

export interface EnqueueTelegramMessageParams {
  botToken: string;
  chatId: string;
  text: string;
  options?: TelegramQueueItemOptions;
  priority?: TelegramMessagePriority;
  maxAttempts?: number;
}

/**
 * Enqueue a Telegram Text Message
 */
export function enqueueTelegramMessage({
  botToken,
  chatId,
  text,
  options,
  priority = 'NORMAL',
  maxAttempts = MAX_QUEUE_RETRIES_DEFAULT,
}: EnqueueTelegramMessageParams): Promise<TelegramSendResult> {
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

export interface EnqueueTelegramDocumentParams {
  botToken: string;
  chatId: string;
  fileBuffer: Buffer | Uint8Array;
  filename: string;
  options?: TelegramQueueItemOptions;
  priority?: TelegramMessagePriority;
  maxAttempts?: number;
}

/**
 * Enqueue a Telegram Document / File
 */
export function enqueueTelegramDocument({
  botToken,
  chatId,
  fileBuffer,
  filename,
  options,
  priority = 'NORMAL',
  maxAttempts = MAX_QUEUE_RETRIES_DEFAULT,
}: EnqueueTelegramDocumentParams): Promise<TelegramSendResult> {
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
