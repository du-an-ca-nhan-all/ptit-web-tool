'use client';

import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import { getFlowActionDefinition } from '../../types/flow.types';
import { UpdateFollowerConfigFn } from './types';

interface FlowConfigMobileListProps {
  filteredStudents: FollowerStudentItem[];
  monitorCoursesCount: number;
  onUpdateFollowerConfig: UpdateFollowerConfigFn;
  onInspectStudent: (student: FollowerStudentItem) => void;
}

export function FlowConfigMobileList({
  filteredStudents,
  monitorCoursesCount,
  onUpdateFollowerConfig,
  onInspectStudent,
}: FlowConfigMobileListProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100">
      {filteredStudents.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold">
          Không tìm thấy sinh viên nào phù hợp
        </div>
      ) : (
        filteredStudents.map((student, idx) => {
          const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
          const is100Percent = diff.matchPercent === 100 && monitorCoursesCount > 0;

          return (
            <div
              key={student.maSV}
              className={`p-3.5 space-y-3 transition-colors ${
                student.isEnabled ? 'bg-amber-50/20' : 'bg-white opacity-80'
              }`}
            >
              {/* Top Row: STT, Mã SV, Name, QLDTTX status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs border border-indigo-100">
                    {student.maSV}
                  </span>
                  <strong className="text-slate-800 text-xs sm:text-sm block">{student.hoTen}</strong>
                </div>
                <div>
                  {student.isExternalConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      <Check className="w-2.5 h-2.5" /> Đã kết nối
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      Chưa TK
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row 1: Flow Toggle Switch + Match Progress */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        student.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-slate-700">
                    {student.isEnabled ? (
                      <span className="text-amber-700 font-black">⚡ Đang BẬT Flow</span>
                    ) : (
                      <span className="text-slate-400">Tắt Flow</span>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => onInspectStudent(student)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
                    is100Percent
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : diff.matchPercent > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span>{diff.matchPercent}% Khớp</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Middle Row 2: Permission Checkboxes */}
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer select-none text-xs font-bold ${
                    student.allowRegisterCourse && student.isEnabled
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={student.allowRegisterCourse}
                    disabled={!student.isEnabled}
                    onChange={(e) =>
                      onUpdateFollowerConfig(student.maSV, 'allowRegisterCourse', e.target.checked)
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                  />
                  <span>Flow ĐK Môn</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer select-none text-xs font-bold ${
                    student.allowCancelCourse && student.isEnabled
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={student.allowCancelCourse}
                    disabled={!student.isEnabled}
                    onChange={(e) =>
                      onUpdateFollowerConfig(student.maSV, 'allowCancelCourse', e.target.checked)
                    }
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                  />
                  <span>Flow Hủy Môn</span>
                </label>
              </div>

              {/* Footer Row: Last Action History */}
              {student.lastActionAt && (
                <div className="text-[11px] pt-1 border-t border-slate-100 flex items-center justify-between text-slate-500">
                  {(() => {
                    const actionDef = getFlowActionDefinition(student.lastActionType);
                    return (
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                            student.lastActionResult === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.lastActionResult === 'SKIPPED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {student.lastActionResult || 'DONE'}
                        </span>
                        <span className="font-bold text-slate-700 truncate">{actionDef.name}</span>
                      </div>
                    );
                  })()}
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(student.lastActionAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
