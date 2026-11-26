import React from 'react';
import {
  Download,
  Crown,
  UserCheck,
  Eye,
  UserPlus,
  RotateCcw,
  ArrowRightLeft,
  Upload,
} from 'lucide-react';
import { LoginUser } from '../../types/class.types';

interface ClassMembersHeaderProps {
  selectedClass: string;
  userOwnClass?: string;
  isMyClass: boolean;
  isAdmin: boolean;
  canManageClass: boolean;
  classMonitor: LoginUser | null;
  classes: string[];
  onClassChange: (cls: string) => void;
  onOpenAssignMonitorModal: (preselectedMaSV?: string | null) => void;
  onOpenImportModal: () => void;
  onOpenReceiveModal: () => void;
  onExportCSV: () => void;
}

export default function ClassMembersHeader({
  selectedClass,
  userOwnClass,
  isMyClass,
  isAdmin,
  canManageClass,
  classMonitor,
  classes,
  onClassChange,
  onOpenAssignMonitorModal,
  onOpenImportModal,
  onOpenReceiveModal,
  onExportCSV,
}: ClassMembersHeaderProps) {
  return (
    <>
      {/* Notice when viewing another class */}
      {userOwnClass && userOwnClass !== selectedClass && (
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-blue-200">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <span>
                  Đang xem danh sách lớp:{' '}
                  <strong className="text-blue-700 font-mono text-sm">{selectedClass}</strong>
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  Lớp Khác
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Lớp chính của bạn: <strong className="text-slate-800 font-mono">{userOwnClass}</strong>. Bấm nút bên
                cạnh để quay về lớp của bạn bất cứ lúc nào.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClassChange(userOwnClass)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Về Lớp Của Tôi ({userOwnClass})</span>
          </button>
        </div>
      )}

      {/* Header Banner & Class Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Quản Lý Thành Viên Lớp <span className="text-blue-600">{selectedClass}</span>
            </h2>
            {isMyClass ? (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Lớp của bạn
              </span>
            ) : userOwnClass ? (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-600" /> Đang xem lớp khác
              </span>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {classMonitor ? (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  LT: {classMonitor.fullName || classMonitor.username}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onOpenAssignMonitorModal(classMonitor.username)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-colors cursor-pointer border border-amber-300"
                    title="Chuyển lớp trưởng sang sinh viên khác trong lớp"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Đổi Lớp Trưởng
                  </button>
                )}
              </>
            ) : (
              isAdmin && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => onOpenAssignMonitorModal(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                    title="Chỉ định Lớp trưởng cho lớp này"
                  >
                    <Crown className="w-3 h-3 text-amber-500" /> Chỉ Định Lớp Trưởng
                  </button>
                </>
              )
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {userOwnClass && userOwnClass !== selectedClass && (
            <button
              onClick={() => onClassChange(userOwnClass)}
              className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span>Về Lớp Của Tôi ({userOwnClass})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-2xs flex-1 sm:flex-initial min-w-[140px] sm:min-w-[170px]">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp:</span>
            <select
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none w-full cursor-pointer"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c} {userOwnClass === c ? '⭐ (Lớp của tôi)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Button Tiếp Nhận Sinh Viên & Import Danh Sách - Chỉ hiện khi là Lớp Trưởng của lớp này hoặc Admin */}
          {canManageClass ? (
            <>
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-md shadow-emerald-200 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
                title="Import danh sách thành viên lớp (tự động chuyển lớp & đánh dấu thôi học)"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Import DS
              </button>

              <button
                onClick={onOpenReceiveModal}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
                title="Tiếp nhận sinh viên chuyển biên chế vào lớp này"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tiếp Nhận SV
              </button>
            </>
          ) : (
            <span
              className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 cursor-default"
              title={`Chỉ Lớp trưởng của lớp ${selectedClass} mới có quyền tiếp nhận và điều chuyển sinh viên`}
            >
              Chỉ xem
            </span>
          )}

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> Xuất CSV
          </button>
        </div>
      </div>
    </>
  );
}
