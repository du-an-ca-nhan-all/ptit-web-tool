/**
 * Telegram Link & Chat ID Parsing Utility
 * 
 * Extracts Chat ID, Thread/Topic ID, or Channel Username from various Telegram URL formats,
 * invite links, and raw ID strings.
 */

export interface ParsedTelegramInput {
  raw: string;
  chatId?: string;
  threadId?: string;
  username?: string;
  isLink: boolean;
  isTopicLink: boolean;
  type: 'private' | 'group' | 'supergroup_or_channel' | 'username' | 'unknown';
  suggestedChatId?: string;
  explanation?: string;
}

/**
 * Parses any user input (raw ID, web URL, deep link, topic link, public username)
 */
export function parseTelegramInput(input: string): ParsedTelegramInput {
  const raw = (input || '').trim();
  if (!raw) {
    return { raw: '', isLink: false, isTopicLink: false, type: 'unknown' };
  }

  // 1. Check for Telegram Private Channel/Supergroup Link:
  // Examples:
  // - https://t.me/c/1987654321/42/100
  // - https://t.me/c/1987654321/42
  // - https://t.me/c/1987654321
  // - t.me/c/1987654321/42
  // - tg://resolve?domain=c/1987654321/42
  const privateLinkMatch = raw.match(
    /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/c\/(\d+)(?:\/(\d+))?(?:\/(\d+))?/i
  );
  if (privateLinkMatch) {
    const rawId = privateLinkMatch[1];
    // In Telegram, private channel links have the ID without "-100". The real Chat ID is "-100" + rawId
    const formattedChatId = rawId.startsWith('100') ? `-${rawId}` : `-100${rawId}`;
    const threadOrMsgId1 = privateLinkMatch[2];
    const threadOrMsgId2 = privateLinkMatch[3];

    // If there are 2 numbers after /c/1234/42/100: 42 is usually the thread_id, 100 is message_id.
    // If only 1 number /c/1234/42: 42 could be thread_id or message_id.
    const threadId = threadOrMsgId1 || undefined;

    return {
      raw,
      chatId: formattedChatId,
      threadId,
      isLink: true,
      isTopicLink: !!threadId,
      type: 'supergroup_or_channel',
      explanation: threadId
        ? `Đã nhận diện Link Topic: Chat ID = ${formattedChatId}, Topic ID = ${threadId}`
        : `Đã nhận diện Link Kênh/Nhóm: Chat ID = ${formattedChatId}`,
    };
  }

  // 2. Check for Telegram Web Client URLs:
  // Examples:
  // - https://web.telegram.org/a/#-1001987654321_42
  // - https://web.telegram.org/a/#-1001987654321
  // - https://web.telegram.org/k/#-1987654321
  // - https://web.telegram.org/k/#@my_channel
  const webClientMatch = raw.match(
    /(?:https?:\/\/)?web\.telegram\.org\/[ak]\/#(-?\d+)(?:_(\d+))?/i
  );
  if (webClientMatch) {
    let extractedId = webClientMatch[1];
    const threadId = webClientMatch[2] || undefined;

    // Fix negative prefix if missing -100
    if (!extractedId.startsWith('-100') && extractedId.startsWith('-')) {
      extractedId = `-100${extractedId.replace(/^-/, '')}`;
    } else if (!extractedId.startsWith('-')) {
      extractedId = `-100${extractedId}`;
    }

    return {
      raw,
      chatId: extractedId,
      threadId,
      isLink: true,
      isTopicLink: !!threadId,
      type: 'supergroup_or_channel',
      explanation: threadId
        ? `Đã trích xuất từ Telegram Web: Chat ID = ${extractedId}, Topic ID = ${threadId}`
        : `Đã trích xuất từ Telegram Web: Chat ID = ${extractedId}`,
    };
  }

  // 3. Check for Public Telegram Link with Topic / Message:
  // Examples:
  // - https://t.me/my_channel_name/42
  // - https://t.me/my_channel_name
  // - t.me/my_channel_name
  const publicLinkMatch = raw.match(
    /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})(?:\/(\d+))?/i
  );
  if (publicLinkMatch) {
    const channelHandle = `@${publicLinkMatch[1]}`;
    const threadId = publicLinkMatch[2] || undefined;

    return {
      raw,
      username: channelHandle,
      threadId,
      isLink: true,
      isTopicLink: !!threadId,
      type: 'username',
      explanation: threadId
        ? `Đã nhận diện Kênh công khai: ${channelHandle}, Topic ID = ${threadId}`
        : `Đã nhận diện Kênh công khai: ${channelHandle}`,
    };
  }

  // 4. Check for @username format
  if (/^@[a-zA-Z0-9_]{4,32}$/.test(raw)) {
    return {
      raw,
      username: raw,
      isLink: false,
      isTopicLink: false,
      type: 'username',
      explanation: `Tên định danh công khai ${raw}`,
    };
  }

  // 5. Check for Raw Numeric Chat IDs
  // Standard Supergroup / Channel: -1001234567890 (usually 13-14 characters with -100)
  if (/^-100\d{6,13}$/.test(raw)) {
    return {
      raw,
      chatId: raw,
      isLink: false,
      isTopicLink: false,
      type: 'supergroup_or_channel',
      explanation: 'Chat ID chuẩn của Nhóm Siêu Lớn / Kênh (Supergroup/Channel)',
    };
  }

  // Standard Basic Group: -123456789 (starts with - but not -100)
  if (/^-\d{6,12}$/.test(raw)) {
    return {
      raw,
      chatId: raw,
      isLink: false,
      isTopicLink: false,
      type: 'group',
      suggestedChatId: `-100${raw.replace(/^-/, '')}`,
      explanation: 'Chat ID của Nhóm cơ bản (Basic Group)',
    };
  }

  // Private User ID or Positive ID: 123456789
  if (/^\d{6,12}$/.test(raw)) {
    const suggestedChatId = `-100${raw}`;
    return {
      raw,
      chatId: raw,
      isLink: false,
      isTopicLink: false,
      type: 'private',
      suggestedChatId,
      explanation: `ID cá nhân: ${raw} (hoặc ${suggestedChatId} nếu là Kênh/Nhóm)`,
    };
  }

  return {
    raw,
    isLink: false,
    isTopicLink: false,
    type: 'unknown',
  };
}

/**
 * Extracts thread/topic ID if user pasted a topic link or message link into the Thread ID field
 */
export function parseTopicInput(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  // If already a clean integer
  if (/^\d+$/.test(raw)) {
    return raw;
  }

  // Match topic link e.g. https://t.me/c/123456789/42/100 or /42
  const parsed = parseTelegramInput(raw);
  if (parsed.threadId) {
    return parsed.threadId;
  }

  const numberMatches = raw.match(/\b\d+\b/g);
  if (numberMatches && numberMatches.length > 0) {
    return numberMatches[0];
  }

  return null;
}
