'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
  itemLabel = 'bản ghi',
}: PaginationProps) {
  if (totalPages <= 1 && (!totalRecords || totalRecords <= pageSize)) {
    return null;
  }

  // Calculate visible page buttons (max 5 buttons)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = totalRecords ? Math.min(currentPage * pageSize, totalRecords) : currentPage * pageSize;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-600 shadow-sm ${className}`}
    >
      {/* Total & Current page info */}
      <div className="flex items-center gap-2">
        {totalRecords !== undefined ? (
          <span>
            Hiển thị <span className="font-bold text-slate-800">{totalRecords > 0 ? startRecord : 0}</span>-
            <span className="font-bold text-slate-800">{endRecord}</span> trong tổng số{' '}
            <span className="font-bold text-blue-600">{totalRecords.toLocaleString()}</span> {itemLabel}
          </span>
        ) : (
          <span>
            Trang <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
            <span className="text-slate-500">Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${
              p === currentPage
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
