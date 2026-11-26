import React from 'react';
import { Search, Trash2 } from 'lucide-react';

interface FilterAndBulkBarProps {
  searchQuery: string;
  typeFilter: string;
  displayModeFilter: string;
  statusFilter: string;
  selectedCount: number;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onDisplayModeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onBulkDelete: () => void;
}

export function FilterAndBulkBar({
  searchQuery,
  typeFilter,
  displayModeFilter,
  statusFilter,
  selectedCount,
  onSearchChange,
  onTypeFilterChange,
  onDisplayModeFilterChange,
  onStatusFilterChange,
  onBulkDelete,
}: FilterAndBulkBarProps) {
  return (
    <>
      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, người tạo hoặc mã lớp..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả loại</option>
            <option value="INFO">Thông tin</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Khẩn cấp</option>
            <option value="MAINTENANCE">Bảo trì</option>
            <option value="SUCCESS">Thành công</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>

          {/* Display Mode Filter */}
          <select
            value={displayModeFilter}
            onChange={(e) => onDisplayModeFilterChange(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="BANNER">Thanh Banner</option>
            <option value="MODAL">Popup Modal</option>
            <option value="BOTH">Cả hai</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bật (Active)</option>
            <option value="INACTIVE">Đang tắt (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="text-xs font-bold text-indigo-900">
            Đã chọn <strong>{selectedCount}</strong> thông báo
          </div>
          <button
            type="button"
            onClick={onBulkDelete}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa đã chọn</span>
          </button>
        </div>
      )}
    </>
  );
}
