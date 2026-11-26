import React from 'react';
import { Search, X } from 'lucide-react';
import { ClassSummary } from './types';

interface AllStudentsFiltersProps {
  isAdmin: boolean;
  searchQuery: string;
  selectedClass: string;
  selectedStatus: string;
  pageSize: number;
  classesList: ClassSummary[];
  onSearchChange: (val: string) => void;
  onClassChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onPageSizeChange: (size: number) => void;
}

export function AllStudentsFilters({
  isAdmin,
  searchQuery,
  selectedClass,
  selectedStatus,
  pageSize,
  classesList,
  onSearchChange,
  onClassChange,
  onStatusChange,
  onPageSizeChange,
}: AllStudentsFiltersProps) {
  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-1 flex-wrap">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isAdmin
                ? 'Tìm theo Mã SV, Họ tên, Lớp, SĐT, Ghi chú...'
                : 'Tìm theo Mã SV, Họ tên, Lớp...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 text-xs flex-1 sm:flex-initial">
            <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Lớp:</span>
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs w-full truncate"
            >
              <option value="ALL">Tất cả ({classesList.length})</option>
              {classesList.map((c) => (
                <option key={c.classCode} value={c.classCode}>
                  {c.classCode} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 text-xs flex-1 sm:flex-initial">
            <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">
              Trạng Thái:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs w-full truncate"
            >
              <option value="ALL">Tất cả</option>
              <option value="DANG_HOC">Đang học</option>
              <option value="BAO_LUU">Bảo lưu</option>
              <option value="NGHI_HOC">Nghỉ học</option>
              <option value="CHUYEN_LOP">Chuyển lớp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Page Size selector */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 text-xs text-slate-500 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span>Hiển thị:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 outline-none cursor-pointer text-xs"
        >
          <option value={25}>25 / trang</option>
          <option value={50}>50 / trang</option>
          <option value={100}>100 / trang</option>
          <option value={200}>200 / trang</option>
        </select>
      </div>
    </div>
  );
}
