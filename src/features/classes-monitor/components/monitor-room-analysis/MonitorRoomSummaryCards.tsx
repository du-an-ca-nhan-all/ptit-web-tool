'use client';

import React from 'react';
import { AlertTriangle, GitBranch, MapPin, Split } from 'lucide-react';
import { StudentScope } from '../../types/roomAnalysis.types';
import { SplitCounts } from './types';

interface MonitorRoomSummaryCardsProps {
  splitCounts: SplitCounts;
  filteredRoomsCount: number;
  totalRoomsCount: number;
  scope: StudentScope;
}

export default function MonitorRoomSummaryCards({
  splitCounts,
  filteredRoomsCount,
  totalRoomsCount,
  scope,
}: MonitorRoomSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
          <Split className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Bị Tách Phòng
          </p>
          <p className="text-2xl font-black text-slate-800">{splitCounts.allSplit}</p>
          <p className="text-[11px] text-slate-500 font-medium">
            {splitCounts.uniqueSplitStudents} sinh viên khác phòng LT
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center gap-4 ring-1 ring-rose-500/10">
        <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Cùng Tổ/Nhóm Bị Tách
          </p>
          <p className="text-2xl font-black text-rose-700">{splitCounts.sameGroup}</p>
          <p className="text-[11px] text-slate-500 font-medium">Lượt thi cần chú ý nhất</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <GitBranch className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            Khác Tổ/Nhóm Bị Tách
          </p>
          <p className="text-2xl font-black text-amber-700">{splitCounts.diffGroup}</p>
          <p className="text-[11px] text-slate-500 font-medium">Khác tổ/nhóm &amp; khác phòng</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Phòng Khớp Bộ Lọc
          </p>
          <p className="text-2xl font-black text-indigo-700">
            {filteredRoomsCount}
            <span className="text-sm font-bold text-slate-400"> / {totalRoomsCount}</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {scope === 'REVIEW' ? 'Theo AE ôn tập' : 'Theo danh sách lớp'}
          </p>
        </div>
      </div>
    </div>
  );
}
