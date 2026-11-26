import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { SystemTelegramBotInfo } from '../../../../types';

interface AdminSystemBotPanelProps {
  systemBot: SystemTelegramBotInfo | null;
  adminSystemToken: string;
  onAdminSystemTokenChange: (val: string) => void;
  isSavingSystemBot: boolean;
  systemBotMsg: string;
  systemBotError: string;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AdminSystemBotPanel({
  systemBot,
  adminSystemToken,
  onAdminSystemTokenChange,
  isSavingSystemBot,
  systemBotMsg,
  systemBotError,
  onSubmit,
}: AdminSystemBotPanelProps) {
  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs animate-in slide-in-from-top-3 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3.5 sm:pb-4 mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-xs shadow-amber-300 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Cấu Hình Bot Telegram Hệ Thống (Toàn Trường)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Dành riêng cho Quản trị viên: Toàn bộ sinh viên có thể dùng bot này mà không cần tự tạo bot.
            </p>
          </div>
        </div>

        {systemBot?.isConfigured && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đang Hoạt Động (@{systemBot.botUsername})</span>
          </span>
        )}
      </div>

      {systemBotMsg && (
        <div className="mb-4 p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl sm:rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{systemBotMsg}</span>
        </div>
      )}

      {systemBotError && (
        <div className="mb-4 p-3.5 bg-rose-100 border border-rose-300 rounded-xl sm:rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{systemBotError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5 sm:gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            System Bot API Token
          </label>
          <input
            type="text"
            value={adminSystemToken}
            onChange={(e) => onAdminSystemTokenChange(e.target.value)}
            placeholder="Nhập Token của Bot hệ thống (ví dụ: 123456789:ABCdef...)"
            className="w-full bg-white border border-amber-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Tạo 1 bot đại diện duy nhất (ví dụ: <code className="font-bold">@PTIT_EduSync_Bot</code>) qua @BotFather và dán token vào đây.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSavingSystemBot}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-xs shadow-amber-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {isSavingSystemBot ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Lưu & Kích Hoạt Bot Toàn Trường</span>
          </button>
        </div>
      </form>
    </div>
  );
}
