import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterState {
  search: string;
  classCode: string;
  subjectCode: string;
  date: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  totalRecords: number;
  filteredCount: number;
  hideClassFilter?: boolean;
}

export default function FilterBar({
  filters,
  onFilterChange,
  classes,
  subjects,
  dates,
  totalRecords,
  filteredCount,
  hideClassFilter = false,
}: FilterBarProps) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ search: filters.search, classCode: '', subjectCode: '', date: '' });
  };

  const hasActiveFilters = filters.classCode || filters.subjectCode || filters.date;

  return (
    <div className="flex items-center gap-3 lg:gap-4 flex-wrap shrink-0">
      {!hideClassFilter && (
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 sm:flex-none min-w-[150px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Lớp:</span>
          <select
            className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full"
            value={filters.classCode}
            onChange={(e) => handleChange('classCode', e.target.value)}
          >
            <option value="">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 sm:flex-none min-w-[150px]">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Môn:</span>
        <select
          className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full sm:max-w-[200px] truncate"
          value={filters.subjectCode}
          onChange={(e) => handleChange('subjectCode', e.target.value)}
        >
          <option value="">Tất cả môn</option>
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 sm:flex-none min-w-[150px]">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ngày thi:</span>
        <select
          className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full"
          value={filters.date}
          onChange={(e) => handleChange('date', e.target.value)}
        >
          <option value="">Tất cả ngày</option>
          {dates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
          Xóa lọc
        </button>
      )}

      <div className="flex-1 hidden sm:block"></div>

      <div className="flex gap-2 items-center w-full sm:w-auto justify-end mt-2 sm:mt-0">
        <span className="text-sm text-slate-500 font-medium px-3">
          {filteredCount} / {totalRecords} kết quả
        </span>
        <button className="p-2 rounded-lg bg-blue-500 text-white shadow-md shadow-blue-200 hover:bg-blue-600 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
