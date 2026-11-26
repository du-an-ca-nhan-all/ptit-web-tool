import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function StudentsPagination({
  currentPage,
  totalPages,
  totalStudents,
  isLoading,
  onPageChange,
}: StudentsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 border-t border-slate-100 bg-white sm:bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div>
        Trang <b className="text-slate-900">{currentPage}</b> / {totalPages} (Tổng cộng{' '}
        <b className="text-slate-900">{totalStudents}</b> sinh viên)
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoading}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trước</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3) {
                pageNum = currentPage - 2 + i;
              }
              if (pageNum > totalPages) {
                pageNum = totalPages - 4 + i;
              }
            }
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoading}
          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
        >
          <span>Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
