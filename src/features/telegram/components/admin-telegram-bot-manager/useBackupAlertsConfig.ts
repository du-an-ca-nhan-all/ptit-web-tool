import React, { useState } from 'react';

interface UseBackupAlertsConfigParams {
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useBackupAlertsConfig({
  setSuccessMsg,
  setErrorMsg,
}: UseBackupAlertsConfigParams) {
  const [backupConfig, setBackupConfig] = useState<any | null>(null);
  const [telChatId, setTelChatId] = useState('');
  const [telThreadId, setTelThreadId] = useState('');
  const [telIsEnabled, setTelIsEnabled] = useState(true);
  const [telSendSql, setTelSendSql] = useState(true);
  const [telAutoBackupEnabled, setTelAutoBackupEnabled] = useState(true);
  const [telScheduleTime, setTelScheduleTime] = useState('10:00');
  const [telNotifyOnDbBackup, setTelNotifyOnDbBackup] = useState(true);
  const [telNotifyOnNewUser, setTelNotifyOnNewUser] = useState(true);
  const [telNotifyOnDbRestore, setTelNotifyOnDbRestore] = useState(true);
  const [telNotifyOnExamBatchImport, setTelNotifyOnExamBatchImport] = useState(true);
  const [useCustomBackupBot, setUseCustomBackupBot] = useState(false);
  const [telBackupBotToken, setTelBackupBotToken] = useState('');
  const [isSavingBackupConfig, setIsSavingBackupConfig] = useState(false);
  const [isTestingBackupConfig, setIsTestingBackupConfig] = useState(false);
  const [isSendingInstantBackup, setIsSendingInstantBackup] = useState(false);
  const [backupTestResult, setBackupTestResult] = useState<any | null>(null);

  const hydrateFromAdminConfig = (telegramAdmin: any) => {
    setTelChatId(telegramAdmin.chatId || '');
    setTelThreadId(telegramAdmin.threadId || '');
    setTelIsEnabled(telegramAdmin.isEnabled !== false);
    setTelNotifyOnDbBackup(telegramAdmin.notifyOnDbBackup !== false);
    setTelNotifyOnNewUser(telegramAdmin.notifyOnNewUser !== false);
    setTelNotifyOnDbRestore(telegramAdmin.notifyOnDbRestore !== false);
    setTelNotifyOnExamBatchImport(telegramAdmin.notifyOnExamBatchImport !== false);
    if (telegramAdmin.botToken) {
      setUseCustomBackupBot(true);
      setTelBackupBotToken(telegramAdmin.botToken);
    }
  };

  const hydrateFromBackupConfig = (telegramConfig: any, hasAdminChatId: boolean) => {
    setBackupConfig(telegramConfig);
    if (!hasAdminChatId) {
      setTelChatId(telegramConfig.chatId || '');
      setTelThreadId(telegramConfig.threadId || '');
    }
    setTelSendSql(telegramConfig.sendSql !== false);
    setTelAutoBackupEnabled(telegramConfig.autoBackupEnabled !== false);
    setTelScheduleTime(telegramConfig.scheduleTime || '10:00');
  };

  const handleSaveBackupTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID nhận thông báo và sao lưu.');
      return;
    }
    setIsSavingBackupConfig(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const [resAdmin, resBackup] = await Promise.all([
        fetch('/api/telegram-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_ADMIN_CONFIG',
            chatId: telChatId.trim(),
            threadId: telThreadId.trim() || null,
            botToken:
              useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
            isEnabled: telIsEnabled,
            notifyOnNewUser: telNotifyOnNewUser,
            notifyOnDbBackup: telNotifyOnDbBackup,
            notifyOnDbRestore: telNotifyOnDbRestore,
            notifyOnExamBatchImport: true,
          }),
        }),
        fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_TELEGRAM_CONFIG',
            chatId: telChatId.trim(),
            threadId: telThreadId.trim() || null,
            botToken:
              useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
            isEnabled: telIsEnabled,
            sendSql: telSendSql,
            sendSqlite: telSendSql,
            autoBackupEnabled: telAutoBackupEnabled,
            scheduleTime: telScheduleTime || '10:00',
            notifyOnDbBackup: telNotifyOnDbBackup,
            notifyOnNewUser: telNotifyOnNewUser,
            notifyOnDbRestore: telNotifyOnDbRestore,
          }),
        }),
      ]);

      const dataAdmin = await resAdmin.json();
      const dataBackup = await resBackup.json();

      if (resAdmin.ok && resBackup.ok) {
        setSuccessMsg(
          'Đã lưu cấu hình kênh thông báo Admin (telegram_admin) & sao lưu thành công!'
        );
        if (dataBackup.telegramConfig) setBackupConfig(dataBackup.telegramConfig);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(dataAdmin.error || dataBackup.error || 'Lưu cấu hình Telegram thất bại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi lưu cấu hình.');
    } finally {
      setIsSavingBackupConfig(false);
    }
  };

  const handleTestBackupTelegram = async () => {
    if (!telChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID để kiểm tra.');
      return;
    }
    setIsTestingBackupConfig(true);
    setBackupTestResult(null);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_ADMIN_TARGET',
          chatId: telChatId.trim(),
          threadId: telThreadId.trim() || null,
          botToken:
            useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupTestResult({
          success: true,
          message: data.message || 'Đã gửi tin nhắn kiểm tra thành công tới kênh Admin!',
        });
      } else {
        setBackupTestResult({
          success: false,
          error: data.error || 'Kiểm tra kết nối thất bại.',
        });
      }
    } catch {
      setBackupTestResult({ success: false, error: 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsTestingBackupConfig(false);
    }
  };

  const handleSendInstantBackupToTelegram = async () => {
    setIsSendingInstantBackup(true);
    setErrorMsg('');
    setSuccessMsg(
      'Đang thực hiện sao lưu toàn bộ dữ liệu PostgreSQL sang file .sql và gửi lên Telegram...'
    );
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_TELEGRAM', format: 'sql' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã gửi file sao lưu lên Telegram thành công!');
        if (data.telegramConfig) setBackupConfig(data.telegramConfig);
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.error || 'Gửi file sao lưu lên Telegram thất bại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi gửi sao lưu.');
    } finally {
      setIsSendingInstantBackup(false);
    }
  };

  return {
    backupConfig,
    telChatId,
    setTelChatId,
    telThreadId,
    setTelThreadId,
    telIsEnabled,
    setTelIsEnabled,
    telSendSql,
    setTelSendSql,
    telAutoBackupEnabled,
    setTelAutoBackupEnabled,
    telScheduleTime,
    setTelScheduleTime,
    telNotifyOnDbBackup,
    setTelNotifyOnDbBackup,
    telNotifyOnNewUser,
    setTelNotifyOnNewUser,
    telNotifyOnDbRestore,
    setTelNotifyOnDbRestore,
    telNotifyOnExamBatchImport,
    setTelNotifyOnExamBatchImport,
    useCustomBackupBot,
    setUseCustomBackupBot,
    telBackupBotToken,
    setTelBackupBotToken,
    isSavingBackupConfig,
    isTestingBackupConfig,
    isSendingInstantBackup,
    backupTestResult,
    hydrateFromAdminConfig,
    hydrateFromBackupConfig,
    handleSaveBackupTelegramConfig,
    handleTestBackupTelegram,
    handleSendInstantBackupToTelegram,
  };
}
