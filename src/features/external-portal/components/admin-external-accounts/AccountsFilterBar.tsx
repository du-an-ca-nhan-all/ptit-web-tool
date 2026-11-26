import React from 'react';
import { Search, X } from 'lucide-react';
import { AVAILABLE_EXTERNAL_SYSTEMS } from '../../../../types';
import { StatusFilter } from './types';

interface AccountsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSystem: string;
  onSystemChange: (value: string) => void;
  selectedClass: string;
  onClassChange: (value: string) => void;
  classList: string[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  totalCount: number;
  hasTokenCount: number;
  connectedCount: number;
}

export function AccountsFilterBar({
  searchQuery,
  onSearchChange,
  selectedSystem,
  onSystemChange,
  selectedClass,
  onClassChange,
  classList,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  hasTokenCount,
  connectedCount,
}: AccountsFilterBarProps) {
  return (
    <div className="p-3 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 bg-slate-50/50">
      {/* Search Box */}
      <div className="relative w-full lg:max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo Mã SV, Họ tên, Lớp, SĐT..."
          className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-8 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
        {/* System and Class Dropdowns (2 columns on mobile) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          {/* System filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-2.5 py-1.5 text-xs shadow-2xs min-w-0">
            <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">Hệ thống:</span>
            <select
              value={selectedSystem}
              onChange={(e) => onSystemChange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer w-full truncate"
            >
              <option value="ALL">Tất cả hệ thống</option>
              {AVAILABLE_EXTERNAL_SYSTEMS.map((sys) => (
                <option key={sys.key} value={sys.key}>
                  {sys.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-2.5 py-1.5 text-xs shadow-2xs min-w-0">
            <span className="text-slate-400 font-bold shrink-0 hidden sm:inline">Lớp:</span>
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer w-full truncate"
            >
              <option value="ALL">Tất cả lớp ({classList.length})</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs (Scrollable on mobile) */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl sm:rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer text-[11px] sm:text-xs ${
              statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('HAS_TOKEN')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer text-[11px] sm:text-xs ${
              statusFilter === 'HAS_TOKEN'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Có Token ({hasTokenCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('CONNECTED')}
            className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl transition-colors cursor-pointer text-[11px] sm:text-xs ${
              statusFilter === 'CONNECTED'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã liên kết ({connectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
