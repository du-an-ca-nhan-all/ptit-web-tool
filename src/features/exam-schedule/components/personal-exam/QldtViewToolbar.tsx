import React from 'react';
import {
  Calendar,
  ChevronDown,
  LayoutGrid,
  Printer,
  Search,
  Table as TableIcon,
  Timer,
} from 'lucide-react';
import type { QldtViewLayout, StatusFilterType } from '../../types/studentPersonalExam.types';

interface QldtViewToolbarProps {
  layoutMode: QldtViewLayout;
  onChangeLayoutMode: (mode: QldtViewLayout) => void;
  statusFilter: StatusFilterType;
  onChangeStatusFilter: (status: StatusFilterType) => void;
  totalCount: number;
  upcomingCount: number;
  pastCount: number;
  distinctFormats: string[];
  formatFilter: string;
  onChangeFormatFilter: (format: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
}

const LAYOUT_TABS: {
  mode: QldtViewLayout;
  label: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    mode: 'TABLE',
    label: 'Dạng Bảng',
    title: 'Xem lịch thi dưới dạng Bảng dữ liệu chi tiết (Table View)',
    Icon: TableIcon,
  },
  {
    mode: 'GRID',
    label: 'Dạng Thẻ',
    title: 'Xem lịch thi dưới dạng Thẻ lưới trực quan (Card Grid View)',
    Icon: LayoutGrid,
  },
  {
    mode: 'TIMELINE',
    label: 'Lộ Trình / Ngày Thi',
    title: 'Xem lịch thi gom nhóm theo Dòng thời gian / Từng ngày thi (Timeline View)',
    Icon: Calendar,
  },
  {
    mode: 'PRINT',
    label: 'Phiếu Báo Dự Thi',
    title: 'Xem mẫu Phiếu Báo Dự Thi chuẩn để in PDF hoặc giấy A4 (Print View)',
    Icon: Printer,
  },
];

export default function QldtViewToolbar({
  layoutMode,
  onChangeLayoutMode,
  statusFilter,
  onChangeStatusFilter,
  totalCount,
  upcomingCount,
  pastCount,
  distinctFormats,
  formatFilter,
  onChangeFormatFilter,
  searchQuery,
  onChangeSearchQuery,
}: QldtViewToolbarProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 print:hidden">
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-x-auto no-scrollbar shrink-0">
        {LAYOUT_TABS.map(({ mode, label, title, Icon }) => (
          <button
            key={mode}
            onClick={() => onChangeLayoutMode(mode)}
            className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              layoutMode === mode
                ? 'bg-white text-indigo-600 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title={title}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl sm:rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onChangeStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả ({totalCount})
          </button>
          <button
            onClick={() => onChangeStatusFilter('UPCOMING')}
            className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              statusFilter === 'UPCOMING'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Timer className="w-3 h-3" />
            <span>Sắp Thi ({upcomingCount})</span>
          </button>
          <button
            onClick={() => onChangeStatusFilter('PAST')}
            className={`px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'PAST'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã Thi ({pastCount})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          {distinctFormats.length > 1 && (
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={formatFilter}
                onChange={(e) => onChangeFormatFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-7"
              >
                <option value="ALL">Mọi hình thức</option>
                {distinctFormats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="relative flex-1 sm:flex-initial sm:min-w-[170px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Tìm môn, phòng..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
