import { TelegramConfigItem, SystemTelegramBotInfo, LoginUser } from '../../../types';
import { ForumTopicItem } from '../components/TelegramTopicSelectorModal';

export type { TelegramConfigItem, SystemTelegramBotInfo, LoginUser, ForumTopicItem };

export interface TelegramSubscriber {
  id: number;
  username: string;
  fullName: string;
  maLop: string;
  soDienThoai: string;
  isCustomBot: boolean;
  botToken: string;
  rawBotToken?: string;
  chatId: string;
  threadId?: string | null;
  isEnabled: boolean;
  notifyExamSchedule: boolean;
  notifyClassActivity: boolean;
  notifyQldtAnnouncements?: boolean;
  qldtCheckInterval?: number;
  lastQldtCheckedAt?: string | null;
  notifyClassSchedule?: boolean;
}
