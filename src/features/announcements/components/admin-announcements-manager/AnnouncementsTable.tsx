import React from 'react';
import { Megaphone, RefreshCw } from 'lucide-react';
import { AnnouncementItem, AnnouncementPagination } from './types';
import { AnnouncementTableRow } from './AnnouncementTableRow';

interface AnnouncementsTableProps {
  announcements: AnnouncementItem[];
  isLoading: boolean;
  selectedIds: number[];
  pagination: AnnouncementPagination;
  onSelectAll: (checked: boolean) => void;
  onToggleSelect: (id: number, checked: boolean) => void;
  onToggleStatus: (item: AnnouncementItem) => void;
  onPreview: (item: AnnouncementItem) => void;
  onEdit: (item: AnnouncementItem) => void;
  onDelete: (id: number) => void;
  onPageChange: (nextPage: number) => void;
}

export function AnnouncementsTable({
  announcements,
  isLoading,
  selectedIds,
  pagination,
  onSelectAll,
  onToggleSelect,
  onToggleStatus,
  onPreview,
  onEdit,
  onDelete,
  onPageChange,
}: AnnouncementsTableProps) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
              <th className="p-3 sm:p-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    announcements.length > 0 &&
                    selectedIds.length === announcements.length
                  }
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </th>
              <th className="p-3 sm:p-4">Tiêu Đề & Nội Dung</th>
              <th className="p-3 sm:p-4">Loại & Hình Thức</th>
              <th className="p-3 sm:p-4">Đối Tượng</th>
              <th className="p-3 sm:p-4">Thời Gian</th>
              <th className="p-3 sm:p-4 text-center">Lượt Xem</th>
              <th className="p-3 sm:p-4 text-center">Trạng Thái</th>
              <th className="p-3 sm:p-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                    <span>Đang tải thông báo...</span>
                  </div>
                </td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Megaphone className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">Chưa có thông báo nào</p>
                    <p className="text-xs text-slate-400">Bấm nút "Tạo Thông Báo Mới" ở trên để phát thông báo đầu tiên.</p>
                  </div>
                </td>
              </tr>
            ) : (
              announcements.map((item) => (
                <AnnouncementTableRow
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={onToggleSelect}
                  onToggleStatus={onToggleStatus}
                  onPreview={onPreview}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> ({pagination.total} thông báo)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
