import { useState } from 'react';

interface UseTelegramCheckActionsParams {
  targetUsername?: string;
  setErrorMsg: (msg: string) => void;
}

export function useTelegramCheckActions({
  targetUsername,
  setErrorMsg,
}: UseTelegramCheckActionsParams) {
  const [isCheckingQldt, setIsCheckingQldt] = useState(false);
  const [qldtCheckMsg, setQldtCheckMsg] = useState('');
  const [isCheckingSlink, setIsCheckingSlink] = useState(false);
  const [slinkCheckMsg, setSlinkCheckMsg] = useState('');
  const [isCheckingClassSchedule, setIsCheckingClassSchedule] = useState(false);
  const [classScheduleCheckMsg, setClassScheduleCheckMsg] = useState('');
  const [isCheckingNearestClassSchedule, setIsCheckingNearestClassSchedule] = useState(false);
  const [nearestClassScheduleMsg, setNearestClassScheduleMsg] = useState('');

  // Check QLDTTX announcements now
  const handleCheckQldtNow = async () => {
    setIsCheckingQldt(true);
    setQldtCheckMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_QLDT_ANNOUNCEMENTS',
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQldtCheckMsg(
          data.totalAnnouncementsDispatched > 0
            ? `Đã quét cổng QLDTTX: Phát hiện và đã gửi ${data.totalAnnouncementsDispatched} thông báo mới về Telegram của bạn!`
            : 'Đã quét cổng QLDTTX: Không có thông báo mới nào hoặc đã được gửi trước đó.'
        );
      } else {
        setErrorMsg(data.error || 'Lỗi khi kiểm tra thông báo cổng QLDTTX.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để kiểm tra thông báo QLDTTX.');
    } finally {
      setIsCheckingQldt(false);
    }
  };

  // Check S-Link announcements now
  const handleCheckSlinkNow = async () => {
    setIsCheckingSlink(true);
    setSlinkCheckMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_SLINK_ANNOUNCEMENTS',
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSlinkCheckMsg(
          data.totalAnnouncementsDispatched > 0
            ? `Đã quét S-Link: Phát hiện và đã gửi ${data.totalAnnouncementsDispatched} thông báo mới về Telegram và tự động đánh dấu đã đọc!`
            : 'Đã quét S-Link: Không có thông báo mới nào hoặc đã được gửi trước đó.'
        );
      } else {
        setErrorMsg(data.error || 'Lỗi khi kiểm tra thông báo PTIT S-Link.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để kiểm tra thông báo PTIT S-Link.');
    } finally {
      setIsCheckingSlink(false);
    }
  };

  // Check Class schedule now
  const handleCheckClassScheduleNow = async () => {
    setIsCheckingClassSchedule(true);
    setClassScheduleCheckMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_CLASS_SCHEDULE_NOW',
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.morningSummariesSent > 0 || data.preClassAlertsSent > 0) {
          setClassScheduleCheckMsg(
            `Đã gọi API kiểm tra lịch học (${data.todayDowName} - ${data.todayStr}) và đã gửi thông báo lên Telegram!`
          );
        } else {
          setClassScheduleCheckMsg(
            `Đã gọi API kiểm tra lịch học (${data.todayDowName} - ${data.todayStr}): Hôm nay bạn không có ca học nào trên hệ thống (đã gửi thông báo xác nhận lên Telegram).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Lỗi khi kiểm tra lịch học.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để kiểm tra lịch học.');
    } finally {
      setIsCheckingClassSchedule(false);
    }
  };

  // Check nearest class schedule in next 10 days
  const handleCheckNearestClassSchedule = async () => {
    setIsCheckingNearestClassSchedule(true);
    setNearestClassScheduleMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_NEAREST_CLASS_SCHEDULE',
          maxDays: 10,
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.totalSent > 0 && data.results && data.results[0]?.found) {
          const r = data.results[0];
          const offsetText =
            r.dayOffset === 0
              ? 'Hôm nay'
              : r.dayOffset === 1
              ? 'Ngày mai'
              : `sau ${r.dayOffset} ngày nữa`;
          setNearestClassScheduleMsg(
            `Đã gọi API quét lịch học: Tìm thấy ngày học gần nhất vào ${r.dowName}, ngày ${r.dateStr} (${offsetText}) gồm ${r.sessionsCount} ca học và đã gửi chi tiết lên Telegram!`
          );
        } else {
          setNearestClassScheduleMsg(
            `Đã gọi API quét thời khóa biểu: Trong 10 ngày tới bạn không có ca học nào trên hệ thống (đã gửi thông báo xác nhận lên Telegram).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Lỗi khi quét lịch học 10 ngày tới.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để quét lịch học.');
    } finally {
      setIsCheckingNearestClassSchedule(false);
    }
  };

  return {
    isCheckingQldt,
    qldtCheckMsg,
    handleCheckQldtNow,
    isCheckingSlink,
    slinkCheckMsg,
    handleCheckSlinkNow,
    isCheckingClassSchedule,
    classScheduleCheckMsg,
    handleCheckClassScheduleNow,
    isCheckingNearestClassSchedule,
    nearestClassScheduleMsg,
    handleCheckNearestClassSchedule,
  };
}
