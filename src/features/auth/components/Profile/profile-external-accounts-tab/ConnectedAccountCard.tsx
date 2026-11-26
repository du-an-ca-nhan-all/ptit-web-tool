'use client';

import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Key,
  Pencil,
  RefreshCw,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { SlinkConnectionGuide } from '@/src/features/external-portal/components/SlinkConnectionGuide';
import { SystemIcon } from './SystemIcon';
import type { ExternalAccountFormState } from './types';

interface ConnectedAccountCardProps {
  sys: any;
  isError: boolean;
  isSlink: boolean;
  form: ExternalAccountFormState;
  onTestConnection: (sys: any) => Promise<void>;
  onStartEdit: (sys: any) => void;
  onDeleteExternalAccount: (sys: any) => Promise<void>;
}

export function ConnectedAccountCard({
  sys,
  isError,
  isSlink,
  form,
  onTestConnection,
  onStartEdit,
  onDeleteExternalAccount,
}: ConnectedAccountCardProps) {
  return (
    <div
      className={`rounded-3xl border bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4.5 transition-all ${
        isError
          ? 'border-rose-200 hover:border-rose-300'
          : 'border-emerald-200 hover:border-emerald-300'
      }`}
    >
      {/* System Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <SystemIcon iconKey={sys.iconKey} isConnected={true} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-slate-800 text-sm sm:text-base">
                {sys.systemName}
              </h4>
              {isError ? (
                <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-rose-300 inline-flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Kết Nối Thất Bại
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã Liên Kết
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
      </div>

      {/* Summary Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <UserIcon className="w-3 h-3" /> Tài khoản liên kết
          </span>
          <span className="font-mono font-bold text-slate-800 text-sm truncate">
            {sys.extUsername}
          </span>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Key className="w-3 h-3" /> {isSlink ? 'Xác thực OAuth' : 'Mật khẩu'}
          </span>
          <span className="font-mono font-bold text-slate-600 text-xs sm:text-sm truncate">
            {isSlink
              ? sys.hasRefreshToken
                ? 'Refresh Token (Tự gia hạn)'
                : 'Chưa có Refresh Token'
              : '••••••••••••'}
          </span>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> {isSlink ? 'Gia hạn token gần nhất' : 'Đồng bộ gần nhất'}
          </span>
          <span className="font-bold text-slate-700 text-xs truncate">
            {isSlink && sys.lastTokenRefreshedAt
              ? new Date(sys.lastTokenRefreshedAt).toLocaleString('vi-VN')
              : sys.lastSyncAt
              ? new Date(sys.lastSyncAt).toLocaleString('vi-VN')
              : 'Đã kết nối'}
          </span>
        </div>
      </div>

      {/* Status / Sync message banner */}
      {sys.syncMessage && (
        <div
          className={`text-xs p-3 rounded-2xl flex items-center gap-2 ${
            isError
              ? 'text-rose-900 bg-rose-50 border border-rose-200/80'
              : 'text-emerald-900 bg-emerald-50 border border-emerald-200/80'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{sys.syncMessage}</span>
        </div>
      )}

      {/* S-Link Helper Guide in connected view */}
      {sys.systemKey === 'SLINK_PTIT' && (
        <SlinkConnectionGuide
          variant="compact"
          defaultUsername={sys.extUsername || ''}
        />
      )}

      {/* Action Buttons for Connected State */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button Test / Refresh Session */}
          <button
            type="button"
            onClick={() => onTestConnection(sys)}
            disabled={form.isTesting}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Kiểm tra lại trạng thái kết nối và làm mới phiên"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${form.isTesting ? 'animate-spin' : ''}`} />
            <span>{form.isTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Lại Kết Nối'}</span>
          </button>

          {/* Button Start Edit */}
          <button
            type="button"
            onClick={() => onStartEdit(sys)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isSlink ? 'Cập Nhật Refresh Token' : 'Chỉnh Sửa Thông Tin'}</span>
          </button>
        </div>

        {/* Button Delete / Disconnect */}
        <button
          type="button"
          onClick={() => onDeleteExternalAccount(sys)}
          className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-2xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hủy Liên Kết</span>
        </button>
      </div>
    </div>
  );
}
