'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="bg-[#0F172A] text-slate-200 font-sans min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-400 mx-auto mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Lỗi Hệ Thống Nghiêm Trọng</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Hệ thống ứng dụng PTIT EduSync gặp sự cố cấp khung giao diện.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Khởi Động Lại Ứng Dụng
          </button>
        </div>
      </body>
    </html>
  );
}
