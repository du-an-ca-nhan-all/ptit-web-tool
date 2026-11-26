'use client';

import React from 'react';
import { Download, Phone, Send, ShieldCheck } from 'lucide-react';

interface SidebarFooterProps {
  isInstalled: boolean;
  openInstallModal: () => void;
}

export function SidebarFooter({ isInstalled, openInstallModal }: SidebarFooterProps) {
  return (
    <>
      {/* PWA Install Button if not installed */}
      {!isInstalled && (
        <div className="px-3 pb-2">
          <button
            onClick={openInstallModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cài Đặt App (PWA)</span>
          </button>
        </div>
      )}

      {/* SECTION BOTTOM: ADMIN CONTACT & SUPPORT */}
      <div className="p-3 mx-3 mb-3 mt-auto rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col gap-2 shadow-inner shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Hỗ Trợ & Admin</span>
          </div>
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-snug">
          Cần cấp lại mật khẩu hoặc hỗ trợ kích hoạt tài khoản?
        </p>

        <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800 font-mono text-[10px]">
          <a
            href="https://t.me/lethanh9398"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors py-0.5"
          >
            <Send className="w-2.5 h-2.5 text-sky-400 shrink-0" />
            <span className="truncate">Telegram: @lethanh9398</span>
          </a>
          <a
            href="tel:0966211618"
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors py-0.5"
          >
            <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            <span className="truncate">SĐT: 0966.211.618</span>
          </a>
          <a
            href="https://www.facebook.com/lethanh9398"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors py-0.5"
          >
            <svg className="w-2.5 h-2.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="truncate">FB: lethanh9398</span>
          </a>
        </div>
      </div>
    </>
  );
}
