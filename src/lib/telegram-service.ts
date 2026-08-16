import { prisma } from './prisma';

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

export interface TelegramChatInfo {
  id: number | string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  isForum?: boolean;
  description?: string;
}

export interface TelegramForumTopic {
  threadId: string;
  name: string;
  iconColor?: number;
  iconCustomEmojiId?: string;
  isGeneral?: boolean;
  lastMessageSnippet?: string;
  lastMessageDate?: string;
}

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

import { getGlobalConfig, setGlobalConfig, TelegramBotConfigValue, GLOBAL_CONFIG_KEYS } from './globalConfig';

export interface SystemBotConfigData {
  id?: number;
  botToken: string;
  botUsername?: string | null;
  botFirstName?: string | null;
  botId?: string | null;
  isActive: boolean;
  description?: string | null;
  lastTestedAt?: string | null;
  lastTestStatus?: string | null;
  lastTestError?: string | null;
  updatedAt: string;
}

/**
 * Get System Telegram Bot Token & info from GlobalConfig table (key: "telegram_bot") or Environment
 */
export async function getSystemTelegramBotConfig(): Promise<SystemBotConfigData | null> {
  try {
    const botConfig = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);

    if (botConfig && botConfig.botToken) {
      return {
        botToken: botConfig.botToken,
        botUsername: botConfig.botUsername || null,
        botFirstName: botConfig.botFirstName || 'PTIT EduSync Official Bot',
        botId: botConfig.botId || null,
        isActive: botConfig.isActive ?? true,
        description: botConfig.description || null,
        lastTestedAt: botConfig.lastTestedAt || null,
        lastTestStatus: botConfig.lastTestStatus || null,
        lastTestError: botConfig.lastTestError || null,
        updatedAt: new Date().toISOString(),
      };
    }

    // Fallback to process.env
    const envToken = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    if (envToken && envToken.trim()) {
      return {
        botToken: envToken.trim(),
        botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
        botFirstName: 'PTIT System Bot',
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error('Error loading system telegram bot config from GlobalConfig:', err);
    return null;
  }
}

/**
 * Public Info of System Bot safe to return to all users
 */
export async function getSystemTelegramBotPublicInfo() {
  const sysConfig = await getSystemTelegramBotConfig();
  if (!sysConfig || !sysConfig.botToken) {
    return {
      isConfigured: false,
      botUsername: null,
      botFirstName: null,
      botUrl: null,
      addToGroupUrl: null,
      addToChannelUrl: null,
      description: null,
      updatedAt: null,
    };
  }

  const username = sysConfig.botUsername || '';
  return {
    isConfigured: true,
    botUsername: sysConfig.botUsername || null,
    botFirstName: sysConfig.botFirstName || 'PTIT EduSync Official Bot',
    botUrl: username ? `https://t.me/${username}` : null,
    addToGroupUrl: username ? `https://t.me/${username}?startgroup=true` : null,
    addToChannelUrl: username ? `https://t.me/${username}?startchannel=true` : null,
    description: sysConfig.description || null,
    updatedAt: sysConfig.updatedAt,
  };
}

/**
 * Save System Bot Token (Admin only) to GlobalConfig table
 */
export async function saveSystemTelegramBot(botToken: string, description?: string) {
  const token = botToken?.trim();
  if (!token) {
    throw new Error('Vui lòng nhập System Telegram Bot Token');
  }

  const verifyRes = await verifyTelegramBot(token);
  if (!verifyRes.success || !verifyRes.botInfo) {
    throw new Error(verifyRes.error || 'Token Bot hệ thống không hợp lệ');
  }

  const existingConfig = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);

  const newConfigValue: TelegramBotConfigValue = {
    botToken: token,
    botUsername: verifyRes.botInfo.username || null,
    botFirstName: verifyRes.botInfo.firstName || 'PTIT EduSync Official Bot',
    botId: verifyRes.botInfo.id ? String(verifyRes.botInfo.id) : null,
    isActive: true,
    description: description || existingConfig?.description || 'Bot Telegram thông báo chính thức của hệ thống PTIT EduSync',
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: 'SUCCESS',
    lastTestError: null,
  };

  const savedRecord = await setGlobalConfig(
    GLOBAL_CONFIG_KEYS.TELEGRAM_BOT,
    newConfigValue,
    newConfigValue.description || undefined
  );

  return {
    success: true,
    botInfo: verifyRes.botInfo,
    config: {
      ...newConfigValue,
      id: savedRecord.id,
      updatedAt: savedRecord.updatedAt.toISOString(),
    },
  };
}

/**
 * Resolve effective bot token: uses customToken if provided, otherwise falls back to GlobalConfig
 */
export async function resolveEffectiveBotToken(
  customToken?: string | null
): Promise<{ token: string; isCustom: boolean }> {
  if (customToken && customToken.trim()) {
    return { token: customToken.trim(), isCustom: true };
  }

  // Fallback to GLOBAL SYSTEM BOT from GlobalConfig
  const sysConfig = await getSystemTelegramBotConfig();
  if (!sysConfig || !sysConfig.botToken) {
    throw new Error(
      'Bot Hệ Thống chưa được Admin thiết lập trong bảng GlobalConfig. Vui lòng liên hệ Quản trị viên hoặc nhập Bot Token riêng.'
    );
  }

  return { token: sysConfig.botToken, isCustom: false };
}

/**
 * Toggle System Telegram Bot Active Status
 */
export async function toggleSystemTelegramBot(isActive: boolean) {
  const existing = await getGlobalConfig<TelegramBotConfigValue>(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT);
  if (!existing) {
    throw new Error('Chưa có cấu hình Bot Hệ Thống để bật/tắt.');
  }
  const updatedValue: TelegramBotConfigValue = {
    ...existing,
    isActive,
  };
  return await setGlobalConfig(GLOBAL_CONFIG_KEYS.TELEGRAM_BOT, updatedValue);
}

