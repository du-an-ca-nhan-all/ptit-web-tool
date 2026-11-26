'use client';

import React from 'react';
import { KeyRound, X } from 'lucide-react';
import type { AdminResetPasswordModalProps } from './admin-reset-password-modal/types';
import { useAdminResetPassword } from './admin-reset-password-modal/useAdminResetPassword';
import { ResetSuccessView } from './admin-reset-password-modal/ResetSuccessView';
import { ResetFormView } from './admin-reset-password-modal/ResetFormView';

export type { AdminResetPasswordModalProps };

export default function AdminResetPasswordModal({
  isOpen,
  onClose,
  initialUsername = '',
  initialFullName = '',
  initialClass = '',
  onSuccess,
}: AdminResetPasswordModalProps) {
  const {
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
  } = useAdminResetPassword({
    isOpen,
    initialUsername,
    initialFullName,
    initialClass,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-white">
                Đặt Lại Mật Khẩu Người Dùng
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Chức năng dành riêng cho Quản trị viên hệ thống
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {resetResult ? (
            <ResetSuccessView
              resetResult={resetResult}
              hasCopied={hasCopied}
              onCopyPassword={handleCopyPassword}
              onResetAnother={handleResetAnother}
              onClose={onClose}
            />
          ) : (
            <ResetFormView
              username={username}
              onUsernameChange={setUsername}
              initialUsername={initialUsername}
              fullName={fullName}
              lop={lop}
              mode={mode}
              onModeChange={setMode}
              customPassword={customPassword}
              onCustomPasswordChange={setCustomPassword}
              showCustomPassword={showCustomPassword}
              onToggleShowCustomPassword={() => setShowCustomPassword(!showCustomPassword)}
              isLoading={isLoading}
              isLookingUp={isLookingUp}
              errorMsg={errorMsg}
              onSubmit={handleSubmit}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
