import React from 'react';
import { Users, Search, X, PauseCircle } from 'lucide-react';
import { ActiveTab, GenderFilter } from './types';

interface ClassMembersToolbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeCount: number;
  excludedCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  genderFilter: GenderFilter;
  onGenderFilterChange: (filter: GenderFilter) => void;
}

export default function ClassMembersToolbar({
  activeTab,
  onTabChange,
  activeCount,
  excludedCount,
  search,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
}: ClassMembersToolbarProps) {
  return (
    <>
      {/* Navigation Tabs between Active Members & Excluded List */}
      <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-4 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap">
          <button
            onClick={() => onTabChange('ACTIVE')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Đang Theo Học ({activeCount})
          </button>

          <button
            onClick={() => onTabChange('EXCLUDED')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'EXCLUDED'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Bảo Lưu / Chuyển Đi ({excludedCount})
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã SV, Họ tên, SĐT, Ghi chú..."
            className="bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-800 font-medium"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-bold">
            <button
              onClick={() => onGenderFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => onGenderFilterChange('NAM')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === 'NAM' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nam
            </button>
            <button
              onClick={() => onGenderFilterChange('NU')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                genderFilter === 'NU' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nữ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
