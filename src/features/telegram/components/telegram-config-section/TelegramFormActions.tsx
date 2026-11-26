import React from 'react';
import { Send, RefreshCw, Trash2, Check } from 'lucide-react';

interface TelegramFormActionsProps {
  isConnected: boolean;
  isDeleting: boolean;
  isTesting: boolean;
  isSaving: boolean;
  chatId: string;
  isCustomBot: boolean;
  botToken: string;
  onDelete: () => void;
  onTest: () => void;
}

export default function TelegramFormActions({
  isConnected,
  isDeleting,
  isTesting,
  isSaving,
  chatId,
  isCustomBot,
  botToken,
  onDelete,
  onTest,
}: TelegramFormActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
      {/* Delete / Clear button */}
      {isConnected ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          <span>Xóa / Hủy Cấu Hình</span>
        </button>
      ) : (
        <div />
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Test Send Button */}
        <button
          type="button"
          onClick={onTest}
          disabled={isTesting || !chatId || (isCustomBot && !botToken)}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 active:scale-95"
          title="Gửi một tin nhắn mẫu tới Telegram để kiểm tra kết nối"
        >
          {isTesting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>Đang gửi thử nghiệm...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>Gửi Thử Tin Nhắn (Test)</span>
            </>
          )}
        </button>

        {/* Save Configuration Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-500/20 disabled:opacity-50 active:scale-95"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
