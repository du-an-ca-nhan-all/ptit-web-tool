import React from 'react';
import { RefreshCw, AlertCircle, Radio } from 'lucide-react';
import { TelegramAutoDetectModalProps } from './telegram-auto-detect-modal/types';
import { useTelegramAutoDetect } from './telegram-auto-detect-modal/useTelegramAutoDetect';
import { AutoDetectHeader } from './telegram-auto-detect-modal/AutoDetectHeader';
import { AutoDetectActionBanner } from './telegram-auto-detect-modal/AutoDetectActionBanner';
import { DetectedChatCard } from './telegram-auto-detect-modal/DetectedChatCard';

export default function TelegramAutoDetectModal({
  isOpen,
  onClose,
  botToken = '',
  botUsername,
  onSelectChat,
}: TelegramAutoDetectModalProps) {
  const {
    activeTab,
    setActiveTab,
    chats,
    isLoading,
    isAutoScanning,
    setIsAutoScanning,
    errorMsg,
    searchQuery,
    setSearchQuery,
    copiedId,
    rawLinkInput,
    parsedResult,
    isResolvingLink,
    resolvedChatInfo,
    resolveError,
    filteredChats,
    fetchRecentUpdates,
    handleLinkInputChange,
    handleResolveLink,
    handleCopy,
  } = useTelegramAutoDetect({ isOpen, botToken });

  if (!isOpen) return null;

  const botHandle = botUsername ? `@${botUsername}` : 'Bot';

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <AutoDetectHeader
          onClose={onClose}
          botUsername={botUsername}
          isAutoScanning={isAutoScanning}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          chatsCount={chats.length}
        />

        <AutoDetectActionBanner
          activeTab={activeTab}
          botUsername={botUsername}
          botHandle={botHandle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAutoScanning={isAutoScanning}
          setIsAutoScanning={setIsAutoScanning}
          isLoading={isLoading}
          onFetchRecentUpdates={() => fetchRecentUpdates(false)}
          rawLinkInput={rawLinkInput}
          onLinkInputChange={handleLinkInputChange}
          onResolveLink={handleResolveLink}
          isResolvingLink={isResolvingLink}
          parsedResult={parsedResult}
          resolvedChatInfo={resolvedChatInfo}
          resolveError={resolveError}
          onSelectChat={onSelectChat}
          onClose={onClose}
        />

        {/* Content Body: Discovered Chats List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[260px] max-h-[480px]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2.5">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <span className="text-xs font-bold text-slate-600">Đang quét cập nhật từ Telegram Bot...</span>
            </div>
          ) : filteredChats.length === 0 && activeTab !== 'LINK' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-black text-sm text-slate-800 mb-1">Chưa phát hiện tin nhắn nào gần đây</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Vui lòng mở Telegram, tìm bot <strong className="text-sky-600">{botHandle}</strong> và gửi một tin nhắn bất kỳ (hoặc gõ <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/id</code>). Hệ thống sẽ tự động bắt ID ngay lập tức.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <DetectedChatCard
                key={chat.chatId}
                chat={chat}
                copiedId={copiedId}
                onCopy={handleCopy}
                onSelectChat={onSelectChat}
                onClose={onClose}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            💡 Mẹo: Bạn có thể sao chép link tin nhắn bất kỳ từ Telegram và dán vào tab "Dán Link Bất Kỳ".
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-pointer transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
