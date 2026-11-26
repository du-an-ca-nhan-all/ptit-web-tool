import React from 'react';
import {
  Archive,
  ArrowDownToLine,
  Database,
  RefreshCw,
  SendHorizontal,
  Server,
} from 'lucide-react';
import { DatabaseStats } from './types';

interface BackupActionCardsProps {
  stats: DatabaseStats | null;
  isCreatingBackup: boolean;
  isSendingTelegram: boolean;
  onDirectDownload: () => void;
  onCreateServerBackup: () => void;
  onSendBackupToTelegram: () => void;
}

export function BackupActionCards({
  stats,
  isCreatingBackup,
  isSendingTelegram,
  onDirectDownload,
  onCreateServerBackup,
  onSendBackupToTelegram,
}: BackupActionCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Card 1: Direct Instant Download (PostgreSQL SQL Dump Live) */}
      <div className="bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">File SQL Dump (.sql)</h3>
              <span className="text-xs text-sky-400 font-medium">Bản sao lưu chuẩn PostgreSQL</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Xuất trực tiếp toàn bộ {stats?.tableBreakdown?.length ? `${stats.tableBreakdown.length} bảng` : 'các bảng'} thành file SQL PostgreSQL đầy đủ. Dễ dàng nạp bằng <code className="text-sky-300 font-mono">psql</code> hoặc phục hồi tức thì trên giao diện Web.
          </p>
        </div>
        <button
          onClick={onDirectDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-900/30 transition cursor-pointer active:scale-98"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Tải File SQL Dump (.sql)
        </button>
      </div>

      {/* Card 2: Server Snapshot Creation */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Lưu Trữ Snapshot (.sql)</h3>
              <span className="text-xs text-indigo-400 font-medium">Tạo bản sao lưu trên máy chủ</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Tạo bản lưu trữ SQL (.sql) đóng dấu thời gian trực tiếp trên máy chủ trong thư mục <code className="text-indigo-300 font-mono">backups/</code>. Dễ dàng tải lại hoặc phục hồi bất cứ lúc nào.
          </p>
        </div>
        <button
          onClick={onCreateServerBackup}
          disabled={isCreatingBackup || isSendingTelegram}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {isCreatingBackup ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang sao lưu...
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              Tạo Snapshot Máy Chủ (.sql)
            </>
          )}
        </button>
      </div>

      {/* Card 3: Send Backup to Telegram */}
      <div className="bg-gradient-to-b from-blue-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 rounded-xl">
              <SendHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gửi Lên Telegram</h3>
              <span className="text-xs text-sky-400 font-medium">Sao lưu & gửi kênh Admin ngay</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Tạo ngay bản sao lưu cơ sở dữ liệu PostgreSQL (.sql) và gửi trực tiếp đính kèm file vào kênh / nhóm Telegram quản trị viên đã thiết lập trong hệ thống.
          </p>
        </div>
        <button
          onClick={onSendBackupToTelegram}
          disabled={isSendingTelegram || isCreatingBackup}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-950/60 transition cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {isSendingTelegram ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang sao lưu & gửi Telegram...
            </>
          ) : (
            <>
              <SendHorizontal className="w-4 h-4" />
              Sao Lưu & Gửi Telegram (.sql)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
