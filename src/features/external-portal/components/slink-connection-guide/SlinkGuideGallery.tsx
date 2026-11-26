'use client';

import React from 'react';
import { Key, ZoomIn } from 'lucide-react';
import type { SlinkGuideImage } from './types';

interface SlinkGuideGalleryProps {
  images: SlinkGuideImage[];
  onOpenLightbox: (index?: number) => void;
}

export function SlinkGuideGallery({
  images,
  onOpenLightbox,
}: SlinkGuideGalleryProps) {
  return (
    <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-2.5">
      <div className="font-bold text-slate-800 text-xs flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-purple-600" />
          <span>Ảnh chụp hướng dẫn ({images.length} ảnh):</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenLightbox(0)}
          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold underline flex items-center gap-0.5 cursor-pointer"
        >
          <span>Phóng to</span>
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      {/* 4-Card Thumbnail Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        {images.map((img, idx) => (
          <div
            key={img.id}
            onClick={() => onOpenLightbox(idx)}
            className="group flex flex-col lg:flex-row rounded-xl overflow-hidden border border-slate-200/90 hover:border-purple-400 bg-white shadow-2xs cursor-pointer transition-all hover:shadow-xs"
            title={`Bấm vào để xem ảnh ${img.title} phóng to`}
          >
            <div className="h-20 lg:w-32 lg:h-20 bg-slate-100/90 flex items-center justify-center p-1 relative overflow-hidden shrink-0">
              <img
                src={img.src}
                alt={img.title}
                className="max-h-full max-w-full object-contain rounded transition-transform duration-200 group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-1 bg-purple-600 text-white rounded-full shadow">
                  <ZoomIn className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="p-2 bg-slate-50/70 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-center min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-800 block truncate">
                {img.shortTitle}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 hidden lg:block">
                {img.caption}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-500 italic text-center">
        (Bấm vào bất kỳ ảnh nào để xem phóng to chi tiết)
      </p>
    </div>
  );
}
