import React from 'react';
import {
  BookOpen,
  RefreshCw,
  Zap,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
} from 'lucide-react';
import { LoginUser } from '../../../../types';
import { RegisteredCoursesSubTab, SemesterInfo } from './types';

interface RegistrationHeaderProps {
  currentUser: LoginUser;
  selectedSemesterName: string;
  semesters: SemesterInfo[];
  totalCourses: number;
  activeSubTab: RegisteredCoursesSubTab;
  onSubTabChange: (tab: RegisteredCoursesSubTab) => void;
  successMsg: string;
  onClearSuccess: () => void;
  errorMsg: string;
  onClearError: () => void;
  isLoading: boolean;
  isPulling: boolean;
  isBatchPulling: boolean;
  isAdmin: boolean;
  isMonitor: boolean;
  onReload: () => void;
  onPullFromQLDTTX: () => void;
  onBatchPullClass: () => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function RegistrationHeader({
  currentUser,
  selectedSemesterName,
  semesters,
  totalCourses,
  activeSubTab,
  onSubTabChange,
  successMsg,
  onClearSuccess,
  errorMsg,
  onClearError,
  isLoading,
  isPulling,
  isBatchPulling,
  isAdmin,
  isMonitor,
  onReload,
  onPullFromQLDTTX,
  onBatchPullClass,
  onNavigateTab,
}: RegistrationHeaderProps) {
  return (
    <>
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={onClearSuccess} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={onClearError} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Môn Học Đã Đăng Ký (ĐKMH & TKB Học Kỳ)
                </h1>
                <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {selectedSemesterName}
                </span>
                {semesters.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {semesters.length} Học Kỳ Đã Lưu
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Sinh viên: <strong className="text-indigo-600 font-mono">{currentUser.fullName || currentUser.username}</strong> ({currentUser.username}) • Lớp:{' '}
                <strong className="text-blue-600">{currentUser.lop || 'Chưa phân lớp'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Reload local button */}
          <button
            onClick={onReload}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu từ cơ sở dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          {/* Active Pull from QLDTTX button */}
          <button
            onClick={onPullFromQLDTTX}
            disabled={isPulling}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Đồng bộ toàn bộ môn học kỳ hiện tại và các kỳ cũ trực tiếp từ cổng QLDTTX (/#/tkb-hocky)"
          >
            {isPulling ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            )}
            <span>Đồng Bộ Từ QLDTTX (Gồm Kỳ Cũ)</span>
          </button>

          {/* Batch Pull for monitor/admin */}
          {(isAdmin || isMonitor) && currentUser.lop && (
            <button
              onClick={onBatchPullClass}
              disabled={isBatchPulling}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-amber-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Kéo toàn bộ môn học và các kỳ cũ cho tất cả sinh viên trong lớp"
            >
              {isBatchPulling ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Đồng Bộ Cả Lớp</span>
            </button>
          )}

          {/* Quick Navigate to Course Registration */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('course_registration')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Đi đến Cổng Đăng Ký Môn Học"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Cổng ĐKMH (QLHT)</span>
            </button>
          )}

          {/* Switch Subtab Button */}
          {activeSubTab === 'COURSES' ? (
            <button
              onClick={() => onSubTabChange('COMPARE')}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-2xl transition-colors border border-blue-200 flex items-center gap-1.5 cursor-pointer"
              title="Chuyển sang So sánh ĐKMH với Lớp trưởng"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-600" />
              <span>So Sánh ĐKMH</span>
            </button>
          ) : (
            <button
              onClick={() => onSubTabChange('COURSES')}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl transition-colors border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
              title="Xem danh sách môn học đã đăng ký"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Môn Đã Đăng Ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Navigation Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onSubTabChange('COURSES')}
          className={`shrink-0 py-2.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
            activeSubTab === 'COURSES'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Môn Học Đã Đăng Ký</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubTab === 'COURSES' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {totalCourses}
          </span>
        </button>

        <button
          onClick={() => onSubTabChange('COMPARE')}
          className={`shrink-0 py-2.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
            activeSubTab === 'COMPARE'
              ? 'bg-blue-600 text-white shadow-xs shadow-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>So Sánh Với Lớp Trưởng</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'COMPARE' ? 'bg-blue-500 text-white' : 'bg-cyan-100 text-cyan-800'
            }`}
          >
            Đối Chiếu Theo Kỳ
          </span>
        </button>
      </div>
    </>
  );
}
