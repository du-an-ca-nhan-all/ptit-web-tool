'use client';

import React from 'react';
import {
  GitFork,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Save,
  Layers,
  BookOpen,
  Table,
  UploadCloud,
} from 'lucide-react';
import { LoginUser } from '../../../../types';
import { MonitorProfileData } from '../../server/monitorFlowServerService';
import { MainSubTab } from './types';

interface MonitorFlowHeaderProps {
  currentUser: LoginUser;
  selectedClass: string;
  monitorData: MonitorProfileData | null;
  monitorCoursesCount: number;
  studentsCount: number;
  activeFollowersCount: number;
  activeSubTab: MainSubTab;
  onSelectSubTab: (tab: MainSubTab) => void;
  successMsg: string;
  onClearSuccessMsg: () => void;
  errorMsg: string;
  onClearErrorMsg: () => void;
  isLoading: boolean;
  isSaving: boolean;
  isPullingCourses: boolean;
  hasUnsavedChanges: boolean;
  onPullAllCourses: () => void;
  onOpenImportModal: () => void;
  onReload: () => void;
  onSaveAllConfigs: () => void;
}

export function MonitorFlowHeader({
  currentUser,
  selectedClass,
  monitorData,
  monitorCoursesCount,
  studentsCount,
  activeFollowersCount,
  activeSubTab,
  onSelectSubTab,
  successMsg,
  onClearSuccessMsg,
  errorMsg,
  onClearErrorMsg,
  isLoading,
  isSaving,
  isPullingCourses,
  hasUnsavedChanges,
  onPullAllCourses,
  onOpenImportModal,
  onReload,
  onSaveAllConfigs,
}: MonitorFlowHeaderProps) {
  return (
    <>
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={onClearSuccessMsg} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl sm:rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={onClearErrorMsg} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 flex-wrap">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-amber-200">
              <GitFork className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                  Cấu Hình Flow Lớp Trưởng
                </h1>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
                  Lớp {selectedClass || currentUser.lop || 'Của Bạn'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-xs md:text-sm mt-0.5">
                Lớp trưởng: <strong className="text-amber-700 font-mono">{monitorData?.hoTen || currentUser.fullName || currentUser.username}</strong> ({currentUser.username})
                {monitorCoursesCount > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] sm:text-xs border border-indigo-100 inline-block">
                    Đã ĐK {monitorCoursesCount} môn ({monitorData?.totalCredits || 0} TC)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions - Grid on mobile, flex on tablet/desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          {/* Pull live courses from QLDTTX for whole class */}
          <button
            onClick={onPullAllCourses}
            disabled={isPullingCourses || isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Kéo và cập nhật dữ liệu môn học trực tiếp từ Cổng QLDTTX cho toàn bộ tài khoản trong lớp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingCourses ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isPullingCourses ? 'Đang kéo...' : 'Kéo Môn (QLDTTX)'}</span>
          </button>

          {/* Import Followers from CSV / Text */}
          <button
            onClick={onOpenImportModal}
            disabled={isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Import danh sách sinh viên được Flow theo Lớp trưởng bằng file CSV hoặc nhập Text"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Import SV</span>
          </button>

          <button
            onClick={onReload}
            disabled={isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          <button
            onClick={onSaveAllConfigs}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
              hasUnsavedChanges
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>

      {/* Main Sub-tabs Navigation - Smooth horizontal scroll on mobile */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 w-full overflow-x-auto scroll-smooth snap-x">
        <button
          onClick={() => onSelectSubTab('FLOW_CONFIG')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'FLOW_CONFIG'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          <span>1. Cấu Hình Flow</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black">
            {activeFollowersCount}
          </span>
        </button>

        <button
          onClick={() => onSelectSubTab('MONITOR_COURSES')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MONITOR_COURSES'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>2. Môn Lớp Trưởng ({monitorCoursesCount})</span>
        </button>

        <button
          onClick={() => onSelectSubTab('ALL_COMPARE')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ALL_COMPARE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
          <span>3. So Sánh Môn Cả Lớp</span>
          {monitorCoursesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black">
              {studentsCount} bạn
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectSubTab('FLOW_QUEUE')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'FLOW_QUEUE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
          <span>4. Hàng Đợi (Queue)</span>
        </button>
      </div>
    </>
  );
}
