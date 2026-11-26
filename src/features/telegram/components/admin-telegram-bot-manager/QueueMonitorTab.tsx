import React from 'react';
import {
  Activity,
  Clock,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import QueueHistoryTable from './QueueHistoryTable';
import QueueMetricsGrid from './QueueMetricsGrid';

interface QueueMonitorTabProps {
  queueStats: any | null;
  isFetchingQueue: boolean;
  isTogglingQueuePause: boolean;
  isClearingQueue: boolean;
  onRefreshQueue: () => void;
  onToggleQueuePause: (pause: boolean) => void;
  onClearQueue: () => void;
}

export default function QueueMonitorTab({
  queueStats,
  isFetchingQueue,
  isTogglingQueuePause,
  isClearingQueue,
  onRefreshQueue,
  onToggleQueuePause,
  onClearQueue,
}: QueueMonitorTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header & Action Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-2xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-800">
                Hàng Đợi Gửi Tin Toàn Cục (Global Telegram Queue)
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  queueStats?.isPaused
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : queueStats?.rateLimitedUntil
                    ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                    : queueStats?.sending > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                    : queueStats?.pending > 0
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {queueStats?.isPaused
                  ? 'ĐANG TẠM DỪNG'
                  : queueStats?.rateLimitedUntil
                  ? 'ĐANG HOÃN (429 COOLDOWN)'
                  : queueStats?.sending > 0
                  ? 'ĐANG GỬI TIN...'
                  : queueStats?.pending > 0
                  ? 'CÓ TIN ĐANG CHỜ'
                  : 'SẴN SÀNG (IDLE)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Điều phối gửi tin tuần tự có kiểm soát tốc độ (Rate Limit) để không bị Telegram chặn
              HTTP 429 Too Many Requests.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onRefreshQueue}
            disabled={isFetchingQueue}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 ${isFetchingQueue ? 'animate-spin' : ''}`}
            />
            <span>Làm Mới</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleQueuePause(!queueStats?.isPaused)}
            disabled={isTogglingQueuePause}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              queueStats?.isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
            }`}
          >
            {queueStats?.isPaused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Tiếp Tục Chạy</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Tạm Dừng Hàng Đợi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClearQueue}
            disabled={isClearingQueue || (!queueStats?.pending && !queueStats?.sending)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Chờ Gửi</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <QueueMetricsGrid queueStats={queueStats} />

      {/* Rate Limiting Specs & Parameters */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white">
            Chính Sách Chống Giới Hạn Tốc Độ (Rate Limit Rules)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>Khoảng cách gửi toàn cục (Global)</span>
            </div>
            <div className="text-slate-200 font-semibold font-mono text-sm">
              {queueStats?.minGlobalIntervalMs || 50}ms / tin (Tối đa ~20 tin/s)
            </div>
            <div className="text-[11px] text-slate-400">
              Telegram cho phép tối đa 30 tin/s. Giới hạn 20 tin/s bảo đảm an toàn 100% không bị
              ngắt kết nối.
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Khoảng cách cùng 1 Chat ID</span>
            </div>
            <div className="text-slate-200 font-semibold font-mono text-sm">
              {queueStats?.minPerChatIntervalMs || 1100}ms / tin (Tối đa 1 tin / 1.1s)
            </div>
            <div className="text-[11px] text-slate-400">
              Telegram giới hạn 1 tin/s đối với mỗi nhóm/chat. Queue tự động phân bổ xen kẽ các chat
              khác nhau.
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Cơ chế Xếp hàng & Thử lại (Retry)</span>
            </div>
            <div className="text-slate-200 font-semibold text-[11px] leading-relaxed">
              <span className="text-rose-300 font-bold">CRITICAL / HIGH</span> &gt;{' '}
              <span className="text-indigo-300 font-bold">NORMAL</span> &gt;{' '}
              <span className="text-slate-400 font-bold">BULK</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Lỗi thông thường: Retry tối đa <b>{queueStats?.maxRetriesDefault ?? 20} lần</b>. Nếu
              gặp 429 Too Many Requests: Cho phép retry tối đa{' '}
              <b>{queueStats?.maxRetries429 ?? 1000} lần</b> theo thời gian `retry_after`.
            </div>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <QueueHistoryTable recentHistory={queueStats?.recentHistory} />
    </div>
  );
}
