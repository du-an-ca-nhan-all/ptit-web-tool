'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Mail,
  Key,
  ShieldAlert,
  ZoomIn,
  X,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Layers,
  Image as ImageIcon,
  KeyRound,
} from 'lucide-react';
import SlinkForgotPasswordModal from './SlinkForgotPasswordModal';

interface SlinkConnectionGuideProps {
  /**
   * Chế độ hiển thị:
   * - 'card': Khung hướng dẫn đầy đủ nằm trong card cấu hình
   * - 'compact': Khung tóm tắt nhỏ gọn có nút xem chi tiết
   * - 'banner': Dải thông báo với nút mở modal
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
   * Username / Email mặc định
   */
  defaultUsername?: string;
  defaultEmail?: string;
}

export function SlinkConnectionGuide({
  variant = 'card',
  defaultExpanded = true,
  title = 'Hướng Dẫn Kết Nối Cổng PTIT S-Link (slink.ptit.edu.vn)',
  className = '',
  defaultUsername = '',
  defaultEmail = '',
}: SlinkConnectionGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const images = [
    {
      id: 'step1',
      stepNum: 1,
      title: 'Bước 1: Ấn "Forgot password?" trên S-Link',
      shortTitle: '1. Ấn "Forgot password?"',
      badge: 'Cổng S-Link',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      src: '/assets/an_quen_mat_khau.png',
      caption: 'Nhấn vào dòng chữ đỏ "Forgot password?" ở góc dưới ô Password trên màn hình đăng nhập',
    },
    {
      id: 'step2',
      stepNum: 2,
      title: 'Bước 2: Điền Email sinh viên PTIT & Submit',
      shortTitle: '2. Điền Email & Submit',
      badge: 'Cổng S-Link',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      src: '/assets/anh_dien_email_quen_mat_khau.png',
      caption: 'Nhập địa chỉ Email sinh viên (...@stu.ptit.edu.vn) rồi bấm nút đỏ "Submit"',
    },
    {
      id: 'step3',
      stepNum: 3,
      title: 'Bước 3: Nhận Email từ PTIT Slink SSO',
      shortTitle: '3. Nhận Email & Bấm Link',
      badge: 'Microsoft Outlook',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      src: '/assets/email_quen_mat_khau.png',
      caption: 'Mở thư từ "PTIT Slink SSO <slink@ptit.edu.vn>" và nhấp vào "Link to reset credentials" (hiệu lực 5 phút)',
    },
    {
      id: 'step4',
      stepNum: 4,
      title: 'Bước 4: Tạo Mật khẩu mới & Xác nhận',
      shortTitle: '4. Tạo Mật khẩu mới',
      badge: 'Cổng S-Link',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      src: '/assets/anh_dien_mat_khau_moi.png',
      caption: 'Nhập mật khẩu mới vào "New password" và "Confirm password", sau đó ấn "Submit"',
    },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Mở trang đăng nhập Cổng S-Link',
      desc: (
        <>
          Truy cập Cổng thông tin sinh viên{' '}
          <a
            href="https://slink.ptit.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-0.5"
          >
            slink.ptit.edu.vn <ExternalLink className="w-3 h-3" />
          </a>
        </>
      ),
    },
    {
      step: 2,
      title: 'Nhấn vào nút "Forgot password?" (Quên mật khẩu)',
      desc: (
        <>
          Trên màn hình đăng nhập S-Link, nhấn vào dòng chữ đỏ{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(0)}
            className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 hover:bg-rose-100 inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Forgot password?</span>
            <ImageIcon className="w-3 h-3" />
          </button>{' '}
          ở ngay phía dưới ô nhập Password.
        </>
      ),
    },
    {
      step: 3,
      title: 'Nhập Email sinh viên PTIT và bấm Submit',
      desc: (
        <>
          Điền địa chỉ Email sinh viên do nhà trường cấp (ví dụ:{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px] border border-slate-200">
            ...ptit.edu.vn
          </code>
          ) vào ô <em>Username or email</em> rồi bấm nút đỏ{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(1)}
            className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Submit</span>
            <ImageIcon className="w-3 h-3" />
          </button>
          .
        </>
      ),
    },
    {
      step: 4,
      title: 'Vào Email trên Microsoft để nhận link',
      desc: (
        <>
          Đăng nhập hòm thư{' '}
          <a
            href="https://outlook.office.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-800 font-bold underline inline-flex items-center gap-0.5"
          >
            PTIT Microsoft Outlook <ExternalLink className="w-3 h-3" />
          </a>
          . Kiểm tra thư từ người gửi{' '}
          <strong className="text-slate-800">PTIT Slink SSO</strong> (
          <span className="font-mono text-purple-700 text-[11px]">slink@ptit.edu.vn</span>) với tiêu đề{' '}
          <em>"Reset password"</em>.{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(2)}
            className="text-sky-600 hover:text-sky-800 font-bold underline inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
          >
            [Xem ảnh email]
          </button>
        </>
      ),
    },
    {
      step: 5,
      title: 'Click vào link trong Email và tạo mật khẩu mới',
      desc: (
        <>
          Nhấp vào liên kết{' '}
          <strong className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
            Link to reset credentials
          </strong>{' '}
          trong email để mở form tạo mật khẩu mới.{' '}
          <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> (Link có hiệu lực trong 5 phút)
          </span>
          . Nhập mật khẩu mới tại ô <em>New password</em> & <em>Confirm password</em> rồi bấm{' '}
          <button
            type="button"
            onClick={() => handleOpenLightbox(3)}
            className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Submit</span>
            <ImageIcon className="w-3 h-3" />
          </button>
          .
        </>
      ),
    },
    {
      step: 6,
      title: 'Điền thông tin và Lưu & Kết Nối trên PTIT Web Tool',
      desc: (
        <>
          Quay lại form bên dưới, nhập <strong>Tên đăng nhập (Email / MSV)</strong> và{' '}
          <strong>Mật khẩu mới</strong> vừa tạo, sau đó ấn <strong>"Kiểm Tra Kết Nối"</strong> rồi{' '}
          <strong>"Lưu & Kết Nối"</strong>.
        </>
      ),
    },
  ];

  const handleOpenLightbox = (index = 0) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

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
                  Hướng Dẫn Lấy Mật Khẩu Cổng PTIT S-Link (4 Bước)
                </h3>
                <p className="text-xs text-purple-200">
                  Tạo mật khẩu tài khoản trực tiếp qua chức năng "Forgot password?" & Email Microsoft
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
            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11.5px]">
                <strong>Lý do cần tạo mật khẩu:</strong> PTIT Web Tool kết nối trực tiếp với giao thức xác thực Keycloak của PTIT S-Link để tự động lấy điểm và nhận thông báo định kỳ. Hệ thống <strong>không hỗ trợ đăng nhập qua nút SSO PTIT Microsoft</strong> nên bạn cần có mật khẩu trực tiếp.
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

            {/* Active Image Container - Clean without overlays */}
            <div className="rounded-2xl border-2 border-purple-200 shadow-xs bg-slate-50 flex flex-col items-center justify-center p-3 gap-2">
              <div className="w-full flex items-center justify-between px-1 gap-2 flex-wrap">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${currentImg.badgeColor}`}>
                  {currentImg.badge}
                </span>
                <span className="text-xs font-bold text-slate-800">{currentImg.title}</span>
              </div>

              <div className="w-full flex items-center justify-center bg-white rounded-xl p-2 border border-slate-200 min-h-[260px] max-h-[420px] overflow-hidden">
                <img
                  src={currentImg.src}
                  alt={currentImg.title}
                  className="max-h-[400px] w-auto max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>

              {/* Caption clearly beneath the image */}
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950 font-bold text-center w-full">
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
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'bg-purple-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
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
            <div className="flex items-center gap-2">
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

              <a
                href="https://outlook.office.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Mở Email Microsoft (Outlook)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

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
                <span>Lưu ý kết nối PTIT S-Link</span>
                <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  Direct Auth
                </span>
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Hệ thống chỉ hỗ trợ kết nối bằng <strong>Username/Email & Mật khẩu trực tiếp</strong> (không hỗ trợ đăng nhập qua PTIT Microsoft SSO). Vui lòng dùng tính năng "Forgot password?" trên S-Link để tạo mật khẩu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quên Mật Khẩu (1-Click)</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenLightbox(0)}
              className="px-3.5 py-2 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Xem Hướng Dẫn</span>
            </button>
          </div>
        </div>

        {/* Modal Lightbox */}
        {isLightboxOpen && renderLightboxModal()}

        {/* Modal Forgot Password */}
        <SlinkForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          defaultUsername={defaultUsername}
          defaultEmail={defaultEmail}
        />
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
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Chỉ hỗ trợ đăng nhập bằng Username & Mật khẩu trực tiếp</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-purple-700 hover:text-purple-900 font-black underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-purple-600" />
                <span>Quên mật khẩu? (1-Click Reset)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenLightbox(0)}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <span>Xem hướng dẫn (4 ảnh)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Lightbox */}
        {isLightboxOpen && renderLightboxModal()}

        {/* Modal Forgot Password */}
        <SlinkForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          defaultUsername={defaultUsername}
          defaultEmail={defaultEmail}
        />
      </>
    );
  }

  // Default 'card' variant: Left-Right side-by-side with cleanly formatted thumbnails
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
                <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Quan Trọng
                </span>
              </h5>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Yêu cầu tạo mật khẩu trực tiếp trên S-Link để hệ thống tự động đồng bộ điểm số & thông báo.
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

        {/* Quick 1-Click Auto Reset Box */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-3.5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-xs">Chưa có hoặc Quên Mật Khẩu S-Link?</div>
              <div className="text-[11px] text-purple-100">
                Gửi yêu cầu reset tự động đến Keycloak SSO PTIT để nhận link đổi mật khẩu qua Outlook
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-purple-50 text-purple-800 text-xs font-black rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>Tự Động Reset Mật Khẩu (1-Click)</span>
          </button>
        </div>

        {/* Warning Notice Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-[11.5px] text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Lưu ý xác thực:</strong> Hệ thống PTIT Web Tool sử dụng cơ chế Direct Authentication với máy chủ PTIT S-Link để quét thông báo và trích xuất bảng điểm tự động. Hệ thống <strong>chỉ hỗ trợ kết nối bằng Username/Email và Mật khẩu trực tiếp</strong>, không hỗ trợ đăng nhập qua nút SSO <em>"PTIT Microsoft"</em> hay <em>"PTIT Google"</em>.
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col lg:flex-row gap-5 pt-1 animate-in fade-in duration-200">
            {/* Left Column: Full 6-Step List */}
            <div className="flex-1 space-y-2.5">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Các bước tạo mật khẩu S-Link trực tiếp:</span>
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
                  <span>1. Mở Cổng PTIT S-Link</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <a
                  href="https://outlook.office.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Mail className="w-3 h-3" />
                  <span>2. Mở Email Microsoft (Outlook)</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Right Column: 4-Cards Visual Gallery (NO text overlaying the image) */}
            <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-2.5">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ảnh minh họa (4 bước):</span>
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

              {/* 2x2 Grid of Thumbnails with labels BELOW each image */}
              <div className="grid grid-cols-2 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => handleOpenLightbox(idx)}
                    className="group flex flex-col rounded-xl overflow-hidden border border-slate-200/90 hover:border-purple-400 bg-white shadow-2xs cursor-pointer transition-all hover:shadow-xs transform active:scale-98"
                    title={`Bấm vào để xem ảnh ${img.title} phóng to`}
                  >
                    {/* Clean Image Area with Object Contain */}
                    <div className="h-24 sm:h-28 bg-slate-100/90 flex items-center justify-center p-1.5 relative overflow-hidden">
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

                    {/* Step Title Box - Completely BELOW the image */}
                    <div className="p-1.5 bg-slate-50 border-t border-slate-100 text-center">
                      <span className="text-[10px] font-bold text-slate-700 block truncate">
                        {img.shortTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-500 italic text-center">
                (Bấm vào bất kỳ ảnh nào để xem toàn màn hình)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox */}
      {isLightboxOpen && renderLightboxModal()}

      {/* Modal Forgot Password */}
      <SlinkForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        defaultUsername={defaultUsername}
        defaultEmail={defaultEmail}
      />
    </>
  );
}
