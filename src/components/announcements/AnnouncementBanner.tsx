import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Sparkles,
  Info,
  Pin,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnnouncementItem } from '../../lib/announcements';

interface AnnouncementBannerProps {
  announcements: AnnouncementItem[];
  onNavigateTab?: (tab: string) => void;
}

export default function AnnouncementBanner({
  announcements,
  onNavigateTab,
}: AnnouncementBannerProps) {
  const [dismissedMap, setDismissedMap] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load dismissed status from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const map: Record<number, string> = {};
    announcements.forEach((a) => {
      try {
        const saved = localStorage.getItem(`dismissed_banner_${a.id}`);
        if (saved) map[a.id] = saved;
      } catch {}
    });
    setDismissedMap(map);
  }, [announcements]);

  // Filter to visible banner announcements
  const visibleAnnouncements = announcements.filter((a) => {
    if (a.displayMode !== 'BANNER' && a.displayMode !== 'BOTH') return false;
    // If dismissed with matching updatedAt timestamp, don't show
    if (dismissedMap[a.id] === a.updatedAt) return false;
    return true;
  });

  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[currentIndex % visibleAnnouncements.length] || visibleAnnouncements[0];

  const handleDismiss = (id: number, updatedAt: string) => {
    try {
      localStorage.setItem(`dismissed_banner_${id}`, updatedAt);
      setDismissedMap((prev) => ({ ...prev, [id]: updatedAt }));
      if (currentIndex >= visibleAnnouncements.length - 1) {
        setCurrentIndex(0);
      }
    } catch {}
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : visibleAnnouncements.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < visibleAnnouncements.length - 1 ? prev + 1 : 0));
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'WARNING':
        return {
          container: 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-300 text-amber-950',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
          accent: 'text-amber-700',
        };
      case 'DANGER':
        return {
          container: 'bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 border-rose-300 text-rose-950',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />,
          button: 'bg-rose-600 hover:bg-rose-700 text-white',
          accent: 'text-rose-700',
        };
      case 'MAINTENANCE':
        return {
          container: 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-orange-300 text-orange-950',
          badge: 'bg-orange-100 text-orange-900 border-orange-300',
          icon: <Wrench className="w-4 h-4 text-orange-600 shrink-0" />,
          button: 'bg-orange-600 hover:bg-orange-700 text-white',
          accent: 'text-orange-700',
        };
      case 'SUCCESS':
        return {
          container: 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          accent: 'text-emerald-700',
        };
      case 'SYSTEM':
        return {
          container: 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-indigo-300 text-indigo-950',
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />,
          button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          accent: 'text-indigo-700',
        };
      case 'INFO':
      default:
        return {
          container: 'bg-gradient-to-r from-sky-50 via-blue-50 to-sky-50 border-sky-300 text-sky-950',
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: <Megaphone className="w-4 h-4 text-sky-600 shrink-0" />,
          button: 'bg-sky-600 hover:bg-sky-700 text-white',
          accent: 'text-sky-700',
        };
    }
  };

  const style = getTypeStyle(current.type);

  const handleCtaClick = () => {
    if (!current.linkUrl) return;
    if (current.linkUrl.startsWith('/') && onNavigateTab) {
      const cleanPath = current.linkUrl.replace(/^\/+/, '');
      onNavigateTab(cleanPath);
    } else {
      window.open(current.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 pt-3 pb-1 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${style.container}`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-white/80 backdrop-blur-xs rounded-xl shadow-xs shrink-0 mt-0.5">
            {style.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {current.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                  <Pin className="w-2.5 h-2.5" /> Ghim
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badge}`}>
                {current.type === 'MAINTENANCE'
                  ? 'Bảo trì'
                  : current.type === 'WARNING'
                  ? 'Cảnh báo'
                  : current.type === 'DANGER'
                  ? 'Khẩn cấp'
                  : current.type === 'SUCCESS'
                  ? 'Tin mới'
                  : current.type === 'SYSTEM'
                  ? 'Hệ thống'
                  : 'Thông báo'}
              </span>
              <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 truncate">
                {current.title}
              </h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 sm:line-clamp-3 whitespace-pre-line font-normal">
              {current.content}
            </p>
          </div>
        </div>

        {/* Action button, pagination controls & dismiss button */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/5">
          {visibleAnnouncements.length > 1 && (
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xs px-2 py-1 rounded-lg border border-black/5 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={handlePrev}
                className="p-0.5 hover:text-slate-900 cursor-pointer"
                title="Thông báo trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {currentIndex + 1}/{visibleAnnouncements.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-0.5 hover:text-slate-900 cursor-pointer"
                title="Thông báo kế tiếp"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {current.linkUrl && (
            <button
              type="button"
              onClick={handleCtaClick}
              className={`px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${style.button}`}
            >
              <span>{current.linkText || 'Xem Chi Tiết'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDismiss(current.id, current.updatedAt)}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-white/60 hover:bg-white/90 rounded-lg transition-colors cursor-pointer"
            title="Đóng thông báo này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
