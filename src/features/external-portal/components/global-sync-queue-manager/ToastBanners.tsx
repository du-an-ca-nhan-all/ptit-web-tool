'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastBannersProps {
  message: string | null;
  errorMessage: string | null;
  onDismissMessage: () => void;
  onDismissError: () => void;
}

export function ToastBanners({
  message,
  errorMessage,
  onDismissMessage,
  onDismissError,
}: ToastBannersProps) {
  return (
    <>
      {message && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs sm:text-sm shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold leading-snug">{message}</span>
          </div>
          <button
            type="button"
            onClick={onDismissMessage}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs sm:text-sm shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span className="font-semibold leading-snug">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}
    </>
  );
}
