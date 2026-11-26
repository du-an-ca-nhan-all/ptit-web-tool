import type { ClassMemberImportPreview } from '../../server/classMemberImportService';
import type { DetailTab, DetailTabConfig } from './types';

export function formatStatusLabel(status?: string): string {
  switch (status) {
    case 'DANG_HOC':
      return 'Đang học';
    case 'BAO_LUU':
      return 'Bảo lưu';
    case 'NGHI_HOC':
      return 'Thôi học';
    case 'CHUYEN_LOP':
      return 'Chuyển lớp';
    case 'LOAI_BO':
      return 'Loại khỏi lớp';
    default:
      return status || 'Không rõ';
  }
}

export function getDefaultDetailTab(preview: ClassMemberImportPreview): DetailTab {
  if (preview.droppedOut.length > 0) return 'DROPPED';
  if (preview.transferred.length > 0) return 'TRANSFERRED';
  if (preview.newStudents.length > 0) return 'NEW';
  if (preview.restored.length > 0) return 'RESTORED';
  return 'UNCHANGED';
}

export function buildDetailTabs(preview: ClassMemberImportPreview): DetailTabConfig[] {
  return [
    {
      key: 'DROPPED',
      label: 'Chuyển Thôi học',
      count: preview.droppedOut.length,
      activeClass: 'border-rose-600 text-rose-700 bg-rose-50/70',
      badgeClass: 'bg-rose-100 text-rose-700',
    },
    {
      key: 'TRANSFERRED',
      label: 'Chuyển từ lớp khác',
      count: preview.transferred.length,
      activeClass: 'border-amber-600 text-amber-800 bg-amber-50/70',
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'NEW',
      label: 'Thêm mới',
      count: preview.newStudents.length,
      activeClass: 'border-emerald-600 text-emerald-700 bg-emerald-50/70',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'RESTORED',
      label: 'Khôi phục',
      count: preview.restored.length,
      activeClass: 'border-blue-600 text-blue-700 bg-blue-50/70',
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      key: 'UNCHANGED',
      label: 'Giữ nguyên',
      count: preview.unchanged.length,
      activeClass: 'border-slate-700 text-slate-800 bg-slate-100/80',
      badgeClass: 'bg-slate-200 text-slate-700',
    },
  ];
}
