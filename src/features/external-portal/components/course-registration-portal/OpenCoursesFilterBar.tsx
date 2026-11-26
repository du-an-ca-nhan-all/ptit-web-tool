'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { CourseStatusFilter, CourseViewMode } from './types';

interface OpenCoursesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: CourseStatusFilter;
  setStatusFilter: (filter: CourseStatusFilter) => void;
  viewMode: CourseViewMode;
  setViewMode: (mode: CourseViewMode) => void;
  totalOpenGroupsCount: number;
  totalRegisteredCoursesCount: number;
  expandAllSubjects: () => void;
  collapseAllSubjects: () => void;
}

export function OpenCoursesFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  totalOpenGroupsCount,
  totalRegisteredCoursesCount,
  expandAllSubjects,
  collapseAllSubjects,
}: OpenCoursesFilterBarProps) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã môn, tên môn, nhóm tổ, phòng học, TKB..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
        {/* Status Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Tất Cả ({totalOpenGroupsCount})
          </button>
          <button
            onClick={() => setStatusFilter('AVAILABLE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Còn Slot
          </button>
          <button
            onClick={() => setStatusFilter('FULL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'FULL' ? 'bg-rose-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Hết Slot
          </button>
          <button
            onClick={() => setStatusFilter('REGISTERED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'REGISTERED' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Đã ĐK ({totalRegisteredCoursesCount})
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setViewMode('ACCORDION')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'ACCORDION' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Gom nhóm theo môn học"
          >
            Gom Môn
          </button>
          <button
            onClick={() => setViewMode('FLAT')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              viewMode === 'FLAT' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
            }`}
            title="Dạng bảng chi tiết tất cả nhóm tổ"
          >
            Bảng Phẳng
          </button>
        </div>

        {viewMode === 'ACCORDION' && (
          <div className="flex items-center gap-1">
            <button
              onClick={expandAllSubjects}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Mở tất cả
            </button>
            <button
              onClick={collapseAllSubjects}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
