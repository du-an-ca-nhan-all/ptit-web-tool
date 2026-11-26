'use client';

import React from 'react';

interface DataTablePaginationProps {
  startIndex: number;
  activeItemsPerPage: number;
  totalCount: number;
  activeCurrentPage: number;
  calculatedTotalPages: number;
  onItemsPerPageChange?: (size: number) => void;
  onGoToPage: (page: number) => void;
}

export function DataTablePagination({
  startIndex,
  activeItemsPerPage,
  totalCount,
  activeCurrentPage,
  calculatedTotalPages,
  onItemsPerPageChange,
  onGoToPage,
}: DataTablePaginationProps) {
  return (
    <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">
          Hiển thị {startIndex + 1} đến {Math.min(startIndex + activeItemsPerPage, totalCount)} trên{' '}
          <strong className="text-slate-700 font-bold">{totalCount}</strong> bản ghi
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>(Xem:</span>
            <select
              value={activeItemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>/ trang)</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 items-center">
        <button
          onClick={() => onGoToPage(1)}
          disabled={activeCurrentPage === 1}
          className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
        >
          Đầu
        </button>
        <button
          onClick={() => onGoToPage(activeCurrentPage - 1)}
          disabled={activeCurrentPage === 1}
          className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
        >
          Trước
        </button>
        <span className="px-2 sm:px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded shadow-xs">
          {activeCurrentPage} / {calculatedTotalPages}
        </span>
        <button
          onClick={() => onGoToPage(activeCurrentPage + 1)}
          disabled={activeCurrentPage === calculatedTotalPages}
          className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
        >
          Sau
        </button>
        <button
          onClick={() => onGoToPage(calculatedTotalPages)}
          disabled={activeCurrentPage === calculatedTotalPages}
          className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
        >
          Cuối
        </button>
      </div>
    </div>
  );
}
