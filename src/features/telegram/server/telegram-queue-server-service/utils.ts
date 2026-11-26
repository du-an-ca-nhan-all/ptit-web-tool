import {
  GROUP_WINDOW_MS,
  MAX_GROUP_MSGS_PER_MINUTE,
  MIN_GROUP_CHAT_INTERVAL_MS,
  MIN_PER_CHAT_INTERVAL_MS,
  PRIORITY_WEIGHTS,
} from './constants';
import { TelegramQueueInternalState, TelegramQueueItem } from './types';

export function isGroupOrChannelChat(chatId: string): boolean {
  return String(chatId || '').trim().startsWith('-');
}

export function getEffectiveChatIntervalMs(chatId: string, consecutive429: number): number {
  const base = isGroupOrChannelChat(chatId) ? MIN_GROUP_CHAT_INTERVAL_MS : MIN_PER_CHAT_INTERVAL_MS;
  if (consecutive429 <= 0) return base;
  // Adaptive backoff nhẹ cho chat vừa dính 429: +1.5s mỗi lần liên tiếp (tối đa +9s)
  return base + Math.min(consecutive429, 6) * 1500;
}

export function buildTextPreview(text?: string): string | undefined {
  return text ? text.replace(/<[^>]*>/g, '').substring(0, 80) : undefined;
}

/**
 * Insert item into queue sorted by priority (high to low) and scheduled time (early to late)
 */
export function insertItemByPriority(
  queue: readonly TelegramQueueItem[],
  item: TelegramQueueItem
): TelegramQueueItem[] {
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
  return [...queue.slice(0, insertIdx), item, ...queue.slice(insertIdx)];
}

/**
 * Find the best ready item in the queue:
 * Must satisfy:
 * - scheduledFor <= now
 * - Not currently sending to this chatId (state.activeChats)
 * - Chat rate limit cool-down has passed
 * - At least effective per-chat interval (1.1s private / 3.2s+ group) passed since last message to this chatId
 * - For group/supergroup/channel: sliding window <= 18 messages / 60s
 */
export function findReadyQueueItemIndex(
  state: TelegramQueueInternalState,
  now: number
): { readyItemIndex: number; minWaitUntilNextReady: number } {
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

  return { readyItemIndex, minWaitUntilNextReady };
}
