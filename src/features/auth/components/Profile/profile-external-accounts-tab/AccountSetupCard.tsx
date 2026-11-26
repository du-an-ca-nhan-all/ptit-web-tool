'use client';

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Lock,
  Pencil,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { SlinkConnectionGuide } from '@/src/features/external-portal/components/SlinkConnectionGuide';
import { SystemIcon } from './SystemIcon';
import { AccountStepIndicator } from './AccountStepIndicator';
import { AccountFormInputs } from './AccountFormInputs';
import type { ExternalAccountFormState } from './types';

interface AccountSetupCardProps {
  sys: any;
  isEditing: boolean;
  isSlink: boolean;
  form: ExternalAccountFormState;
  isTestSuccess: boolean;
  setExtForm: React.Dispatch<React.SetStateAction<any>>;
  onTestConnection: (sys: any) => Promise<void>;
  onSaveAccount: (sys: any) => Promise<void>;
  onCancelEdit: (sysKey: string) => void;
}

export function AccountSetupCard({
  sys,
  isEditing,
  isSlink,
  form,
  isTestSuccess,
  setExtForm,
  onTestConnection,
  onSaveAccount,
  onCancelEdit,
}: AccountSetupCardProps) {
  return (
    <div
      className={`rounded-3xl border transition-all p-5 sm:p-6 flex flex-col gap-4.5 shadow-xs ${
        isEditing
          ? 'bg-white border-indigo-300 ring-4 ring-indigo-50'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <SystemIcon iconKey={sys.iconKey} isConnected={false} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-slate-800 text-sm sm:text-base">
                {isEditing ? `Chỉnh Sửa Cấu Hình: ${sys.systemName}` : sys.systemName}
              </h4>
              {isEditing ? (
                <span className="bg-indigo-100 text-indigo-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 inline-flex items-center gap-1">
                  <Pencil className="w-3 h-3" /> Đang Chỉnh Sửa
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  Chưa Liên Kết
                </span>
              )}
            </div>
            <a
              href={sys.systemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 hover:underline mt-0.5"
            >
              <span>{sys.systemUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => onCancelEdit(sys.systemKey)}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Hủy Chỉnh Sửa</span>
          </button>
        )}
      </div>

      {sys.description && !isEditing && (
        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
          {sys.description}
        </p>
      )}

      {/* Hướng Dẫn Kết Nối Dành Riêng Cho PTIT S-Link */}
      {sys.systemKey === 'SLINK_PTIT' && (
        <SlinkConnectionGuide
          variant="card"
          defaultExpanded={true}
          defaultUsername={form.username || ''}
          title={isEditing ? 'Hướng Dẫn Lấy Refresh Token OAuth PTIT S-Link Mới' : 'Hướng Dẫn Kết Nối PTIT S-Link Qua OAuth Refresh Token'}
        />
      )}

      {/* 3-Step Flow Visual Indicator */}
      <AccountStepIndicator isTestSuccess={isTestSuccess} testStatus={form.testStatus} />

      {/* Input Fields */}
      <AccountFormInputs
        sys={sys}
        isSlink={isSlink}
        isEditing={isEditing}
        form={form}
        setExtForm={setExtForm}
      />

      {/* Interactive Status & Feedback Alert */}
      {isTestSuccess ? (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold block text-emerald-950">Kiểm tra kết nối thành công!</strong>
            <span className="text-emerald-800 text-[11px]">
              Tài khoản và mật khẩu hoàn toàn chính xác. Nút <strong>"{isEditing ? 'Lưu Thay Đổi' : 'Lưu & Kết Nối'}"</strong> bên dưới đã được mở khóa.
            </span>
          </div>
        </div>
      ) : form.testStatus === 'FAILED' ? (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-950 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold block text-rose-950">Kiểm tra kết nối thất bại!</strong>
            <span className="text-rose-800 text-[11px]">
              {form.testMessage || `Tên đăng nhập hoặc mật khẩu không chính xác trên ${sys.systemName}. Vui lòng kiểm tra lại.`}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-950">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <strong className="font-bold block text-amber-950">Yêu cầu kiểm tra kết nối</strong>
            <span className="text-amber-900 text-[11px]">
              Vui lòng bấm nút <strong>"Kiểm Tra Kết Nối"</strong> (Bước 2) để xác thực tài khoản trước khi lưu.
            </span>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Step 2 Action Button: Test Connection */}
          <button
            type="button"
            onClick={() => onTestConnection(sys)}
            disabled={
              form.isTesting ||
              (isSlink
                ? !form.refreshToken?.trim()
                : !form.username?.trim() || (!form.password?.trim() && !sys.hasPassword))
            }
            className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-xs ${
              isTestSuccess
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-100'
            }`}
          >
            {form.isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isTestSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {form.isTesting
                ? 'Đang Kiểm Tra Kết Nối...'
                : isTestSuccess
                ? 'Đã Xác Thực Thành Công'
                : 'Kiểm Tra Kết Nối'}
            </span>
          </button>

          {/* Step 3 Action Button: Save & Connect */}
          <button
            type="button"
            onClick={() => onSaveAccount(sys)}
            disabled={form.isSaving || !isTestSuccess}
            className={`px-5 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
              !isTestSuccess
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer active:scale-95'
            }`}
          >
            {form.isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !isTestSuccess ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            <span>{isEditing ? 'Lưu Thay Đổi' : 'Lưu & Kết Nối'}</span>
          </button>
        </div>

        {isEditing ? (
          <button
            type="button"
            onClick={() => onCancelEdit(sys.systemKey)}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Hủy Bỏ
          </button>
        ) : null}
      </div>
    </div>
  );
}
