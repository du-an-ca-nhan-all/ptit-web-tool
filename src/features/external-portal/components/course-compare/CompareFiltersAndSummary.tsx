import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Info,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react';
import { LoginUser } from '../../../../types';
import { CourseCompareData, CourseComparisonResult, SemesterInfo } from './types';

interface CompareFiltersAndSummaryProps {
  data: CourseCompareData | null;
  currentUser?: LoginUser | null;
  selectedSemester: string;
  availableSemesters: SemesterInfo[];
  selectedStudentUsername: string;
  hasMonitorData: boolean;
  comparison: CourseComparisonResult;
  canNavigateToMyCourses: boolean;
  onSemesterChange: (sem: string) => void;
  onStudentChange: (username: string) => void;
  onGoToMyCourses: () => void;
}

export function CompareFiltersAndSummary({
  data,
  currentUser,
  selectedSemester,
  availableSemesters,
  selectedStudentUsername,
  hasMonitorData,
  comparison,
  canNavigateToMyCourses,
  onSemesterChange,
  onStudentChange,
  onGoToMyCourses,
}: CompareFiltersAndSummaryProps) {
  return (
    <>
      {/* Filter Control Bar: Semester Selector & Student Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Semester Filter */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Học Kỳ Đối Chiếu:
              </span>
              <span className="text-[11px] text-slate-400">
                So sánh theo từng học kỳ
              </span>
            </div>
          </div>
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
          >
            <option value="CURRENT">⚡ Đợt ĐKMH Hiện Tại</option>
            {availableSemesters.map((s) => (
              <option key={s.hoc_ky} value={String(s.hoc_ky)}>
                📅 {s.ten_hoc_ky}
              </option>
            ))}
            {availableSemesters.length > 0 && <option value="ALL">🌐 Tất Cả Các Học Kỳ</option>}
          </select>
        </div>

        {/* Student Selector Dropdown */}
        {data?.allSubAccounts && data.allSubAccounts.length > 0 ? (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Sinh Viên Đối Chiếu:
                </span>
                <span className="text-[11px] text-slate-400">
                  Đối chiếu với Lớp trưởng ({data?.main?.username || 'Lớp trưởng'})
                </span>
              </div>
            </div>
            <select
              value={selectedStudentUsername}
              onChange={(e) => onStudentChange(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
            >
              {data.allSubAccounts.map((acc: any) => (
                <option key={acc.username} value={acc.username?.toUpperCase()}>
                  {acc.username?.toUpperCase()} {acc.username?.toUpperCase() === currentUser?.username?.toUpperCase() ? '(Bạn)' : ''} {acc.isMonitor || acc.username?.toUpperCase() === data?.main?.username?.toUpperCase() ? '★ Lớp trưởng' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-2.5 text-xs text-slate-500 font-bold">
            <Users className="w-5 h-5 text-slate-400" />
            <span>Đang so sánh tài khoản của bạn với Lớp trưởng</span>
          </div>
        )}
      </div>

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Trùng khớp</span>
          </div>
          <span className="text-3xl font-black text-emerald-700 mt-1">
            {hasMonitorData ? comparison.exactMatch.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Môn học cùng nhóm tổ với LT</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Khác nhóm tổ</span>
          </div>
          <span className="text-3xl font-black text-amber-700 mt-1">
            {hasMonitorData ? comparison.diffGroup.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Cùng môn, khác nhóm học với LT</span>
        </div>

        <div className="bg-white border border-rose-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <XCircle className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Thiếu môn</span>
          </div>
          <span className="text-3xl font-black text-rose-700 mt-1">
            {hasMonitorData ? comparison.missing.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">LT đăng ký nhưng SV chưa ĐK</span>
        </div>

        <div className="bg-white border border-purple-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Info className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Đăng ký thêm</span>
          </div>
          <span className="text-3xl font-black text-purple-700 mt-1">
            {hasMonitorData ? comparison.extra.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">SV ĐK nhưng LT không ĐK</span>
        </div>
      </div>

      {/* When Monitor Has No Data */}
      {!hasMonitorData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mt-2">
            Chưa thể đối chiếu vì Lớp trưởng chưa có dữ liệu môn học
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Khi Lớp trưởng thực hiện đồng bộ kết quả đăng ký môn học từ cổng trường QLDTTX, toàn bộ kết quả đối chiếu 4 trạng thái (Trùng khớp, Khác nhóm, Thiếu môn, ĐK thêm) sẽ tự động hiển thị tại đây.
          </p>
          {canNavigateToMyCourses && (
            <button
              onClick={onGoToMyCourses}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem Môn Học Đã Đăng Ký Của Bạn</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
