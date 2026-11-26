'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SortKey } from '../../types/exam.types';
import { SortConfig } from './types';

interface DataTableHeaderProps {
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  showRoomClassmatesColumn: boolean;
  hideStatusColumn: boolean;
}

function SortIcon({
  columnKey,
  sortConfig,
}: {
  columnKey: SortKey;
  sortConfig: SortConfig;
}) {
  if (sortConfig?.key !== columnKey)
    return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
  return sortConfig.direction === 'asc' ? (
    <ArrowUp className="w-3 h-3 ml-1 text-blue-500" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />
  );
}

export function DataTableHeader({
  sortConfig,
  onSort,
  showRoomClassmatesColumn,
  hideStatusColumn,
}: DataTableHeaderProps) {
  return (
    <thead className="bg-slate-50 sticky top-0 z-10">
      <tr>
        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
          STT
        </th>
        <th
          className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
          onClick={() => onSort('MaSV')}
        >
          <div className="flex items-center">
            Mã SV <SortIcon columnKey="MaSV" sortConfig={sortConfig} />
          </div>
        </th>
        <th
          className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
          onClick={() => onSort('Name')}
        >
          <div className="flex items-center">
            Họ Tên <SortIcon columnKey="Name" sortConfig={sortConfig} />
          </div>
        </th>
        <th
          className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
          onClick={() => onSort('MaLop')}
        >
          <div className="flex items-center">
            Lớp <SortIcon columnKey="MaLop" sortConfig={sortConfig} />
          </div>
        </th>
        <th
          className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
          onClick={() => onSort('MaMH')}
        >
          <div className="flex items-center">
            Môn Thi <SortIcon columnKey="MaMH" sortConfig={sortConfig} />
          </div>
        </th>
        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
          Phòng
        </th>
        <th
          className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
          onClick={() => onSort('DateTime')}
        >
          <div className="flex items-center">
            Ngày Thi <SortIcon columnKey="DateTime" sortConfig={sortConfig} />
          </div>
        </th>
        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
          Giờ
        </th>
        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
          HT
        </th>
        {showRoomClassmatesColumn && (
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
            Cùng lớp trong phòng
          </th>
        )}
        {!hideStatusColumn && (
          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
            Trạng thái thi
          </th>
        )}
      </tr>
    </thead>
  );
}
