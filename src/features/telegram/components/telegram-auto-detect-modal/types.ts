export type DetectTabType = 'ALL' | 'PRIVATE' | 'GROUP' | 'CHANNEL' | 'LINK';

export interface SelectedTelegramChat {
  chatId: string;
  chatTitle: string;
  chatType: string;
  threadId?: string;
  topicName?: string;
}

export interface TelegramAutoDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToken?: string;
  botUsername?: string | null;
  onSelectChat: (selected: SelectedTelegramChat) => void;
}
