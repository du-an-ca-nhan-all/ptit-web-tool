'use client';

import React from 'react';
import { Bell, User, BookOpen, CheckCircle2, Search, RefreshCw } from 'lucide-react';
import { ReminderStats, ReminderTabFilter, ReminderStatusFilter } from './types';

interface RemindersStatsAndFiltersProps {
  stats: ReminderStats;
  activeTab: ReminderTabFilter;
  onTabChange: (tab: ReminderTabFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: ReminderStatusFilter;
  onStatusFilterChange: (status: ReminderStatusFilter) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RemindersStatsAndFilters({
  stats,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isRefreshing,
  onRefresh,
}: RemindersStatsAndFiltersProps) {
  return (
    <>
      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tổng nhắc hẹn</span>
            <Bell className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-slate-800">{stats.total}</span>
          <span className="text-[11px] text-slate-400">{stats.active} đang hoạt động</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Nhắc hẹn cá nhân</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600">{stats.personal}</span>
          <span className="text-[11px] text-slate-400">Riêng tài khoản bạn</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Theo môn học & tổ</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600">{stats.course}</span>
          <span className="text-[11px] text-slate-400">Chia sẻ cùng lớp/tổ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{stats.completed}</span>
          <span className="text-[11px] text-slate-400">Nhiệm vụ đã chốt</span>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => onTabChange('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tất Cả ({stats.total})
          </button>
          <button
            onClick={() => onTabChange('PERSONAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PERSONAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cá Nhân ({stats.personal})</span>
          </button>
          <button
            onClick={() => onTabChange('COURSE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'COURSE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theo Môn Học ({stats.course})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, môn, ghi chú..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Chưa hoàn thành</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>
    </>
  );
}
