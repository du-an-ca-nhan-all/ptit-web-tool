import React, { useEffect, useState } from 'react';
import { SubscriberItem } from './types';

interface UseGlobalBotConfigParams {
  onQueueStats: (stats: any) => void;
  onHydrateAdminConfig: (telegramAdmin: any) => void;
  onHydrateBackupConfig: (telegramConfig: any, hasAdminChatId: boolean) => void;
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useGlobalBotConfig({
  onQueueStats,
  onHydrateAdminConfig,
  onHydrateBackupConfig,
  setSuccessMsg,
  setErrorMsg,
}: UseGlobalBotConfigParams) {
  const [isLoading, setIsLoading] = useState(true);

  // Global bot state
  const [systemBot, setSystemBot] = useState<any | null>(null);
  const [systemBotConfig, setSystemBotConfig] = useState<any | null>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);

  // Admin Direct Test state
  const [testChatId, setTestChatId] = useState('');
  const [testThreadId, setTestThreadId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [res, backupRes] = await Promise.all([
        fetch('/api/telegram-config?view=all'),
        fetch('/api/backup').catch(() => null),
      ]);

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribers(data.configs || []);
        setSystemBot(data.systemBot || null);
        if (data.queueStats) {
          onQueueStats(data.queueStats);
        }
        if (data.systemBotConfig) {
          setSystemBotConfig(data.systemBotConfig);
          setBotTokenInput(data.systemBotConfig.botToken || '');
          setBotDescription(data.systemBotConfig.description || '');
        }
        if (data.telegramAdmin) {
          onHydrateAdminConfig(data.telegramAdmin);
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu cấu hình Telegram.');
      }

      if (backupRes && backupRes.ok) {
        const backupData = await backupRes.json();
        if (backupData.telegramConfig) {
          onHydrateBackupConfig(backupData.telegramConfig, Boolean(data?.telegramAdmin?.chatId));
        }
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveGlobalBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot API Token.');
      return;
    }

    setIsSavingBot(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SYSTEM_BOT',
          botToken: botTokenInput.trim(),
          description: botDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã lưu cấu hình Bot Hệ Thống thành công!');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Không thể lưu Bot Hệ Thống.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsSavingBot(false);
    }
  };

  const handleToggleGlobalBot = async () => {
    if (!systemBotConfig) return;
    const newStatus = !systemBotConfig.isActive;

    setIsTogglingBot(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_SYSTEM_BOT',
          isActive: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã cập nhật trạng thái Bot Hệ Thống.');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể cập nhật trạng thái.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsTogglingBot(false);
    }
  };

  const handleAdminTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận để gửi thử nghiệm.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          chatId: testChatId.trim(),
          threadId: testThreadId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Đã gửi tin nhắn thử nghiệm thành công!',
          botInfo: data.botInfo,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Gửi tin nhắn thử nghiệm thất bại.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi gửi tin nhắn.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return {
    isLoading,
    systemBot,
    systemBotConfig,
    botTokenInput,
    setBotTokenInput,
    botDescription,
    setBotDescription,
    showToken,
    setShowToken,
    isSavingBot,
    isTogglingBot,
    subscribers,
    testChatId,
    setTestChatId,
    testThreadId,
    setTestThreadId,
    isTesting,
    testResult,
    fetchData,
    handleSaveGlobalBot,
    handleToggleGlobalBot,
    handleAdminTest,
  };
}
