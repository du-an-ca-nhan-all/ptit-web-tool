import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonitorsPaginationProps {
  validPage: number;
  totalPages: number;
  totalItems: number;
  pageNumbers: (number | string)[];
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}

export function MonitorsPagination({
  validPage,
  totalPages,
  totalItems,
  pageNumbers,
  onPageChange,
}: MonitorsPaginationProps) {
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-xs text-slate-500 font-medium">
        Trang <span className="font-bold text-slate-800">{validPage}</span> / <span className="font-bold text-slate-800">{totalPages}</span> (Tổng {totalItems} cán bộ lớp)
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={validPage <= 1}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {pageNumbers.map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                p === validPage
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-xs text-slate-400 font-bold">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={validPage >= totalPages}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
          title="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
