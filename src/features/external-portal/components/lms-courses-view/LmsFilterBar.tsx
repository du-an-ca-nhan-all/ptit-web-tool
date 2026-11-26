import React from 'react';
import { Filter, GraduationCap, Search, X } from 'lucide-react';
import { LmsFilterCounts, LmsSortBy, LmsStatusFilter } from './types';

interface LmsFilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: LmsStatusFilter;
  onStatusFilterChange: (value: LmsStatusFilter) => void;
  filterCounts: LmsFilterCounts;
  semestersList: string[];
  selectedSemester: string;
  onSelectedSemesterChange: (value: string) => void;
  sortBy: LmsSortBy;
  onSortByChange: (value: LmsSortBy) => void;
}

export function LmsFilterBar({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  filterCounts,
  semestersList,
  selectedSemester,
  onSelectedSemesterChange,
  sortBy,
  onSortByChange,
}: LmsFilterBarProps) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* Search */}
      <div className="relative w-full lg:max-w-xs">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Tìm theo mã môn, tên môn, giảng viên..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
        {/* Status Tabs Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold flex-wrap">
          <button
            type="button"
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tất cả ({filterCounts.all})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'IN_PROGRESS' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Đang học ({filterCounts.inProgress})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('NOT_STARTED')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'NOT_STARTED' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Chưa học ({filterCounts.notStarted})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Đã học xong ({filterCounts.completed})
          </button>
        </div>

        {/* Semester / Category Filter Dropdown */}
        {semestersList.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSemester}
              onChange={(e) => onSelectedSemesterChange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">Tất cả đợt / học kỳ</option>
              {semestersList.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as LmsSortBy)}
            className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="PROGRESS_ASC">Môn cần học trước</option>
            <option value="PROGRESS_DESC">Tiến độ: Cao đến Thấp</option>
            <option value="NAME_ASC">Tên môn học (A-Z)</option>
            <option value="GRADE_DESC">Điểm LMS cao nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}
