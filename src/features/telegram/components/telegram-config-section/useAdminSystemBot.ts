import React, { useState } from 'react';

interface UseAdminSystemBotParams {
  onSaved: () => void;
}

export function useAdminSystemBot({ onSaved }: UseAdminSystemBotParams) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminSystemToken, setAdminSystemToken] = useState('');
  const [isSavingSystemBot, setIsSavingSystemBot] = useState(false);
  const [systemBotMsg, setSystemBotMsg] = useState('');
  const [systemBotError, setSystemBotError] = useState('');

  const handleSaveSystemBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSystemToken.trim()) {
      setSystemBotError('Vui lòng nhập Bot Token cho hệ thống.');
      return;
    }

    setIsSavingSystemBot(true);
    setSystemBotMsg('');
    setSystemBotError('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SYSTEM_BOT',
          botToken: adminSystemToken.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSystemBotMsg(data.message || 'Đã lưu Bot Hệ Thống thành công!');
        onSaved();
        setTimeout(() => setSystemBotMsg(''), 5000);
      } else {
        setSystemBotError(data.error || 'Không thể lưu Bot Hệ Thống.');
      }
    } catch (err) {
      setSystemBotError('Lỗi kết nối khi lưu Bot Hệ Thống.');
    } finally {
      setIsSavingSystemBot(false);
    }
  };

  return {
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    adminSystemToken,
    setAdminSystemToken,
    isSavingSystemBot,
    systemBotMsg,
    systemBotError,
    handleSaveSystemBot,
  };
}
