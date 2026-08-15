/**
 * Telegram Service Helper for PTIT Web Tool
 * Handles Telegram Bot API calls, message formatting, and bot verification.
 */

export interface TelegramBotInfo {
  id: number;
  isBot: boolean;
  firstName: string;
  username?: string;
  canJoinGroups?: boolean;
  canReadAllGroupMessages?: boolean;
  supportsInlineQueries?: boolean;
}

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  botInfo?: TelegramBotInfo;
  error?: string;
  errorCode?: number;
  rawResponse?: any;
}

/**
 * Clean and format error messages from Telegram API to friendly Vietnamese descriptions
 */
export function formatTelegramError(description: string, errorCode?: number): string {
  const desc = description.toLowerCase();

  if (desc.includes('unauthorized') || errorCode === 401) {
    return 'Bot Token không hợp lệ. Vui lòng kiểm tra lại token được cấp bởi @BotFather.';
  }
  if (desc.includes('bot was blocked by the user') || desc.includes('user is deactivated')) {
    return 'Bot đã bị người dùng chặn hoặc bạn chưa bấm nút "Start" (/start) với Bot trên Telegram.';
  }
  if (desc.includes('chat not found')) {
    return 'Không tìm thấy Chat ID. Vui lòng kiểm tra lại ID hoặc đảm bảo bạn đã gửi tin nhắn /start cho Bot trước.';
  }
  if (desc.includes('message thread not found') || desc.includes('thread not found') || desc.includes('topic not found')) {
    return 'Không tìm thấy Thread ID (Topic). Vui lòng kiểm tra lại Thread ID trong nhóm siêu nhóm (supergroup topic).';
  }
  if (desc.includes('bot is not a member of the group chat') || desc.includes('bot is not a member')) {
    return 'Bot chưa được thêm vào Nhóm chat. Vui lòng thêm Bot vào nhóm và cấp quyền gửi tin nhắn.';
  }
  if (desc.includes('bot is not an administrator') || desc.includes('not enough rights')) {
    return 'Bot chưa có đủ quyền quản trị viên trong Kênh/Nhóm để gửi tin nhắn.';
  }
  if (desc.includes('can\'t parse entities') || desc.includes('parse mode')) {
    return 'Lỗi định dạng nội dung tin nhắn HTML/Markdown.';
  }

  return description || `Lỗi Telegram API (Mã lỗi: ${errorCode || 'Unknown'})`;
}

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
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
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
