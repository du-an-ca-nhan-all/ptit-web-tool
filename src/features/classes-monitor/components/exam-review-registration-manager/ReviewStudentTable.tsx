'use client';

import React from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Search,
  Check,
  Phone,
  X,
  AlertCircle,
  Square,
} from 'lucide-react';
import { FilterMode, ReviewStudentItem, ReviewSummary } from './types';

interface ReviewStudentTableProps {
  selectedClass: string;
  summary: ReviewSummary;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  errorMsg: string;
  isLoading: boolean;
  isBulkSaving: boolean;
  savingStudentId: string | null;
  filteredStudents: ReviewStudentItem[];
  noteDrafts: Record<string, string>;
  onNoteDraftChange: (maSV: string, value: string) => void;
  onToggleStudent: (student: ReviewStudentItem) => void;
  onSaveNote: (student: ReviewStudentItem) => void;
}

export function ReviewStudentTable({
  selectedClass,
  summary,
  filterMode,
  onFilterModeChange,
  searchQuery,
  onSearchQueryChange,
  errorMsg,
  isLoading,
  isBulkSaving,
  savingStudentId,
  filteredStudents,
  noteDrafts,
  onNoteDraftChange,
  onToggleStudent,
  onSaveNote,
}: ReviewStudentTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter Tabs & Search */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: 'ALL', label: `Tất cả (${summary.total})` },
              { id: 'REGISTERED', label: `Đã đăng ký (${summary.registered})` },
              { id: 'UNREGISTERED', label: `Chưa đăng ký (${summary.unregistered})` },
              { id: 'HAS_EXAMS', label: `Có lịch thi (${summary.withExams})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterModeChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm Mã SV, Họ tên, SĐT, ghi chú..."
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

      {/* Error banner */}
      {errorMsg && (
        <div className="m-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading / Empty / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Đang tải danh sách sinh viên lớp {selectedClass}...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 px-4 flex flex-col items-center justify-center gap-2">
          <BookOpenCheck className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">Không có sinh viên nào phù hợp</p>
          <p className="text-xs text-slate-400">
            Thử đổi bộ lọc hoặc chọn đợt thi / lớp khác để xem danh sách.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">STT</th>
                <th className="py-3.5 px-4 text-center w-36">Đăng ký ôn tập</th>
                <th className="py-3.5 px-4">Mã SV</th>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">SĐT</th>
                <th className="py-3.5 px-4">Lịch thi đợt này</th>
                <th className="py-3.5 px-4 min-w-[220px]">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((st, idx) => {
                const isSavingThis = savingStudentId === st.maSV;
                const draftNote = noteDrafts[st.maSV] ?? '';
                const noteChanged = draftNote.trim() !== (st.note || '').trim();

                return (
                  <tr
                    key={st.maSV}
                    className={`transition-colors ${
                      st.isRegistered
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                        : idx % 2 === 1
                        ? 'bg-slate-50/30 hover:bg-slate-50'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={isSavingThis || isBulkSaving}
                        onClick={() => onToggleStudent(st)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-60 ${
                          st.isRegistered
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        {st.isRegistered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã đăng ký
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            Chưa đăng ký
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{st.maSV}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{st.hoTen}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {st.soDienThoai ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {st.soDienThoai}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {st.examCount > 0 ? (
                        <span
                          title={st.examSubjects.map((m) => `${m.code} - ${m.name}`).join('\n')}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          {st.examCount} môn thi
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Không có lịch</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={draftNote}
                          onChange={(e) => onNoteDraftChange(st.maSV, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onSaveNote(st);
                            }
                          }}
                          onBlur={() => onSaveNote(st)}
                          placeholder="Thêm ghi chú..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {noteChanged && (
                          <button
                            type="button"
                            onClick={() => onSaveNote(st)}
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Lưu ghi chú"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
