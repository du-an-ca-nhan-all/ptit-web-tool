import React from 'react';
import { BarChart3, X } from 'lucide-react';
import { PopupStats, SelectedCourseInfo } from './types';

interface CourseStatsModalProps {
  selectedCourse: SelectedCourseInfo;
  popupStats: PopupStats;
  onClose: () => void;
}

export function CourseStatsModal({ selectedCourse, popupStats, onClose }: CourseStatsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black">{selectedCourse.courseName}</h3>
              <p className="text-xs text-slate-300 font-mono">{selectedCourse.courseCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-slate-500 font-bold block mb-1">
              Thống kê trên {popupStats.totalAnalyzed} sinh viên trong lớp có dữ liệu:
            </span>
          </div>

          {/* Group Distribution */}
          <div className="flex flex-col gap-2">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
              Phân bố theo nhóm tổ:
            </h4>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {Array.from(popupStats.groupMap.entries()).map(([grp, users]) => (
                <div
                  key={grp}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Nhóm {grp}
                    </span>
                    {grp === selectedCourse.monitorGroup && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                        Nhóm của LT
                      </span>
                    )}
                    {grp === selectedCourse.myGroup && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                        Nhóm của bạn
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-700">{users.length} SV</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing list */}
          {popupStats.missingUsers.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <h4 className="font-black text-rose-700 uppercase tracking-wider text-[11px]">
                Chưa đăng ký ({popupStats.missingUsers.length} SV):
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {popupStats.missingUsers.map((u: string) => (
                  <span
                    key={u}
                    className="px-2 py-1 bg-rose-50 text-rose-800 font-mono font-bold rounded-lg border border-rose-200 text-[11px]"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
