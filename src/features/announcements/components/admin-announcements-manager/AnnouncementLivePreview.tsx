import React from 'react';
import { Megaphone, Eye, ExternalLink, X } from 'lucide-react';
import { AnnouncementFormData, PreviewTab } from './types';
import { AnnouncementTypeBadge } from './AnnouncementTypeBadge';

interface AnnouncementLivePreviewProps {
  formData: AnnouncementFormData;
  previewTab: PreviewTab;
  onChangePreviewTab: (tab: PreviewTab) => void;
}

export function AnnouncementLivePreview({
  formData,
  previewTab,
  onChangePreviewTab,
}: AnnouncementLivePreviewProps) {
  return (
    <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-sky-600" />
          <span>Xem Trước Trực Tiếp</span>
        </span>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => onChangePreviewTab('BANNER')}
            className={`px-2 py-0.5 rounded transition ${
              previewTab === 'BANNER'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Banner
          </button>
          <button
            type="button"
            onClick={() => onChangePreviewTab('MODAL')}
            className={`px-2 py-0.5 rounded transition ${
              previewTab === 'MODAL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Popup Modal
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {previewTab === 'BANNER' ? (
          <div className="p-3 bg-white rounded-xl border border-sky-300 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {formData.isPinned && (
                <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold uppercase">
                  Ghim
                </span>
              )}
              <AnnouncementTypeBadge type={formData.type} />
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {formData.title || 'Tiêu đề thông báo mẫu'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
              {formData.content || 'Nội dung thông báo sẽ xuất hiện tại đây...'}
            </p>
            {formData.linkUrl && (
              <div className="pt-1 flex justify-end">
                <span className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <span>{formData.linkText || 'Xem Chi Tiết'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
            <div className="p-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white truncate">
                  {formData.title || 'Tiêu đề thông báo mẫu'}
                </h4>
              </div>
              <X className="w-3.5 h-3.5 opacity-80" />
            </div>
            <div className="p-3.5 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
              {formData.content || 'Nội dung chi tiết của thông báo popup bật lên...'}
            </div>
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Không hiện lại trong 24h</span>
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                Đã Hiểu
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 text-center">
        Giao diện thực tế sẽ tự động tối ưu theo thiết bị người dùng.
      </div>
    </div>
  );
}
