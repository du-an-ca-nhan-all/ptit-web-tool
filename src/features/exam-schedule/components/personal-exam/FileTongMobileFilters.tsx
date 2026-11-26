import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { FilterState } from '../FilterBar';

interface FileTongMobileFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  subjects: { code: string; name: string }[];
  dates: string[];
}

export default function FileTongMobileFilters({
  filters,
  setFilters,
  subjects,
  dates,
}: FileTongMobileFiltersProps) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <select
            value={filters.subjectCode}
            onChange={(e) => setFilters((prev) => ({ ...prev, subjectCode: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-6 truncate"
          >
            <option value="">Tất cả môn</option>
            {subjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-6 truncate"
          >
            <option value="">Tất cả ngày</option>
            {dates.map((dateItem) => (
              <option key={dateItem} value={dateItem}>
                {dateItem}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Tìm môn, phòng, ngày thi..."
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
    </div>
  );
}
