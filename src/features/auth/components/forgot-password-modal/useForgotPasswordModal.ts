'use client';

import React, { useState, useEffect } from 'react';
import type {
  ForgotPasswordModalProps,
  ForgotPasswordSuccessResult,
  StudentLookupInfo,
} from './types';

export function useForgotPasswordModal({
  isOpen,
  onClose,
  defaultUsername = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [qlhtPassword, setQlhtPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [studentLookupError, setStudentLookupError] = useState('');
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentLookupInfo | null>(null);
  const [successResult, setSuccessResult] = useState<ForgotPasswordSuccessResult | null>(null);

  // Sync default username on modal open
  useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername || '');
      setQlhtPassword('');
      setShowPassword(false);
      setErrorMsg('');
      setStudentLookupError('');
      setSuccessResult(null);
    }
  }, [isOpen, defaultUsername]);

  // Debounced lookup for student name and class
  useEffect(() => {
    const clean = username.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setStudentInfo(null);
      setStudentLookupError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingStudent(true);
      setStudentLookupError('');
      try {
        const res = await fetch(`/api/auth/register?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (res.ok && data.found && data.student) {
          setStudentInfo(data.student);
          setStudentLookupError('');
        } else {
          setStudentInfo(null);
          setStudentLookupError(data.error || 'Mã sinh viên không tồn tại trong danh sách sinh viên trường.');
        }
      } catch {
        setStudentInfo(null);
      } finally {
        setIsCheckingStudent(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toUpperCase();
    const cleanPassword = qlhtPassword.trim();

    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập Mã sinh viên');
      return;
    }

    if (!cleanPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu Cổng QLHT');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessResult(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          qlhtPassword: cleanPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessResult({
          username: cleanUsername,
          fullName: data.fullName || studentInfo?.hoTen,
          lop: data.lop || studentInfo?.maLop,
          message: data.message,
        });
      } else {
        setErrorMsg(data.error || 'Xác thực mật khẩu QLHT thất bại. Vui lòng kiểm tra lại.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAndLogin = () => {
    if (onSuccess && successResult) {
      onSuccess(successResult.username, qlhtPassword);
    }
    onClose();
  };

  return {
    username,
    setUsername,
    qlhtPassword,
    setQlhtPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMsg,
    studentLookupError,
    isCheckingStudent,
    studentInfo,
    successResult,
    handleSubmit,
    handleApplyAndLogin,
  };
}
