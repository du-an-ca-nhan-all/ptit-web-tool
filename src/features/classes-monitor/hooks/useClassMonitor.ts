'use client';

import { useState, useCallback } from 'react';
import { LoginUser } from '@/src/types/domain';

export function useClassMonitor(initialClass?: string) {
  const [monitorClass, setMonitorClass] = useState<string>(() => {
    if (initialClass) return initialClass;
    if (typeof window === 'undefined') return '';
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const u = JSON.parse(saved);
        return u.lop || '';
      }
    } catch {}
    return '';
  });

  const [loginUsers, setLoginUsers] = useState<LoginUser[]>([]);
  const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null);
  const [confirmClassCode, setConfirmClassCode] = useState<string | null>(null);
  const [isClassGroupOpen, setIsClassGroupOpen] = useState(false);
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(false);

  const fetchMonitorsData = useCallback(
    async (params?: { page?: number; limit?: number; search?: string; classCode?: string }) => {
      try {
        setIsLoadingMonitors(true);
        const query = new URLSearchParams();
        if (params?.page) query.set('page', String(params.page));
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.search) query.set('search', params.search);
        if (params?.classCode) query.set('classCode', params.classCode);

        const qs = query.toString();
        const url = qs ? `/api/class-monitors?${qs}` : '/api/class-monitors';
        const res = await fetch(url);
        const data = await res.json();
        const monitorList = data.monitors || data.users || [];
        if (res.ok && Array.isArray(monitorList)) {
          setLoginUsers(monitorList);
        }
      } catch (err) {
        console.error('Error fetching monitors data:', err);
      } finally {
        setIsLoadingMonitors(false);
      }
    },
    []
  );

  return {
    monitorClass,
    setMonitorClass,
    loginUsers,
    setLoginUsers,
    confirmStudentId,
    setConfirmStudentId,
    confirmClassCode,
    setConfirmClassCode,
    isClassGroupOpen,
    setIsClassGroupOpen,
    isLoadingMonitors,
    fetchMonitorsData,
  };
}
