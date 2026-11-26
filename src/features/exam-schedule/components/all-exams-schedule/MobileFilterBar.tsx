'use client';

import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { FilterState } from '../../types/exam.types';

interface MobileFilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
}

export default function MobileFilterBar({
  filters,
  setFilters,
  classes,
  subjects,
  dates,
}: MobileFilterBarProps) {
  const isFilterActive = Boolean(filters.classCode || filters.subjectCode || filters.date || filters.search);

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        <div className="relative">
          <select
            value={filters.classCode}
            onChange={(e) => setFilters((prev) => ({ ...prev, classCode: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-5 truncate"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.subjectCode}
            onChange={(e) => setFilters((prev) => ({ ...prev, subjectCode: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-5 truncate"
          >
            <option value="">Tất cả môn</option>
            {subjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-5 truncate"
          >
            <option value="">Tất cả ngày</option>
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Tìm mã SV, họ tên, môn, phòng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isFilterActive && (
          <button
            onClick={() => setFilters({ classCode: '', subjectCode: '', date: '', search: '' })}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>
    </div>
  );
}
