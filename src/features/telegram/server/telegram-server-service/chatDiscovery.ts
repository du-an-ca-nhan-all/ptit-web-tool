import type { DetectedTelegramChat, TelegramForumTopic } from './types';
import { formatTelegramError } from './utils';

interface ChatMapEntry {
  chatId: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  isForum?: boolean;
  topicMap: Map<string, TelegramForumTopic>;
  lastMessageSnippet?: string;
  lastSender?: string;
  lastActivityDate?: string;
  isBotAdmin?: boolean;
}

function updateTopicFromMessage(params: {
  topicMap: Map<string, TelegramForumTopic>;
  msg: any;
  textSnippet: string;
  msgDate: string;
}): void {
  const { topicMap, msg, textSnippet, msgDate } = params;
  if (msg.forum_topic_created) {
    const threadId = String(msg.message_thread_id || msg.message_id);
    topicMap.set(threadId, {
      threadId,
      name: msg.forum_topic_created.name || `Topic #${threadId}`,
      iconColor: msg.forum_topic_created.icon_color,
      iconCustomEmojiId: msg.forum_topic_created.icon_custom_emoji_id,
      isGeneral: threadId === '1',
      lastMessageSnippet: textSnippet,
      lastMessageDate: msgDate,
    });
    return;
  }

  if (msg.forum_topic_edited) {
    const threadId = String(msg.message_thread_id || msg.message_id);
    const existing = topicMap.get(threadId);
    if (existing && msg.forum_topic_edited.name) existing.name = msg.forum_topic_edited.name;
    return;
  }

  if (!msg.message_thread_id) return;
  const threadId = String(msg.message_thread_id);
  const existing = topicMap.get(threadId);
  if (!existing) {
    topicMap.set(threadId, {
      threadId,
      name: threadId === '1' ? 'General (Chung)' : `Topic #${threadId}`,
      isGeneral: threadId === '1',
      lastMessageSnippet: textSnippet,
      lastMessageDate: msgDate,
    });
    return;
  }

  if (msgDate && (!existing.lastMessageDate || new Date(msgDate) > new Date(existing.lastMessageDate))) {
    existing.lastMessageDate = msgDate;
    if (textSnippet) existing.lastMessageSnippet = textSnippet;
  }
}

function applyMessageUpdate(chatMap: Map<string, ChatMapEntry>, update: any, msg: any): void {
  const rawChatId = String(msg.chat.id);
  const chatType = msg.chat.type || (rawChatId.startsWith('-100') ? 'supergroup' : 'private');
  const chatTitle =
    msg.chat.title ||
    [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') ||
    (msg.chat.username ? `@${msg.chat.username}` : `Chat ${rawChatId}`);
  const senderName = msg.from
    ? [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || msg.from.username
    : undefined;
  const textSnippet = (
    msg.text ||
    msg.caption ||
    (msg.forum_topic_created ? `Đã tạo chủ đề: ${msg.forum_topic_created.name}` : '')
  ).substring(0, 100);
  const msgDate = msg.date ? new Date(msg.date * 1000).toISOString() : new Date().toISOString();

  if (!chatMap.has(rawChatId)) {
    const topicMap = new Map<string, TelegramForumTopic>();
    if (msg.chat.is_forum) {
      topicMap.set('1', { threadId: '1', name: 'General (Chung)', isGeneral: true, lastMessageSnippet: 'Chủ đề mặc định' });
    }
    chatMap.set(rawChatId, {
      chatId: rawChatId,
      title: chatTitle,
      type: chatType,
      username: msg.chat.username ? `@${msg.chat.username}` : undefined,
      isForum: !!msg.chat.is_forum,
      topicMap,
      lastMessageSnippet: textSnippet || undefined,
      lastSender: senderName,
      lastActivityDate: msgDate,
      isBotAdmin: update.channel_post || update.edited_channel_post ? true : undefined,
    });
  }

  const chatEntry = chatMap.get(rawChatId)!;
  if (!chatEntry.lastActivityDate || new Date(msgDate) >= new Date(chatEntry.lastActivityDate)) {
    chatEntry.lastActivityDate = msgDate;
    if (textSnippet) chatEntry.lastMessageSnippet = textSnippet;
    if (senderName) chatEntry.lastSender = senderName;
  }

  updateTopicFromMessage({ topicMap: chatEntry.topicMap, msg, textSnippet, msgDate });
}

function applyMyChatMemberUpdate(chatMap: Map<string, ChatMapEntry>, myChatMember: any): void {
  const rawChatId = String(myChatMember.chat.id);
  const chatType = myChatMember.chat.type || 'group';
  const chatTitle = myChatMember.chat.title || `Chat ${rawChatId}`;
  const isBotAdmin = myChatMember.new_chat_member?.status === 'administrator';
  const date = myChatMember.date ? new Date(myChatMember.date * 1000).toISOString() : new Date().toISOString();

  const entry = chatMap.get(rawChatId);
  if (!entry) {
    chatMap.set(rawChatId, {
      chatId: rawChatId,
      title: chatTitle,
      type: chatType,
      username: myChatMember.chat.username ? `@${myChatMember.chat.username}` : undefined,
      isForum: !!myChatMember.chat.is_forum,
      topicMap: new Map(),
      lastMessageSnippet: isBotAdmin ? 'Bot được cấp quyền Quản trị viên' : 'Bot được thêm vào cuộc trò chuyện',
      lastActivityDate: date,
      isBotAdmin,
    });
    return;
  }

  if (isBotAdmin !== undefined) entry.isBotAdmin = isBotAdmin;
  if (date && (!entry.lastActivityDate || new Date(date) > new Date(entry.lastActivityDate))) {
    entry.lastActivityDate = date;
  }
}

/**
 * Scan recent updates received by the bot to detect active chats, groups, channels, and forum topics
 */
export async function detectRecentTelegramChats(botToken: string): Promise<{
  success: boolean;
  chats: DetectedTelegramChat[];
  error?: string;
}> {
  const token = botToken?.trim();
  if (!token) {
    return { success: false, chats: [], error: 'Thiếu Bot Token' };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=${encodeURIComponent(
      JSON.stringify(['message', 'edited_message', 'channel_post', 'edited_channel_post', 'my_chat_member', 'chat_member'])
    )}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.ok || !Array.isArray(data.result)) {
      return {
        success: false,
        chats: [],
        error: formatTelegramError(data.description || 'Không thể lấy thông tin cập nhật từ bot', data.error_code),
      };
    }

    const chatMap = new Map<string, ChatMapEntry>();

    for (const update of data.result) {
      const msg = update.message || update.edited_message || update.channel_post || update.edited_channel_post;
      if (msg && msg.chat) applyMessageUpdate(chatMap, update, msg);
      if (update.my_chat_member?.chat) applyMyChatMemberUpdate(chatMap, update.my_chat_member);
    }

    const chatsList: DetectedTelegramChat[] = Array.from(chatMap.values())
      .map((entry) => {
        const topics = Array.from(entry.topicMap.values()).sort((a, b) => {
          if (a.isGeneral) return -1;
          if (b.isGeneral) return 1;
          return Number(a.threadId) - Number(b.threadId);
        });
        return {
          chatId: entry.chatId,
          title: entry.title,
          type: entry.type,
          username: entry.username,
          isForum: entry.isForum,
          topics,
          lastMessageSnippet: entry.lastMessageSnippet,
          lastSender: entry.lastSender,
          lastActivityDate: entry.lastActivityDate,
          isBotAdmin: entry.isBotAdmin,
        };
      })
      .sort((a, b) => {
        const timeA = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0;
        const timeB = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0;
        return timeB - timeA;
      });

    return { success: true, chats: chatsList };
  } catch (err: any) {
    return {
      success: false,
      chats: [],
      error: `Lỗi kết nối khi quét cập nhật Telegram: ${err.message || 'Lỗi mạng'}`,
    };
  }
}
