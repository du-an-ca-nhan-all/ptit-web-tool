import React from 'react';
import {
  Key,
  MessageSquare,
  Hash,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  ListFilter,
  X as CloseIcon,
  Radio,
} from 'lucide-react';

interface TelegramConnectionFieldsProps {
  isCustomBot: boolean;
  botToken: string;
  onBotTokenChange: (val: string) => void;
  showToken: boolean;
  onToggleShowToken: () => void;
  chatId: string;
  onChatIdChange: (val: string) => void;
  onApplyChatSuggestion: (suggestion: string) => void;
  parsedNotice: string | null;
  onDismissParsedNotice: () => void;
  smartChatSuggestion: string | null;
  threadId: string;
  onThreadIdChange: (val: string) => void;
  selectedTopicName: string | null;
  onClearTopic: () => void;
  onOpenAutoDetect: () => void;
  onOpenTopicModal: () => void;
}

export default function TelegramConnectionFields({
  isCustomBot,
  botToken,
  onBotTokenChange,
  showToken,
  onToggleShowToken,
  chatId,
  onChatIdChange,
  onApplyChatSuggestion,
  parsedNotice,
  onDismissParsedNotice,
  smartChatSuggestion,
  threadId,
  onThreadIdChange,
  selectedTopicName,
  onClearTopic,
  onOpenAutoDetect,
  onOpenTopicModal,
}: TelegramConnectionFieldsProps) {
  return (
    <>
      {/* Custom Bot Token Input (Only when isCustomBot is true) */}
      {isCustomBot && (
        <div className="animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Telegram Bot API Token Riêng</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Từ @BotFather</span>
          </div>
          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              value={botToken}
              onChange={(e) => onBotTokenChange(e.target.value)}
              placeholder="Ví dụ: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-12 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required={isCustomBot}
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleShowToken}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                title={showToken ? 'Ẩn Token' : 'Hiện Token'}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Chat ID and Thread ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Input 1: Chat ID */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Chat ID / Group ID / Channel ID</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAutoDetect}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-100/80 hover:bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-300 transition-colors cursor-pointer active:scale-95 shadow-2xs"
              >
                <Radio className="w-3 h-3 text-sky-600 animate-pulse" />
                <span>Trợ Lý Bắt ID</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={chatId}
              onChange={(e) => onChatIdChange(e.target.value)}
              placeholder="Nhập ID (vd: -100...) hoặc dán Link Telegram bất kỳ"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-24 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={onOpenAutoDetect}
              className="absolute right-2 px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-600 text-[11px] font-bold border border-slate-200 rounded-lg sm:rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
              title="Mở Trợ lý tự động nhận diện ID từ Telegram"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Bắt ID</span>
            </button>
          </div>

          {/* Parsed link badge */}
          {parsedNotice && (
            <div className="mt-1.5 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-[11px] text-emerald-800 font-medium animate-in fade-in">
              <span className="truncate flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{parsedNotice}</span>
              </span>
              <button
                type="button"
                onClick={onDismissParsedNotice}
                className="p-0.5 text-emerald-600 hover:text-emerald-800 ml-1 cursor-pointer"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Smart Suggestion for Supergroup / Channel */}
          {smartChatSuggestion && (
            <div className="mt-1.5 flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-[11px] text-amber-900 animate-in fade-in">
              <span className="truncate">
                💡 Nếu là Kênh/Nhóm, ID chuẩn là: <strong className="font-mono text-indigo-700">{smartChatSuggestion}</strong>
              </span>
              <button
                type="button"
                onClick={() => onApplyChatSuggestion(smartChatSuggestion)}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 ml-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                Áp Dụng
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Hỗ trợ <strong>Dán link Telegram bất kỳ</strong> hoặc bấm <strong>"Trợ Lý Bắt ID"</strong> để tự động nhận diện.
          </p>
        </div>

        {/* Input 2: Message Thread ID / Topic Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span>Thread ID / Topic ID</span>
              <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <button
              type="button"
              onClick={onOpenTopicModal}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-200 transition-colors cursor-pointer"
            >
              <ListFilter className="w-3 h-3" />
              <span>Quét Topic</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={threadId}
              onChange={(e) => onThreadIdChange(e.target.value)}
              placeholder="Ví dụ: 24 (hoặc dán Link Topic)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-28 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={onOpenTopicModal}
              className="absolute right-2 px-2.5 py-1.5 bg-white hover:bg-sky-50 text-sky-600 text-[11px] font-bold border border-slate-200 rounded-lg sm:rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
            >
              <ListFilter className="w-3 h-3 text-sky-500" />
              <span>Chọn Topic</span>
            </button>
          </div>

          {selectedTopicName && threadId && (
            <div className="mt-1.5 flex items-center justify-between bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-xl text-[11px] text-sky-800 font-medium animate-in fade-in">
              <span className="truncate">
                Topic đã chọn: <strong>{selectedTopicName}</strong> <span className="font-mono text-sky-600">(#{threadId})</span>
              </span>
              <button
                type="button"
                onClick={onClearTopic}
                className="p-0.5 text-sky-500 hover:text-sky-700 ml-1 cursor-pointer"
                title="Bỏ chọn topic"
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Dán link Topic bất kỳ hoặc bấm <strong>"Chọn Topic"</strong> để chọn từ danh sách.
          </p>
        </div>
      </div>
    </>
  );
}
