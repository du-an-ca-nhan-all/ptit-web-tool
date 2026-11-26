import React from 'react';
import {
  GraduationCap,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Users,
  CheckCircle2,
  Eye,
  Layers,
} from 'lucide-react';

interface AllStudentsHeaderProps {
  totalStudents: number;
  totalClasses: number;
  displayedCount: number;
  isAdmin: boolean;
  isLoading: boolean;
  onOpenResetModal: () => void;
  onRefresh: () => void;
}

export function AllStudentsHeader({
  totalStudents,
  totalClasses,
  displayedCount,
  isAdmin,
  isLoading,
  onOpenResetModal,
  onRefresh,
}: AllStudentsHeaderProps) {
  return (
    <>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Danh Sách Sinh Viên Toàn Trường
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] sm:text-xs font-bold rounded-full">
                {totalStudents} Sinh Viên
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Full Quyền Admin
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              {isAdmin
                ? 'Xem toàn bộ hồ sơ chi tiết, trạng thái tài khoản, SĐT liên hệ và thao tác quản trị'
                : 'Tra cứu thông tin sinh viên các khóa ngành theo danh sách cơ bản'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenResetModal}
              className="px-3.5 py-2 sm:px-4 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              title="Đặt lại mật khẩu cho sinh viên"
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Reset MK</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="px-3.5 py-2 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary (Admin view or General Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Sinh Viên
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-800">{totalStudents}</div>
          </div>
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Số Lớp
            </div>
            <div className="text-lg sm:text-2xl font-black text-indigo-600">{totalClasses}</div>
          </div>
          <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đang Hiển Thị
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600">{displayedCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Chế Độ Xem
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-700 mt-0.5 sm:mt-1 flex items-center gap-1">
              {isAdmin ? (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Admin
                </span>
              ) : (
                <span className="text-slate-600">Cơ bản</span>
              )}
            </div>
          </div>
          <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 opacity-50" />
        </div>
      </div>
    </>
  );
}
