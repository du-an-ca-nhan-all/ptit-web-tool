import React from 'react';
import {
  Search,
  CheckCircle2,
  RotateCcw,
  Users,
  Sparkles,
  Filter,
  Calendar,
  GraduationCap,
  X,
} from 'lucide-react';
import { EnvelopeCounts, EnvelopeFilterStatus } from './types';

interface EnvelopeFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: EnvelopeFilterStatus;
  setFilterStatus: (value: EnvelopeFilterStatus) => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  filterClass: string;
  setFilterClass: (value: string) => void;
  availableDates: string[];
  availableClasses: string[];
  userClass: string;
  counts: EnvelopeCounts;
  isFilterActive: boolean;
  handleResetFilters: () => void;
}

export default function EnvelopeFilterBar({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterDate,
  setFilterDate,
  filterClass,
  setFilterClass,
  availableDates,
  availableClasses,
  userClass,
  counts,
  isFilterActive,
  handleResetFilters,
}: EnvelopeFilterBarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-3 shrink-0">
      {/* Row 1: Search & Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-center">
        {/* Search text input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm môn, phòng, lớp, LT, SV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Select */}
        <div className="relative">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
          >
            <option value="ALL">Tất cả trạng thái ({counts.total})</option>
            <option value="UNCLAIMED">Chưa nhận - Đang gợi ý ({counts.unclaimed})</option>
            <option value="CLAIMED">Đã có người nhận ({counts.claimed})</option>
            {userClass && (
              <>
                <option value="MY_CLASS">Phòng có lớp tôi ({counts.myClass})</option>
                <option value="MY_CLASS_STRICT_LARGEST">
                  Lớp tôi đông nhất (so sánh tất cả lớp kể cả không có LT) ({counts.myClassStrictLargest})
                </option>
                <option value="MY_CLASS_SUGGESTED">Gợi ý cho lớp tôi ({counts.myClassSuggested})</option>
                <option value="MY_CLAIMED">Lớp tôi đã nhận ({counts.myClaimed})</option>
              </>
            )}
          </select>
        </div>

        {/* Date Select */}
        <div className="relative">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
          >
            <option value="ALL">Tất cả ngày thi ({availableDates.length} ngày)</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                Ngày: {d}
              </option>
            ))}
          </select>
        </div>

        {/* Class Select & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
            >
              <option value="ALL">Tất cả các lớp ({availableClasses.length} lớp)</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Lớp: {c} {userClass === c ? '(Lớp bạn)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              title="Xóa tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Quick Filter Chips / Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lọc nhanh:</span>
        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả ({counts.total})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('UNCLAIMED')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'UNCLAIMED'
              ? 'bg-amber-500 text-white shadow-2xs shadow-amber-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Chưa ai nhận ({counts.unclaimed})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('CLAIMED')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            filterStatus === 'CLAIMED'
              ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Đã nhận ({counts.claimed})</span>
        </button>
        {userClass && (
          <>
            <button
              type="button"
              onClick={() => setFilterStatus('MY_CLASS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'MY_CLASS'
                  ? 'bg-blue-600 text-white shadow-2xs shadow-blue-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Lớp tôi ({userClass}: {counts.myClass})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('MY_CLASS_STRICT_LARGEST')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'MY_CLASS_STRICT_LARGEST'
                  ? 'bg-indigo-600 text-white shadow-2xs shadow-indigo-200'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Các phòng thi mà lớp bạn có đông sinh viên nhất so với toàn bộ các lớp trong phòng (bao gồm cả các lớp không có lớp trưởng)"
            >
              <Users className="w-3 h-3" />
              <span>Lớp tôi đông nhất (tất cả lớp: {counts.myClassStrictLargest})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('MY_CLASS_SUGGESTED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'MY_CLASS_SUGGESTED'
                  ? 'bg-amber-600 text-white shadow-2xs shadow-amber-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
              }`}
              title="Các phòng thi mà hệ thống gợi ý lớp bạn phụ trách (dựa trên lớp có Lớp trưởng đông SV nhất)"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Gợi ý cho lớp tôi ({counts.myClassSuggested})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('MY_CLAIMED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'MY_CLAIMED'
                  ? 'bg-purple-600 text-white shadow-2xs shadow-purple-200'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Lớp tôi đã nhận ({counts.myClaimed})</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
