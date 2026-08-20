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
} from 'lucide-react';
import { LoginUser, ExamRecord } from '../types/auth.types';

interface LoginScreenProps {
  users?: LoginUser[];
  records?: ExamRecord[];
  onLogin: (user: LoginUser) => void;
}

export default function LoginScreen({ users = [], records = [], onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regNote, setRegNote] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
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
        setRegSuccessMsg(
          data.message ||
            'Đăng ký tài khoản thành công! Yêu cầu của bạn đang chờ Quản trị viên xét duyệt.'
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 relative z-10 animate-in zoom-in-95 duration-300">
        {/* Header with Switcher Tabs */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-6 text-center text-white relative overflow-hidden">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/10 text-sky-400 shadow-inner">
            {mode === 'LOGIN' ? <LogIn className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            PTIT Portal & Quản Lý Thi
          </h1>
          <p className="text-slate-300 mt-1 text-xs">
            {mode === 'LOGIN'
              ? 'Đăng nhập vào hệ thống để tra cứu và quản lý'
              : 'Đăng ký kích hoạt tài khoản sinh viên'}
          </p>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-2xl mt-4 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
                setRegError('');
                setRegSuccessMsg('');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
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
                if (username && !regUsername) setRegUsername(username);
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
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
          <div className="p-6 sm:p-8">
            {error && (
              <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2.5 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                    placeholder="Ví dụ: K25DTCN402 hoặc admin"
                    disabled={isLoading}
                    autoCapitalize="characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
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
                    className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-2xl bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    placeholder="Nhập mật khẩu..."
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 mt-2"
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

              <div className="pt-4 border-t border-slate-100 text-center">
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
              </div>
            </form>
          </div>
        )}

        {/* ===================== TAB 2: REGISTER FORM ===================== */}
        {mode === 'REGISTER' && (
          <div className="p-6 sm:p-8">
            {regSuccessMsg ? (
              <div className="flex flex-col items-center justify-center py-4 text-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Gửi Yêu Cầu Thành Công!</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-sm">
                    {regSuccessMsg}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left w-full space-y-1">
                  <div>
                    Mã SV: <b className="text-slate-900 font-mono">{regUsername}</b>
                  </div>
                  {studentInfo?.hoTen && (
                    <div>
                      Họ tên: <b className="text-slate-900">{studentInfo.hoTen}</b>
                    </div>
                  )}
                  {studentInfo?.maLop && (
                    <div>
                      Lớp: <b className="text-indigo-700 font-bold">{studentInfo.maLop}</b>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setUsername(regUsername);
                    setRegSuccessMsg('');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Quay Lại Màn Hình Đăng Nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {regError && (
                  <div className="bg-rose-50 text-rose-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{regError}</span>
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
                      className="block w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase"
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
                    <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-800">{studentInfo.hoTen}</div>
                          <div className="text-[11px] text-slate-500">
                            Lớp: <b className="text-indigo-700">{studentInfo.maLop || 'Chưa rõ lớp'}</b>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        Đã xác nhận SV
                      </span>
                    </div>
                  )}

                  {studentLookupError && (
                    <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{studentLookupError}</span>
                    </div>
                  )}
                </div>

                {/* SĐT liên hệ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      placeholder="0912345678"
                      disabled={isRegistering}
                    />
                  </div>
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mật Khẩu Mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        disabled={isRegistering}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nhập Lại Mật Khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegConfirm ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="block w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Nhập lại..."
                        required
                        disabled={isRegistering}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ghi Chú (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={regNote}
                    onChange={(e) => setRegNote(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    placeholder="Lý do đăng ký, liên hệ..."
                    disabled={isRegistering}
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Sau khi đăng ký, yêu cầu sẽ được chuyển tới <strong>Quản trị viên</strong> để xét duyệt và kích hoạt mật khẩu của bạn.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || Boolean(studentLookupError)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRegistering ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <div className="pt-4 pb-4 px-6 bg-slate-50 border-t border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Hỗ Trợ & Liên Hệ Quản Trị Viên (Admin)</span>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2.5 leading-tight">
            Khi cần cấp lại mật khẩu, mở khóa tài khoản hoặc khiếu nại thông tin:
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold flex-wrap">
            <a
              href="https://t.me/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>@lethanh9398</span>
            </a>
            <a
              href="tel:0966211618"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              <Phone className="w-3 h-3" />
              <span>0966.211.618</span>
            </a>
            <a
              href="https://www.facebook.com/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>FB: lethanh9398</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
