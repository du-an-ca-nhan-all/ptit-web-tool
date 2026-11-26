import React from 'react';
import { RefreshCw, SendHorizontal, Server } from 'lucide-react';

interface InstantActionBarProps {
  isCreatingBackup: boolean;
  isSendingTelegram: boolean;
  onCreateServerBackup: () => void;
  onSendBackupToTelegram: () => void;
}

export function InstantActionBar({
  isCreatingBackup,
  isSendingTelegram,
  onCreateServerBackup,
  onSendBackupToTelegram,
}: InstantActionBarProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Nút Chủ Động Sao Lưu Tức Thì
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                Thao tác nhanh
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Nhấn để thực hiện sao lưu ngay lập tức:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút Chủ Động: Tạo Snapshot Máy Chủ */}
          <button
            onClick={onCreateServerBackup}
            disabled={isCreatingBackup || isSendingTelegram}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950/60 transition cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang tạo snapshot...
              </>
            ) : (
              <>
                <Server className="w-4 h-4 text-white" />
                Tạo Snapshot Máy Chủ (.sql)
              </>
            )}
          </button>

          {/* Nút Chủ Động: Sao Lưu & Gửi Telegram */}
          <button
            onClick={onSendBackupToTelegram}
            disabled={isSendingTelegram || isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950/60 transition cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSendingTelegram ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang gửi Telegram...
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4 text-sky-200" />
                Sao Lưu & Gửi Telegram
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
