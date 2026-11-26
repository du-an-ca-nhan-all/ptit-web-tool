import React from 'react';
import {
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface AnnouncementTypeBadgeProps {
  type: string;
}

export function AnnouncementTypeBadge({ type }: AnnouncementTypeBadgeProps) {
  switch (type) {
    case 'WARNING':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Cảnh báo
        </span>
      );
    case 'DANGER':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 text-rose-600" /> Khẩn cấp
        </span>
      );
    case 'MAINTENANCE':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1">
          <Wrench className="w-3 h-3 text-orange-600" /> Bảo trì
        </span>
      );
    case 'SUCCESS':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
        </span>
      );
    case 'SYSTEM':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-600" /> Hệ thống
        </span>
      );
    case 'INFO':
    default:
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
          <Megaphone className="w-3 h-3 text-sky-600" /> Thông tin
        </span>
      );
  }
}
