import React, { useState } from 'react';
import { SubscriberItem } from './types';

interface UseRemindersAndBroadcastParams {
  subscribers: SubscriberItem[];
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useRemindersAndBroadcast({
  subscribers,
  setSuccessMsg,
  setErrorMsg,
}: UseRemindersAndBroadcastParams) {
  // Exam Reminders state
  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [forceAllReminders, setForceAllReminders] = useState(false);
  const [reminderRunResult, setReminderRunResult] = useState<any | null>(null);

  // Class Schedule Reminders state (10 days scan)
  const [isTriggeringClassReminders, setIsTriggeringClassReminders] = useState(false);
  const [classReminderDays, setClassReminderDays] = useState<number>(10);
  const [classReminderRunResult, setClassReminderRunResult] = useState<any | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // Run Exam Schedule Reminders (Cron Dispatcher)
  const handleRunReminders = async () => {
    setIsTriggeringReminders(true);
    setReminderRunResult(null);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (forceAllReminders) params.append('force', 'true');
      if (customReminderDate.trim()) params.append('date', customReminderDate.trim());

      const res = await fetch(`/api/cron/exam-reminders?${params.toString()}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReminderRunResult(data);
        setSuccessMsg(
          `Quét nhắc lịch thi hoàn tất: Đã gửi ${data.reminders1DaySent} nhắc trước 1 ngày, ${data.remindersSameDaySent} nhắc 7h sáng hôm thi.`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setReminderRunResult({
          success: false,
          error: data.error || 'Lỗi khi kích hoạt quét nhắc lịch thi.',
        });
      }
    } catch {
      setReminderRunResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi chạy quét nhắc lịch thi.',
      });
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  // Run Nearest Class Schedule Scan (10 days) for all subscribers
  const handleRunClassNearestReminders = async () => {
    setIsTriggeringClassReminders(true);
    setClassReminderRunResult(null);
    setErrorMsg('');

    try {
      const res = await fetch(
        `/api/cron/class-reminders?type=nearest&days=${classReminderDays}&force=true`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setClassReminderRunResult(data);
        setSuccessMsg(
          `Quét lịch học gần nhất hoàn tất: Đã gửi thông báo tới ${data.totalSent} sinh viên có lịch học trong ${classReminderDays} ngày tới.`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setClassReminderRunResult({
          success: false,
          error: data.error || 'Lỗi khi kích hoạt quét lịch học gần nhất.',
        });
      }
    } catch {
      setClassReminderRunResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi chạy quét lịch học.',
      });
    } finally {
      setIsTriggeringClassReminders(false);
    }
  };

  // Send Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung phát sóng.');
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn gửi phát sóng thông báo này tới ${subscribers.filter((s) => s.isEnabled).length} tài khoản đang nhận thông báo không?`
      )
    ) {
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BROADCAST',
          title: broadcastTitle.trim(),
          content: broadcastContent.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastResult({
          success: true,
          message: data.message,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
        });
        setBroadcastTitle('');
        setBroadcastContent('');
      } else {
        setBroadcastResult({
          success: false,
          error: data.error || 'Phát sóng thông báo thất bại.',
        });
      }
    } catch {
      setBroadcastResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi gửi phát sóng.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return {
    isTriggeringReminders,
    customReminderDate,
    setCustomReminderDate,
    forceAllReminders,
    setForceAllReminders,
    reminderRunResult,
    isTriggeringClassReminders,
    classReminderDays,
    setClassReminderDays,
    classReminderRunResult,
    broadcastTitle,
    setBroadcastTitle,
    broadcastContent,
    setBroadcastContent,
    isBroadcasting,
    broadcastResult,
    handleRunReminders,
    handleRunClassNearestReminders,
    handleBroadcast,
  };
}
