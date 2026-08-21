import React, { useState } from 'react';
import {
  Bell,
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
  Layers,
  Search,
} from 'lucide-react';
import { AnnouncementItem } from '../../../features/announcements';

interface AnnouncementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: AnnouncementItem[];
  onNavigateTab?: (tab: string) => void;
}

export default function AnnouncementDrawer({
  isOpen,
  onClose,
  announcements,
  onNavigateTab,
}: AnnouncementDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = announcements.filter((a) => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    }
    return true;
  });

  const getTypeVisual = (type: string) => {
    switch (type) {
      case 'WARNING':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label: 'Cảnh báo',
        };
      case 'DANGER':
        return {
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <AlertOctagon className="w-4 h-4 text-rose-600" />,
          label: 'Khẩn cấp',
        };
      case 'MAINTENANCE':
        return {
          badge: 'bg-orange-100 text-orange-900 border-orange-300',
          icon: <Wrench className="w-4 h-4 text-orange-600" />,
          label: 'Bảo trì',
        };
      case 'SUCCESS':
        return {
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'Mới',
        };
      case 'SYSTEM':
        return {
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
          label: 'Hệ thống',
        };
      case 'INFO':
      default:
        return {
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: <Megaphone className="w-4 h-4 text-sky-600" />,
          label: 'Thông báo',
        };
    }
  };

  const handleCtaClick = (linkUrl?: string | null) => {
    if (!linkUrl) return;
    onClose();
    if (linkUrl.startsWith('/') && onNavigateTab) {
      const cleanPath = linkUrl.replace(/^\/+/, '');
      onNavigateTab(cleanPath);
    } else {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-sky-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Thông Báo Hệ Thống</span>
                  <span className="px-2 py-0.5 bg-sky-500/30 text-sky-300 rounded-full text-xs font-mono">
                    {announcements.length}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">Cập nhật tin tức học vụ & thông báo quan trọng</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Type Filters */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'INFO', label: 'Thông tin' },
                { key: 'WARNING', label: 'Cảnh báo' },
                { key: 'DANGER', label: 'Khẩn cấp' },
                { key: 'MAINTENANCE', label: 'Bảo trì' },
                { key: 'SYSTEM', label: 'Hệ thống' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    typeFilter === t.key
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-1">Hiện không có thông báo mới phù hợp với bộ lọc</p>
              </div>
            ) : (
              filtered.map((item) => {
                const vis = getTypeVisual(item.type);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 transition-all shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wider">
                            <Pin className="w-2.5 h-2.5" /> Ghim
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${vis.badge}`}>
                          {vis.icon}
                          <span>{vis.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>

                    {item.linkUrl && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCtaClick(item.linkUrl)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <span>{item.linkText || 'Xem Chi Tiết'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
