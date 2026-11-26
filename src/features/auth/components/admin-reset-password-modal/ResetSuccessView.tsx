'use client';

import React from 'react';
import { Copy, Check, CheckCircle2 } from 'lucide-react';
import type { ResetPasswordResult } from './types';

interface ResetSuccessViewProps {
  resetResult: ResetPasswordResult;
  hasCopied: boolean;
  onCopyPassword: () => void;
  onResetAnother: () => void;
  onClose: () => void;
}

export function ResetSuccessView({
  resetResult,
  hasCopied,
  onCopyPassword,
  onResetAnother,
  onClose,
}: ResetSuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2 text-center gap-5">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div>
        <h4 className="text-lg font-black text-slate-800">
          {resetResult.mode === 'CLEAR' ? 'Đã Xóa Mật Khẩu' : 'Đặt Lại Mật Khẩu Thành Công!'}
        </h4>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">
          {resetResult.message}
        </p>
      </div>

      {/* Target User Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full text-left text-xs space-y-1.5 font-medium text-slate-600">
        <div className="flex justify-between items-center">
          <span>Mã Sinh Viên / User:</span>
          <b className="font-mono text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {resetResult.username}
          </b>
        </div>
        {resetResult.fullName && (
          <div className="flex justify-between items-center">
            <span>Họ và Tên:</span>
            <b className="text-slate-900">{resetResult.fullName}</b>
          </div>
        )}
        {resetResult.lop && (
          <div className="flex justify-between items-center">
            <span>Lớp:</span>
            <b className="text-indigo-600 font-bold">{resetResult.lop}</b>
          </div>
        )}
      </div>

      {/* New Password Box */}
      {resetResult.newPassword && (
        <div className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider text-left">
            Mật Khẩu Mới Của Người Dùng:
          </div>
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-emerald-300 shadow-inner">
            <span className="font-mono text-base font-black text-emerald-700 tracking-wider">
              {resetResult.newPassword}
            </span>
            <button
              type="button"
              onClick={onCopyPassword}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã Sao Chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-emerald-700 text-left">
            💡 Hãy copy mật khẩu này và gửi lại cho sinh viên để họ có thể đăng nhập ngay.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 w-full mt-2">
        <button
          type="button"
          onClick={onResetAnother}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
        >
          Reset Cho Người Khác
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          Hoàn Tất
        </button>
      </div>
    </div>
  );
}
