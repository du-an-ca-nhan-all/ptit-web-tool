'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WifiOff, RefreshCw, Download, X, Sparkles } from 'lucide-react';
import { usePWA, PWAState } from '../../hooks/usePWA';
import PWAInstallModal from './PWAInstallModal';

interface PWAContextType extends PWAState {
  openInstallModal: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export const usePWAContext = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
};

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [showOnlineToast, setShowOnlineToast] = useState<boolean>(false);
  const [prevOnline, setPrevOnline] = useState<boolean>(true);

  // Detect transition from offline -> online to show restored toast
  useEffect(() => {
    if (!prevOnline && pwa.isOnline) {
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 4000);
      return () => clearTimeout(timer);
    }
    setPrevOnline(pwa.isOnline);
  }, [pwa.isOnline, prevOnline]);

  // Show install banner once per session if not installed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bannerDismissed = sessionStorage.getItem('ptit_pwa_banner_dismissed');
    if (!pwa.isInstalled && (pwa.isInstallable || pwa.isIOS) && !bannerDismissed) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pwa.isInstalled, pwa.isInstallable, pwa.isIOS]);

  const handleDismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('ptit_pwa_banner_dismissed', 'true');
  };

  const openInstallModal = () => {
    if (pwa.isInstallable) {
      pwa.installPWA();
    } else {
      pwa.setShowInstallGuide(true);
    }
  };

  return (
    <PWAContext.Provider value={{ ...pwa, openInstallModal }}>
      {children}

      {/* 1. Offline Mode Banner */}
      {!pwa.isOnline && (
        <aside
          aria-label="Thông báo trạng thái ngoại tuyến"
          className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white px-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2 text-xs font-medium shadow-md flex items-center justify-between"
        >
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span className="truncate">
              Bạn đang ngoại tuyến. Dữ liệu học vụ đã lưu trong bộ nhớ đệm vẫn có thể tra cứu bình thường.
            </span>
          </div>
        </aside>
      )}

      {/* 2. Online Restored Toast */}
      {showOnlineToast && (
        <aside
          aria-label="Thông báo khôi phục kết nối"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
          <span>Đã khôi phục kết nối Internet!</span>
        </aside>
      )}

      {/* 3. New Version / Update Available Banner */}
      {pwa.isUpdateAvailable && (
        <aside
          aria-label="Thông báo cập nhật phiên bản"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-5 right-5 md:left-auto md:right-5 md:max-w-md z-50 bg-[#1E293B] border border-blue-500/40 text-slate-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-xs text-white">Đã có phiên bản mới!</p>
              <p className="text-[11px] text-slate-400">Cập nhật ngay để nhận các tính năng và sửa lỗi mới nhất.</p>
            </div>
          </div>
          <button
            onClick={pwa.updatePWA}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex-shrink-0 shadow-md transition-colors"
          >
            Cập nhật
          </button>
        </aside>
      )}

      {/* 4. Install App Floating Callout */}
      {showInstallBanner && !pwa.isInstalled && (
        <aside
          aria-label="Gợi ý cài đặt ứng dụng"
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-5 right-5 md:left-auto md:right-5 md:max-w-sm z-40 bg-[#0F172A]/95 border border-slate-700/80 text-slate-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 p-0.5 flex-shrink-0 flex items-center justify-center shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="PTIT EduSync" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <p className="font-bold text-xs text-white flex items-center gap-1">
                Cài đặt PTIT EduSync <Sparkles className="w-3 h-3 text-amber-400 inline" />
              </p>
              <p className="text-[11px] text-slate-400">Tra cứu lịch thi nhanh và ngoại tuyến</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                handleDismissInstallBanner();
                openInstallModal();
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Cài đặt
            </button>
            <button
              onClick={handleDismissInstallBanner}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Bỏ qua"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 5. Install Guide Modal */}
      <PWAInstallModal
        isOpen={pwa.showInstallGuide}
        onClose={() => pwa.setShowInstallGuide(false)}
        onInstallNative={pwa.installPWA}
        isInstallable={pwa.isInstallable}
        isIOS={pwa.isIOS}
      />
    </PWAContext.Provider>
  );
}
