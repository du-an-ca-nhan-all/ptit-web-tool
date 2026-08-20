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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              {/* Telegram Admin */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-200 rounded-2xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Telegram Admin
                    </span>
                    <a
                      href="https://t.me/thanhlv_admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-xs text-sky-700 hover:text-sky-800 truncate block hover:underline"
                    >
                      @thanhlv_admin
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('@thanhlv_admin', 'telegram')}
                  className="p-1.5 text-slate-400 hover:text-sky-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Sao chép Telegram handle"
                >
                  {copied === 'telegram' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Email Admin */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-200 rounded-2xl transition-all group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Email Quản Trị
                    </span>
                    <a
                      href="mailto:admin@ptit.edu.vn"
                      className="font-mono font-bold text-xs text-slate-800 hover:text-indigo-600 truncate block hover:underline"
                    >
                      admin@ptit.edu.vn
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('admin@ptit.edu.vn', 'email')}
                  className="p-1.5 text-slate-400 hover:text-amber-600 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Sao chép Email"
                >
                  {copied === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
