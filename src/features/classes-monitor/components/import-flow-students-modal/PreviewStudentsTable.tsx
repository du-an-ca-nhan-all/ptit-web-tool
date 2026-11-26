'use client';

import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { ParsedFlowStudent } from './types';

interface PreviewStudentsTableProps {
  parsedStudents: ParsedFlowStudent[];
  inClassCount: number;
  linkedCount: number;
  onToggleStudent: (maSV: string) => void;
  onToggleRegister: (maSV: string, checked: boolean) => void;
  onToggleCancel: (maSV: string, checked: boolean) => void;
  onRemoveStudent: (maSV: string) => void;
}

export function PreviewStudentsTable({
  parsedStudents,
  inClassCount,
  linkedCount,
  onToggleStudent,
  onToggleRegister,
  onToggleCancel,
  onRemoveStudent,
}: PreviewStudentsTableProps) {
  return (
    <div className="space-y-3">
      {/* Preview Stats Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-800 text-xs">
            Danh Sách Phân Tích Được ({parsedStudents.length} bạn):
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
            🟢 {inClassCount} bạn trong lớp
          </span>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-lg text-[11px]">
            🔑 {linkedCount} bạn đã liên kết QLDTTX
          </span>
          {parsedStudents.length - inClassCount > 0 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">
              ⚪ {parsedStudents.length - inClassCount} bạn ngoài lớp
            </span>
          )}
          {parsedStudents.length - linkedCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px]">
              ⚠️ {parsedStudents.length - linkedCount} bạn chưa có TK QLDTTX
            </span>
          )}
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-center w-10">STT</th>
              <th className="px-3 py-2">Mã SV</th>
              <th className="px-3 py-2">Họ và Tên</th>
              <th className="px-3 py-2 text-center">Thuộc Lớp</th>
              <th className="px-3 py-2 text-center">Tài Khoản QLDTTX</th>
              <th className="px-3 py-2 text-center">Bật Flow</th>
              <th className="px-3 py-2 text-center">Đăng Ký</th>
              <th className="px-3 py-2 text-center">Hủy Môn</th>
              <th className="px-3 py-2 text-center w-10">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parsedStudents.map((st, i) => (
              <tr key={st.maSV} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 text-center text-slate-400 font-mono">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                    {st.maSV}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <strong className="text-slate-800">{st.hoTen || st.matchedName || '—'}</strong>
                </td>
                <td className="px-3 py-2 text-center">
                  {st.isInClass ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> {st.classCode}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Khác lớp
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {st.isLinked ? (
                    <span className="text-emerald-700 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      🔑 Đã có TK
                    </span>
                  ) : (
                    <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      ⚠️ Chưa có TK
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={st.isEnabled}
                    onChange={() => onToggleStudent(st.maSV)}
                    className="rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={st.allowRegisterCourse}
                    onChange={(e) => onToggleRegister(st.maSV, e.target.checked)}
                    className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={st.allowCancelCourse}
                    onChange={(e) => onToggleCancel(st.maSV, e.target.checked)}
                    className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveStudent(st.maSV)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Xóa bạn này khỏi danh sách import"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
