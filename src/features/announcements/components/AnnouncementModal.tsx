import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Sparkles,
  Pin,
  ExternalLink,
  X,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import { AnnouncementItem } from '../../../features/announcements';

interface AnnouncementModalProps {
  announcements: AnnouncementItem[];
  onNavigateTab?: (tab: string) => void;
}

export default function AnnouncementModal({
  announcements,
  onNavigateTab,
}: AnnouncementModalProps) {
  const [activeModalItem, setActiveModalItem] = useState<AnnouncementItem | null>(null);
  const [dontShowAgain24h, setDontShowAgain24h] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check modal announcements
    const modalCandidates = announcements.filter(
      (a) => a.displayMode === 'MODAL' || a.displayMode === 'BOTH'
    );

    if (modalCandidates.length === 0) {
      setActiveModalItem(null);
      return;
    }

    // Find the first modal announcement that hasn't been dismissed
    const unread = modalCandidates.find((a) => {
      try {
        const snoozeUntil = localStorage.getItem(`dismissed_modal_snooze_${a.id}`);
        if (snoozeUntil && parseInt(snoozeUntil, 10) > Date.now()) {
          return false;
        }
        const dismissedTimestamp = localStorage.getItem(`dismissed_modal_${a.id}`);
        if (dismissedTimestamp === a.updatedAt) {
          return false;
        }
      } catch {}
      return true;
    });

    if (unread) {
      setActiveModalItem(unread);
    } else {
      setActiveModalItem(null);
    }
  }, [announcements]);

  if (!activeModalItem) return null;

  const handleClose = () => {
    if (!activeModalItem) return;
    try {
      if (dontShowAgain24h) {
        // Snooze for 24 hours (86400000 ms)
        localStorage.setItem(
          `dismissed_modal_snooze_${activeModalItem.id}`,
          String(Date.now() + 24 * 60 * 60 * 1000)
        );
      } else {
        localStorage.setItem(`dismissed_modal_${activeModalItem.id}`, activeModalItem.updatedAt);
      }
    } catch {}
    setActiveModalItem(null);
  };

  const handleCtaClick = () => {
    if (!activeModalItem?.linkUrl) return;
    const url = activeModalItem.linkUrl;
    handleClose();
    if (url.startsWith('/') && onNavigateTab) {
      const cleanPath = url.replace(/^\/+/, '');
      onNavigateTab(cleanPath);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getTypeVisuals = (type: string) => {
    switch (type) {
      case 'WARNING':
        return {
          bannerBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          icon: <AlertTriangle className="w-6 h-6 text-white" />,
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
          label: 'Cảnh Báo Quan Trọng',
        };
      case 'DANGER':
        return {
          bannerBg: 'bg-gradient-to-r from-rose-600 to-red-600',
          icon: <AlertOctagon className="w-6 h-6 text-white" />,
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
          label: 'Khẩn Cấp',
        };
      case 'MAINTENANCE':
        return {
          bannerBg: 'bg-gradient-to-r from-orange-500 to-amber-600',
          icon: <Wrench className="w-6 h-6 text-white" />,
          badge: 'bg-orange-100 text-orange-900 border-orange-300',
          btnColor: 'bg-orange-600 hover:bg-orange-700 text-white',
          label: 'Bảo Trì Hệ Thống',
        };
      case 'SUCCESS':
        return {
          bannerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          icon: <CheckCircle2 className="w-6 h-6 text-white" />,
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          label: 'Thông Báo Mới',
        };
      case 'SYSTEM':
        return {
          bannerBg: 'bg-gradient-to-r from-indigo-600 to-purple-600',
          icon: <Sparkles className="w-6 h-6 text-white" />,
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          label: 'Thông Báo Hệ Thống',
        };
      case 'INFO':
      default:
        return {
          bannerBg: 'bg-gradient-to-r from-sky-500 to-blue-600',
          icon: <Megaphone className="w-6 h-6 text-white" />,
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          btnColor: 'bg-sky-600 hover:bg-sky-700 text-white',
          label: 'Thông Báo',
        };
    }
  };

  const visual = getTypeVisuals(activeModalItem.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between gap-3 ${visual.bannerBg}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-xs shrink-0">
              {visual.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/20 rounded-full">
                  {visual.label}
                </span>
                {activeModalItem.isPinned && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white text-rose-600 rounded-full flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5" /> Ghim
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-1 text-white line-clamp-1">
                {activeModalItem.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/25 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 font-normal">
            {activeModalItem.content}
          </div>

          {/* Metadata info footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            {activeModalItem.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Người đăng: <strong>{activeModalItem.author}</strong></span>
              </div>
            )}
            {activeModalItem.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>
                  {new Date(activeModalItem.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-500 self-start sm:self-center">
            <input
              type="checkbox"
              checked={dontShowAgain24h}
              onChange={(e) => setDontShowAgain24h(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
            <span>Không hiện lại trong 24 giờ</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeModalItem.linkUrl && (
              <button
                type="button"
                onClick={handleCtaClick}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${visual.btnColor}`}
              >
                <span>{activeModalItem.linkText || 'Xem Chi Tiết'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
