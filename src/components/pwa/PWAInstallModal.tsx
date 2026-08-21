'use client';

import React from 'react';
import { X, Share, PlusSquare, Download, CheckCircle2, Smartphone, Monitor } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNative?: () => void;
  isInstallable: boolean;
  isIOS: boolean;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  onInstallNative,
  isInstallable,
  isIOS,
}: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-[#1E293B] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-blue-500/20 flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="PTIT EduSync Icon" className="w-full h-full rounded-[14px] object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Cài đặt PTIT EduSync</h3>
            <p className="text-xs text-slate-400">Ứng dụng tiện ích sinh viên & học vụ</p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 mb-6 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Mở nhanh ngay từ màn hình chính không cần nhập URL</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Tra cứu lịch thi và dữ liệu ngay cả khi mất mạng</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Trải nghiệm toàn màn hình mượt mà như Native App</span>
          </div>
        </div>

        {/* Installation Instructions */}
        {isIOS ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Hướng dẫn cài đặt trên iPhone / iPad (Safari)
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                <div>
                  Nhấn nút <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline text-blue-400" /> Chia sẻ (Share)</strong> ở thanh dưới trình duyệt Safari.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                <div>
                  Cuộn xuống và chọn <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-blue-400" /> Thêm vào MH chính (Add to Home Screen)</strong>.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                <div>
                  Nhấn <strong className="text-white">Thêm (Add)</strong> ở góc trên bên phải để hoàn tất.
                </div>
              </div>
            </div>
          </div>
        ) : isInstallable && onInstallNative ? (
          <div className="space-y-3">
            <button
              onClick={() => {
                onInstallNative();
                onClose();
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Cài đặt ứng dụng ngay
            </button>
            <p className="text-center text-[11px] text-slate-400">
              Trình duyệt sẽ hiển thị hộp thoại xác nhận cài đặt.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Monitor className="w-4 h-4" /> Hướng dẫn trên Chrome / Edge
            </div>
            <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <p>
                1. Nhấn vào biểu tượng <strong className="text-white">Cài đặt (Install)</strong> trên thanh địa chỉ của trình duyệt.
              </p>
              <p>
                2. Hoặc nhấn menu <strong>⋮ (3 chấm)</strong> &gt; chọn <strong>&quot;Cài đặt PTIT EduSync...&quot;</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
