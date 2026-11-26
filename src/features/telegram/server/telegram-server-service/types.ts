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

export interface DetectedTelegramChat {
  chatId: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  isForum?: boolean;
  topics: TelegramForumTopic[];
  lastMessageSnippet?: string;
  lastSender?: string;
  lastActivityDate?: string;
  isBotAdmin?: boolean;
}

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
