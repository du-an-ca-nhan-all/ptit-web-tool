'use client';

import React from 'react';
import {
  ExternalLink,
  X,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { SlinkGuideImage } from './types';

interface SlinkLightboxModalProps {
  images: SlinkGuideImage[];
  activeImageIndex: number;
  onSelectImage: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

export function SlinkLightboxModal({
  images,
  activeImageIndex,
  onSelectImage,
  onClose,
}: SlinkLightboxModalProps) {
  const currentImg = images[activeImageIndex] || images[0];

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Lightbox Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                Ảnh Hướng Dẫn Lấy Refresh Token OAuth PTIT S-Link (3 Bước)
              </h3>
              <p className="text-xs text-purple-200">
                Kết nối an toàn qua OAuth Refresh Token và tự động gia hạn định kỳ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lightbox Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 text-xs text-purple-950 flex items-start gap-2.5">
            <RefreshCw className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11.5px]">
              <strong>Cơ chế OAuth Refresh Token:</strong> Cổng PTIT S-Link chỉ hỗ trợ đăng nhập qua OAuth. Bạn chỉ cần lấy{' '}
              <code className="font-mono font-bold text-purple-800">refresh_token</code> một lần sau khi đăng nhập trên trình duyệt; hệ thống sẽ tự động xoay vòng để cấp mới cả{' '}
              <code className="font-mono">access_token</code> và <code className="font-mono">refresh_token</code> định kỳ mỗi 20 phút.
            </div>
          </div>

          {/* 4 Tabs selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 pb-3">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelectImage(idx)}
                className={`px-2.5 py-2 rounded-2xl text-[11.5px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  activeImageIndex === idx
                    ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                    activeImageIndex === idx ? 'bg-white text-purple-700' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {img.stepNum}
                </span>
                <span className="truncate">{img.shortTitle}</span>
              </button>
            ))}
          </div>

          {/* Active Image Viewer */}
          <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-800">{currentImg.title}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentImg.badgeColor}`}>
                {currentImg.badge}
              </span>
            </div>

            <div className="p-3 sm:p-4 flex items-center justify-center bg-slate-900/5 min-h-[260px] max-h-[55vh]">
              <img
                src={currentImg.src}
                alt={currentImg.title}
                className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
              />
            </div>

            <div className="px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-700 font-medium leading-relaxed">
              🔍 {currentImg.caption}
            </div>
          </div>

          {/* Step navigation buttons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={activeImageIndex === 0}
              onClick={() => onSelectImage((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ảnh trước</span>
            </button>

            <div className="flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectImage(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'bg-purple-600 w-6' : 'bg-slate-300 hover:bg-slate-400 w-2.5'
                  }`}
                  title={`Ảnh ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={activeImageIndex === images.length - 1}
              onClick={() => onSelectImage((prev) => Math.min(images.length - 1, prev + 1))}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ảnh tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lightbox Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <a
            href="https://slink.ptit.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mở Cổng PTIT S-Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
