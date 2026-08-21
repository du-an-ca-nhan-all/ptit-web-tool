'use client';

import React from 'react';
import { Megaphone, Pin, ArrowRight, ExternalLink, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { AnnouncementItem } from '../../announcements';

interface RecentAnnouncementsWidgetProps {
  announcements: AnnouncementItem[];
  onNavigateTab: (tab: string) => void;
}

export default function RecentAnnouncementsWidget({
  announcements,
  onNavigateTab,
}: RecentAnnouncementsWidgetProps) {
  if (!announcements || announcements.length === 0) {
    return null;
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'DANGER':
      case 'MAINTENANCE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            Khẩn cấp
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Lưu ý
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Cập nhật
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Thông báo
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Thông Báo Hệ Thống & Nhà Trường</h3>
            <p className="text-xs text-slate-500">Các tin tức, lưu ý quan trọng cần theo dõi</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all ${
              item.isPinned
                ? 'bg-sky-50/50 border-sky-200/80 hover:bg-sky-50'
                : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md">
                      <Pin className="w-2.5 h-2.5" /> Ghim
                    </span>
                  )}
                  {getTypeBadge(item.type)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
              </div>

              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-sky-600 bg-white border border-slate-200 rounded-xl transition-colors shrink-0 shadow-xs"
                  title="Mở liên kết"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
