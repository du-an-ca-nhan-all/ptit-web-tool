'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Crown,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import type { ClassMemberImportPreview } from '../../server/classMemberImportService';

interface ConfirmSummarySectionProps {
  preview: ClassMemberImportPreview;
  error: string | null;
}

export default function ConfirmSummarySection({ preview, error }: ConfirmSummarySectionProps) {
  const delta = preview.expectedActiveCountAfter - preview.currentActiveCount;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <>
      {/* Confirmation Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-indigo-950">
            Xác Nhận Thay Đổi Trước Khi Import Lớp {preview.classCode}
          </h3>
          <p className="text-xs text-indigo-900/80 leading-relaxed">
            Vui lòng kiểm tra kỹ danh sách biến động bên dưới. Dữ liệu chỉ được cập nhật vào hệ thống sau khi bạn bấm{' '}
            <strong>Xác Nhận Thực Hiện Import</strong>.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Sĩ số lớp
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-800">
              {preview.currentActiveCount} → {preview.expectedActiveCountAfter}
            </span>
            <span
              className={`text-[11px] font-bold ${
                delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500'
              }`}
            >
              ({deltaText})
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-600">
            <UserMinus className="w-3.5 h-3.5" />
            Thôi học
          </div>
          <div className="mt-1 text-lg font-black text-rose-700">{preview.droppedOut.length}</div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-700">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Chuyển lớp sang
          </div>
          <div className="mt-1 text-lg font-black text-amber-800">{preview.transferred.length}</div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-700">
            <UserPlus className="w-3.5 h-3.5" />
            Mới / Khôi phục
          </div>
          <div className="mt-1 text-lg font-black text-emerald-700">
            {preview.newStudents.length + preview.restored.length}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Giữ nguyên
          </div>
          <div className="mt-1 text-lg font-black text-slate-800">{preview.unchanged.length}</div>
        </div>
      </div>

      {/* Critical Warnings */}
      {preview.hasMonitorInDroppedOut && (
        <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 flex items-start gap-2.5">
          <Crown className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-xs">Cảnh báo: Lớp trưởng hiện tại nằm trong danh sách chuyển Thôi học!</p>
            <p className="text-[11px] mt-0.5 text-rose-800">
              Mã sinh viên lớp trưởng không có trong danh sách import. Hãy kiểm tra lại xem có thiếu dòng hay không trước khi xác nhận.
            </p>
          </div>
        </div>
      )}

      {preview.droppedOut.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            Có <strong>{preview.droppedOut.length}</strong> sinh viên đang học trong lớp{' '}
            <strong>{preview.classCode}</strong> không xuất hiện trong danh sách import sẽ được chuyển sang trạng thái{' '}
            <strong className="text-rose-700">Thôi học (NGHI_HOC)</strong> (có thể khôi phục lại trong tab Biến Động nếu cần).
          </p>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
          {error}
        </div>
      )}
    </>
  );
}
