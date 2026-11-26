import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { SyncFeedback } from './types';

interface TimetableStatusBannersProps {
  syncFeedback: SyncFeedback | null;
  onDismissSyncFeedback: () => void;
  hasLinkedAccount?: boolean;
  onNavigateToExternalAccounts?: () => void;
}

export default function TimetableStatusBanners({
  syncFeedback,
  onDismissSyncFeedback,
  hasLinkedAccount,
  onNavigateToExternalAccounts,
}: TimetableStatusBannersProps) {
  return (
    <>
      {/* Sync Toast Feedback Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-3xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={onDismissSyncFeedback}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unlinked Account Notice Banner */}
      {!hasLinkedAccount && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Chưa liên kết tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Liên kết tài khoản QLDTTX để hệ thống tự động cập nhật thời khóa biểu, phòng học và thông báo nhắc lịch học ca tối qua Telegram.
              </p>
            </div>
          </div>
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Liên Kết QLĐT Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
