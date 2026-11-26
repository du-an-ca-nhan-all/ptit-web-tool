import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import { ParsedTelegramInput } from '../../utils/telegramParser';
import { SelectedTelegramChat } from './types';

interface LinkParserPanelProps {
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

export function LinkParserPanel({
  rawLinkInput,
  onLinkInputChange,
  onResolveLink,
  isResolvingLink,
  parsedResult,
  resolvedChatInfo,
  resolveError,
  onSelectChat,
  onClose,
}: LinkParserPanelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-bold text-slate-800">
        Dán đường link bất kỳ từ Telegram (Link bài viết, Link Topic, Link Kênh, hoặc Telegram Web):
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={rawLinkInput}
            onChange={(e) => onLinkInputChange(e.target.value)}
            placeholder="Ví dụ: https://t.me/c/1987654321/42 hoặc https://t.me/ptit_k21"
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="button"
          onClick={onResolveLink}
          disabled={isResolvingLink || !rawLinkInput.trim()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {isResolvingLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          <span>Phân Tích</span>
        </button>
      </div>

      {/* Parsed link preview */}
      {parsedResult && parsedResult.chatId && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
          <div>
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{parsedResult.explanation}</span>
            </div>
            <div className="text-[11px] text-purple-700 mt-1 flex items-center gap-3 font-mono">
              <span>Chat ID: <strong>{parsedResult.chatId}</strong></span>
              {parsedResult.threadId && (
                <span>Topic ID: <strong>#{parsedResult.threadId}</strong></span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectChat({
                chatId: parsedResult.chatId!,
                chatTitle: 'Đã phân tách từ Link',
                chatType: parsedResult.type,
                threadId: parsedResult.threadId,
              });
              onClose();
            }}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
          >
            <span>Áp Dụng ID Này</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Resolved Chat Info Result */}
      {resolvedChatInfo && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
          <div>
            <div className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tìm thấy: {resolvedChatInfo.title}</span>
              <span className="px-2 py-0.2 bg-emerald-200 text-emerald-800 rounded-md text-[10px] uppercase font-bold">
                {resolvedChatInfo.type}
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-3 font-mono">
              <span>ID: <strong>{resolvedChatInfo.id}</strong></span>
              {resolvedChatInfo.memberCount !== undefined && (
                <span>Thành viên: <strong>{resolvedChatInfo.memberCount}</strong></span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectChat({
                chatId: String(resolvedChatInfo.id),
                chatTitle: resolvedChatInfo.title,
                chatType: resolvedChatInfo.type,
                threadId: parsedResult?.threadId,
              });
              onClose();
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
          >
            <span>Áp Dụng ID Này</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {resolveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{resolveError}</span>
        </div>
      )}
    </div>
  );
}
