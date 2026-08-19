import React from 'react';
import {
  CalendarDays,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  Users,
  Clock,
  BookOpen,
  GraduationCap,
  X,
  Layers,
} from 'lucide-react';
import { ExamRecord, LoginUser, ExamBatchItem } from '../types';
import { FilterState } from './FilterBar';
import FilterBar from './FilterBar';
import DataTable, { SortKey, SortDirection } from './DataTable';
import ExamRoomMembers from './ExamRoomMembers';

interface AllExamsScheduleProps {
  records: ExamRecord[];
  totalRecords: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: (config: { key: SortKey; direction: SortDirection } | null) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  selectedExamRoom: ExamRecord | null;
  setSelectedExamRoom: (room: ExamRecord | null) => void;
  setConfirmStudentId: (id: string | null) => void;
  setConfirmClassCode: (code: string | null) => void;
  handleToggleExamPostpone: (record: ExamRecord, newStatus: boolean) => Promise<void>;
  canAccessMonitorTools: boolean;
  isLoading: boolean;
  activeBatch: ExamBatchItem | null;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
}

function getFormatBadgeColor(formatStr?: string): string {
  const f = (formatStr || '').toLowerCase();
  if (f.includes('trắc nghiệm') || f === 'tn' || f === 'tt') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (f.includes('thực hành') || f.includes('máy') || f === 'th') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (f.includes('tiểu luận') || f.includes('báo cáo') || f === 'bctl') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (f.includes('tự luận') || f.includes('viết') || f === 'tl') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getDayOfWeekVietnamese(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length !== 3) return '';
  let d = 1, m = 1, y = 1970;
  const p0 = parseInt(parts[0], 10);
  const p1 = parseInt(parts[1], 10);
  const p2 = parseInt(parts[2], 10);
  y = p2;
  if (p1 > 12) {
    m = p0;
    d = p1;
  } else if (p0 > 12) {
    d = p0;
    m = p1;
  } else {
    m = p0;
    d = p1;
  }
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return '';
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[dateObj.getDay()] || '';
}

export default function AllExamsSchedule({
  records,
  totalRecords,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  sortConfig,
  setSortConfig,
  filters,
  setFilters,
  classes,
  subjects,
  dates,
  selectedExamRoom,
  setSelectedExamRoom,
  setConfirmStudentId,
  setConfirmClassCode,
  handleToggleExamPostpone,
  canAccessMonitorTools,
  isLoading,
  activeBatch,
  loadDataFromApi,
}: AllExamsScheduleProps) {
  if (selectedExamRoom) {
    return (
      <ExamRoomMembers
        roomRecord={selectedExamRoom}
        allRecords={records}
        batchCode={activeBatch?.code}
        onBack={() => setSelectedExamRoom(null)}
        onStudentClick={setConfirmStudentId}
        onClassClick={setConfirmClassCode}
        onTogglePostpone={handleToggleExamPostpone}
        canEditPostpone={canAccessMonitorTools}
      />
    );
  }

  const isFilterActive = Boolean(filters.class || filters.subject || filters.date || filters.search);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl sm:rounded-2xl shadow-sm shrink-0">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Lịch Thi Tổng Hợp Toàn Trường</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalRecords.toLocaleString()} ca thi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Đợt thi: <strong className="text-slate-800">{activeBatch?.name || 'Đợt thi học kỳ'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => loadDataFromApi(activeBatch?.code)}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-stretch sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW: Mobile Filter Controls + Mobile Cards                        */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {/* Mobile Filter Container */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col gap-2.5">
          {/* 3 Dropdown selects */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Class filter */}
            <div className="relative">
              <select
                value={filters.class}
                onChange={(e) => setFilters((prev) => ({ ...prev, class: e.target.value }))}
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

            {/* Subject filter */}
            <div className="relative">
              <select
                value={filters.subject}
                onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
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

            {/* Date filter */}
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

          {/* Search box & reset */}
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
                onClick={() => setFilters({ class: '', subject: '', date: '', search: '' })}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* Mobile Exam Cards List */}
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            Không tìm thấy ca thi nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec, index) => {
              const dow = getDayOfWeekVietnamese(rec.NgayThi);

              return (
                <div
                  key={rec.id || `${rec.MaSV}-${rec.MaMH}-${index}`}
                  onClick={() => setSelectedExamRoom(rec)}
                  className={`p-4 rounded-2xl bg-white border transition shadow-2xs flex flex-col gap-3 relative overflow-hidden active:scale-98 cursor-pointer ${
                    rec.isPostponed
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Top Status Indicator Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      rec.isPostponed ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                  />

                  {/* Header: Student Info & Class / Format Badges */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0 flex-1">
                      {/* Big Prominent Student Name */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {rec.HoLotSV} {rec.TenSV}
                      </h3>

                      {/* Student ID & Class Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmStudentId(rec.MaSV);
                          }}
                          className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition shadow-2xs"
                        >
                          {rec.MaSV}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmClassCode(rec.MaLop);
                          }}
                          className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition shadow-2xs truncate max-w-[140px]"
                        >
                          {rec.MaLop}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {rec.MaHTThi && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getFormatBadgeColor(
                            rec.MaHTThi
                          )}`}
                        >
                          {rec.MaHTThi}
                        </span>
                      )}

                      {rec.isPostponed && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md uppercase">
                          Hoãn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subject Info */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-xs font-black text-slate-900 leading-snug">
                      {rec.TenMH}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Mã môn: {rec.MaMH}
                    </div>
                  </div>

                  {/* Key Details Grid 2x2 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-indigo-600" /> Ngày Thi
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                        {rec.NgayThi || 'Chưa rõ'} {dow && <span className="text-indigo-600 font-semibold">({dow})</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-600" /> Giờ Thi
                      </span>
                      <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                        {rec.GioThi || 'Chưa rõ'}
                        {rec.SoPhutThi && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            ({rec.SoPhutThi}p)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Building className="w-3 h-3 text-amber-600" /> Phòng Thi
                      </span>
                      <span className="font-mono font-black text-indigo-700 text-xs mt-0.5">
                        {rec.MAPTHI || rec.PhongThi || 'Chưa rõ'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-purple-600" /> Tổ / Nhóm
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                        Tổ {rec['To thi'] || rec.ToThi || '-'} • N{rec.NhomThi || rec.NhomHoc || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-indigo-600 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Xem Phòng Thi</span>
                    </span>

                    {canAccessMonitorTools ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExamPostpone(rec, !rec.isPostponed);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                          rec.isPostponed
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        {rec.isPostponed ? '✕ Đã hoãn thi' : 'Hoãn thi?'}
                      </button>
                    ) : (
                      <span className="text-indigo-600 font-bold">
                        Chi tiết &rarr;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <span className="text-xs font-bold text-slate-700 font-mono">
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW: Full FilterBar + Full DataTable                             */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          totalRecords={totalRecords}
          filteredCount={totalRecords}
          hideClassFilter={false}
        />
        <DataTable
          records={records}
          totalRecords={totalRecords}
          currentPage={page}
          totalPages={totalPages}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          onStudentClick={setConfirmStudentId}
          onClassClick={setConfirmClassCode}
          onRowClick={setSelectedExamRoom}
          onTogglePostpone={handleToggleExamPostpone}
          canEditPostpone={canAccessMonitorTools}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
