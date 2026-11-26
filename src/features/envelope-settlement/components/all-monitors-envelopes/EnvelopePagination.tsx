import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EnvelopePaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: (size: number) => void;
}

export default function EnvelopePagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  setPage,
  setPageSize,
}: EnvelopePaginationProps) {
  if (totalItems <= 0) return null;

  return (
    <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 text-slate-600">
        <span>
          Hiển thị <strong>{(page - 1) * pageSize + 1}</strong> -{' '}
          <strong>{Math.min(page * pageSize, totalItems)}</strong> trên tổng số{' '}
          <strong>{totalItems}</strong> phòng
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-slate-400">Dòng/trang:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={9999}>Tất cả</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          <div className="flex items-center gap-1 px-2 font-semibold text-slate-700">
            <span>Trang</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= totalPages) setPage(val);
              }}
              className="w-12 text-center py-0.5 border border-slate-200 rounded-md font-bold bg-white"
            />
            <span>/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}
