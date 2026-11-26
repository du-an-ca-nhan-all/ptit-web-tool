import React from 'react';
import { RefreshCw, SendHorizontal, Sparkles } from 'lucide-react';

interface BackupAlertsSidebarProps {
  telChatId: string;
  isSendingInstantBackup: boolean;
  onSendInstantBackup: () => void;
}

export default function BackupAlertsSidebar({
  telChatId,
  isSendingInstantBackup,
  onSendInstantBackup,
}: BackupAlertsSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick Action: Instant Backup to Telegram */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/20 rounded-xl text-sky-400 border border-sky-500/30">
            <SendHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Sao Lưu & Gửi Ngay</h4>
            <p className="text-[11px] text-slate-400">Thao tác chủ động không cần đợi lịch</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Nhấn nút bên dưới để hệ thống lập tức xuất toàn bộ cơ sở dữ liệu PostgreSQL (file .sql) và
          gửi thẳng vào kênh Telegram cấu hình.
        </p>

        <button
          type="button"
          onClick={onSendInstantBackup}
          disabled={isSendingInstantBackup || !telChatId.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSendingInstantBackup ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang sao lưu & gửi...</span>
            </>
          ) : (
            <>
              <SendHorizontal className="w-4 h-4" />
              <span>Sao Lưu & Gửi Ngay Lên Telegram</span>
            </>
          )}
        </button>
      </div>

      {/* Guide Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Hướng dẫn lấy Chat ID Telegram Admin:</span>
        </div>
        <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              Để nhận tin vào tài khoản cá nhân: Mở bot <b>@userinfobot</b> trên Telegram và lấy ID
              số của bạn.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>
              Để nhận vào Group/Kênh: Mời Bot của bạn vào Group, cấp quyền <b>Admin</b>, rồi dùng{' '}
              <b>@RawDataBot</b> để lấy ID Group (dạng{' '}
              <code className="text-indigo-600 font-mono">-100...</code>).
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              Bấm nút <b>Kiểm Tra Kết Nối (Ping Test)</b> để xác nhận Bot gửi tin nhắn thành công
              trước khi lưu.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
