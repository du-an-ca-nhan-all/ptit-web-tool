'use client';

import React from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';

interface SlinkBannerVariantProps {
  className: string;
  onOpenLightbox: (index?: number) => void;
}

export function SlinkBannerVariant({
  className,
  onOpenLightbox,
}: SlinkBannerVariantProps) {
  return (
    <div
      className={`bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200/80 rounded-2xl p-3.5 sm:p-4 text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0 mt-0.5">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-black text-purple-900 flex items-center gap-1.5">
            <span>Kết nối PTIT S-Link bằng OAuth Refresh Token</span>
            <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
              OAuth Auto-Refresh
            </span>
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            PTIT S-Link xác thực qua OAuth. Dán <strong>Refresh Token</strong> một lần để hệ thống tự động gia hạn định kỳ cả Access Token lẫn Refresh Token.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>Xem Ảnh Hướng Dẫn (3 bước)</span>
        </button>
      </div>
    </div>
  );
}

interface SlinkCompactVariantProps {
  className: string;
  imageCount: number;
  onOpenLightbox: (index?: number) => void;
}

export function SlinkCompactVariant({
  className,
  imageCount,
  onOpenLightbox,
}: SlinkCompactVariantProps) {
  return (
    <div className={`bg-purple-50/70 border border-purple-200 rounded-2xl p-3 text-xs ${className}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-purple-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Xác thực qua OAuth Refresh Token (Tự động gia hạn mỗi 20 phút)</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 text-[11px] cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Xem ảnh hướng dẫn ({imageCount} ảnh)</span>
        </button>
      </div>
    </div>
  );
}
