'use client';

import React from 'react';
import { Phone, ShieldCheck, Send } from 'lucide-react';

export default function AdminContactFooter() {
  return (
    <div className="py-4 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>Hỗ Trợ & Liên Hệ Quản Trị Viên (Admin)</span>
      </div>
      <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2.5 leading-tight">
        Khi cần cấp lại mật khẩu, mở khóa tài khoản hoặc khiếu nại thông tin:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono font-bold">
        <a
          href="https://t.me/lethanh9398"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-sky-600 hover:text-sky-700 bg-white sm:bg-sky-50 hover:bg-sky-100 border border-sky-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span>@lethanh9398</span>
        </a>
        <a
          href="tel:0966211618"
          className="flex items-center justify-center gap-1.5 text-emerald-700 hover:text-emerald-800 bg-white sm:bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>0966.211.618</span>
        </a>
        <a
          href="https://www.facebook.com/lethanh9398"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-blue-700 hover:text-blue-800 bg-white sm:bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 px-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
        >
          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>FB: lethanh9398</span>
        </a>
      </div>
    </div>
  );
}
