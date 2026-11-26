import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Database,
  Hash,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
} from 'lucide-react';
import { parseTopicInput } from '../../utils/telegramParser';
import BackupAlertsSidebar from './BackupAlertsSidebar';
import BackupEventTriggersSection from './BackupEventTriggersSection';
import BackupScheduleSection from './BackupScheduleSection';
import { useBackupAlertsConfig } from './useBackupAlertsConfig';
import { applyTelegramChatInput } from './utils';

interface BackupAlertsTabProps {
  systemBot: any | null;
  backup: ReturnType<typeof useBackupAlertsConfig>;
  onOpenAutoDetectForBackup: () => void;
}

export default function BackupAlertsTab({
  systemBot,
  backup,
  onOpenAutoDetectForBackup,
}: BackupAlertsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {/* Main Settings Form */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                Cấu Hình Sao Lưu & Gửi Lên Telegram Cho Admin
              </h3>
              <p className="text-xs text-slate-500">
                Quản lý kênh tiếp nhận bản sao lưu tự động & các sự kiện cảnh báo quan trọng trong
                hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                backup.telIsEnabled && backup.telChatId
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backup.telIsEnabled && backup.telChatId
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              {backup.telIsEnabled && backup.telChatId ? 'Đang kích hoạt' : 'Chưa cấu hình'}
            </span>
          </div>
        </div>

        <form onSubmit={backup.handleSaveBackupTelegramConfig} className="flex flex-col gap-5">
          {/* Destination: Chat ID & Thread ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>Chat ID / Kênh / Nhóm Admin</span>
                  <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenAutoDetectForBackup}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 cursor-pointer shadow-2xs"
                >
                  <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
                  <span>Bắt ID Tự Động</span>
                </button>
              </div>
              <input
                type="text"
                value={backup.telChatId}
                onChange={(e) =>
                  applyTelegramChatInput(e.target.value, backup.setTelChatId, backup.setTelThreadId)
                }
                placeholder="Ví dụ: -100123456789 hoặc dán link Telegram"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ID cá nhân, hoặc ID Group/Channel mà bạn thêm Bot vào làm Quản trị viên (có thể dán
                link).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-600" />
                <span>Topic ID / Thread ID (Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={backup.telThreadId}
                onChange={(e) => {
                  const parsedTopic = parseTopicInput(e.target.value);
                  backup.setTelThreadId(parsedTopic || e.target.value);
                }}
                placeholder="Để trống hoặc dán link Topic"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dành riêng cho nhóm Supergroup bật tính năng phân chủ đề (Topics/Forums).
              </p>
            </div>
          </div>

          <BackupEventTriggersSection
            systemBot={systemBot}
            useCustomBackupBot={backup.useCustomBackupBot}
            setUseCustomBackupBot={backup.setUseCustomBackupBot}
            telBackupBotToken={backup.telBackupBotToken}
            setTelBackupBotToken={backup.setTelBackupBotToken}
            telNotifyOnDbBackup={backup.telNotifyOnDbBackup}
            setTelNotifyOnDbBackup={backup.setTelNotifyOnDbBackup}
            telNotifyOnNewUser={backup.telNotifyOnNewUser}
            setTelNotifyOnNewUser={backup.setTelNotifyOnNewUser}
            telNotifyOnDbRestore={backup.telNotifyOnDbRestore}
            setTelNotifyOnDbRestore={backup.setTelNotifyOnDbRestore}
            telNotifyOnExamBatchImport={backup.telNotifyOnExamBatchImport}
            setTelNotifyOnExamBatchImport={backup.setTelNotifyOnExamBatchImport}
          />

          <BackupScheduleSection
            telAutoBackupEnabled={backup.telAutoBackupEnabled}
            setTelAutoBackupEnabled={backup.setTelAutoBackupEnabled}
            telScheduleTime={backup.telScheduleTime}
            setTelScheduleTime={backup.setTelScheduleTime}
            telSendSql={backup.telSendSql}
            setTelSendSql={backup.setTelSendSql}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
            <button
              type="button"
              onClick={backup.handleTestBackupTelegram}
              disabled={backup.isTestingBackupConfig || !backup.telChatId.trim()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {backup.isTestingBackupConfig ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <Send className="w-4 h-4 text-sky-600" />
              )}
              <span>Kiểm Tra Kết Nối (Ping Test)</span>
            </button>

            <button
              type="submit"
              disabled={backup.isSavingBackupConfig || !backup.telChatId.trim()}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {backup.isSavingBackupConfig ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Lưu Cấu Hình Sao Lưu Telegram</span>
            </button>
          </div>

          {backup.backupTestResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                backup.backupTestResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {backup.backupTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {backup.backupTestResult.success
                  ? backup.backupTestResult.message
                  : backup.backupTestResult.error}
              </span>
            </div>
          )}
        </form>
      </div>

      {/* Right Info & Instant Action Card */}
      <BackupAlertsSidebar
        telChatId={backup.telChatId}
        isSendingInstantBackup={backup.isSendingInstantBackup}
        onSendInstantBackup={backup.handleSendInstantBackupToTelegram}
      />
    </div>
  );
}
