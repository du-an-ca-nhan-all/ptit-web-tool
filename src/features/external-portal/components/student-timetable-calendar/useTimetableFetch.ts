import { useState, useEffect, useCallback, useRef } from 'react';
import { StudentTimetableCalendarResult } from '../../server/studentTimetableServerService';
import { SyncFeedback, TimetableErrorType } from './types';
import { formatIso, formatSyncDateTime } from './utils';

interface UseTimetableFetchOptions {
  onAutoJumpDate: (date: Date, isoDate: string) => void;
}

function tryAutoJumpToFirstEvent(
  events: any[] | undefined,
  onAutoJump: (date: Date, isoDate: string) => void
): void {
  if (!events || events.length === 0) return;
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (params?.get('date') || params?.get('day')) return;

  const todayIso = formatIso(new Date());
  const hasTodayOrFuture = events.some((e: any) => e.date >= todayIso);
  if (hasTodayOrFuture || !events[0]?.date) return;

  const firstDate = new Date(events[0].date);
  if (!isNaN(firstDate.getTime())) {
    onAutoJump(firstDate, events[0].date);
  }
}

export function useTimetableFetch({ onAutoJumpDate }: UseTimetableFetchOptions) {
  const [data, setData] = useState<StudentTimetableCalendarResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<TimetableErrorType>(null);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);

  // Track the timestamp of the last fetch to automatically re-pull if returning after 10 minutes
  const lastFetchTimeRef = useRef<number>(Date.now());
  const onAutoJumpDateRef = useRef(onAutoJumpDate);
  onAutoJumpDateRef.current = onAutoJumpDate;

  // Fetch timetable from API
  const fetchTimetable = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const res = await fetch(`/api/student/timetable${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      lastFetchTimeRef.current = Date.now();

      if (res.ok && json.success) {
        setData(json);
        setErrorType(null);

        if (refresh) {
          const syncTimeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
          setSyncFeedback({
            type: 'success',
            message: `Đồng bộ thành công thời khóa biểu mới nhất từ QLDTTX (lúc ${syncTimeFormatted})!`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        }

        // Auto jump calendar date to nearest active session if current month has no events and no URL date
        tryAutoJumpToFirstEvent(json.events, onAutoJumpDateRef.current);
      } else {
        const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
        setErrorType(type);
        setError(json.error || 'Không thể tải lịch học cá nhân');
        if (json.username) {
          setData(json);
        }
        if (refresh) {
          setSyncFeedback({
            type: 'error',
            message: json.error || 'Đồng bộ từ cổng QLDTTX thất bại. Vui lòng kiểm tra lại tài khoản.',
          });
        }
      }
    } catch (err: any) {
      setErrorType('SERVER_ERROR');
      setError('Lỗi kết nối máy chủ khi lấy dữ liệu thời khóa biểu');
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: 'Lỗi kết nối máy chủ khi đồng bộ thời khóa biểu từ QLDTTX.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Tự động kiểm tra và pull lại nếu người dùng quay lại tab/vào lại sau 10 phút (10 * 60 * 1000 ms)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= 10 * 60 * 1000) {
          lastFetchTimeRef.current = Date.now();
          fetchTimetable(false);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleFocusOrVisibility);

    function handleFocusOrVisibility() {
      handleVisibilityOrFocus();
    }

    // Interval định kỳ mỗi 10 phút kiểm tra làm mới nền nếu tab vẫn đang mở
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (elapsed >= 10 * 60 * 1000) {
        lastFetchTimeRef.current = Date.now();
        fetchTimetable(false);
      }
    }, 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleFocusOrVisibility);
      clearInterval(intervalId);
    };
  }, [fetchTimetable]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    fetchTimetable,
  };
}
