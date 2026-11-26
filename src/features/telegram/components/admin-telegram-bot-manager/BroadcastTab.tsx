import React from 'react';
import { AlertCircle, CheckCircle2, Megaphone, RefreshCw, Send } from 'lucide-react';

interface BroadcastTabProps {
  totalActive: number;
  broadcastTitle: string;
  setBroadcastTitle: (value: string) => void;
  broadcastContent: string;
  setBroadcastContent: (value: string) => void;
  isBroadcasting: boolean;
  broadcastResult: any | null;
  onBroadcast: (e: React.FormEvent) => void;
}

export default function BroadcastTab({
  totalActive,
  broadcastTitle,
  setBroadcastTitle,
  broadcastContent,
  setBroadcastContent,
  isBroadcasting,
  broadcastResult,
  onBroadcast,
}: BroadcastTabProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6 max-w-4xl">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">
              Phát Sóng Thông Báo Toàn Trường Qua Telegram
            </h3>
            <p className="text-xs text-slate-500">
              Gửi thông báo khẩn cấp hoặc tin tức chung đến toàn bộ{' '}
              <strong className="text-indigo-600">{totalActive} tài khoản</strong> đang kích hoạt
              nhận tin.
            </p>
          </div>
        </div>
      </div>

      {broadcastResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
            broadcastResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {broadcastResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <div>{broadcastResult.message || broadcastResult.error}</div>
            {broadcastResult.success && (
              <div className="font-normal text-[11px] opacity-80 mt-0.5">
                Thành công: {broadcastResult.totalSent} | Thất bại: {broadcastResult.totalFailed}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={onBroadcast} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Tiêu Đề Thông Báo
          </label>
          <input
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Ví dụ: THAY ĐỔI LỊCH THI HỌC KỲ 2 NĂM HỌC 2025-2026"
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Nội Dung Thông Báo (Hỗ trợ định dạng HTML / Text)
          </label>
          <textarea
            value={broadcastContent}
            onChange={(e) => setBroadcastContent(e.target.value)}
            placeholder="Nhập nội dung chi tiết cần thông báo tới toàn bộ sinh viên..."
            rows={6}
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            required
          />
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isBroadcasting || !broadcastTitle || !broadcastContent}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isBroadcasting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang gửi phát sóng tới {totalActive} tài khoản...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Phát Sóng Tới Toàn Bộ Sinh Viên</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
