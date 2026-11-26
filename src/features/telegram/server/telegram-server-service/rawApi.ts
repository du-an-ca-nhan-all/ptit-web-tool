import { cleanHtml } from '@/src/lib/htmlUtils';
import type { TelegramBotInfo, TelegramSendResult } from './types';
import { formatTelegramError } from './utils';

/**
 * Verify Bot Token with Telegram getMe API
 */
export async function verifyTelegramBot(botToken: string): Promise<{
  success: boolean;
  botInfo?: TelegramBotInfo;
  error?: string;
}> {
  const token = botToken?.trim();
  if (!token) {
    return { success: false, error: 'Vui lòng nhập Telegram Bot Token' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getMe`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        botInfo: {
          id: data.result.id,
          isBot: data.result.is_bot,
          firstName: data.result.first_name,
          username: data.result.username,
          canJoinGroups: data.result.can_join_groups,
          canReadAllGroupMessages: data.result.can_read_all_group_messages,
          supportsInlineQueries: data.result.supports_inline_queries,
        },
      };
    }

    return {
      success: false,
      error: formatTelegramError(data.description || 'Không thể xác thực Bot', data.error_code),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Không thể kết nối đến máy chủ Telegram: ${err.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Raw Telegram API: Send message directly to Telegram Bot API without queuing
 */
export async function sendRawTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  options?: {
    threadId?: string | number | null;
    parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
    disableWebPagePreview?: boolean;
  }
): Promise<TelegramSendResult> {
  const token = botToken?.trim();
  const chat = chatId?.trim();

  if (!token) {
    return { success: false, error: 'Thiếu Bot Token' };
  }
  if (!chat) {
    return { success: false, error: 'Thiếu Chat ID' };
  }
  if (!text || !text.trim()) {
    return { success: false, error: 'Nội dung tin nhắn không được để trống' };
  }

  try {
    const payload: any = {
      chat_id: chat,
      text: text,
      parse_mode: options?.parseMode || 'HTML',
      disable_web_page_preview: options?.disableWebPagePreview ?? true,
    };

    if (options?.threadId) {
      const threadNum = Number(options.threadId);
      if (!isNaN(threadNum) && threadNum > 0) {
        payload.message_thread_id = threadNum;
      }
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        messageId: data.result.message_id,
        rawResponse: data.result,
      };
    }

    // Fallback: Nếu Telegram báo lỗi parse entity HTML/Markdown, tự động thử gửi lại dưới dạng plain text
    if (
      (!data.ok || !res.ok) &&
      payload.parse_mode &&
      typeof data.description === 'string' &&
      (data.description.toLowerCase().includes("can't parse entities") ||
        data.description.toLowerCase().includes('parse mode'))
    ) {
      const fallbackPayload = {
        ...payload,
        text: cleanHtml(text),
      };
      delete fallbackPayload.parse_mode;

      const retryRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });

      const retryData = await retryRes.json();
      if (retryRes.ok && retryData.ok && retryData.result) {
        return {
          success: true,
          messageId: retryData.result.message_id,
          rawResponse: retryData.result,
        };
      }
    }

    return {
      success: false,
      errorCode: data.error_code,
      error: formatTelegramError(data.description || 'Gửi tin nhắn thất bại', data.error_code),
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Không thể kết nối đến máy chủ Telegram: ${err.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Raw Telegram API: Send document/file directly to Telegram Bot API without queuing
 */
export async function sendRawTelegramDocument(
  botToken: string,
  chatId: string,
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  options?: {
    threadId?: string | number | null;
    caption?: string;
    parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  }
): Promise<TelegramSendResult> {
  const token = botToken?.trim();
  const chat = chatId?.trim();

  if (!token) {
    return { success: false, error: 'Thiếu Bot Token' };
  }
  if (!chat) {
    return { success: false, error: 'Thiếu Chat ID' };
  }
  if (!fileBuffer || fileBuffer.length === 0) {
    return { success: false, error: 'Dữ liệu file trống' };
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', chat);
    if (options?.caption) {
      formData.append('caption', options.caption);
      formData.append('parse_mode', options.parseMode || 'HTML');
    }
    if (options?.threadId) {
      const threadNum = Number(options.threadId);
      if (!isNaN(threadNum) && threadNum > 0) {
        formData.append('message_thread_id', String(threadNum));
      }
    }

    const blob = new Blob([fileBuffer]);
    formData.append('document', blob, filename);

    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        messageId: data.result.message_id,
        rawResponse: data.result,
      };
    }

    return {
      success: false,
      errorCode: data.error_code,
      error: formatTelegramError(data.description || 'Gửi file lên Telegram thất bại', data.error_code),
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Không thể gửi file đến Telegram: ${err.message || 'Lỗi mạng'}`,
    };
  }
}
