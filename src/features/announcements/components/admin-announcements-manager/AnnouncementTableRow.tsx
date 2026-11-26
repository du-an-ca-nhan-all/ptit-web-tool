import React from 'react';
import {
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Pin,
  ExternalLink,
  EyeOff,
} from 'lucide-react';
import { AnnouncementItem } from './types';
import { AnnouncementTypeBadge } from './AnnouncementTypeBadge';

interface AnnouncementTableRowProps {
  item: AnnouncementItem;
  isSelected: boolean;
  onToggleSelect: (id: number, checked: boolean) => void;
  onToggleStatus: (item: AnnouncementItem) => void;
  onPreview: (item: AnnouncementItem) => void;
  onEdit: (item: AnnouncementItem) => void;
  onDelete: (id: number) => void;
}

export function AnnouncementTableRow({
  item,
  isSelected,
  onToggleSelect,
  onToggleStatus,
  onPreview,
  onEdit,
  onDelete,
}: AnnouncementTableRowProps) {
  return (
    <tr
      className={`hover:bg-slate-50/80 transition-colors ${
        isSelected ? 'bg-sky-50/50' : ''
      }`}
    >
      <td className="p-3 sm:p-4 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(item.id, e.target.checked)}
          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
        />
      </td>

      {/* Title and content */}
      <td className="p-3 sm:p-4 max-w-xs md:max-w-sm">
        <div className="flex items-center gap-1.5 mb-1">
          {item.isPinned && (
            <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-0.5">
              <Pin className="w-2.5 h-2.5" /> Ghim
            </span>
          )}
          <h4 className="font-bold text-slate-900 line-clamp-1">{item.title}</h4>
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {item.content}
        </p>
        {item.linkUrl && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-600 font-medium">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{item.linkText || item.linkUrl}</span>
          </div>
        )}
      </td>

      {/* Type and Display Mode */}
      <td className="p-3 sm:p-4">
        <div className="flex flex-col gap-1.5 items-start">
          <AnnouncementTypeBadge type={item.type} />
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {item.displayMode === 'BOTH'
              ? 'Banner & Modal'
              : item.displayMode === 'MODAL'
              ? 'Popup Modal'
              : 'Thanh Banner'}
          </span>
        </div>
      </td>

      {/* Target */}
      <td className="p-3 sm:p-4">
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="font-bold text-slate-700">
            {item.targetRole === 'ALL'
              ? 'Tất cả đối tượng'
              : item.targetRole === 'sinh_vien'
              ? 'Sinh viên'
              : item.targetRole === 'lop_truong'
              ? 'Lớp trưởng'
              : 'Quản trị viên'}
          </span>
          {item.targetClass && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded self-start">
              Lớp: {item.targetClass}
            </span>
          )}
        </div>
      </td>

      {/* Timing */}
      <td className="p-3 sm:p-4 text-[11px] text-slate-500 whitespace-nowrap">
        <div>
          {item.startDate ? (
            <span>
              Từ: {new Date(item.startDate).toLocaleDateString('vi-VN')}
            </span>
          ) : (
            <span>Ngay tức thì</span>
          )}
        </div>
        {item.endDate && (
          <div className="text-[10px] text-slate-400 mt-0.5">
            Đến: {new Date(item.endDate).toLocaleDateString('vi-VN')}
          </div>
        )}
      </td>

      {/* Views */}
      <td className="p-3 sm:p-4 text-center font-bold text-slate-700">
        {item.viewCount}
      </td>

      {/* Active toggle */}
      <td className="p-3 sm:p-4 text-center">
        <button
          type="button"
          onClick={() => onToggleStatus(item)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
            item.isActive
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300'
          }`}
        >
          {item.isActive ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Bật
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3 text-slate-400" /> Tắt
            </>
          )}
        </button>
      </td>

      {/* Actions */}
      <td className="p-3 sm:p-4 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            title="Xem trước giao diện"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Chỉnh sửa thông báo"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Xóa thông báo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
