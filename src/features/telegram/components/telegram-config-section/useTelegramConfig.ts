import { useState, useEffect } from 'react';
import { TelegramConfigItem, SystemTelegramBotInfo } from '../../../../types';
import {
  TelegramConfigSectionProps,
  ExternalAccountStatus,
  TelegramTestResult,
} from './types';
import { useAdminSystemBot } from './useAdminSystemBot';
import { useTelegramCheckActions } from './useTelegramCheckActions';
import { useTelegramConfigActions } from './useTelegramConfigActions';
import { useTelegramInputParsers } from './useTelegramInputParsers';

export function useTelegramConfig({
  currentUser,
  targetUsername,
  onConfigUpdated,
}: Pick<TelegramConfigSectionProps, 'currentUser' | 'targetUsername' | 'onConfigUpdated'>) {
  const [config, setConfig] = useState<TelegramConfigItem | null>(null);
  const [systemBot, setSystemBot] = useState<SystemTelegramBotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomBot, setIsCustomBot] = useState(false);

  // Form states
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [notifyExamSchedule, setNotifyExamSchedule] = useState(true);
  const [notifyClassActivity, setNotifyClassActivity] = useState(true);
  const [notifyQldtAnnouncements, setNotifyQldtAnnouncements] = useState(true);
  const [qldtCheckInterval, setQldtCheckInterval] = useState<number>(2);
  const [notifySlinkAnnouncements, setNotifySlinkAnnouncements] = useState(true);
  const [slinkCheckInterval, setSlinkCheckInterval] = useState<number>(2);
  const [notifyClassSchedule, setNotifyClassSchedule] = useState(true);
  const [classReminderBefore, setClassReminderBefore] = useState<number>(30);

  // External Account Statuses & UI helpers
  const [qldttxStatus, setQldttxStatus] = useState<ExternalAccountStatus | null>(null);
  const [slinkStatus, setSlinkStatus] = useState<ExternalAccountStatus | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isAutoDetectModalOpen, setIsAutoDetectModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<TelegramTestResult | null>(null);

  const isAdmin = Boolean(
    currentUser?.activeRole === 'admin' ||
    (currentUser?.isAdmin && currentUser?.activeRole !== 'sinh_vien' && currentUser?.activeRole !== 'lop_truong') ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );
  const usernameToQuery = targetUsername || currentUser?.username;

  const isQldttxConnected = Boolean(qldttxStatus?.isConfigured && qldttxStatus?.status === 'CONNECTED');
  const isQldttxError = Boolean(qldttxStatus?.isConfigured && qldttxStatus?.status === 'ERROR');
  const isQldttxAvailable = isQldttxConnected;

  const isSlinkConnected = Boolean(slinkStatus?.isConfigured && slinkStatus?.status === 'CONNECTED');
  const isSlinkError = Boolean(slinkStatus?.isConfigured && slinkStatus?.status === 'ERROR');
  const isSlinkAvailable = isSlinkConnected;

  const adminBot = useAdminSystemBot({ onSaved: () => fetchConfig() });

  // Fetch current user's Telegram config and System Bot info
  const fetchConfig = async () => {
    if (!usernameToQuery) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const url = targetUsername
        ? `/api/telegram-config?username=${encodeURIComponent(targetUsername)}`
        : '/api/telegram-config';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.systemBot) setSystemBot(data.systemBot);
        if (data.systemBotConfig && data.systemBotConfig.botToken) {
          adminBot.setAdminSystemToken(data.systemBotConfig.botToken);
        }
        if (data.qldttxStatus) setQldttxStatus(data.qldttxStatus);
        if (data.slinkStatus) setSlinkStatus(data.slinkStatus);

        if (data.config) {
          setConfig(data.config);
          setIsCustomBot(!!data.config.botToken);
          setBotToken(data.config.botToken || '');
          setChatId(data.config.chatId || '');
          setThreadId(data.config.threadId || '');
          setIsEnabled(data.config.isEnabled ?? true);
          setNotifyExamSchedule(data.config.notifyExamSchedule ?? true);
          setNotifyClassActivity(data.config.notifyClassActivity ?? true);
          setNotifyQldtAnnouncements(data.config.notifyQldtAnnouncements ?? true);
          setQldtCheckInterval(data.config.qldtCheckInterval ?? 2);
          setNotifySlinkAnnouncements(data.config.notifySlinkAnnouncements ?? true);
          setSlinkCheckInterval(data.config.slinkCheckInterval ?? 2);
          setNotifyClassSchedule(data.config.notifyClassSchedule ?? true);
          setClassReminderBefore(data.config.classReminderBefore ?? 30);
          if (data.config.lastTestStatus) {
            setTestResult({
              success: data.config.lastTestStatus === 'SUCCESS',
              message: data.config.lastTestStatus === 'SUCCESS' ? 'Lần kiểm tra gần nhất thành công' : undefined,
              error: data.config.lastTestError || undefined,
              botInfo: data.config.botUsername ? { username: data.config.botUsername, firstName: data.config.botFirstName } : null,
            });
          }
        } else {
          setConfig(null);
          setIsCustomBot(false);
        }
      }
    } catch (err: any) {
      console.error('Fetch Telegram config error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [usernameToQuery]);

  const inputParsers = useTelegramInputParsers({
    setChatId,
    setThreadId,
    setSelectedTopicName,
    setIsCustomBot,
    setBotToken,
    setSuccessMsg,
  });

  const checkActions = useTelegramCheckActions({ targetUsername, setErrorMsg });
  const configActions = useTelegramConfigActions({
    targetUsername,
    isCustomBot,
    botToken,
    chatId,
    threadId,
    isEnabled,
    notifyExamSchedule,
    notifyClassActivity,
    notifyQldtAnnouncements,
    qldtCheckInterval,
    notifySlinkAnnouncements,
    slinkCheckInterval,
    notifyClassSchedule,
    classReminderBefore,
    onConfigUpdated,
    fetchConfig,
    setConfig,
    setBotToken,
    setChatId,
    setThreadId,
    setSelectedTopicName,
    setIsCustomBot,
    setTestResult,
    setSuccessMsg,
    setErrorMsg,
  });

  const isConnected = !!config?.id;
  const isCustomConfigValid = !isCustomBot || !!(config?.botToken && config.botToken.trim());
  const isTelegramConfigured = Boolean(isConnected && config?.chatId && isCustomConfigValid);
  const isTelegramTestSuccess = Boolean(
    testResult ? testResult.success : config?.lastTestStatus === 'SUCCESS'
  );
  const isTelegramReady = Boolean(isTelegramConfigured && isTelegramTestSuccess);
  const activeBotUsername =
    !isCustomBot ? systemBot?.botUsername : (config?.botUsername || 'CustomBot');

  return {
    config,
    systemBot,
    isLoading,
    isCustomBot,
    setIsCustomBot,
    botToken,
    setBotToken,
    chatId,
    setChatId,
    threadId,
    setThreadId,
    selectedTopicName,
    setSelectedTopicName,
    isTopicModalOpen,
    setIsTopicModalOpen,
    isEnabled,
    setIsEnabled,
    notifyExamSchedule,
    setNotifyExamSchedule,
    notifyClassActivity,
    setNotifyClassActivity,
    notifyQldtAnnouncements,
    setNotifyQldtAnnouncements,
    qldtCheckInterval,
    setQldtCheckInterval,
    notifySlinkAnnouncements,
    setNotifySlinkAnnouncements,
    slinkCheckInterval,
    setSlinkCheckInterval,
    notifyClassSchedule,
    setNotifyClassSchedule,
    classReminderBefore,
    setClassReminderBefore,
    showToken,
    setShowToken,
    showGuide,
    setShowGuide,
    isAutoDetectModalOpen,
    setIsAutoDetectModalOpen,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    testResult,
    isAdmin,
    usernameToQuery,
    isQldttxError,
    isQldttxAvailable,
    isSlinkError,
    isSlinkAvailable,
    isConnected,
    isTelegramConfigured,
    isTelegramReady,
    activeBotUsername,
    ...inputParsers,
    ...adminBot,
    ...checkActions,
    ...configActions,
  };
}

export type TelegramConfigState = ReturnType<typeof useTelegramConfig>;
