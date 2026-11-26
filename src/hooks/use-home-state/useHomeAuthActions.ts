'use client';

import { useState, useCallback } from 'react';
import {
  ADMIN_ONLY_TABS,
  MONITOR_AND_ADMIN_TABS,
  getRoleDisplayLabel,
} from './constants';
import { UseHomeAuthActionsParams } from './types';

export function useHomeAuthActions({
  currentUser,
  setCurrentUser,
  activeRole,
  setActiveRole,
  userRoles,
  activeTab,
  handleTabChange,
  setMonitorClass,
}: UseHomeAuthActionsParams) {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Impersonation state
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateTargetInput, setImpersonateTargetInput] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isRevertingImpersonate, setIsRevertingImpersonate] = useState(false);
  const [impersonateError, setImpersonateError] = useState('');

  // Role select handler
  const handleSelectRole = useCallback(
    (newRole: string) => {
      if (!userRoles.includes(newRole)) return;
      setActiveRole(newRole);
      if (currentUser) {
        localStorage.setItem('active_role_' + currentUser.username, newRole);
      }

      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        fetch('/api/activity-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: 'SWITCH_ROLE',
            targetType: 'ROLE',
            targetId: newRole,
            description: `Chuyển vai trò làm việc sang ${getRoleDisplayLabel(newRole)}`,
            metadata: { previousRole: activeRole, newRole },
          }),
        }).catch((err) => console.warn("[useHomeAuthActions] Non-fatal async error:", err));
      } catch (caughtError) {
        console.warn(`[useHomeAuthActions] Non-fatal error:`, caughtError);
      }

      if (newRole === 'sinh_vien') {
        if (MONITOR_AND_ADMIN_TABS.includes(activeTab)) {
          handleTabChange('personal_schedule');
        }
      } else if (newRole === 'lop_truong') {
        if (ADMIN_ONLY_TABS.includes(activeTab)) {
          handleTabChange('members');
        }
      }
    },
    [userRoles, setActiveRole, currentUser, activeRole, activeTab, handleTabChange]
  );

  // Impersonate handlers
  const handleImpersonate = useCallback(
    async (targetUsername: string) => {
      setIsImpersonating(true);
      setImpersonateError('');
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const res = await fetch('/api/auth/impersonate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetUsername }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setImpersonateError(data.error || 'Giả lập tài khoản thất bại');
          return;
        }
        if (data.token) localStorage.setItem('auth_token', data.token);
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          if (data.user.lop) setMonitorClass(data.user.lop);
        }
        setShowImpersonateModal(false);
        setImpersonateTargetInput('');
        handleTabChange('schedule');
      } catch (err: any) {
        setImpersonateError(err.message || 'Lỗi mạng khi giả lập tài khoản');
      } finally {
        setIsImpersonating(false);
      }
    },
    [setCurrentUser, setMonitorClass, handleTabChange]
  );

  const handleRevertImpersonate = useCallback(async () => {
    setIsRevertingImpersonate(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/auth/revert-impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) return;
      if (data.token) localStorage.setItem('auth_token', data.token);
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.user.lop) setMonitorClass(data.user.lop);
      }
      handleTabChange('schedule');
    } catch (err) {
      console.error('Error reverting impersonation:', err);
    } finally {
      setIsRevertingImpersonate(false);
    }
  }, [setCurrentUser, setMonitorClass, handleTabChange]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (caughtError) {
      console.warn(`[useHomeAuthActions] Non-fatal error:`, caughtError);
    }
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    window.location.href = '/';
  }, [setCurrentUser]);

  return {
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    showImpersonateModal,
    setShowImpersonateModal,
    impersonateTargetInput,
    setImpersonateTargetInput,
    isImpersonating,
    isRevertingImpersonate,
    impersonateError,
    setImpersonateError,
    handleSelectRole,
    handleImpersonate,
    handleRevertImpersonate,
    handleLogout,
  };
}
