import React from 'react';

interface StudentStatusBadgeProps {
  status?: string;
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  switch (status) {
    case 'DANG_HOC':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Đang học
        </span>
      );
    case 'BAO_LUU':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Bảo lưu
        </span>
      );
    case 'NGHI_HOC':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Nghỉ học
        </span>
      );
    case 'CHUYEN_LOP':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Chuyển lớp
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {status || 'Đang học'}
        </span>
      );
  }
}
