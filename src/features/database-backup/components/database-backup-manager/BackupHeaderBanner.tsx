import React from 'react';
import { Clock, Database, RefreshCw } from 'lucide-react';
import { formatServerDate, formatServerTime } from './utils';

interface BackupHeaderBannerProps {
  currentServerTime: Date;
  isLoading: boolean;
  onRefresh: () => void;
}

export function BackupHeaderBanner({
  currentServerTime,
  isLoading,
  onRefresh,
}: BackupHeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Sao Lưu & Phục Hồi Cơ Sở Dữ Liệu
              </h1>
              <p className="text-slate-400 text-sm">
                Quản lý sao lưu an toàn, tự động lúc <b>10:00 sáng VN</b> & <b>phục hồi dữ liệu tức thì</b> (từ Snapshot máy chủ hoặc tải lên từ máy tính)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Server Clock Widget */}
          <div
            className="flex items-center gap-3 px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-inner backdrop-blur-md"
            title="Thời gian máy chủ (Server Time) được đồng bộ thời gian thực"
          >
            <div className="relative flex items-center justify-center pl-1">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Ngày giờ máy chủ</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm font-black text-emerald-300 tracking-wider">
                  {formatServerTime(currentServerTime)}
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  {formatServerDate(currentServerTime)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>
    </div>
  );
}
