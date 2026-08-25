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
} from 'lucide-react';

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
}

export function SlinkConnectionGuide({
  variant = 'card',
  defaultExpanded = true,
  title = 'Hướng Dẫn Kết Nối Cổng PTIT S-Link (slink.ptit.edu.vn)',
  className = '',
}: SlinkConnectionGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
          <strong className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            Forgot password?
          </strong>{' '}
          ở ngay phía dưới ô nhập Password <em>(xem ảnh minh họa)</em>.
        </>
      ),
    },
    {
      step: 3,
      title: 'Nhập Email sinh viên PTIT',
      desc: (
        <>
          Điền địa chỉ Email sinh viên do nhà trường cấp (ví dụ:{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">
            ...ptit.edu.vn
          </code>
          ) hoặc Mã sinh viên rồi bấm gửi yêu cầu lấy lại mật khẩu.
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
          </a>{' '}
          của bạn để mở thư gửi từ hệ thống S-Link.
        </>
      ),
    },
    {
      step: 5,
      title: 'Click vào link trong Email để tạo mật khẩu mới',
      desc: (
        <>
          Bấm vào liên kết xác nhận trong email để tạo <strong>Mật khẩu mới</strong> cho tài khoản S-Link trực tiếp.
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

  // Modal Lightbox Component
  const renderLightboxModal = () => {
    return (
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsLightboxOpen(false);
        }}
      >
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Lightbox Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Hướng Dẫn Lấy Mật Khẩu Cổng PTIT S-Link
                </h3>
                <p className="text-xs text-purple-200">
                  Tạo mật khẩu tài khoản trực tiếp qua chức năng "Forgot password?"
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
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11.5px]">
                <strong>Lý do cần tạo mật khẩu:</strong> PTIT Web Tool kết nối trực tiếp với giao thức xác thực Keycloak của PTIT S-Link để tự động lấy điểm và nhận thông báo định kỳ. Hệ thống <strong>không hỗ trợ đăng nhập qua nút SSO PTIT Microsoft</strong> nên bạn cần có mật khẩu trực tiếp.
              </div>
            </div>

            {/* High-res Image with Caption */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-purple-300 shadow-md bg-slate-100 flex items-center justify-center p-2">
              <img
                src="/assets/an_quen_mat_khau.png"
                alt="Minh họa ấn quên mật khẩu trên Cổng S-Link"
                className="max-h-[380px] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Quick Steps */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Quy trình 5 bước đơn giản:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11.5px] leading-relaxed">
                <li>
                  Mở trang đăng nhập{' '}
                  <a
                    href="https://slink.ptit.edu.vn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-600 underline"
                  >
                    slink.ptit.edu.vn
                  </a>
                  .
                </li>
                <li>
                  Nhấn vào nút <strong className="text-rose-600 font-bold">"Forgot password?"</strong> ngay dưới ô nhập mật khẩu.
                </li>
                <li>
                  Nhập địa chỉ Email sinh viên PTIT (ví dụ:{' '}
                  <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">...ptit.edu.vn</code>) rồi nhấn Gửi.
                </li>
                <li>
                  Đăng nhập vào{' '}
                  <a
                    href="https://outlook.office.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-600 underline"
                  >
                    hòm thư Microsoft Outlook của trường
                  </a>{' '}
                  để nhận email khôi phục từ PTIT S-Link.
                </li>
                <li>
                  Bấm vào link trong email để đặt mật khẩu mới, sau đó dùng mật khẩu này kết nối vào PTIT Web Tool.
                </li>
              </ol>
            </div>
          </div>

          {/* Lightbox Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href="https://slink.ptit.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mở Cổng PTIT S-Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://outlook.office.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Mở Email PTIT Microsoft</span>
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

          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Xem Hướng Dẫn Chi Tiết</span>
          </button>
        </div>

        {/* Modal Lightbox */}
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
              <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Chỉ hỗ trợ đăng nhập bằng Username & Mật khẩu trực tiếp</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>Xem hướng dẫn lấy mật khẩu</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Modal Lightbox */}
        {isLightboxOpen && renderLightboxModal()}
      </>
    );
  }

  // Default 'card' variant
  return (
    <>
      <div
        className={`bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-slate-50 border border-purple-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-xs text-slate-700 shadow-xs flex flex-col gap-3.5 transition-all ${className}`}
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

        {/* Warning Notice Box */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-[11.5px] text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Lưu ý xác thực:</strong> Hệ thống PTIT Web Tool sử dụng cơ chế Direct Authentication với máy chủ PTIT S-Link để quét thông báo và trích xuất bảng điểm tự động. Hệ thống <strong>chỉ hỗ trợ kết nối bằng Username/Email và Mật khẩu trực tiếp</strong>, không hỗ trợ đăng nhập qua nút SSO <em>"PTIT Microsoft"</em> hay <em>"PTIT Google"</em>.
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col lg:flex-row gap-4 pt-1 animate-in fade-in duration-200">
            {/* Step list */}
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

            {/* Visual preview card */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Ảnh minh họa nút Quên Mật Khẩu:</span>
              </div>

              <div
                onClick={() => setIsLightboxOpen(true)}
                className="group relative rounded-2xl overflow-hidden border-2 border-purple-200 hover:border-purple-400 bg-slate-900 cursor-pointer shadow-sm transition-all transform active:scale-98"
                title="Bấm vào để xem ảnh phóng to chi tiết"
              >
                <img
                  src="/assets/an_quen_mat_khau.png"
                  alt="Hướng dẫn ấn Forgot password trên PTIT S-Link"
                  className="w-full h-auto object-cover object-center group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2 text-center">
                  <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                  <span className="text-[11px] font-bold bg-purple-600/90 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Phóng to ảnh
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg text-center truncate">
                  🔍 Nhấn vào "Forgot password?"
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center">
                (Bấm vào ảnh trên để xem phóng to rõ nét)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox */}
      {isLightboxOpen && renderLightboxModal()}
    </>
  );
}
