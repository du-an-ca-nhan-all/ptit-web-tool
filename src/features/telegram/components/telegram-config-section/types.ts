import { TelegramConfigItem, LoginUser } from '../../../../types';

export interface TelegramConfigSectionProps {
  currentUser?: LoginUser | null;
  targetUsername?: string;
  onConfigUpdated?: (config: TelegramConfigItem | null) => void;
  onNavigateTab?: (tab: string) => void;
}

export interface ExternalAccountStatus {
  isConfigured: boolean;
  status: string;
  syncMessage?: string | null;
  lastSyncAt?: string | null;
}

export interface TelegramTestResult {
  success: boolean;
  message?: string;
  botInfo?: any;
  error?: string;
}
