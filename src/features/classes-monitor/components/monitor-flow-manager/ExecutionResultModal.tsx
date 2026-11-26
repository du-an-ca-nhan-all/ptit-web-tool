'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { ExecutionResultSummary } from './types';

interface ExecutionResultModalProps {
  result: ExecutionResultSummary | null;
  onClose: () => void;
}

export function ExecutionResultModal({ result, onClose }: ExecutionResultModalProps) {
  if (!result) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[88vh] sm:max-h-[85vh] flex flex-col">
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-black">Kết Quả Thực Thi Flow Action</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
          <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
            <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Thành Công</span>
            <span className="text-base sm:text-lg font-black text-emerald-700">{result.successCount}</span>
          </div>
          <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
            <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Thất Bại</span>
            <span className="text-base sm:text-lg font-black text-rose-600">{result.failCount}</span>
          </div>
          <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
            <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Bỏ Qua</span>
            <span className="text-base sm:text-lg font-black text-amber-600">{result.skippedCount}</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
          {result.results.map((res, i) => (
            <div key={i} className="py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    {res.username}
                  </span>
                  <span className="font-bold text-slate-800 text-xs truncate">{res.hoTen || res.username}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{res.message}</p>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                  res.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : res.status === 'SKIPPED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {res.status}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
