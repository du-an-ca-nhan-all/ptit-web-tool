'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Uncaught Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center text-red-400 mx-auto mb-5 shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Đã Xảy Ra Sự Cố</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Hệ thống gặp lỗi bất ngờ trong quá trình xử lý dữ liệu. Vui lòng bấm thử lại hoặc tải lại trang để tiếp tục.
        </p>

        {error.message && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-6 text-left overflow-x-auto">
            <p className="text-[11px] font-mono text-red-300 break-words">{error.message}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử Lại
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-2"
          >
            <HomeIcon className="w-3.5 h-3.5" /> Trang Chủ
          </a>
        </div>
      </div>
    </div>
  );
}
