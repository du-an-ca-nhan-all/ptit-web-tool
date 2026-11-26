import React from 'react';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertOctagon,
  Radio,
} from 'lucide-react';
import { AnnouncementStats } from './types';

interface OverviewHeaderProps {
  stats: AnnouncementStats;
  isLoading: boolean;
  successMsg: string;
  errorMsg: string;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

export function OverviewHeader({
  stats,
  isLoading,
  successMsg,
  errorMsg,
  onRefresh,
  onOpenCreate,
}: OverviewHeaderProps) {
  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-sky-300 mb-2.5 sm:mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Admin Announcements & Notifications</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            Quản Lý Thông Báo Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tạo và cấu hình các thông báo pop-up hoặc thanh banner hiển thị nổi bật cho toàn bộ sinh viên, lớp trưởng hoặc theo từng lớp khi truy cập website.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Thông Báo Mới</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thông Báo</div>
            <div className="text-lg sm:text-2xl font-black text-slate-800">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang Hiển Thị</div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600">{stats.activeCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Popup / Modal</div>
            <div className="text-lg sm:text-2xl font-black text-indigo-600">{stats.modalCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Xem</div>
            <div className="text-lg sm:text-2xl font-black text-amber-600">{stats.totalViews.toLocaleString('vi-VN')}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </>
  );
}
