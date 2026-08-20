import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import AppLogo from '@/src/components/common/AppLogo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <AppLogo />
        </div>

        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">404 - Không Tìm Thấy Trang</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ mới trong hệ thống PTIT EduSync.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          <Home className="w-4 h-4" /> Quay Lại Trang Chủ
        </Link>
      </div>
    </div>
  );
}
