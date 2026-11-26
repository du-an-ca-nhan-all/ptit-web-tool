import type { TelegramChatInfo, TelegramForumTopic } from './types';
import { getChatInfo } from './chatInfo';

/**
 * Pull and scan forum topics from recent updates / messages in the group
 */
export async function pullForumTopics(
  botToken: string,
  chatId: string
): Promise<{
  success: boolean;
  chat?: TelegramChatInfo;
  topics: TelegramForumTopic[];
  isForumGroup: boolean;
  error?: string;
}> {
  const token = botToken?.trim();
  const chat = chatId?.trim();

  if (!token || !chat) {
    return {
      success: false,
      topics: [],
      isForumGroup: false,
      error: 'Thiếu Bot Token hoặc Chat ID',
    };
  }

  // 1. Fetch Chat Info
  const chatRes = await getChatInfo(token, chat);
  if (!chatRes.success) {
    return {
      success: false,
      topics: [],
      isForumGroup: false,
      error: chatRes.error || 'Không thể kiểm tra thông tin nhóm chat',
    };
  }

  const chatInfo = chatRes.chat!;
  const isForumGroup = !!chatInfo.isForum || chatInfo.type === 'supergroup';

  // Map to store discovered topics keyed by threadId
  const topicMap = new Map<string, TelegramForumTopic>();

  // Always register "General" topic (ID 1) if it's a forum supergroup
  if (chatInfo.isForum) {
    topicMap.set('1', {
      threadId: '1',
      name: 'General (Chung)',
      isGeneral: true,
      lastMessageSnippet: 'Chủ đề mặc định của nhóm',
    });
  }

  // 2. Fetch recent updates to discover topic creation events and thread IDs
  try {
    const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=${encodeURIComponent(
      JSON.stringify(['message', 'edited_message', 'channel_post'])
    )}`;
    const updatesRes = await fetch(updatesUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const updatesData = await updatesRes.json();
    if (updatesRes.ok && updatesData.ok && Array.isArray(updatesData.result)) {
      const normalizedTargetChatId = String(chatInfo.id);

      for (const update of updatesData.result) {
        const msg = update.message || update.edited_message || update.channel_post;
        if (!msg || !msg.chat) continue;

        const msgChatId = String(msg.chat.id);
        if (msgChatId !== normalizedTargetChatId && msgChatId !== chat) continue;

        // Check forum_topic_created action
        if (msg.forum_topic_created) {
          const threadId = String(msg.message_thread_id || msg.message_id);
          const existing = topicMap.get(threadId);
          topicMap.set(threadId, {
            threadId,
            name: msg.forum_topic_created.name || `Topic #${threadId}`,
            iconColor: msg.forum_topic_created.icon_color,
            iconCustomEmojiId: msg.forum_topic_created.icon_custom_emoji_id,
            isGeneral: threadId === '1',
            lastMessageDate: msg.date ? new Date(msg.date * 1000).toISOString() : existing?.lastMessageDate,
          });
        }

        // Check forum_topic_edited action
        if (msg.forum_topic_edited) {
          const threadId = String(msg.message_thread_id || msg.message_id);
          const existing = topicMap.get(threadId);
          if (existing) {
            if (msg.forum_topic_edited.name) existing.name = msg.forum_topic_edited.name;
            if (msg.forum_topic_edited.icon_custom_emoji_id) existing.iconCustomEmojiId = msg.forum_topic_edited.icon_custom_emoji_id;
          }
        }

        // Check regular messages that have message_thread_id
        if (msg.message_thread_id) {
          const threadId = String(msg.message_thread_id);
          const textSnippet = (msg.text || msg.caption || '').substring(0, 60);
          const msgDate = msg.date ? new Date(msg.date * 1000).toISOString() : undefined;

          if (!topicMap.has(threadId)) {
            topicMap.set(threadId, {
              threadId,
              name: threadId === '1' ? 'General (Chung)' : `Topic #${threadId}`,
              isGeneral: threadId === '1',
              lastMessageSnippet: textSnippet || undefined,
              lastMessageDate: msgDate,
            });
          } else {
            const existing = topicMap.get(threadId)!;
            if (textSnippet && !existing.lastMessageSnippet) {
              existing.lastMessageSnippet = textSnippet;
            }
            if (msgDate && (!existing.lastMessageDate || new Date(msgDate) > new Date(existing.lastMessageDate))) {
              existing.lastMessageDate = msgDate;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Telegram updates for topics:', err);
  }

  const topicList = Array.from(topicMap.values()).sort((a, b) => {
    if (a.isGeneral) return -1;
    if (b.isGeneral) return 1;
    return Number(a.threadId) - Number(b.threadId);
  });

  return {
    success: true,
    chat: chatInfo,
    topics: topicList,
    isForumGroup,
  };
}
