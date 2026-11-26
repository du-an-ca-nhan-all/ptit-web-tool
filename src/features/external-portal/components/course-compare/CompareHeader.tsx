import React from 'react';
import { AlertTriangle, BookOpen, RefreshCw, Zap } from 'lucide-react';
import { LoginUser } from '../../../../types';

interface CompareHeaderProps {
  hasMonitorData: boolean;
  currentStudentName: string;
  monitorUsername?: string;
  currentUser?: LoginUser | null;
  isCurrentUserMonitor: boolean;
  isPulling: boolean;
  canNavigateToMyCourses: boolean;
  onReloadClick: () => void;
  onPullMyCourses: () => void;
  onGoToMyCourses: () => void;
}

export function CompareHeader({
  hasMonitorData,
  currentStudentName,
  monitorUsername,
  currentUser,
  isCurrentUserMonitor,
  isPulling,
  canNavigateToMyCourses,
  onReloadClick,
  onPullMyCourses,
  onGoToMyCourses,
}: CompareHeaderProps) {
  return (
    <>
      {/* Screen Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  So Sánh Đăng Ký Môn Học
                </h1>
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Mặc Định Đối Chiếu Với Lớp Trưởng
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {hasMonitorData ? (
                  <>
                    Đối chiếu danh sách môn học & nhóm tổ của <strong className="text-indigo-600 font-mono">({currentStudentName})</strong> với mốc chuẩn <strong className="text-emerald-700 font-mono">Lớp trưởng ({monitorUsername || 'Lớp trưởng'})</strong>
                  </>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Chưa có mốc chuẩn đối chiếu từ Lớp trưởng của lớp
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={onReloadClick}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải Lại</span>
          </button>

          {currentUser && (
            <button
              onClick={onPullMyCourses}
              disabled={isPulling}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPulling ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              )}
              <span>Đồng Bộ Từ QLDTTX</span>
            </button>
          )}

          {canNavigateToMyCourses && (
            <button
              onClick={onGoToMyCourses}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl transition-colors border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem Danh Sách Môn ĐK</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Warning when Monitor has not pulled course data */}
      {!hasMonitorData && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-tight">
                  Lớp Trưởng Chưa Đồng Bộ Dữ Liệu Đăng Ký Môn Học
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  Chưa Có Mốc Chuẩn
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1.5 leading-relaxed max-w-2xl">
                {isCurrentUserMonitor ? (
                  <>
                    Bạn là <strong>Lớp trưởng</strong> nhưng chưa kéo kết quả đăng ký môn học của mình từ cổng trường (<strong>https://qldttx.pttc1.edu.vn/</strong>).
                    Vui lòng bấm nút <strong>"Đồng Bộ Môn Học Lớp Trưởng Ngay"</strong> bên dưới để tạo mốc đối chiếu cho toàn bộ sinh viên trong lớp.
                  </>
                ) : (
                  <>
                    <strong>Lớp trưởng</strong> của lớp <strong className="text-indigo-700 font-mono">({currentUser?.lop || 'Lớp bạn'})</strong> chưa đồng bộ dữ liệu môn học đã đăng ký kỳ này từ cổng QLDTTX.
                    Vì vậy hệ thống chưa thể tạo mốc chuẩn để đối chiếu môn học và nhóm tổ. Bạn vẫn có thể xem và đồng bộ danh sách môn học của riêng mình.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {isCurrentUserMonitor ? (
              <button
                onClick={onPullMyCourses}
                disabled={isPulling}
                className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-amber-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPulling ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current text-yellow-300" />
                )}
                <span>Đồng Bộ Môn Học Lớp Trưởng Ngay</span>
              </button>
            ) : canNavigateToMyCourses ? (
              <button
                onClick={onGoToMyCourses}
                className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-colors shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Môn Của Bạn</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
