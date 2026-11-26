'use client';

import React from 'react';
import { AlertTriangle, Check, Flame, Search, X } from 'lucide-react';
import { CompareFilter } from './types';

interface AllCompareToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  compareFilter: CompareFilter;
  onFilterChange: (filter: CompareFilter) => void;
  studentsCount: number;
  needsAttentionCount: number;
  activeFollowersCount: number;
  matched100Count: number;
  linkedAccountsCount: number;
}

export function AllCompareToolbar({
  searchQuery,
  onSearchChange,
  compareFilter,
  onFilterChange,
  studentsCount,
  needsAttentionCount,
  activeFollowersCount,
  matched100Count,
  linkedAccountsCount,
}: AllCompareToolbarProps) {
  return (
    <>
      {/* Filter Toolbar */}
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
        {/* Search Box */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm sinh viên theo mã SV, họ tên..."
            className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 scroll-smooth snap-x">
          <button
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
              compareFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({studentsCount})
          </button>

          <button
            onClick={() => onFilterChange('NEEDS_ATTENTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer flex items-center gap-1 ${
              compareFilter === 'NEEDS_ATTENTION'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cần Xử Lý ({needsAttentionCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('ACTIVE_FLOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
              compareFilter === 'ACTIVE_FLOW'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Đang Bật Flow ({activeFollowersCount})
          </button>

          <button
            onClick={() => onFilterChange('MATCHED_100')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
              compareFilter === 'MATCHED_100'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Đã Khớp 100% ({matched100Count})
          </button>

          {studentsCount - linkedAccountsCount > 0 && (
            <button
              onClick={() => onFilterChange('NOT_LINKED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
                compareFilter === 'NOT_LINKED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Chưa Có TK ({studentsCount - linkedAccountsCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile Scroll Helper Hint */}
      <div className="px-3.5 sm:px-5 py-2 bg-amber-50/60 border-b border-amber-200/50 flex items-center justify-between text-[11px] font-bold text-amber-900">
        <span className="flex items-center gap-1.5">
          💡 <span className="font-semibold">Vuốt ngang bảng để xem tất cả các môn đối chiếu, hoặc bấm vào nút chi tiết để xem 1-1.</span>
        </span>
      </div>

      {/* Legend Guidance */}
      <div className="px-3.5 sm:px-5 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-bold text-slate-600 overflow-x-auto snap-x">
        <span className="text-slate-400 uppercase text-[9px] sm:text-[10px] shrink-0">Chú thích:</span>
        <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
          <Check className="w-3 h-3 text-emerald-600" /> Khớp 100%
        </span>
        <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Lệch Nhóm
        </span>
        <span className="flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
          <X className="w-3 h-3 text-rose-600" /> Chưa ĐK
        </span>
        <span className="flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
          🟣 Thừa Ngoài
        </span>
      </div>
    </>
  );
}
