'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Send,
  Mail,
  Clock,
  HelpCircle,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';

export default function Footer() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <footer className="mt-14 pt-8 pb-30 border-t border-slate-200/90 text-slate-600 bg-slate-50/60 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Main Admin Contact Card Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Info Title & Description */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                    Thông Tin Hỗ Trợ & Liên Hệ Quản Trị Viên (Admin)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang Trực Tuyến
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Khi cần hỗ trợ <strong>cấp lại mật khẩu</strong>, <strong>kích hoạt tài khoản sinh viên</strong>, <strong>khiếu nại lịch thi</strong> hoặc báo lỗi hệ thống, vui lòng liên hệ Ban Quản trị qua các kênh bên dưới:
                </p>
              </div>
            </div>

            {/* Right: Contact Channel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
              {/* Telegram Admin */}
              <div className="flex items-center justify-between gap-2.5 p-3 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-200 rounded-2xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Telegram
                    </span>
                    <a
                      href="https://t.me/lethanh9398"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-xs text-sky-700 hover:text-sky-800 truncate block hover:underline"
                    >
                      @lethanh9398
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('@lethanh9398', 'telegram')}
                  className="p-1.5 text-slate-400 hover:text-sky-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Sao chép Telegram handle"
                >
                  {copied === 'telegram' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Phone / Zalo Admin */}
              <div className="flex items-center justify-between gap-2.5 p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-2xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      SĐT / Zalo
                    </span>
                    <a
                      href="tel:0966211618"
                      className="font-mono font-bold text-xs text-emerald-700 hover:text-emerald-800 truncate block hover:underline"
                    >
                      0966.211.618
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('0966211618', 'phone')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Sao chép Số điện thoại"
                >
                  {copied === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Facebook Admin */}
              <div className="flex items-center justify-between gap-2.5 p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Facebook
                    </span>
                    <a
                      href="https://www.facebook.com/lethanh9398"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-xs text-blue-700 hover:text-blue-800 truncate block hover:underline"
                    >
                      lethanh9398
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('https://www.facebook.com/lethanh9398', 'facebook')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Sao chép link Facebook"
                >
                  {copied === 'facebook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notes Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Thời gian phản hồi: <strong>Ưu tiên xử lý nhanh</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Hỗ trợ: Quên mật khẩu, sai sót dữ liệu phòng thi</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="font-mono text-slate-400">PTIT EduSync v2.5</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div>
            © {new Date().getFullYear()} <strong>PTIT EduSync</strong> — Cổng Thông Tin & Quản Lý Lịch Thi Trực Tuyến.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Học viện Công nghệ Bưu chính Viễn thông</span>
            <span>•</span>
            <a
              href="https://qldttx.pttc1.edu.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Cổng QLDTTX <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
