'use client';

import React from 'react';
import { BookOpen, Search, Trash2, UploadCloud, Zap } from 'lucide-react';
import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import { UpdateFollowerConfigFn } from './types';
import { FlowConfigMobileList } from './FlowConfigMobileList';
import { FlowConfigDesktopTable } from './FlowConfigDesktopTable';

interface FlowConfigTabProps {
  activeFollowersCount: number;
  isExecuting: boolean;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredStudents: FollowerStudentItem[];
  monitorCoursesCount: number;
  onOpenSyncAllModal: () => void;
  onOpenQuickRegisterModal: () => void;
  onOpenQuickCancelModal: () => void;
  onOpenImportModal: () => void;
  onDisableAllFollowers: () => void;
  onUpdateFollowerConfig: UpdateFollowerConfigFn;
  onInspectStudent: (student: FollowerStudentItem) => void;
}

export function FlowConfigTab({
  activeFollowersCount,
  isExecuting,
  isLoading,
  searchQuery,
  onSearchChange,
  filteredStudents,
  monitorCoursesCount,
  onOpenSyncAllModal,
  onOpenQuickRegisterModal,
  onOpenQuickCancelModal,
  onOpenImportModal,
  onDisableAllFollowers,
  onUpdateFollowerConfig,
  onInspectStudent,
}: FlowConfigTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Quick Flow Actions Launcher Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-current" />
              <h3 className="font-black text-base sm:text-lg text-white">
                Bắn Lệnh Flow Action Cho Cả Lớp
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Thực thi đồng loạt cho <strong className="text-amber-300">{activeFollowersCount} thành viên</strong> đang bật Flow Action
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
            <button
              onClick={onOpenSyncAllModal}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4" />
              <span>Đồng Bộ 2 Chiều Cả Lớp</span>
            </button>

            <button
              onClick={onOpenQuickRegisterModal}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-orange-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Flow Đăng Ký...</span>
            </button>

            <button
              onClick={onOpenQuickCancelModal}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-3.5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Flow Hủy Môn...</span>
            </button>

            <button
              onClick={onOpenImportModal}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Import danh sách sinh viên Flow từ file hoặc text"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Import Flow SV...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Config Table & Mobile Cards Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo mã SV, họ tên, số điện thoại..."
              className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full md:w-auto justify-end">
            <button
              onClick={onOpenImportModal}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-xl transition-colors border border-amber-200 flex items-center justify-center gap-1 cursor-pointer"
              title="Import danh sách sinh viên bật flow từ file hoặc text"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>Import SV</span>
            </button>
            <button
              onClick={onDisableAllFollowers}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Tắt Tất Cả
            </button>
          </div>
        </div>

        {/* Mobile Cards View (Visible on Small Screens) */}
        <FlowConfigMobileList
          filteredStudents={filteredStudents}
          monitorCoursesCount={monitorCoursesCount}
          onUpdateFollowerConfig={onUpdateFollowerConfig}
          onInspectStudent={onInspectStudent}
        />

        {/* Desktop Table View (Hidden on Small Screens, Visible on Medium+) */}
        <FlowConfigDesktopTable
          filteredStudents={filteredStudents}
          monitorCoursesCount={monitorCoursesCount}
          onUpdateFollowerConfig={onUpdateFollowerConfig}
          onInspectStudent={onInspectStudent}
        />
      </div>
    </div>
  );
}
