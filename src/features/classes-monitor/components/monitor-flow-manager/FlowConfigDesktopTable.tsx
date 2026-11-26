'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import { getFlowActionDefinition } from '../../types/flow.types';
import { UpdateFollowerConfigFn } from './types';

interface FlowConfigDesktopTableProps {
  filteredStudents: FollowerStudentItem[];
  monitorCoursesCount: number;
  onUpdateFollowerConfig: UpdateFollowerConfigFn;
  onInspectStudent: (student: FollowerStudentItem) => void;
}

export function FlowConfigDesktopTable({
  filteredStudents,
  monitorCoursesCount,
  onUpdateFollowerConfig,
  onInspectStudent,
}: FlowConfigDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-4 py-3.5 text-center w-12">STT</th>
            <th className="px-4 py-3.5">Mã SV</th>
            <th className="px-4 py-3.5">Họ và Tên</th>
            <th className="px-4 py-3.5 text-center">Tài Khoản QLDTTX</th>
            <th className="px-4 py-3.5 text-center">Bật / Tắt Flow</th>
            <th className="px-4 py-3.5 text-center">Flow Đăng Ký Môn</th>
            <th className="px-4 py-3.5 text-center">Flow Hủy Môn</th>
            <th className="px-4 py-3.5 text-center">So Khớp Môn</th>
            <th className="px-4 py-3.5">Lịch Sử Flow Gần Nhất</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredStudents.map((student, idx) => {
            const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
            const is100Percent = diff.matchPercent === 100 && monitorCoursesCount > 0;

            return (
              <tr
                key={student.maSV}
                className={`hover:bg-slate-50/80 transition-colors ${
                  student.isEnabled ? 'bg-amber-50/20' : 'opacity-70 bg-slate-50/30'
                }`}
              >
                <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                <td className="px-4 py-3.5">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs border border-indigo-100">
                    {student.maSV}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-bold text-slate-800 text-sm block">{student.hoTen}</span>
                  {student.soDienThoai && (
                    <span className="text-[11px] text-slate-400 font-mono">SĐT: {student.soDienThoai}</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {student.isExternalConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3" /> Đã Liên Kết
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Chưa Liên Kết
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
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
                </td>
                <td className="px-4 py-3.5 text-center">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={student.allowRegisterCourse}
                      disabled={!student.isEnabled}
                      onChange={(e) =>
                        onUpdateFollowerConfig(student.maSV, 'allowRegisterCourse', e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                    />
                    <span className="text-[11px] font-bold text-slate-700">Đăng ký</span>
                  </label>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={student.allowCancelCourse}
                      disabled={!student.isEnabled}
                      onChange={(e) =>
                        onUpdateFollowerConfig(student.maSV, 'allowCancelCourse', e.target.checked)
                      }
                      className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                    />
                    <span className="text-[11px] font-bold text-slate-700">Hủy môn</span>
                  </label>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => {
                      onInspectStudent(student);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      is100Percent
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : diff.matchPercent > 0
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{diff.matchPercent}% Khớp</span>
                  </button>
                </td>
                <td className="px-4 py-3.5 max-w-xs">
                  {student.lastActionAt ? (
                    <div className="space-y-0.5">
                      {(() => {
                        const actionDef = getFlowActionDefinition(student.lastActionType);
                        return (
                          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
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
                            <span className="font-bold text-slate-700">{actionDef.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({actionDef.categoryName})</span>
                          </div>
                        );
                      })()}
                      {student.lastActionMessage && (
                        <p className="text-[11px] text-slate-500 truncate" title={student.lastActionMessage}>
                          {student.lastActionMessage}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Chưa có hành động</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
