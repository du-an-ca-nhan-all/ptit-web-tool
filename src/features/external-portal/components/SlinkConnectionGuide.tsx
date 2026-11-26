'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Key,
  ShieldCheck,
  ZoomIn,
  X,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface SlinkConnectionGuideProps {
  /**
   * Chế độ hiển thị:
   * - 'card': Khung hướng dẫn đầy đủ nằm trong card cấu hình
   * - 'compact': Khung tóm tắt nhỏ gọn có nút xem chi tiết
   * - 'banner': Dải thông báo với nút mở modal ảnh hướng dẫn
   */
  variant?: 'card' | 'compact' | 'banner';
  /**
   * Trạng thái mở mặc định (đối với chế độ có thể thu gọn)
   */
  defaultExpanded?: boolean;
  /**
   * Tiêu đề tùy chỉnh
   */
  title?: string;
  /**
   * Lớp CSS bổ sung
   */
  className?: string;
  /**
   * Username / Email mặc định (giữ tương thích prop)
   */
  defaultUsername?: string;
  defaultEmail?: string;
}

const SLINK_OIDC_STORAGE_KEY = 'oidc.user:https://gwdu.ptit.edu.vn/sso/realms/ptit:ptit-connect';

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

  const images = [
    {
      id: 'step1',
      stepNum: '1',
      title: 'Bước 1: Đăng nhập OAuth trên slink.ptit.edu.vn',
      shortTitle: '1. Đăng nhập OAuth',
      badge: 'Cổng S-Link',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      src: '/assets/slink_oauth_step1_login.jpg',
      caption: 'Mở slink.ptit.edu.vn trên trình duyệt và đăng nhập qua cổng OAuth / Microsoft PTIT như bình thường.',
    },
    {
      id: 'step2a',
      stepNum: '2A',
      title: 'Bước 2 (Cách 1 - Nhanh nhất): Application → Session Storage',
      shortTitle: '2A. Session Storage',
      badge: 'Khuyên dùng',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      src: '/assets/slink_oauth_step2_session_storage.jpg',
      caption: `Nhấn F12 → tab Application → Session Storage → https://slink.ptit.edu.vn → chọn khóa "${SLINK_OIDC_STORAGE_KEY}" và copy giá trị "refresh_token".`,
    },
    {
      id: 'step2b',
      stepNum: '2B',
      title: 'Bước 2 (Cách 2): Network → POST token → Response',
      shortTitle: '2B. Tab Network',
      badge: 'Chrome DevTools',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      src: '/assets/slink_oauth_step2_devtools.jpg',
      caption: 'Nhấn F12 → tab Network → lọc "token" → chọn request POST token → tab Response và copy giá trị "refresh_token" (không gồm dấu ngoặc kép).',
    },
    {
      id: 'step3',
      stepNum: '3',
      title: 'Bước 3: Dán Refresh Token → Kiểm Tra & Lưu Kết Nối',
      shortTitle: '3. Dán & Lưu Token',
      badge: 'PTIT Web Tool',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      src: '/assets/slink_oauth_step3_connect.jpg',
      caption: 'Dán refresh_token vào ô bên dưới, bấm "Kiểm Tra Kết Nối" rồi "Lưu & Kết Nối". Hệ thống sẽ tự động gia hạn định kỳ mỗi 20 phút.',
    },
  ];

  const handleOpenLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const guideSteps = [
    {
      step: 1,
      title: 'Đăng nhập Cổng PTIT S-Link bằng OAuth trên trình duyệt',
      desc: (
        <>
          Mở{' '}
          <a
            href="https://slink.ptit.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 hover:text-purple-900 font-bold underline inline-flex items-center gap-0.5"
          >
            slink.ptit.edu.vn <ExternalLink className="w-3 h-3" />
          </a>{' '}
          trên trình duyệt máy tính (Chrome/Edge) và đăng nhập qua cổng <strong>OAuth / Microsoft PTIT</strong>.{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(0)}
            className="text-purple-700 hover:text-purple-900 font-bold underline inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            <span>[Xem ảnh Bước 1]</span>
          </button>
        </>
      ),
    },
    {
      step: 2,
      title: 'Mở DevTools (F12) để sao chép chuỗi refresh_token (2 cách)',
      desc: (
        <div className="space-y-1.5 mt-1">
          <div>
            <span className="inline-block bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">
              Cách 1 (Nhanh nhất)
            </span>
            Nhấn <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10.5px] border border-slate-200">F12</code> → tab{' '}
            <strong>Application</strong> → <strong>Session Storage</strong> → <code className="font-mono text-[10.5px]">https://slink.ptit.edu.vn</code> → tìm khóa:
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <code className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded font-mono text-[10.5px] border border-purple-200 break-all">
                {SLINK_OIDC_STORAGE_KEY}
              </code>
              <button
                type="button"
                onClick={handleCopyStorageKey}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer border border-slate-200"
                title="Sao chép tên khóa Session Storage"
              >
                {copiedKey ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedKey ? 'Đã copy' : 'Copy tên khóa'}</span>
              </button>
            </div>
            <div className="mt-0.5">
              Sau đó copy giá trị <strong className="text-purple-700 font-mono">refresh_token</strong> bên trong JSON.{' '}
              <button
                type="button"
                onClick={() => handleOpenLightbox(1)}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>[Xem ảnh Cách 1]</span>
              </button>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <span className="inline-block bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">
              Cách 2
            </span>
            Vào tab <strong>Network</strong> → lọc{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[10.5px] border border-slate-200">
              token
            </code>{' '}
            → chọn <code className="font-mono text-[10.5px] font-bold">POST token</code> → tab <strong>Response</strong> → copy giá trị{' '}
            <strong className="text-purple-700 font-mono">refresh_token</strong>.{' '}
            <button
              type="button"
              onClick={() => handleOpenLightbox(2)}
              className="text-sky-600 hover:text-sky-800 font-bold underline inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              <span>[Xem ảnh Cách 2]</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      step: 3,
      title: 'Dán Refresh Token vào ô bên dưới → Kiểm Tra & Lưu',
      desc: (
        <>
          Dán chuỗi <strong className="text-purple-700 font-mono">refresh_token</strong> vào form bên dưới, nhấn{' '}
          <strong>"Kiểm Tra Kết Nối"</strong> (hệ thống tự nhận diện Email sinh viên PTIT), sau đó bấm{' '}
          <strong>"Lưu & Kết Nối"</strong>.{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(3)}
            className="text-emerald-700 hover:text-emerald-900 font-bold underline inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
          >
            <ImageIcon className="w-3 h-3" />
            <span>[Xem ảnh Bước 3]</span>
          </button>
        </>
      ),
    },
    {
      step: 4,
      title: 'Tự động gia hạn Token & Refresh Token định kỳ',
      desc: (
        <>
          Sau khi lưu thành công, hệ thống sẽ{' '}
          <strong>tự động dùng refresh_token để tạo mới cả Access Token và Refresh Token mới định kỳ (mỗi 20 phút)</strong>{' '}
          giúp duy trì phiên kết nối S-Link liên tục không bị gián đoạn.
        </>
      ),
    },
  ];

  const currentImg = images[activeImageIndex] || images[0];

  // Lightbox Modal Component
  const renderLightboxModal = () => {
    return (
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsLightboxOpen(false);
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
              onClick={() => setIsLightboxOpen(false)}
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
                  onClick={() => setActiveImageIndex(idx)}
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
                onClick={() => setActiveImageIndex((prev) => Math.max(0, prev - 1))}
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
                    onClick={() => setActiveImageIndex(idx)}
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
                onClick={() => setActiveImageIndex((prev) => Math.min(images.length - 1, prev + 1))}
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
              onClick={() => setIsLightboxOpen(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Banner variant
  if (variant === 'banner') {
    return (
      <>
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
              onClick={() => handleOpenLightbox(0)}
              className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Xem Ảnh Hướng Dẫn (3 bước)</span>
            </button>
          </div>
        </div>

        {isLightboxOpen && renderLightboxModal()}
      </>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <>
        <div className={`bg-purple-50/70 border border-purple-200 rounded-2xl p-3 text-xs ${className}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Xác thực qua OAuth Refresh Token (Tự động gia hạn mỗi 20 phút)</span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenLightbox(0)}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Xem ảnh hướng dẫn ({images.length} ảnh)</span>
            </button>
          </div>
        </div>

        {isLightboxOpen && renderLightboxModal()}
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
            {/* Left Column: Step List */}
            <div className="flex-1 space-y-2.5">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Các bước lấy Refresh Token PTIT S-Link:</span>
              </div>

              <div className="space-y-2">
                {guideSteps.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-2.5 bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-purple-200 transition"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div className="flex-1 text-[11.5px] leading-relaxed">
                      <div className="font-bold text-slate-800">{s.title}</div>
                      <div className="text-slate-600 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href="https://slink.ptit.edu.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mở Cổng PTIT S-Link</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenLightbox(0)}
                  className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ZoomIn className="w-3 h-3 text-purple-600" />
                  <span>Xem Ảnh Minh Họa Phóng To</span>
                </button>
              </div>
            </div>

            {/* Right Column: 3-Cards Visual Gallery */}
            <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-2.5">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ảnh chụp hướng dẫn ({images.length} ảnh):</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenLightbox(0)}
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
                    onClick={() => handleOpenLightbox(idx)}
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
          </div>
        )}
      </div>

      {isLightboxOpen && renderLightboxModal()}
    </>
  );
}
