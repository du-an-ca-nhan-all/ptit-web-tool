'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ImportMode } from './types';

interface ModalFooterProps {
  parsedCount: number;
  importMode: ImportMode;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export function ModalFooter({
  parsedCount,
  importMode,
  isSubmitting,
  onClose,
  onSubmit,
}: ModalFooterProps) {
  return (
    <div className="p-3.5 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
      <div className="text-[11px] text-slate-500 text-center sm:text-left">
        {parsedCount > 0 ? (
          <span>
            Sẽ cấu hình Flow cho <strong className="text-indigo-700">{parsedCount} bạn</strong> (
            {importMode === 'REPLACE' ? (
              <strong className="text-amber-700">Ghi đè toàn bộ</strong>
            ) : (
              <strong className="text-emerald-700">Bổ sung</strong>
            )}
            )
          </span>
        ) : (
          <span>Chọn file CSV hoặc nhập danh sách text để bắt đầu.</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-50 text-center"
        >
          Hủy
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={parsedCount === 0 || isSubmitting}
          className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
            importMode === 'REPLACE'
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Xác Nhận ({parsedCount} SV)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
