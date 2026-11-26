import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Inbox,
  Send,
} from 'lucide-react';

interface QueueMetricsGridProps {
  queueStats: any | null;
}

export default function QueueMetricsGrid({ queueStats }: QueueMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Card 1: Pending */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Đang Chờ Gửi</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Inbox className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {queueStats?.pending ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">tin trong hàng đợi</div>
        </div>
      </div>

      {/* Card 2: Active Sending */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Đang Gửi Đi</span>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-purple-600 font-mono">
            {queueStats?.sending ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">kết nối đồng thời</div>
        </div>
      </div>

      {/* Card 3: Sent Success */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Đã Gửi Thành Công</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {queueStats?.sentCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">tin nhắn / file</div>
        </div>
      </div>

      {/* Card 4: Failed */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Thất Bại</span>
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-rose-600 font-mono">
            {queueStats?.failedCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">vượt quá số lần thử</div>
        </div>
      </div>

      {/* Card 5: 429 Pauses */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Lần Chạm 429</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-600 font-mono">
            {queueStats?.rateLimitPauses ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            tự động hoãn thành công
          </div>
        </div>
      </div>

      {/* Card 6: Total Processed */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500">Tổng Đã Xử Lý</span>
          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-800 font-mono">
            {queueStats?.totalProcessed ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">kể từ khi khởi động</div>
        </div>
      </div>
    </div>
  );
}
