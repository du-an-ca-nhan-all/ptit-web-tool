'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { ExternalAccountFormState } from './types';

interface AccountStepIndicatorProps {
  isTestSuccess: boolean;
  testStatus?: ExternalAccountFormState['testStatus'];
}

export function AccountStepIndicator({
  isTestSuccess,
  testStatus,
}: AccountStepIndicatorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
      {/* Step 1 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-800 font-bold text-xs shadow-2xs border border-slate-200/60">
        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
          1
        </div>
        <span className="truncate">1. Nhập thông tin</span>
      </div>

      {/* Step 2 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          isTestSuccess
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : testStatus === 'TESTING'
            ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
            : testStatus === 'FAILED'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'text-slate-400'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
            isTestSuccess
              ? 'bg-emerald-600 text-white'
              : testStatus === 'FAILED'
              ? 'bg-rose-600 text-white'
              : testStatus === 'TESTING'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          {isTestSuccess ? <Check className="w-3 h-3" /> : 2}
        </div>
        <span className="truncate">
          {isTestSuccess ? '2. Đã xác thực' : '2. Kiểm tra kết nối'}
        </span>
      </div>

      {/* Step 3 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          isTestSuccess
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'text-slate-400'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
            isTestSuccess ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
          }`}
        >
          3
        </div>
        <span className="truncate">3. Lưu & Kết nối</span>
      </div>
    </div>
  );
}
