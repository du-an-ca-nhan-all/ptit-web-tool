'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { FlowQueueStats } from './types';

interface FlowQueueFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalCount: number;
  stats: FlowQueueStats;
}

export function FlowQueueFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  stats,
}: FlowQueueFiltersBarProps) {
  return (
    <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
      <div className="relative w-full md:max-w-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo mã SV, họ tên, môn học..."
          className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full md:w-auto justify-start md:justify-end snap-x scroll-smooth">
        <button
          onClick={() => onStatusFilterChange('ALL')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất Cả ({totalCount})
        </button>
        <button
          onClick={() => onStatusFilterChange('QUEUED')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'QUEUED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
          }`}
        >
          Chờ ({stats.totalQueued})
        </button>
        <button
          onClick={() => onStatusFilterChange('RUNNING')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'RUNNING'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          Chạy ({stats.totalRunning})
        </button>
        <button
          onClick={() => onStatusFilterChange('SUCCESS')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'SUCCESS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Thành Công ({stats.totalSuccess})
        </button>
        <button
          onClick={() => onStatusFilterChange('FAILED')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'FAILED'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Lỗi ({stats.totalFailed})
        </button>
        <button
          onClick={() => onStatusFilterChange('CANCELLED')}
          className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
            statusFilter === 'CANCELLED'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          Hủy ({stats.totalCancelled})
        </button>
      </div>
    </div>
  );
}
