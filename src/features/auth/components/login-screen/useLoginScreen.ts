'use client';

import React, { useState, useEffect } from 'react';
import { LoginUser } from '../../types/auth.types';
import { AuthMode, StudentLookupInfo } from './types';

interface UseLoginScreenParams {
  initialError?: string | null;
  onLogin: (user: LoginUser) => void;
}

export function useLoginScreen({ initialError, onLogin }: UseLoginScreenParams) {
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNote, setRegNote] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Real-time student lookup state
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentLookupInfo | null>(null);
  const [studentLookupError, setStudentLookupError] = useState('');

  // Debounced student lookup when regUsername changes
  useEffect(() => {
    const clean = regUsername.trim().toUpperCase();
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
          if (data.student.soDienThoai && !regPhone) {
            setRegPhone(data.student.soDienThoai);
          }
          if (data.student.hasPassword) {
            setStudentLookupError(
              'Tài khoản này đã có mật khẩu hoạt động. Nếu bạn quên mật khẩu, có thể khôi phục ngay bằng Mật khẩu Cổng QLHT.'
            );
          } else {
            setStudentLookupError('');
          }
        } else {
          setStudentInfo(null);
          setStudentLookupError(
            data.error || 'Mã sinh viên không tồn tại trong danh sách của trường.'
          );
        }
      } catch (err) {
        setStudentInfo(null);
      } finally {
        setIsCheckingStudent(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regUsername]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        onLogin(data.user as LoginUser);
        return;
      }

      setError(data.error || 'Tài khoản hoặc mật khẩu không chính xác');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');
    setIsAutoApproved(false);

    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError('Vui lòng điền Mã sinh viên và Mật khẩu Cổng QLHT');
      return;
    }

    if (studentLookupError) {
      setRegError(studentLookupError);
      return;
    }

    setIsRegistering(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword.trim(),
          phoneNumber: regPhone.trim() || undefined,
          note: regNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAutoApproved(true);
        setRegSuccessMsg(
          data.message ||
            'Tài khoản của bạn đã được TỰ ĐỘNG KÍCH HOẠT và liên kết QLHT thành công!'
        );
        // Clear form
        setRegPassword('');
        setRegNote('');
      } else {
        setRegError(
          data.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại mật khẩu QLHT.'
        );
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setRegError('Lỗi kết nối máy chủ khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSelectLoginTab = () => {
    setMode('LOGIN');
    setError('');
    setRegError('');
    setRegSuccessMsg('');
    setIsAutoApproved(false);
  };

  const handleSelectRegisterTab = () => {
    setMode('REGISTER');
    setError('');
    setRegError('');
    setRegSuccessMsg('');
    setIsAutoApproved(false);
    if (username && !regUsername) setRegUsername(username);
  };

  const handleSwitchToRegisterFromLogin = () => {
    setMode('REGISTER');
    if (username) setRegUsername(username);
  };

  const handleBackToLoginFromRegisterSuccess = () => {
    setMode('LOGIN');
    setUsername(regUsername);
    setRegSuccessMsg('');
    setIsAutoApproved(false);
  };

  const handleForgotPasswordSuccess = (resetUser: string, newPass?: string) => {
    setMode('LOGIN');
    setUsername(resetUser);
    if (newPass) {
      setPassword(newPass);
    }
    setError('');
    setIsForgotModalOpen(false);
  };

  return {
    mode,
    setMode,
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    isLoading,
    isForgotModalOpen,
    setIsForgotModalOpen,
    regUsername,
    setRegUsername,
    regPhone,
    setRegPhone,
    regPassword,
    setRegPassword,
    regNote,
    setRegNote,
    showRegPassword,
    setShowRegPassword,
    regSuccessMsg,
    isAutoApproved,
    regError,
    isRegistering,
    isCheckingStudent,
    studentInfo,
    studentLookupError,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleSelectLoginTab,
    handleSelectRegisterTab,
    handleSwitchToRegisterFromLogin,
    handleBackToLoginFromRegisterSuccess,
    handleForgotPasswordSuccess,
  };
}
