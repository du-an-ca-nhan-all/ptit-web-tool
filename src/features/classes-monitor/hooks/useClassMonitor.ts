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

  const fetchMonitorsData = useCallback(async () => {
    try {
      setIsLoadingMonitors(true);
      const res = await fetch('/api/monitors?all=true');
      const data = await res.json();
      if (res.ok && data.users) {
        setLoginUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching monitors data:', err);
    } finally {
      setIsLoadingMonitors(false);
    }
  }, []);

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
