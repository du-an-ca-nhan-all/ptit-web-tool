'use client';

import React from 'react';
import {
  Layers,
  Plus,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  Users,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ExamBatchItem } from '../../types/exam.types';

interface BatchHeaderAndStatsProps {
  batchesCount: number;
  activeBatch: ExamBatchItem | null;
  isLoading: boolean;
  onDownloadSampleCsv: () => void;
  onRefresh: () => void;
  onCreateClick: () => void;
}

export function BatchHeaderAndStats({
  batchesCount,
  activeBatch,
  isLoading,
  onDownloadSampleCsv,
  onRefresh,
  onCreateClick,
}: BatchHeaderAndStatsProps) {
  return (
    <>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" />
              Quản Lý Đợt Thi
            </h2>
            <span className="bg-rose-100 text-rose-700 text-xs font-black px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Dành Cho Admin
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Tạo các đợt thi theo kỳ, nhập dữ liệu lịch thi qua tệp CSV và chuyển đổi đợt thi mặc định của toàn hệ thống
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onDownloadSampleCsv}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            title="Tải tệp CSV ví dụ định dạng chuẩn PTIT (tương thích Excel tiếng Việt)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Tải CSV Mẫu
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Tạo Đợt Thi Mới
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Số Đợt Thi</p>
            <p className="text-2xl font-black text-slate-800">{batchesCount} đợt</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đợt Thi Mặc Định</p>
            <p className="text-sm font-black text-slate-800 truncate" title={activeBatch?.name || 'Chưa có'}>
              {activeBatch?.name || 'Chưa thiết lập'}
            </p>
            <p className="text-[11px] font-mono font-bold text-emerald-600">{activeBatch?.code || '—'}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt Thi Đang Chạy</p>
            <p className="text-2xl font-black text-slate-800">
              {activeBatch?.totalRecords ? activeBatch.totalRecords.toLocaleString('vi-VN') : 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sinh Viên Đang Thi</p>
            <p className="text-2xl font-black text-slate-800">
              {activeBatch?.totalStudents ? activeBatch.totalStudents.toLocaleString('vi-VN') : 0} SV
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
