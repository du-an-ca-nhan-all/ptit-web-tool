'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginUser } from '../types/auth.types';
import {
  AUTH_EXPIRED_EVENT,
  getStoredToken,
  clearStoredAuth,
  handleAuthExpired,
  initAuthInterceptor,
} from '../../../lib/authClient';

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

  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  // Initialize global fetch interceptor on client
  useEffect(() => {
    initAuthInterceptor();
  }, []);

  // Listen for auth expiration events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setCurrentUser(null);
      setAuthError(
        customEvent.detail?.message ||
          'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
      );
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    };
  }, []);

  // Validate token on initial mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      if (currentUser) {
        clearStoredAuth();
        setCurrentUser(null);
      }
      setIsVerifyingAuth(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || !res.ok) {
          handleAuthExpired('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
          return;
        }
        const data = await res.json();
        if (data?.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          setAuthError(null);
        } else {
          handleAuthExpired('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        }
      })
      .catch((err) => {
        console.warn('Network issue during auth check:', err);
      })
      .finally(() => {
        setIsVerifyingAuth(false);
      });
  }, []);

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
      const token = getStoredToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    clearStoredAuth();
    setCurrentUser(null);
    setAuthError(null);
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
    authError,
    setAuthError,
    isVerifyingAuth,
  };
}

