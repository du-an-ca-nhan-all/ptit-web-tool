'use client';

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { CourseItem, FollowerStudentItem } from '../../server/monitorFlowServerService';
import { ExecuteFlowFn } from './types';

interface StudentInspectionModalProps {
  student: FollowerStudentItem | null;
  monitorCourses: CourseItem[];
  isExecuting: boolean;
  onClose: () => void;
  onExecuteFlow: ExecuteFlowFn;
}

export function StudentInspectionModal({
  student,
  monitorCourses,
  isExecuting,
  onClose,
  onExecuteFlow,
}: StudentInspectionModalProps) {
  if (!student) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black">
              Đối Chiếu: LT vs {student.hoTen} ({student.maSV})
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Khớp: <strong className="text-amber-300 font-mono">{student.diffSummary?.matchPercent}%</strong> • {student.courses.length} môn đã ĐK
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 gap-2 sm:gap-0">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 text-xs sm:text-sm">Hành Động Khắc Phục Nhanh</div>
              <p className="text-slate-500 text-[10px] sm:text-[11px]">Đưa toàn bộ môn về khớp 100% với Lớp trưởng</p>
            </div>
            <button
              onClick={async () => {
                const sv = student.maSV;
                onClose();
                await onExecuteFlow({
                  flowAction: 'SYNC_ALL_COURSES',
                  targetFollowerUsernames: [sv],
                });
              }}
              disabled={isExecuting}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Đồng Bộ Khớp 100% Ngay</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="px-3 py-2.5">Môn Học (LT)</th>
                  <th className="px-2.5 py-2.5 text-center">Nhóm LT</th>
                  <th className="px-2.5 py-2.5 text-center">Trạng Thái SV</th>
                  <th className="px-2.5 py-2.5 text-center">Nhóm SV</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monitorCourses.map((m, i) => {
                  const fol = student.courses.find(
                    (c) => String(c.ma_mon).toUpperCase() === String(m.ma_mon).toUpperCase()
                  );
                  const isMatch = fol && String(fol.id_to_hoc).trim() === String(m.id_to_hoc).trim();
                  const isDiff = fol && !isMatch;

                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <strong className="text-slate-800 text-xs block">{m.ten_mon}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{m.ma_mon}</span>
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-black text-amber-900 bg-amber-50 text-xs">
                        {m.nhom_to}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        {isMatch ? (
                          <span className="text-emerald-700 font-black text-[10px] whitespace-nowrap">🟢 Trùng khớp</span>
                        ) : isDiff ? (
                          <span className="text-amber-700 font-black text-[10px] whitespace-nowrap">🟡 Lệch nhóm</span>
                        ) : (
                          <span className="text-rose-700 font-black text-[10px] whitespace-nowrap">🔴 Chưa ĐK</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-center font-bold text-slate-700 text-xs">
                        {fol ? fol.nhom_to : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isMatch ? (
                          <span className="text-emerald-600 font-bold text-[10px]">Đã chuẩn</span>
                        ) : isDiff ? (
                          <button
                            onClick={async () => {
                              if (fol?.id_to_hoc) {
                                await onExecuteFlow({
                                  flowAction: 'CANCEL',
                                  id_to_hoc: fol.id_to_hoc,
                                  targetFollowerUsernames: [student.maSV],
                                });
                              }
                              await onExecuteFlow({
                                flowAction: 'REGISTER',
                                id_to_hoc: m.id_to_hoc,
                                targetFollowerUsernames: [student.maSV],
                              });
                            }}
                            disabled={isExecuting}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                          >
                            Đổi nhóm {m.nhom_to}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onExecuteFlow({
                                flowAction: 'REGISTER',
                                id_to_hoc: m.id_to_hoc,
                                targetFollowerUsernames: [student.maSV],
                              })
                            }
                            disabled={isExecuting}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                          >
                            Đăng ký
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
