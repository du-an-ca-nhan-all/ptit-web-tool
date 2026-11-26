'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Filter, MapPin, Search, Split, X } from 'lucide-react';
import {
  ExamDateTimeSortOrder,
  RoomCountOperator,
  SplitFilterMode,
  StudentScope,
} from '../../types/roomAnalysis.types';
import { OPERATOR_LABELS, QUICK_ROOM_PRESETS } from './constants';
import { SplitCounts, SubjectOption, ViewTab } from './types';

interface MonitorRoomFilterToolbarProps {
  viewTab: ViewTab;
  onViewTabChange: (tab: ViewTab) => void;
  filteredRecordsCount: number;
  filteredRoomsCount: number;
  examTimeSort: ExamDateTimeSortOrder;
  onToggleExamTimeSort: () => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  subjects: SubjectOption[];
  scope: StudentScope;
  roomCountOp: RoomCountOperator;
  onRoomCountOpChange: (op: RoomCountOperator) => void;
  roomCountN: number;
  onRoomCountNChange: (n: number) => void;
  onlyNonMonitorRooms: boolean;
  onOnlyNonMonitorRoomsChange: (checked: boolean) => void;
  splitCounts: SplitCounts;
  splitFilter: SplitFilterMode;
  onSplitFilterChange: (mode: SplitFilterMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function MonitorRoomFilterToolbar({
  viewTab,
  onViewTabChange,
  filteredRecordsCount,
  filteredRoomsCount,
  examTimeSort,
  onToggleExamTimeSort,
  selectedSubject,
  onSubjectChange,
  subjects,
  scope,
  roomCountOp,
  onRoomCountOpChange,
  roomCountN,
  onRoomCountNChange,
  onlyNonMonitorRooms,
  onOnlyNonMonitorRoomsChange,
  splitCounts,
  splitFilter,
  onSplitFilterChange,
  searchQuery,
  onSearchQueryChange,
}: MonitorRoomFilterToolbarProps) {
  return (
    <>
      {/* View Mode Switcher */}
      <div className="px-4 pt-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewTabChange('SPLIT_STUDENTS')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              viewTab === 'SPLIT_STUDENTS'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Split className="w-4 h-4" />
            SV Bị Tách Phòng ({filteredRecordsCount})
          </button>
          <button
            type="button"
            onClick={() => onViewTabChange('ROOMS_BY_COUNT')}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              viewTab === 'ROOMS_BY_COUNT'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Lọc Phòng Theo Sĩ Số ({filteredRoomsCount})
          </button>
        </div>

        {/* Subject Filter + Exam Date/Time Sort */}
        <div className="pb-2 sm:pb-3 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onToggleExamTimeSort}
            title="Đảo chiều sắp xếp theo ngày giờ thi"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            {examTimeSort === 'DATE_ASC' ? (
              <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>
              Ngày giờ thi: {examTimeSort === 'DATE_ASC' ? 'Sớm → Muộn' : 'Muộn → Sớm'}
            </span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase">Môn thi:</span>
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[240px]"
          >
            <option value="ALL">Tất cả môn ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        {/* Row 1: Room Member Count Filter (> / < N) */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Sĩ số phòng ({scope === 'REVIEW' ? 'AE ôn tập' : 'SV lớp'}):
          </span>

          <select
            value={roomCountOp}
            onChange={(e) => onRoomCountOpChange(e.target.value as RoomCountOperator)}
            className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {(Object.keys(OPERATOR_LABELS) as RoomCountOperator[]).map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>

          {roomCountOp !== 'ALL' && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={200}
                value={roomCountN}
                onChange={(e) => onRoomCountNChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-18 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-black text-indigo-700 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-500">SV</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap ml-0 sm:ml-2">
            {QUICK_ROOM_PRESETS.map((preset) => {
              const isActive = roomCountOp === preset.op && roomCountN === preset.n;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      onRoomCountOpChange('ALL');
                    } else {
                      onRoomCountOpChange(preset.op);
                      onRoomCountNChange(preset.n);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {roomCountOp !== 'ALL' && (
              <button
                type="button"
                onClick={() => onRoomCountOpChange('ALL')}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Xóa lọc N
              </button>
            )}
          </div>

          {viewTab === 'ROOMS_BY_COUNT' && (
            <label className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyNonMonitorRooms}
                onChange={(e) => onOnlyNonMonitorRoomsChange(e.target.checked)}
                className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              Chỉ phòng tách khỏi LT
            </label>
          )}
        </div>

        {/* Row 2: Split Status Pills (for Tab 1) + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {viewTab === 'SPLIT_STUDENTS' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'ALL_SPLIT', label: `Tất cả bị tách (${splitCounts.allSplit})` },
                  { id: 'SPLIT_SAME_GROUP', label: `Cùng tổ/nhóm (${splitCounts.sameGroup})` },
                  { id: 'SPLIT_DIFF_GROUP', label: `Khác tổ/nhóm (${splitCounts.diffGroup})` },
                  { id: 'SAME_ROOM', label: `Cùng phòng LT (${splitCounts.sameRoom})` },
                  { id: 'NO_MONITOR_EXAM', label: `LT không thi (${splitCounts.noMonitor})` },
                  { id: 'ALL', label: `Tất cả (${splitCounts.total})` },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => onSplitFilterChange(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    splitFilter === pill.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">
              Bấm vào từng phòng thi để xem danh sách sinh viên chi tiết bên trong.
            </p>
          )}

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Tìm Mã SV, tên, phòng, môn, tổ..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
