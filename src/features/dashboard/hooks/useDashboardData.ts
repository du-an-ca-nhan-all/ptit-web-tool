'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../types/dashboard.types';

export function useDashboardData(username?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/dashboard?username=${encodeURIComponent(username)}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();

      if (res.ok && json.success && json.dashboard) {
        setData(json.dashboard);
      } else {
        setError(json.error || 'Không thể tải dữ liệu bảng điều khiển');
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Lỗi kết nối khi tải bảng điều khiển');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
