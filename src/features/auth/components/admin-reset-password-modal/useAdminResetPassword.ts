'use client';

import React, { useState, useEffect } from 'react';
import type { ResetPasswordMode, ResetPasswordResult } from './types';

interface UseAdminResetPasswordParams {
  isOpen: boolean;
  initialUsername: string;
  initialFullName: string;
  initialClass: string;
  onSuccess?: () => void;
}

export function useAdminResetPassword({
  isOpen,
  initialUsername,
  initialFullName,
  initialClass,
  onSuccess,
}: UseAdminResetPasswordParams) {
  const [username, setUsername] = useState(initialUsername);
  const [fullName, setFullName] = useState(initialFullName);
  const [lop, setLop] = useState(initialClass);
  const [mode, setMode] = useState<ResetPasswordMode>('GENERATE');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result state after reset
  const [resetResult, setResetResult] = useState<ResetPasswordResult | null>(null);

  const [hasCopied, setHasCopied] = useState(false);

  // Student lookup state if username is changed
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername);
      setFullName(initialFullName);
      setLop(initialClass);
      setMode('GENERATE');
      setCustomPassword('');
      setErrorMsg('');
      setResetResult(null);
      setHasCopied(false);
    }
  }, [isOpen, initialUsername, initialFullName, initialClass]);

  // Lookup student info when username changes (and not pre-filled)
  useEffect(() => {
    const clean = username.trim().toUpperCase();
    if (!clean || clean.length < 3 || initialFullName) return;

    const timer = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const res = await fetch(`/api/auth/register?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (res.ok && data.found && data.student) {
          setFullName(data.student.hoTen);
          setLop(data.student.maLop || '');
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLookingUp(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, initialFullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên / Tên đăng nhập');
      return;
    }

    if (mode === 'CUSTOM') {
      if (!customPassword || customPassword.length < 6) {
        setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự');
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: username.trim(),
          mode,
          newPassword: mode === 'CUSTOM' ? customPassword.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResetResult({
          username: data.username,
          fullName: data.fullName || fullName,
          lop: data.lop || lop,
          mode: data.mode,
          newPassword: data.newPassword,
          message: data.message,
        });
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(data.error || 'Lỗi khi đặt lại mật khẩu');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi thực hiện reset mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetResult?.newPassword) {
      navigator.clipboard.writeText(resetResult.newPassword);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleResetAnother = () => {
    setResetResult(null);
    setCustomPassword('');
  };

  return {
    username,
    setUsername,
    fullName,
    lop,
    mode,
    setMode,
    customPassword,
    setCustomPassword,
    showCustomPassword,
    setShowCustomPassword,
    isLoading,
    errorMsg,
    resetResult,
    hasCopied,
    isLookingUp,
    handleSubmit,
    handleCopyPassword,
    handleResetAnother,
  };
}
