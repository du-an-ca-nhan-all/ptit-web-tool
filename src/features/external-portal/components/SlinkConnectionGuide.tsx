'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import type { SlinkConnectionGuideProps } from './slink-connection-guide/types';
import {
  SLINK_GUIDE_IMAGES,
  SLINK_OIDC_STORAGE_KEY,
} from './slink-connection-guide/constants';
import { SlinkLightboxModal } from './slink-connection-guide/SlinkLightboxModal';
import { SlinkGuideStepList } from './slink-connection-guide/SlinkGuideStepList';
import { SlinkGuideGallery } from './slink-connection-guide/SlinkGuideGallery';
import {
  SlinkBannerVariant,
  SlinkCompactVariant,
} from './slink-connection-guide/SlinkGuideVariants';

export type { SlinkConnectionGuideProps };

export function SlinkConnectionGuide({
  variant = 'card',
  defaultExpanded = true,
  title = 'Hướng Dẫn Kết Nối PTIT S-Link Qua OAuth Refresh Token',
  className = '',
}: SlinkConnectionGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyStorageKey = () => {
    navigator.clipboard.writeText(SLINK_OIDC_STORAGE_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const lightbox = isLightboxOpen ? (
    <SlinkLightboxModal
      images={SLINK_GUIDE_IMAGES}
      activeImageIndex={activeImageIndex}
      onSelectImage={setActiveImageIndex}
      onClose={() => setIsLightboxOpen(false)}
    />
  ) : null;

  // Banner variant
  if (variant === 'banner') {
    return (
      <>
        <SlinkBannerVariant
          className={className}
          onOpenLightbox={handleOpenLightbox}
        />
        {lightbox}
      </>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <>
        <SlinkCompactVariant
          className={className}
          imageCount={SLINK_GUIDE_IMAGES.length}
          onOpenLightbox={handleOpenLightbox}
        />
        {lightbox}
      </>
    );
  }

  // Default 'card' variant: Left-Right side-by-side with visual thumbnails
  return (
    <>
      <div
        className={`bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-slate-50 border border-purple-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-xs text-slate-700 shadow-xs flex flex-col gap-3.5 transition-all ${className}`}
      >
        {/* Header with Toggle */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h5 className="font-black text-purple-950 text-xs sm:text-sm tracking-tight flex items-center gap-2 flex-wrap">
                <span>{title}</span>
                <span className="text-[10px] bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded-full border border-purple-300 inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-purple-600" /> OAuth Auto-Refresh
                </span>
              </h5>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Lấy Refresh Token sau khi đăng nhập OAuth trên slink.ptit.edu.vn để tự động đồng bộ điểm số & thông báo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-100/80 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
            title={isExpanded ? 'Thu gọn hướng dẫn' : 'Mở rộng hướng dẫn'}
          >
            <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Info Notice Box */}
        <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-xl p-3 flex items-start gap-2.5 text-[11.5px] text-indigo-950">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Cơ chế xác thực OAuth:</strong> Cổng PTIT S-Link sử dụng đăng nhập OAuth. Bạn chỉ cần dán{' '}
            <strong className="font-mono text-purple-800">refresh_token</strong> một lần; hệ thống sẽ tự động gia hạn định kỳ cả Access Token lẫn Refresh Token mới mà không cần đăng nhập lại.
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col lg:flex-row gap-5 pt-1 animate-in fade-in duration-200">
            <SlinkGuideStepList
              copiedKey={copiedKey}
              onCopyStorageKey={handleCopyStorageKey}
              onOpenLightbox={handleOpenLightbox}
            />
            <SlinkGuideGallery
              images={SLINK_GUIDE_IMAGES}
              onOpenLightbox={handleOpenLightbox}
            />
          </div>
        )}
      </div>

      {lightbox}
    </>
  );
}
