'use client';

import React from 'react';
import {
  ExternalLink,
  ZoomIn,
  Smartphone,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';
import { SLINK_OIDC_STORAGE_KEY } from './constants';

interface SlinkGuideStepListProps {
  copiedKey: boolean;
  onCopyStorageKey: () => void;
  onOpenLightbox: (index?: number) => void;
}

export function SlinkGuideStepList({
  copiedKey,
  onCopyStorageKey,
  onOpenLightbox,
}: SlinkGuideStepListProps) {
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
            onClick={() => onOpenLightbox(0)}
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
                onClick={onCopyStorageKey}
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
                onClick={() => onOpenLightbox(1)}
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
              onClick={() => onOpenLightbox(2)}
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
            onClick={() => onOpenLightbox(3)}
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

  return (
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
          onClick={() => onOpenLightbox(0)}
          className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <ZoomIn className="w-3 h-3 text-purple-600" />
          <span>Xem Ảnh Minh Họa Phóng To</span>
        </button>
      </div>
    </div>
  );
}
