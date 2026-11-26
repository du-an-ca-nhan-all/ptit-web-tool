import React, { useState } from 'react';
import { TelegramConfigItem } from '../../../../types';
import { TelegramTestResult } from './types';

interface UseTelegramConfigActionsParams {
  targetUsername?: string;
  isCustomBot: boolean;
  botToken: string;
  chatId: string;
  threadId: string;
  isEnabled: boolean;
  notifyExamSchedule: boolean;
  notifyClassActivity: boolean;
  notifyQldtAnnouncements: boolean;
  qldtCheckInterval: number;
  notifySlinkAnnouncements: boolean;
  slinkCheckInterval: number;
  notifyClassSchedule: boolean;
  classReminderBefore: number;
  onConfigUpdated?: (config: TelegramConfigItem | null) => void;
  fetchConfig: () => Promise<void>;
  setConfig: (config: TelegramConfigItem | null) => void;
  setBotToken: (val: string) => void;
  setChatId: (val: string) => void;
  setThreadId: (val: string) => void;
  setSelectedTopicName: (val: string | null) => void;
  setIsCustomBot: (val: boolean) => void;
  setTestResult: (val: TelegramTestResult | null) => void;
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useTelegramConfigActions({
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
}: UseTelegramConfigActionsParams) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Save User Configuration
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isCustomBot && !botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token riêng.');
      return;
    }
    if (!chatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE',
          targetUsername: targetUsername || undefined,
          botToken: isCustomBot ? botToken.trim() : null,
          chatId: chatId.trim(),
          threadId: threadId.trim() || null,
          isEnabled,
          notifyExamSchedule,
          notifyClassActivity,
          notifyQldtAnnouncements,
          qldtCheckInterval,
          notifySlinkAnnouncements,
          slinkCheckInterval,
          notifyClassSchedule,
          classReminderBefore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã lưu cấu hình Telegram thành công!');
        setConfig(data.config);
        if (onConfigUpdated) onConfigUpdated(data.config);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể lưu cấu hình.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Test Send Notification
  const handleTest = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setTestResult(null);

    if (isCustomBot && !botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token riêng trước khi gửi thử nghiệm.');
      return;
    }
    if (!chatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận trước khi gửi thử nghiệm.');
      return;
    }

    setIsTesting(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          targetUsername: targetUsername || undefined,
          botToken: isCustomBot ? botToken.trim() : undefined,
          chatId: chatId.trim(),
          threadId: threadId.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          botInfo: data.botInfo,
        });
        setSuccessMsg(data.message || 'Đã gửi tin nhắn thử nghiệm thành công!');
        fetchConfig();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Gửi thử nghiệm thất bại.',
        });
        setErrorMsg(data.error || 'Gửi tin nhắn thử nghiệm thất bại.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ để gửi tin nhắn thử nghiệm.');
      setTestResult({
        success: false,
        error: 'Lỗi kết nối mạng hoặc máy chủ.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Delete / Disconnect
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy liên kết và xóa cấu hình Telegram này không?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          targetUsername: targetUsername || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã xóa cấu hình Telegram.');
        setConfig(null);
        setBotToken('');
        setChatId('');
        setThreadId('');
        setSelectedTopicName(null);
        setTestResult(null);
        setIsCustomBot(false);
        if (onConfigUpdated) onConfigUpdated(null);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể xóa cấu hình.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isSaving,
    isTesting,
    isDeleting,
    handleSave,
    handleTest,
    handleDelete,
  };
}
