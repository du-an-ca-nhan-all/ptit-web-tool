import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { ACTION_CATEGORIES } from '../../types/activityLogActions';
import { ACTION_CONFIGS } from './actionConfigs';
import { ActivityLogsPagination } from './types';

interface ActivityLogsFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  actionFilter: string;
  onActionFilterChange: (action: string) => void;
  filteredAvailableActions: string[];
  pagination: ActivityLogsPagination;
  isLoading: boolean;
  onFetchPage: (page: number) => void;
}

export function ActivityLogsFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchQueryChange,
  actionFilter,
  onActionFilterChange,
  filteredAvailableActions,
  pagination,
  isLoading,
  onFetchPage,
}: ActivityLogsFiltersProps) {
  return (
    <>
      {/* Category Filter Pills (Scrollable horizontally) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Object.entries(ACTION_CATEGORIES).map(([key, cat]) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectCategory(key)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto flex-1">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mô tả, người dùng, mã SV..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Action selector */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={actionFilter}
              onChange={(e) => onActionFilterChange(e.target.value)}
              className="w-full sm:w-auto pl-3 pr-8 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none truncate"
            >
              <option value="">
                {selectedCategory === 'ALL'
                  ? `Tất cả hành động (${filteredAvailableActions.length})`
                  : `Tất cả trong nhóm (${filteredAvailableActions.length})`}
              </option>
              {filteredAvailableActions.map((act) => {
                const config = ACTION_CONFIGS[act] || { label: act };
                return (
                  <option key={act} value={act}>
                    {config.label} ({act})
                  </option>
                );
              })}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Pagination Summary */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold justify-between md:justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span>
            Trang {pagination.page} / {pagination.totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFetchPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => onFetchPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
