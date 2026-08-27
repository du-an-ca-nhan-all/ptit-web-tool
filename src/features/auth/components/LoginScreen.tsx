'use client';

import React, { useState, useEffect } from 'react';
import {
  LogIn,
  Lock,
  User,
  UserPlus,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Send,
  Download,
  Zap,
  Sparkles,
  Clock,
} from 'lucide-react';
import { LoginUser, ExamRecord } from '../types/auth.types';
import { usePWAContext } from '../../../components/pwa/PWAProvider';
import SlinkForgotPasswordModal from '@/src/features/external-portal/components/SlinkForgotPasswordModal';

interface LoginScreenProps {
  users?: LoginUser[];
  records?: ExamRecord[];
  initialError?: string | null;
  onLogin: (user: LoginUser) => void;
}

export default function LoginScreen({
  users = [],
  records = [],
  initialError,
  onLogin,
}: LoginScreenProps) {
  const { isInstalled, openInstallModal } = usePWAContext();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSlinkModalOpen, setIsSlinkModalOpen] = useState(false);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regNote, setRegNote] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Real-time student lookup state
  const [isCheckingStudent, setIsCheckingStudent] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{
    maSV: string;
    hoTen: string;
    maLop?: string | null;
    soDienThoai?: string | null;
    hasPassword?: boolean;
  } | null>(null);
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
            setStudentLookupError('Tài khoản này đã có mật khẩu hoạt động. Nếu bạn quên mật khẩu, vui lòng liên hệ Admin.');
          } else {
            setStudentLookupError('');
          }
        } else {
          setStudentInfo(null);
          setStudentLookupError(data.error || 'Mã sinh viên không tồn tại trong danh sách của trường.');
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

    if (!regUsername.trim() || !regPassword) {
      setRegError('Vui lòng điền Mã sinh viên và Mật khẩu');
      return;
    }

    if (studentLookupError) {
      setRegError(studentLookupError);
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu nhập lại không trùng khớp');
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
          confirmPassword: regConfirmPassword.trim(),
          phoneNumber: regPhone.trim() || undefined,
          note: regNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAutoApproved(Boolean(data.autoApproved));
        setRegSuccessMsg(
          data.message ||
            (data.autoApproved
              ? 'Tài khoản của bạn đã được TỰ ĐỘNG KÍCH HOẠT và liên kết QLHT thành công!'
              : 'Đăng ký tài khoản thành công! Yêu cầu của bạn đang chờ Quản trị viên xét duyệt.')
        );
        // Clear form
        setRegPassword('');
        setRegConfirmPassword('');
        setRegNote('');
      } else {
        setRegError(data.error || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setRegError('Lỗi kết nối máy chủ khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col items-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-3 py-4 sm:py-8 sm:px-6 font-sans overflow-y-auto overflow-x-hidden pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+2rem)]">
      {/* Dynamic Background Blurs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* PWA Install Button on Login Screen */}
      {!isInstalled && (
        <button
          type="button"
          onClick={openInstallModal}
          className="fixed sm:absolute top-[calc(env(safe-area-inset-top,0px)+0.75rem)] right-3 sm:right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 rounded-full text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
          title="Cài đặt PTIT EduSync về thiết bị"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cài Đặt App</span>
          <span className="sm:hidden">Cài App</span>
        </button>
      )}

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 relative z-10 animate-in zoom-in-95 duration-300 my-auto shrink-0">
        {/* Header with Switcher Tabs */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 px-4 py-5 sm:p-6 text-center text-white relative overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-2.5 sm:mb-3 backdrop-blur-md border border-white/10 text-sky-400 shadow-inner">
            {mode === 'LOGIN' ? <LogIn className="w-6 h-6 sm:w-7 sm:h-7" /> : <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />}
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            PTIT Portal & Quản Lý Thi
          </h1>
          <p className="text-slate-300 mt-0.5 sm:mt-1 text-xs">
            {mode === 'LOGIN'
              ? 'Đăng nhập vào hệ thống để tra cứu và quản lý'
              : 'Đăng ký kích hoạt tài khoản sinh viên'}
          </p>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-xl sm:rounded-2xl mt-3.5 sm:mt-4 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
                setRegError('');
                setRegSuccessMsg('');
                setIsAutoApproved(false);
              }}
              className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                mode === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setError('');
                setRegError('');
                setRegSuccessMsg('');
                setIsAutoApproved(false);
                if (username && !regUsername) setRegUsername(username);
              }}
              className={`py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer active:scale-[0.98] ${
                mode === 'REGISTER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: LOGIN FORM ===================== */}
        {mode === 'LOGIN' && (
          <div className="p-4 sm:p-7">
            {error && (
              <div className="bg-rose-50 text-rose-700 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-xs font-bold mb-4 sm:mb-5 flex items-center gap-2.5 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 sm:mb-1.5 uppercase tracking-wider">
                  Mã Sinh Viên / Tên Đăng Nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 sm:py-2.5 border border-slate-300 rounded-xl sm:rounded-2xl bg-slate-50 text-sm sm:text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                    placeholder="Ví dụ: K25DTCN402 hoặc admin"
                    disabled={isLoading}
                    autoCapitalize="characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 sm:mb-1.5 uppercase tracking-wider">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 sm:py-2.5 border border-slate-300 rounded-xl sm:rounded-2xl bg-slate-50 text-sm sm:text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Nhập mật khẩu..."
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl sm:rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-[0.99] touch-manipulation mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3.5 border-t border-slate-100 text-center space-y-1.5">
                <p className="text-xs text-slate-500">
                  Chưa kích hoạt mật khẩu?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('REGISTER');
                      if (username) setRegUsername(username);
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    Đăng ký kích hoạt ngay
                  </button>
                </p>
                <p className="text-[11px] text-slate-400">
                  Quên mật khẩu Cổng S-Link?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSlinkModalOpen(true)}
                    className="text-purple-600 font-semibold hover:underline cursor-pointer"
                  >
                    Gửi yêu cầu reset S-Link
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ===================== TAB 2: REGISTER FORM ===================== */}
        {mode === 'REGISTER' && (
          <div className="p-4 sm:p-7">
            {regSuccessMsg ? (
              <div className="flex flex-col items-center justify-center py-2 text-center gap-3 sm:gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xs ${
                    isAutoApproved
                      ? 'bg-gradient-to-br from-amber-400 to-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {isAutoApproved ? (
                    <Zap className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                    {isAutoApproved ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Kích Hoạt Tự Động Thành Công!</span>
                      </>
                    ) : (
                      <span>Gửi Yêu Cầu Thành Công!</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-sm">
                    {regSuccessMsg}
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs text-slate-600 text-left w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mã SV:</span>
                    <b className="text-slate-900 font-mono text-sm">{regUsername}</b>
                  </div>
                  {studentInfo?.hoTen && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Họ tên:</span>
                      <b className="text-slate-900">{studentInfo.hoTen}</b>
                    </div>
                  )}
                  {studentInfo?.maLop && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Lớp:</span>
                      <b className="text-indigo-700 font-bold">{studentInfo.maLop}</b>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500">Trạng thái:</span>
                    {isAutoApproved ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        Đã kích hoạt & Liên kết QLHT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Chờ Admin duyệt
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setUsername(regUsername);
                    setRegSuccessMsg('');
                    setIsAutoApproved(false);
                  }}
                  className={`w-full py-3 text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-[0.99] touch-manipulation flex items-center justify-center gap-2 ${
                    isAutoApproved
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  <span>{isAutoApproved ? 'Đăng Nhập Ngay' : 'Quay Lại Màn Hình Đăng Nhập'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 sm:space-y-3.5">
                {regError && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="leading-snug">{regError}</span>
                  </div>
                )}

                {/* MSSV Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Mã Sinh Viên (MSSV) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toUpperCase())}
                      className="block w-full pl-9 pr-9 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
                      placeholder="Ví dụ: K25DTCN402"
                      required
                      disabled={isRegistering}
                    />
                    {isCheckingStudent && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Student Auto-Lookup Info Card */}
                  {studentInfo && (
                    <div className="mt-2 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{studentInfo.hoTen}</div>
                          <div className="text-[11px] text-slate-500">
                            Lớp: <b className="text-indigo-700">{studentInfo.maLop || 'Chưa rõ lớp'}</b>
                          </div>
                        </div>
                      </div>
                      <span className="self-start sm:self-center text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                        Đã xác nhận SV
                      </span>
                    </div>
                  )}

                  {studentLookupError && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="leading-snug">{studentLookupError}</span>
                    </div>
                  )}
                </div>

                {/* SĐT liên hệ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại Liên Hệ (Tùy chọn)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="0912345678"
                      disabled={isRegistering}
                    />
                  </div>
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật Khẩu Mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="block w-full pl-3 pr-9 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        disabled={isRegistering}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nhập Lại Mật Khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegConfirm ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="block w-full pl-3 pr-9 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Nhập lại mật khẩu..."
                        required
                        disabled={isRegistering}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute inset-y-0 right-0 w-9 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showRegConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showRegConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ghi Chú (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={regNote}
                    onChange={(e) => setRegNote(e.target.value)}
                    className="block w-full px-3 py-2 sm:py-2.5 border border-slate-300 rounded-xl bg-slate-50 text-sm sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Lý do đăng ký, liên hệ..."
                    disabled={isRegistering}
                  />
                </div>

                {/* Instant Activation Tip Banner */}
                <div className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-indigo-200/80 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong className="text-indigo-900">Mẹo kích hoạt tức thì:</strong> Nhập mật khẩu trùng khớp với <strong>Cổng QLDTTX (QLHT)</strong> để hệ thống <strong>tự động kích hoạt tài khoản & liên kết QLHT ngay lập tức</strong> mà không cần chờ Admin duyệt.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || Boolean(studentLookupError)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] touch-manipulation"
                >
                  {isRegistering ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xs">Đang kiểm tra & kích hoạt...</span>
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Gửi Yêu Cầu Đăng Ký</span>
                    </>
                  )}
                </button>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    Đã có mật khẩu?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('LOGIN')}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Bottom Spacing & Admin Contact Information */}
        <div className="py-4 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Hỗ Trợ & Liên Hệ Quản Trị Viên (Admin)</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2.5 leading-tight">
            Khi cần cấp lại mật khẩu, mở khóa tài khoản hoặc khiếu nại thông tin:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono font-bold">
            <a
              href="https://t.me/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sky-600 hover:text-sky-700 bg-white sm:bg-sky-50 hover:bg-sky-100 border border-sky-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>@lethanh9398</span>
            </a>
            <a
              href="tel:0966211618"
              className="flex items-center justify-center gap-1.5 text-emerald-700 hover:text-emerald-800 bg-white sm:bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>0966.211.618</span>
            </a>
            <a
              href="https://www.facebook.com/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-blue-700 hover:text-blue-800 bg-white sm:bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>FB: lethanh9398</span>
            </a>
          </div>
        </div>
      </div>

      {/* S-Link Forgot Password Modal */}
      <SlinkForgotPasswordModal
        isOpen={isSlinkModalOpen}
        onClose={() => setIsSlinkModalOpen(false)}
        defaultUsername=""
      />
    </div>
  );
}
