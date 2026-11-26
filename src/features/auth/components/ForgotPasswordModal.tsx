'use client';

import React from 'react';
import { KeyRound, X, Zap } from 'lucide-react';
import type { ForgotPasswordModalProps } from './forgot-password-modal/types';
import { useForgotPasswordModal } from './forgot-password-modal/useForgotPasswordModal';
import { ForgotPasswordForm } from './forgot-password-modal/ForgotPasswordForm';
import { ForgotPasswordSuccessView } from './forgot-password-modal/ForgotPasswordSuccessView';

export type { ForgotPasswordModalProps };

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  defaultUsername = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const {
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
  } = useForgotPasswordModal({
    isOpen,
    onClose,
    defaultUsername,
    onSuccess,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Quên Mật Khẩu Tài Khoản
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                  Xác Thực QLHT
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Tự động khôi phục mật khẩu thông qua Cổng Quản Lý Học Tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {!successResult ? (
            <ForgotPasswordForm
              username={username}
              onUsernameChange={setUsername}
              qlhtPassword={qlhtPassword}
              onQlhtPasswordChange={setQlhtPassword}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              defaultUsername={defaultUsername}
              isLoading={isLoading}
              isCheckingStudent={isCheckingStudent}
              studentInfo={studentInfo}
              studentLookupError={studentLookupError}
              errorMsg={errorMsg}
              onClose={onClose}
              onSubmit={handleSubmit}
            />
          ) : (
            <ForgotPasswordSuccessView
              successResult={successResult}
              onApplyAndLogin={handleApplyAndLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
