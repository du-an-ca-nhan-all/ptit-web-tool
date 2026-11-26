import type { TelegramChatInfo, TelegramForumTopic } from './types';
import { formatTelegramError } from './utils';

/**
 * Fetch Chat Details to check if it's a supergroup and has forum topics enabled
 */
export async function getChatInfo(
  botToken: string,
  chatId: string
): Promise<{
  success: boolean;
  chat?: TelegramChatInfo;
  error?: string;
}> {
  const token = botToken?.trim();
  const chat = chatId?.trim();

  if (!token || !chat) {
    return { success: false, error: 'Thiếu Bot Token hoặc Chat ID' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chat)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      const r = data.result;
      return {
        success: true,
        chat: {
          id: r.id,
          type: r.type,
          title: r.title || r.first_name || 'Cuộc trò chuyện',
          username: r.username,
          isForum: !!r.is_forum,
          description: r.description,
        },
      };
    }

    return {
      success: false,
      error: formatTelegramError(data.description || 'Không thể lấy thông tin nhóm chat', data.error_code),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi kết nối khi lấy thông tin nhóm: ${err.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Create a new Forum Topic in a supergroup (requires bot to have admin rights)
 */
export async function createTelegramForumTopic(
  botToken: string,
  chatId: string,
  name: string,
  iconColor?: number,
  iconCustomEmojiId?: string
): Promise<{
  success: boolean;
  topic?: TelegramForumTopic;
  error?: string;
}> {
  const token = botToken?.trim();
  const chat = chatId?.trim();
  const topicName = name?.trim();

  if (!token) return { success: false, error: 'Thiếu Bot Token' };
  if (!chat) return { success: false, error: 'Thiếu Chat ID nhóm' };
  if (!topicName) return { success: false, error: 'Tên Topic không được để trống' };

  try {
    const payload: any = {
      chat_id: chat,
      name: topicName,
    };
    if (iconColor !== undefined) payload.icon_color = iconColor;
    if (iconCustomEmojiId) payload.icon_custom_emoji_id = iconCustomEmojiId;

    const url = `https://api.telegram.org/bot${token}/createForumTopic`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        topic: {
          threadId: String(data.result.message_thread_id),
          name: data.result.name,
          iconColor: data.result.icon_color,
          iconCustomEmojiId: data.result.icon_custom_emoji_id,
        },
      };
    }

    return {
      success: false,
      error: formatTelegramError(data.description || 'Không thể tạo Topic mới', data.error_code),
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi kết nối khi tạo Topic: ${err.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Resolve Chat Info with Admin check & member count
 */
export async function resolveTelegramChatInfo(
  botToken: string,
  identifier: string
): Promise<{
  success: boolean;
  chat?: TelegramChatInfo & {
    memberCount?: number;
    isBotAdmin?: boolean;
  };
  error?: string;
}> {
  const token = botToken?.trim();
  let cleanId = (identifier || '').trim();
  if (!token || !cleanId) {
    return { success: false, error: 'Thiếu Bot Token hoặc Chat ID/Username' };
  }

  // If input is e.g. public username without @
  if (/^[a-zA-Z0-9_]{4,32}$/.test(cleanId) && !cleanId.startsWith('@') && isNaN(Number(cleanId))) {
    cleanId = `@${cleanId}`;
  }

  const baseChatRes = await getChatInfo(token, cleanId);
  if (!baseChatRes.success || !baseChatRes.chat) {
    return {
      success: false,
      error: baseChatRes.error || 'Không tìm thấy cuộc trò chuyện hoặc Kênh Telegram này',
    };
  }

  const chat = baseChatRes.chat;
  let memberCount: number | undefined;
  let isBotAdmin: boolean | undefined;

  // Try to get member count
  try {
    const countUrl = `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(String(chat.id))}`;
    const countRes = await fetch(countUrl);
    const countData = await countRes.json();
    if (countRes.ok && countData.ok) {
      memberCount = countData.result;
    }
  } catch {}

  // Try to check if bot is admin in the chat (if channel/supergroup)
  if (chat.type === 'channel' || chat.type === 'supergroup') {
    try {
      const adminsUrl = `https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=${encodeURIComponent(String(chat.id))}`;
      const adminsRes = await fetch(adminsUrl);
      const adminsData = await adminsRes.json();
      if (adminsRes.ok && adminsData.ok && Array.isArray(adminsData.result)) {
        isBotAdmin = adminsData.result.some((adm: any) => adm.user?.is_bot && adm.status === 'administrator');
      }
    } catch {}
  }

  return {
    success: true,
    chat: {
      ...chat,
      memberCount,
      isBotAdmin,
    },
  };
}
