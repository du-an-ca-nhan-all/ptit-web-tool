import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react';
import { LoginUser } from '@/src/features/auth/types/auth.types';
import { LmsDashboardOverview } from '../../server/lmsServerService';
import { LmsFilterCounts } from './types';
import { formatSyncDateTime } from './utils';

interface LmsHeaderAndMetricsProps {
  currentUser: LoginUser;
  data: LmsDashboardOverview | null;
  filterCounts: LmsFilterCounts;
  isLoading: boolean;
  isRefreshing: boolean;
  successMsg: string;
  errorMsg: string;
  onDismissSuccess: () => void;
  onDismissError: () => void;
  onRefresh: () => void;
}

export function LmsHeaderAndMetrics({
  currentUser,
  data,
  filterCounts,
  isLoading,
  isRefreshing,
  successMsg,
  errorMsg,
  onDismissSuccess,
  onDismissError,
  onRefresh,
}: LmsHeaderAndMetricsProps) {
  return (
    <>
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={onDismissSuccess} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={onDismissError} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sync Warning banner if LMS fetch failed and cached data was safely preserved */}
      {data?.syncWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{data.syncWarning}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Khóa Học & Tiến Độ Học Tập LMS
              </h2>
              <span className="bg-sky-100 text-sky-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-sky-200">
                PTTC1 LMS
              </span>
              {data?.isCachedDb ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  Đã Lưu CSDL
                </span>
              ) : data?.isLiveSync ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ Trực Tuyến
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  Dữ Liệu Đã Lưu
                </span>
              )}

              {/* Last Update Badge */}
              {data?.lastSyncAt && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                  title="Thời điểm kéo dữ liệu từ Cổng LMS PTTC1 (lms.pttc1.edu.vn)."
                >
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Kéo cuối:</span>
                  <strong className="font-mono text-slate-900">{formatSyncDateTime(data.lastSyncAt)}</strong>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sinh viên: <strong className="text-slate-800">{data?.userFullName || currentUser.fullName}</strong> • Cổng học tập:{' '}
              <a
                href="https://lms.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 font-mono font-bold hover:underline inline-flex items-center gap-1"
              >
                lms.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          title="Tải dữ liệu mới nhất trực tiếp từ LMS PTTC1"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Đang Tải Từ LMS...' : 'Cập Nhật Mới Nhất'}</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số khóa học */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Khóa Học Đăng Ký</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
              {data?.stats.enrolledCourses || data?.courses.length || 0}
            </div>
            <div className="text-[11px] text-indigo-600 font-bold truncate">Tổng số môn ghi danh</div>
          </div>
        </div>

        {/* Card 2: Hoạt động đã hoàn thành */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Hoạt Động Hoàn Thành</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
              {data?.stats.completedActivities || 0}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold truncate">Video, Slide, Bài học</div>
          </div>
        </div>

        {/* Card 3: Khóa học hoàn thành 100% */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Đã Học Xong (100%)</div>
            <div className="text-xl sm:text-2xl font-black text-sky-600 mt-0.5">
              {filterCounts.completed}
            </div>
            <div className="text-[11px] text-sky-700 font-bold truncate">Môn hoàn thành</div>
          </div>
        </div>

        {/* Card 4: Hoạt động còn lại */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Cần Hoàn Thành</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
              {data?.stats.dueActivities || 0}
            </div>
            <div className="text-[11px] text-amber-700 font-bold truncate">Hoạt động đang chờ</div>
          </div>
        </div>
      </div>
    </>
  );
}
