import React from 'react';
import { Calendar, Clock, HardDrive, Layers, Users } from 'lucide-react';
import { DatabaseStats } from './types';

interface OverviewStatsCardsProps {
  stats: DatabaseStats | null;
  localBackupsCount: number;
}

export function OverviewStatsCards({
  stats,
  localBackupsCount,
}: OverviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {/* DB File Size */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
          <span>Dung Lượng Database</span>
          <HardDrive className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-black text-white tracking-tight">
          {stats ? stats.dbFileSizeFormatted : '...'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>
            {stats?.dbLastModified
              ? new Date(stats.dbLastModified).toLocaleString('vi-VN')
              : 'PostgreSQL Database'}
          </span>
        </div>
      </div>

      {/* Total Records */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
          <span>Tổng Bản Ghi</span>
          <Layers className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-black text-emerald-400 tracking-tight">
          {stats ? stats.totalRecords.toLocaleString('vi-VN') : '...'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {stats ? `${stats.tableBreakdown.length} bảng dữ liệu hệ thống` : 'Các bảng dữ liệu'}
        </div>
      </div>

      {/* Total Tables */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
          <span>Tổng Số Bảng CSDL</span>
          <Users className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-2xl font-black text-sky-400 tracking-tight">
          {stats?.tableBreakdown?.length || Object.keys(stats?.tables || {}).length}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Toàn bộ bảng trong public schema
        </div>
      </div>

      {/* Server Snapshots & Storage */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
          <span>Bản Sao Lưu Máy Chủ</span>
          <Calendar className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-black text-amber-400 tracking-tight">
          {localBackupsCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          File snapshot trong thư mục backups/
        </div>
      </div>
    </div>
  );
}
