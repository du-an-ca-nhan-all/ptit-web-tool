import React from 'react';
import { Check, Copy, Search, X } from 'lucide-react';
import { ClassBreakdownItem } from './types';

interface RoomStudentsToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedClass: string;
  onSelectClass: (value: string) => void;
  copiedMssv: boolean;
  onCopyAllMssv: () => void;
  filteredCount: number;
  totalCount: number;
  classBreakdown: ClassBreakdownItem[];
  userClass: string;
}

export default function RoomStudentsToolbar({
  searchQuery,
  onSearchQueryChange,
  selectedClass,
  onSelectClass,
  copiedMssv,
  onCopyAllMssv,
  filteredCount,
  totalCount,
  classBreakdown,
  userClass,
}: RoomStudentsToolbarProps) {
  return (
    <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-white">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo MSSV, Họ và tên, Lớp..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-700 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCopyAllMssv}
            disabled={filteredCount === 0}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Sao chép danh sách MSSV đang hiển thị"
          >
            {copiedMssv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã chép MSSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Chép {filteredCount} MSSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Class Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lớp:</span>
        <button
          type="button"
          onClick={() => onSelectClass('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
            selectedClass === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          Tất cả ({totalCount})
        </button>
        {classBreakdown.map((c) => {
          const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
          const isSelected = selectedClass.trim().toUpperCase() === c.className.trim().toUpperCase();
          return (
            <button
              key={c.className}
              type="button"
              onClick={() => onSelectClass(isSelected ? 'ALL' : c.className)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : isMyClass
                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>{c.className}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {c.count}
              </span>
              {isMyClass && !isSelected && (
                <span className="text-[9px] bg-blue-200 text-blue-900 px-1 py-0.2 rounded font-semibold">
                  Lớp bạn
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
