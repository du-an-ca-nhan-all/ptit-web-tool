'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePaginationBarProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function MobilePaginationBar({
  page,
  totalPages,
  setPage,
}: MobilePaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Trước</span>
      </button>

      <span className="text-xs font-bold text-slate-700 font-mono">
        Trang {page} / {totalPages}
      </span>

      <button
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
      >
        <span>Sau</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
