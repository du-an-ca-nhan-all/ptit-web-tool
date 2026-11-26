import { TelegramMessagePriority } from './types';

// Tối đa retry cho lỗi thông thường (mạng, timeout, 5xx, ngoại lệ): 20 lần
export const MAX_QUEUE_RETRIES_DEFAULT = 20;

// Tối đa retry khi gặp mã lỗi HTTP 429 (Too Many Requests / Rate Limit): 1000 lần
export const MAX_QUEUE_RETRIES_429 = 1000;

// Priority weights: higher numbers = sent first
export const PRIORITY_WEIGHTS: Record<TelegramMessagePriority, number> = {
  CRITICAL: 100,
  HIGH: 50,
  NORMAL: 20,
  LOW: 10,
  BULK: 1,
};

// Telegram API limits:
// 1. Global limit: max 30 msg/sec per bot -> dùng 60ms (~16 msg/sec)
export const MIN_GLOBAL_INTERVAL_MS = 60;
// 2. Private chat (chatId > 0): max 1 msg/sec -> dùng 1100ms
export const MIN_PER_CHAT_INTERVAL_MS = 1100;
// 3. Group / Supergroup / Channel (chatId < 0, vd: -100...):
//    Telegram giới hạn tối đa 20 msg/phút cho cùng 1 nhóm -> dùng 3200ms (~18.7 msg/phút)
//    + sliding window tối đa 18 msg trong 60 giây để tránh 429 khi gửi dồn dập.
export const MIN_GROUP_CHAT_INTERVAL_MS = 3200;
export const GROUP_WINDOW_MS = 60_000;
export const MAX_GROUP_MSGS_PER_MINUTE = 18;
// Maximum recent history kept in memory
export const MAX_HISTORY_ITEMS = 100;
