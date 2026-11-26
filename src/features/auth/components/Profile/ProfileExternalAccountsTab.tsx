'use client';

import React from 'react';
import { Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import type { ProfileExternalAccountsTabProps } from './profile-external-accounts-tab/types';
import {
  createDefaultFormState,
  isAccountSyncError,
  isConnectionTestSuccess,
} from './profile-external-accounts-tab/utils';
import { useExternalAccountsEditing } from './profile-external-accounts-tab/useExternalAccountsEditing';
import { ConnectedAccountCard } from './profile-external-accounts-tab/ConnectedAccountCard';
import { AccountSetupCard } from './profile-external-accounts-tab/AccountSetupCard';

export function ProfileExternalAccountsTab({
  currentUser,
  externalAccounts,
  isLoadingExternal,
  extForm,
  setExtForm,
  onFetchExternalAccounts,
  onTestConnection,
  onSaveExternalAccount,
  onDeleteExternalAccount,
}: ProfileExternalAccountsTabProps) {
  const {
    editingSystems,
    handleStartEdit,
    handleCancelEdit,
    handleSaveAccountWrapper,
  } = useExternalAccountsEditing({
    currentUser,
    setExtForm,
    onSaveExternalAccount,
  });

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-5 sm:gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              Liên Kết Các Hệ Thống Đào Tạo & Học Tập Trực Tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tự động đồng bộ từ: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong> • <strong className="text-purple-600 font-mono">slink.ptit.edu.vn</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFetchExternalAccounts}
          disabled={isLoadingExternal}
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExternal ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Security & Instruction Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-indigo-950">Quy trình liên kết tài khoản an toàn</p>
          <p className="text-slate-600 leading-relaxed">
            Để đảm bảo thông tin đăng nhập chính xác, hệ thống yêu cầu <strong>Kiểm Tra Kết Nối</strong> trực tiếp với cổng trường thành công trước khi lưu cấu hình. Thông tin được mã hóa bảo mật và chỉ dùng để tự động đồng bộ kết quả học tập, thời khóa biểu & lịch thi.
          </p>
        </div>
      </div>

      {isLoadingExternal ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Đang tải danh sách hệ thống liên kết...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-6">
          {externalAccounts.map((sys) => {
            const isEditing = !!editingSystems[sys.systemKey];
            const isConnected = sys.isConfigured && !isEditing;
            const isError = isAccountSyncError(sys);
            const isSlink = sys.systemKey === 'SLINK_PTIT';
            const form = extForm[sys.systemKey] || createDefaultFormState(sys, currentUser);
            const isTestSuccess = isConnectionTestSuccess(isSlink, form);

            if (isConnected) {
              return (
                <ConnectedAccountCard
                  key={sys.systemKey}
                  sys={sys}
                  isError={isError}
                  isSlink={isSlink}
                  form={form}
                  onTestConnection={onTestConnection}
                  onStartEdit={handleStartEdit}
                  onDeleteExternalAccount={onDeleteExternalAccount}
                />
              );
            }

            return (
              <AccountSetupCard
                key={sys.systemKey}
                sys={sys}
                isEditing={isEditing}
                isSlink={isSlink}
                form={form}
                isTestSuccess={isTestSuccess}
                setExtForm={setExtForm}
                onTestConnection={onTestConnection}
                onSaveAccount={handleSaveAccountWrapper}
                onCancelEdit={handleCancelEdit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
