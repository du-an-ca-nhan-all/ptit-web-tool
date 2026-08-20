'use client';

import React, { useState } from 'react';
import { Lock, Shield, Key, Eye, EyeOff, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';

export function ProfileSecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassErrorMsg('Vui lòng điền đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận lại mật khẩu mới.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Mật khẩu mới và mật khẩu xác nhận không khớp nhau. Vui lòng kiểm tra lại.');
      return;
    }

    if (currentPassword === newPassword) {
      setPassErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPassSuccessMsg(data.message || 'Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccessMsg(''), 5000);
      } else {
        setPassErrorMsg(data.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch (err: any) {
      setPassErrorMsg('Lỗi kết nối máy chủ khi thực hiện đổi mật khẩu.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
        <div className="p-2 sm:p-2.5 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl shrink-0">
          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-800">Bảo Mật Tài Khoản PTIT EduSync</h3>
          <p className="text-xs text-slate-500 mt-0.5">Đổi mật khẩu đăng nhập cổng portal sinh viên</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-amber-800 leading-relaxed flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Lưu ý về mật khẩu đăng nhập:</strong>
          Mật khẩu khởi tạo ban đầu là <strong>Mã sinh viên</strong> (viết in hoa). Bạn có thể đổi sang bất kỳ mật khẩu nào tùy ý và nhập lại 2 lần để xác nhận.
        </div>
      </div>

      {/* Feedback messages */}
      {passSuccessMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passSuccessMsg}</span>
          </div>
          <button onClick={() => setPassSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {passErrorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-between shadow-2xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passErrorMsg}</span>
          </div>
          <button onClick={() => setPassErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5 sm:gap-4">
        {/* Field 1: Current Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Mật khẩu hiện tại <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại (mặc định là MSSV)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPass(!showCurrentPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
            >
              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Field 2: New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Mật khẩu mới (Lần 1) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPass(!showNewPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
            >
              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Field 3: Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Xác nhận mật khẩu mới (Nhập lại lần 2) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới để chắc chắn"
              className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 outline-none transition-all ${
                confirmPassword
                  ? newPassword === confirmPassword
                    ? 'border-emerald-400 focus:ring-emerald-500'
                    : 'border-rose-400 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Realtime Matching Status */}
          {confirmPassword && (
            <div className="mt-1.5">
              {newPassword === confirmPassword ? (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex">
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  Hai mật khẩu mới trùng khớp hoàn toàn
                </span>
              ) : (
                <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-flex">
                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                  Mật khẩu xác nhận chưa khớp với mật khẩu mới
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            * Yêu cầu nhập đúng 2 lần mật khẩu mới
          </span>
          <button
            type="submit"
            disabled={
              isChangingPass ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword
            }
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
          >
            {isChangingPass ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5" />
                <span>Cập Nhật Mật Khẩu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
