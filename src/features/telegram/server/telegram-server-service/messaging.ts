import type { TelegramSendResult } from './types';
import { sendRawTelegramDocument, sendRawTelegramMessage, verifyTelegramBot } from './rawApi';

/**
 * Send a message via Global Telegram Queue (rate-limited, throttled, 429 backoff)
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  options?: {
    threadId?: string | number | null;
    parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
    disableWebPagePreview?: boolean;
    priority?: import('../telegramQueueServerService').TelegramMessagePriority;
    sendImmediately?: boolean;
    maxAttempts?: number;
  }
): Promise<TelegramSendResult> {
  if (options?.sendImmediately) {
    return await sendRawTelegramMessage(botToken, chatId, text, options);
  }
  const { enqueueTelegramMessage } = await import('../telegramQueueServerService');
  return await enqueueTelegramMessage(botToken, chatId, text, options, options?.priority || 'NORMAL', options?.maxAttempts);
}

/**
 * Send a document/file via Global Telegram Queue (sendDocument)
 */
export async function sendTelegramDocument(
  botToken: string,
  chatId: string,
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  options?: {
    threadId?: string | number | null;
    caption?: string;
    parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
    priority?: import('../telegramQueueServerService').TelegramMessagePriority;
    sendImmediately?: boolean;
    maxAttempts?: number;
  }
): Promise<TelegramSendResult> {
  if (options?.sendImmediately) {
    return await sendRawTelegramDocument(botToken, chatId, fileBuffer, filename, options);
  }
  const { enqueueTelegramDocument } = await import('../telegramQueueServerService');
  return await enqueueTelegramDocument(botToken, chatId, fileBuffer, filename, options, options?.priority || 'NORMAL', options?.maxAttempts);
}

/**
 * Send a formatted test notification to Telegram
 */
export async function sendTestNotification(
  botToken: string,
  chatId: string,
  threadId?: string | null,
  userInfo?: {
    username?: string;
    fullName?: string;
    maLop?: string;
  }
): Promise<TelegramSendResult> {
  // First verify the bot info
  const botVerify = await verifyTelegramBot(botToken);
  if (!botVerify.success) {
    return {
      success: false,
      error: botVerify.error || 'Xác thực Bot Token thất bại',
    };
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateString = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const username = userInfo?.username || 'Chưa xác định';
  const fullName = userInfo?.fullName || username;
  const lop = userInfo?.maLop || 'Chưa cập nhật';
  const botHandle = botVerify.botInfo?.username ? `@${botVerify.botInfo.username}` : (botVerify.botInfo?.firstName || 'Telegram Bot');

  const threadInfoLine = threadId && threadId.trim()
    ? `🧵 <b>Thread / Topic ID:</b> <code>${threadId.trim()}</code>\n`
    : '';

  const messageHtml = [
    `🤖 <b>THÔNG BÁO THỬ NGHIỆM - PTIT WEB TOOL</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🎉 <b>Chúc mừng! Cấu hình Telegram Bot đã hoạt động chính xác.</b>`,
    ``,
    `👤 <b>Họ và tên:</b> ${fullName}`,
    `🆔 <b>Mã sinh viên:</b> <code>${username}</code>`,
    `🏫 <b>Lớp:</b> <b>${lop}</b>`,
    `🤖 <b>Bot gửi:</b> <b>${botHandle}</b>`,
    `📌 <b>Chat ID nhận:</b> <code>${chatId.trim()}</code>`,
    threadInfoLine ? threadInfoLine.trim() : null,
    `⏰ <b>Thời gian test:</b> <i>${timeString} - ${dateString}</i>`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔔 <i>Từ bây giờ, hệ thống sẽ tự động gửi thông báo lịch thi, cập nhật phòng thi, kết quả ĐKMH và các thông tin học vụ quan trọng trực tiếp đến Telegram này.</i>`,
  ].filter(Boolean).join('\n');

  const sendResult = await sendTelegramMessage(botToken, chatId, messageHtml, {
    threadId,
    parseMode: 'HTML',
  });

  if (sendResult.success) {
    sendResult.botInfo = botVerify.botInfo;
  }

  return sendResult;
}
