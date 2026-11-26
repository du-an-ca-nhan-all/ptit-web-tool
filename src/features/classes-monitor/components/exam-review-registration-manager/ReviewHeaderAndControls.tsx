'use client';

import React from 'react';
import {
  BookOpenCheck,
  Download,
  Copy,
  Check,
  RefreshCw,
  Crown,
  Layers,
  ClipboardList,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { ExamBatchItem } from '../../../../types';
import { ReviewStudentItem, ReviewSummary } from './types';

interface ReviewHeaderAndControlsProps {
  examBatches: ExamBatchItem[];
  selectedBatchCode: string;
  onSelectBatchCode: (code: string) => void;
  students: ReviewStudentItem[];
  summary: ReviewSummary;
  copiedList: boolean;
  isLoading: boolean;
  isBulkSaving: boolean;
  onCopyRegisteredList: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  onOpenQuickImport: () => void;
  onBulkUpdate: (
    items: Array<{ maSV: string; isRegistered: boolean }>,
    successMsg: string
  ) => void;
}

export function ReviewHeaderAndControls({
  examBatches,
  selectedBatchCode,
  onSelectBatchCode,
  students,
  summary,
  copiedList,
  isLoading,
  isBulkSaving,
  onCopyRegisteredList,
  onExportCSV,
  onRefresh,
  onOpenQuickImport,
  onBulkUpdate,
}: ReviewHeaderAndControlsProps) {
  return (
    <>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BookOpenCheck className="w-7 h-7 text-amber-600" />
              Đăng Ký Ôn Tập Đợt Thi
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Lớp Trưởng
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Cấu hình và chốt danh sách sinh viên đăng ký ôn tập của lớp theo đợt thi đang chọn
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onCopyRegisteredList}
            disabled={summary.registered === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            title="Sao chép danh sách sinh viên đã đăng ký ôn tập (dán Zalo/Telegram)"
          >
            {copiedList ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedList ? 'Đã sao chép' : 'Copy DS Ôn Tập'}
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            disabled={summary.registered === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            title="Xuất file CSV danh sách sinh viên đã đăng ký ôn tập"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất CSV ({summary.registered})
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Context Selectors: Batch & Class */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          {/* Batch selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Đợt thi:
            </span>
            {examBatches.length > 0 ? (
              <select
                value={selectedBatchCode}
                onChange={(e) => onSelectBatchCode(e.target.value)}
                className="bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {examBatches.map((batch) => (
                  <option key={batch.code} value={batch.code}>
                    {batch.name} ({batch.code}){batch.isActive ? ' ★' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                Chưa có đợt thi nào
              </span>
            )}
          </div>
        </div>

        {/* Bulk Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isBulkSaving || students.length === 0}
            onClick={onOpenQuickImport}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Nhập nhanh DS Mã SV
          </button>

          <button
            type="button"
            disabled={isBulkSaving || summary.withExams === 0}
            onClick={() =>
              onBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: s.examCount > 0 })),
                `Đã chọn ${summary.withExams} SV có lịch thi đợt này`
              )
            }
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Chọn tất cả sinh viên có lịch thi trong đợt thi đang chọn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Chọn SV có lịch thi ({summary.withExams})
          </button>

          <button
            type="button"
            disabled={isBulkSaving || students.length === 0}
            onClick={() =>
              onBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: true })),
                `Đã chọn toàn bộ ${students.length} sinh viên trong lớp`
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Chọn cả lớp
          </button>

          <button
            type="button"
            disabled={isBulkSaving || summary.registered === 0}
            onClick={() =>
              onBulkUpdate(
                students.map((s) => ({ maSV: s.maSV, isRegistered: false })),
                'Đã bỏ chọn toàn bộ danh sách ôn tập'
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5" />
            Bỏ chọn hết
          </button>
        </div>
      </div>
    </>
  );
}
