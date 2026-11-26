export interface ForumTopicItem {
  threadId: string;
  name: string;
  iconColor?: number;
  iconCustomEmojiId?: string;
  isGeneral?: boolean;
  lastMessageSnippet?: string;
  lastMessageDate?: string;
}

export interface TelegramTopicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToken?: string;
  chatId: string;
  currentSelectedThreadId?: string;
  onSelectTopic: (topic: { threadId: string; name: string }) => void;
}
