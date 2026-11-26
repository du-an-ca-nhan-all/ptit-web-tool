import React from 'react';
import { Bell, Bot } from 'lucide-react';

interface BackupEventTriggersSectionProps {
  systemBot: any | null;
  useCustomBackupBot: boolean;
  setUseCustomBackupBot: (value: boolean) => void;
  telBackupBotToken: string;
  setTelBackupBotToken: (value: string) => void;
  telNotifyOnDbBackup: boolean;
  setTelNotifyOnDbBackup: (value: boolean) => void;
  telNotifyOnNewUser: boolean;
  setTelNotifyOnNewUser: (value: boolean) => void;
  telNotifyOnDbRestore: boolean;
  setTelNotifyOnDbRestore: (value: boolean) => void;
  telNotifyOnExamBatchImport: boolean;
  setTelNotifyOnExamBatchImport: (value: boolean) => void;
}

export default function BackupEventTriggersSection({
  systemBot,
  useCustomBackupBot,
  setUseCustomBackupBot,
  telBackupBotToken,
  setTelBackupBotToken,
  telNotifyOnDbBackup,
  setTelNotifyOnDbBackup,
  telNotifyOnNewUser,
  setTelNotifyOnNewUser,
  telNotifyOnDbRestore,
  setTelNotifyOnDbRestore,
  telNotifyOnExamBatchImport,
  setTelNotifyOnExamBatchImport,
}: BackupEventTriggersSectionProps) {
  return (
    <>
      {/* Bot selection */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">Bot Gửi Thông Báo & Sao Lưu</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseCustomBackupBot(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                !useCustomBackupBot
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Dùng Bot Hệ Thống {systemBot?.botUsername ? `(@${systemBot.botUsername})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setUseCustomBackupBot(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                useCustomBackupBot
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Dùng Token Riêng
            </button>
          </div>
        </div>

        {useCustomBackupBot && (
          <div className="pt-2 animate-in fade-in">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Token Bot riêng từ @BotFather:
            </label>
            <input
              type="password"
              value={telBackupBotToken}
              onChange={(e) => setTelBackupBotToken(e.target.value)}
              placeholder="Nhập 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800"
            />
          </div>
        )}
      </div>

      {/* Event Triggers Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-800">
            Sự Kiện Kích Hoạt Gửi Thông Báo Tức Thì Cho Admin
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Realtime Event Alerts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Event 1 */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-2xs">
          <input
            type="checkbox"
            checked={telNotifyOnDbBackup}
            onChange={(e) => setTelNotifyOnDbBackup(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">💾 Sao Lưu & Xuất DB</span>
            <span className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Nhận báo cáo khi auto-backup chạy hoặc khi xuất file SQL / JSON
            </span>
          </div>
        </label>

        {/* Event 2 */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-2xs">
          <input
            type="checkbox"
            checked={telNotifyOnNewUser}
            onChange={(e) => setTelNotifyOnNewUser(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">👤 Người Đăng Ký Mới</span>
            <span className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Gửi ngay khi có sinh viên đăng ký tài khoản (Họ tên, MSSV, Lớp)
            </span>
          </div>
        </label>

        {/* Event 3 */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-2xs">
          <input
            type="checkbox"
            checked={telNotifyOnDbRestore}
            onChange={(e) => setTelNotifyOnDbRestore(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">🛡️ Phục Hồi Dữ Liệu DB</span>
            <span className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Cảnh báo an toàn khi có thao tác khôi phục database trên máy chủ
            </span>
          </div>
        </label>

        {/* Event 4 */}
        <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-2xs">
          <input
            type="checkbox"
            checked={telNotifyOnExamBatchImport}
            onChange={(e) => setTelNotifyOnExamBatchImport(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">📥 Import Đợt Thi Mới</span>
            <span className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Thông báo khi Admin import danh sách lịch thi đợt mới thành công
            </span>
          </div>
        </label>
      </div>
    </div>
    </>
  );
}
