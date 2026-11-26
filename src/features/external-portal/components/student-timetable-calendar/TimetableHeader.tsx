import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  Zap,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  ListFilter,
  CalendarPlus,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { StudentTimetableCalendarResult } from '../../server/studentTimetableServerService';
import { TimetableProgressStats } from '../../utils/timetableProgress';
import { CalendarViewMode } from './types';
import { formatSyncDateTime } from './utils';

interface TimetableHeaderProps {
  data: StudentTimetableCalendarResult | null;
  selectedSubjectFilter: string;
  onResetSubjectFilter: () => void;
  currentContextStats: TimetableProgressStats;
  overallProgressStats: TimetableProgressStats;
  isRefreshing: boolean;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenProgressModal: () => void;
  onOpenSyncModal: () => void;
  onNavigateToReminders?: () => void;
  viewMode: CalendarViewMode;
  onChangeViewMode: (mode: CalendarViewMode) => void;
}

export default function TimetableHeader({
  data,
  selectedSubjectFilter,
  onResetSubjectFilter,
  currentContextStats,
  overallProgressStats,
  isRefreshing,
  isLoading,
  onRefresh,
  onOpenProgressModal,
  onOpenSyncModal,
  onNavigateToReminders,
  viewMode,
  onChangeViewMode,
}: TimetableHeaderProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
        <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-xs shadow-indigo-500/20 shrink-0 mt-0.5 sm:mt-0">
          <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h2 className="text-sm sm:text-lg font-black text-slate-800">Thời Khóa Biểu & Lịch Học Cá Nhân</h2>
            {data?.isCachedDb ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                Đã Lưu CSDL
              </span>
            ) : data?.isLiveSync ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ Trực Tuyến
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <CheckCircle2 className="w-3 h-3 text-slate-500" />
                Dữ Liệu Đã Lưu
              </span>
            )}

            {/* Last Update Badge */}
            {data?.lastSyncAt && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                title="Thời điểm kéo dữ liệu từ Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)."
              >
                <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>Kéo cuối:</span>
                <strong className="font-mono text-slate-900">{formatSyncDateTime(data.lastSyncAt)}</strong>
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] sm:text-xs text-slate-500 leading-relaxed">
            <span>
              Cổng: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • {data?.semesterName || 'Học kỳ hiện tại'} • <b>{data?.uniqueSubjectsCount || 0} môn học</b>
            </span>

            <span className="hidden sm:inline text-slate-300">•</span>

            {/* Session Progress Stats Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 shadow-2xs cursor-pointer hover:bg-slate-100/80 transition"
              onClick={onOpenProgressModal}
              title="Nhấn để xem bảng chi tiết tiến độ buổi học từng môn"
            >
              <span className="font-semibold text-slate-800">
                {selectedSubjectFilter !== 'ALL' ? (
                  <>Môn <strong className="font-mono text-indigo-700">{selectedSubjectFilter}</strong>: </>
                ) : (
                  <>Tổng: </>
                )}
                <strong className="font-mono text-slate-900">{currentContextStats.total}</strong> buổi
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <span>✓ Đã học:</span>
                <strong className="font-mono">{currentContextStats.completed}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <span>⏳ Còn:</span>
                <strong className="font-mono">{currentContextStats.remaining}</strong>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200/60">
                {currentContextStats.percentage}%
              </span>
            </div>

            {selectedSubjectFilter !== 'ALL' && (
              <button
                type="button"
                onClick={onResetSubjectFilter}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                title="Hủy lọc môn học để xem tiến độ toàn khóa"
              >
                (Xem toàn kỳ)
              </button>
            )}
          </div>

          {/* Mini Progress Bar for current scope */}
          {currentContextStats.total > 0 && (
            <div
              className="mt-2 w-full max-w-md bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/70"
              title={`Tiến độ: ${currentContextStats.completed}/${currentContextStats.total} buổi (${currentContextStats.percentage}%)`}
            >
              <div
                className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, currentContextStats.percentage))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Active Pull button from QLDTTX */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          title="Chủ động kéo lại thời khóa biểu mới nhất từ cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)"
        >
          {isRefreshing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          )}
          <span>{isRefreshing ? 'Đang kéo...' : 'Kéo Lại QLDTTX'}</span>
        </button>

        {/* Tiến Độ Môn Học Button */}
        <button
          type="button"
          onClick={onOpenProgressModal}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          title="Xem bảng chi tiết tiến độ các môn học trong kỳ (Tổng buổi, Đã học, Còn lại)"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Tiến Độ Môn</span>
          <span className="ml-0.5 px-1.5 py-0.5 bg-white/25 text-white text-[10px] font-black rounded-full font-mono">
            {overallProgressStats.percentage}%
          </span>
        </button>

        {/* Sync to External Calendars (Google / Apple / Outlook) */}
        <button
          onClick={onOpenSyncModal}
          className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          title="Đồng bộ thời khóa biểu tự động lên Google Calendar, Apple Calendar (iPhone/Mac), hoặc Outlook"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Đồng Bộ Lịch</span>
        </button>

        {/* Lịch Nhắc Hẹn Button */}
        {onNavigateToReminders && (
          <button
            onClick={onNavigateToReminders}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-amber-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Quản lý lịch nhắc hẹn cá nhân & môn học (Gửi thông báo Telegram)"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Nhắc Hẹn</span>
            {(data?.reminders?.length || 0) > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-white/30 text-white text-[10px] font-black rounded-full">
                {data?.reminders?.length}
              </span>
            )}
          </button>
        )}

        {/* View mode toggle */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => onChangeViewMode('MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'MONTH'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Tháng</span>
          </button>
          <button
            onClick={() => onChangeViewMode('WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'WEEK'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Tuần</span>
          </button>
          <button
            onClick={() => onChangeViewMode('AGENDA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'AGENDA'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Danh Sách</span>
          </button>
        </div>
      </div>
    </div>
  );
}
