import React from 'react';
import { MessageSquare, Copy, Check } from 'lucide-react';

interface ClassAnnouncementCardProps {
  announcementText: string;
  copied: boolean;
  onCopy: () => void;
}

export function ClassAnnouncementCard({
  announcementText,
  copied,
  onCopy,
}: ClassAnnouncementCardProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            Mẫu thông báo Zalo / Facebook
          </h3>
          <button
            onClick={onCopy}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Sao chép</>}
          </button>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <textarea
            className="w-full h-full bg-transparent resize-none outline-none text-sm text-slate-700 leading-relaxed font-medium min-h-[250px]"
            value={announcementText}
            readOnly
          />
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">
          * Văn bản được tự động tổng hợp từ dữ liệu lịch thi của lớp. Bạn có thể sao chép và dán trực tiếp vào nhóm lớp.
        </p>
      </div>
    </div>
  );
}
