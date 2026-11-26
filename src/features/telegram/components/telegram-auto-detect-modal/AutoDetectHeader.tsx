import React from 'react';
import {
  X,
  Users,
  Megaphone,
  User,
  Radio,
  Zap,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import { DetectTabType } from './types';

interface AutoDetectHeaderProps {
  onClose: () => void;
  botUsername?: string | null;
  isAutoScanning: boolean;
  activeTab: DetectTabType;
  setActiveTab: (tab: DetectTabType) => void;
  chatsCount: number;
}

export function AutoDetectHeader({
  onClose,
  botUsername,
  isAutoScanning,
  activeTab,
  setActiveTab,
  chatsCount,
}: AutoDetectHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 sm:p-6 text-white shrink-0 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-xs shrink-0">
            <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold mb-1">
              <Radio className="w-3 h-3 text-emerald-300 animate-ping" />
              <span>Trợ Lý Bắt ID Thông Minh</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Tự Động Nhận Diện Chat ID & Topic ID
            </h3>
            <p className="text-[11px] sm:text-xs text-sky-100 mt-0.5">
              Không cần tra cứu thủ công - Chỉ cần gửi tin nhắn hoặc dán link Telegram là nhận diện ngay!
            </p>
          </div>
        </div>

        {/* Bot info badge */}
        {botUsername && (
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
            <div className="flex items-center gap-2">
              <span className="opacity-80">Bot đang lắng nghe:</span>
              <span className="font-bold text-sky-200 font-mono">@{botUsername}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-200">
                {isAutoScanning ? 'Đang tự động quét (3s/lần)' : 'Tạm dừng quét'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Tất Cả Phát Hiện ({chatsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRIVATE')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'PRIVATE'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <User className="w-3.5 h-3.5 text-indigo-600" />
          <span>Chat Cá Nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GROUP')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'GROUP'
              ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>Nhóm & Topic Lớp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CHANNEL')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'CHANNEL'
              ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Kênh Thông Báo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LINK')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'LINK'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
          <span>Dán Link Bất Kỳ</span>
        </button>
      </div>
    </>
  );
}
