import { useEffect, useState } from 'react';
import { AdminSubTab } from './types';

interface UseQueueManagerParams {
  activeSubTab: AdminSubTab;
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useQueueManager({
  activeSubTab,
  setSuccessMsg,
  setErrorMsg,
}: UseQueueManagerParams) {
  const [queueStats, setQueueStats] = useState<any | null>(null);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [isTogglingQueuePause, setIsTogglingQueuePause] = useState(false);
  const [isFetchingQueue, setIsFetchingQueue] = useState(false);

  const fetchQueueStats = async () => {
    try {
      setIsFetchingQueue(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_QUEUE_STATS' }),
      });
      const data = await res.json();
      if (res.ok && data.queueStats) {
        setQueueStats(data.queueStats);
      }
    } catch (caughtError) {
      console.warn(`[useQueueManager] Non-fatal error:`, caughtError);
    } finally {
      setIsFetchingQueue(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ tin nhắn đang chờ trong hàng đợi Telegram?')) {
      return;
    }
    try {
      setIsClearingQueue(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_QUEUE' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (data.queueStats) setQueueStats(data.queueStats);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Xóa hàng đợi thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xóa hàng đợi');
    } finally {
      setIsClearingQueue(false);
    }
  };

  const handleToggleQueuePause = async (pause: boolean) => {
    try {
      setIsTogglingQueuePause(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_QUEUE_PAUSE', isPaused: pause }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (data.queueStats) setQueueStats(data.queueStats);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi cập nhật trạng thái hàng đợi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi cập nhật trạng thái hàng đợi');
    } finally {
      setIsTogglingQueuePause(false);
    }
  };

  // Poll queue stats when on QUEUE tab or when there are pending items
  useEffect(() => {
    if (activeSubTab === 'QUEUE') {
      fetchQueueStats();
      const interval = setInterval(fetchQueueStats, 2500);
      return () => clearInterval(interval);
    }
  }, [activeSubTab]);

  return {
    queueStats,
    setQueueStats,
    isClearingQueue,
    isTogglingQueuePause,
    isFetchingQueue,
    fetchQueueStats,
    handleClearQueue,
    handleToggleQueuePause,
  };
}
