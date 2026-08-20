'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginUser } from '../types/auth.types';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const userRoles = useMemo(() => {
    if (!currentUser) return [];
    const set = new Set<string>();
    const rawRole = currentUser.role || '';
    if (rawRole.includes('admin') || currentUser.isAdmin) set.add('admin');
    if (rawRole.includes('lop_truong') || currentUser.isMonitor) set.add('lop_truong');
    set.add('sinh_vien');
    return Array.from(set);
  }, [currentUser]);

  const [activeRole, setActiveRole] = useState<string>(() => {
    if (typeof window === 'undefined') return 'sinh_vien';
    try {
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u?.username) {
          const savedRole = localStorage.getItem('active_role_' + u.username);
          if (savedRole) return savedRole;
          const rawRole = u.role || '';
          if (rawRole.includes('admin') || u.isAdmin) return 'admin';
          if (rawRole.includes('lop_truong') || u.isMonitor) return 'lop_truong';
        }
      }
    } catch {}
    return 'sinh_vien';
  });

  const isAdmin = activeRole === 'admin';
  const isMonitor = activeRole === 'lop_truong' || activeRole === 'admin';
  const canAccessMonitorTools = isMonitor || isAdmin;
  const canImpersonate = isAdmin || Boolean(currentUser?.impersonatedBy);

  const effectiveUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      role: activeRole,
      activeRole: activeRole,
      isAdmin: activeRole === 'admin',
      isMonitor: activeRole === 'lop_truong' || activeRole === 'admin',
    };
  }, [currentUser, activeRole]);

  const logout = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('currentUser');
    }
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    effectiveUser,
    activeRole,
    setActiveRole,
    userRoles,
    isAdmin,
    isMonitor,
    canAccessMonitorTools,
    canImpersonate,
    logout,
  };
}
