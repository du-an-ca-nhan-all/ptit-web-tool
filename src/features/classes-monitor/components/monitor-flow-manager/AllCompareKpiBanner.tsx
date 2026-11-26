'use client';

import React from 'react';
import { BookOpen, RefreshCw, Sparkles, UploadCloud } from 'lucide-react';

interface AllCompareKpiBannerProps {
  monitorCoursesCount: number;
  monitorTotalCredits: number;
  matched100Count: number;
  needsAttentionCount: number;
  activeFollowersCount: number;
  linkedAccountsCount: number;
  studentsCount: number;
  isExecuting: boolean;
  isLoading: boolean;
  isPullingCourses: boolean;
  onOpenSyncAllModal: () => void;
  onOpenImportModal: () => void;
  onPullAllCourses: () => void;
}

export function AllCompareKpiBanner({
  monitorCoursesCount,
  monitorTotalCredits,
  matched100Count,
  needsAttentionCount,
  activeFollowersCount,
  linkedAccountsCount,
  studentsCount,
  isExecuting,
  isLoading,
  isPullingCourses,
  onOpenSyncAllModal,
  onOpenImportModal,
  onPullAllCourses,
}: AllCompareKpiBannerProps) {
  return (
    <>
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Tổng Môn Chuẩn</div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5 sm:mt-1">
            {monitorCoursesCount} <span className="text-xs font-normal text-slate-400">môn</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-indigo-600 font-bold mt-0.5">
            {monitorTotalCredits} Tín chỉ chuẩn
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Đã Khớp 100%</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">
            {matched100Count} <span className="text-xs font-normal text-slate-400">/ {studentsCount} bạn</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5">
            🟢 Học chung toàn bộ
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Cần Đồng Bộ</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">
            {needsAttentionCount} <span className="text-xs font-normal text-slate-400">bạn</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-amber-700 font-bold mt-0.5">
            🟡 / 🔴 Lệch hoặc thiếu
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Bật Flow Action</div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
            {activeFollowersCount} <span className="text-xs font-normal text-slate-400">/ {studentsCount}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-0.5">
            {linkedAccountsCount} bạn có TK
          </div>
        </div>
      </div>

      {/* Quick Action Bar: Đồng Bộ 2 Chiều Cả Lớp & Kéo QLDTTX */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm sm:text-base text-white">Đồng Bộ 2 Chiều Cho Cả Lớp</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Tự động ĐK môn thiếu và Hủy môn thừa cho <strong className="text-amber-300">{activeFollowersCount} bạn</strong> đang bật Flow
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenSyncAllModal}
            disabled={isExecuting || activeFollowersCount === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <BookOpen className="w-4 h-4" />
            <span>Đồng Bộ Khớp 100% Cả Lớp</span>
          </button>

          <button
            onClick={onOpenImportModal}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Import danh sách sinh viên được Flow theo Lớp trưởng bằng file CSV hoặc nhập Text"
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>Import Flow SV</span>
          </button>

          <button
            onClick={onPullAllCourses}
            disabled={isPullingCourses || isLoading}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingCourses ? 'animate-spin' : ''}`} />
            <span>{isPullingCourses ? 'Đang kéo...' : 'Pull QLDTTX'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
