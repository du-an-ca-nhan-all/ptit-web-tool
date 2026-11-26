import React from 'react';
import {
  Search,
  RefreshCw,
  Users,
  ExternalLink,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { ParsedTelegramInput } from '../../utils/telegramParser';
import { DetectTabType, SelectedTelegramChat } from './types';
import { LinkParserPanel } from './LinkParserPanel';

interface AutoDetectActionBannerProps {
  activeTab: DetectTabType;
  botUsername?: string | null;
  botHandle: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAutoScanning: boolean;
  setIsAutoScanning: (v: boolean) => void;
  isLoading: boolean;
  onFetchRecentUpdates: () => void;
  rawLinkInput: string;
  onLinkInputChange: (val: string) => void;
  onResolveLink: () => void;
  isResolvingLink: boolean;
  parsedResult: ParsedTelegramInput | null;
  resolvedChatInfo: any | null;
  resolveError: string;
  onSelectChat: (selected: SelectedTelegramChat) => void;
  onClose: () => void;
}

export function AutoDetectActionBanner({
  activeTab,
  botUsername,
  botHandle,
  searchQuery,
  setSearchQuery,
  isAutoScanning,
  setIsAutoScanning,
  isLoading,
  onFetchRecentUpdates,
  rawLinkInput,
  onLinkInputChange,
  onResolveLink,
  isResolvingLink,
  parsedResult,
  resolvedChatInfo,
  resolveError,
  onSelectChat,
  onClose,
}: AutoDetectActionBannerProps) {
  return (
    <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
      {activeTab === 'PRIVATE' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-800">👉 Cách lấy Chat ID cá nhân nhanh nhất:</p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Bấm nút bên cạnh để mở Bot Telegram $\rightarrow$ Bấm <strong>Start</strong> (hoặc gửi bất kỳ tin nhắn gì) $\rightarrow$ ID sẽ xuất hiện ngay bên dưới!
            </p>
          </div>
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Bot Telegram</span>
            </a>
          )}
        </div>
      )}

      {activeTab === 'GROUP' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-800">👉 Cách lấy ID Nhóm hoặc Topic diễn đàn:</p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              1. Thêm Bot vào Nhóm $\rightarrow$ 2. Gửi 1 tin nhắn bất kỳ (hoặc gõ <code className="font-bold text-indigo-600">/id</code>) vào Topic bạn muốn nhận tin.
            </p>
          </div>
          {botUsername && (
            <a
              href={`https://t.me/${botUsername}?startgroup=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Thêm Bot Vào Nhóm</span>
            </a>
          )}
        </div>
      )}

      {activeTab === 'CHANNEL' && (
        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Yêu cầu quan trọng đối với Kênh Telegram (Channel):</strong>
              <span className="text-[11px] text-amber-800">
                Bạn phải thêm {botHandle} làm <strong>Quản trị viên (Administrator)</strong> của Kênh và bật quyền <strong>"Post Messages" (Đăng bài)</strong> $\rightarrow$ Sau đó đăng 1 bài viết bất kỳ lên Kênh.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LINK' && (
        <LinkParserPanel
          rawLinkInput={rawLinkInput}
          onLinkInputChange={onLinkInputChange}
          onResolveLink={onResolveLink}
          isResolvingLink={isResolvingLink}
          parsedResult={parsedResult}
          resolvedChatInfo={resolvedChatInfo}
          resolveError={resolveError}
          onSelectChat={onSelectChat}
          onClose={onClose}
        />
      )}

      {activeTab !== 'LINK' && (
        <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc theo tên hoặc Chat ID..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAutoScanning(!isAutoScanning)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isAutoScanning
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={isAutoScanning ? 'Bấm để tạm dừng tự động quét' : 'Bấm để bật tự động quét'}
            >
              <Radio className={`w-3 h-3 ${isAutoScanning ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isAutoScanning ? 'Auto Scan: BẬT' : 'Auto Scan: TẮT'}</span>
            </button>

            <button
              type="button"
              onClick={onFetchRecentUpdates}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Quét Ngay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
