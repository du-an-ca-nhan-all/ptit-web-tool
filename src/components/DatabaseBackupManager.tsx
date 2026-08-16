import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  Server,
  Calendar,
  Clock,
  Layers,
  Users,
  Shield,
  ArrowDownToLine,
  Sparkles,
  Check,
  ChevronRight,
  Info,
  FileText,
  Copy,
  ExternalLink,
  ShieldAlert,
  Archive,
  Send,
  Bot,
  Settings2,
  MessageSquare,
  Hash,
  Key,
  HelpCircle,
  SendHorizontal,
  CloudUpload,
} from 'lucide-react';
import { LoginUser } from '../types';

interface TableStat {
  name: string;
  label: string;
  count: number;
  description: string;
}

interface DatabaseStats {
  tables: {
    users: number;
    students: number;
    examBatches: number;
    examRecords: number;
    courseRegistrations: number;
    systemMeta: number;
    externalAccounts: number;
    activityLogs: number;
    telegramConfigs: number;
    globalConfigs: number;
    examReminderLogs: number;
    qldtAnnouncementLogs: number;
    classScheduleReminderLogs: number;
    registrationRequests: number;
  };
  tableBreakdown: TableStat[];
  totalRecords: number;
  dbFileSize: number;
  dbFileSizeFormatted: string;
  dbLastModified: string | null;
}

interface LocalBackupFile {
  name: string;
  format: 'sqlite' | 'json';
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

interface BackupTelegramConfigItem {
  isEnabled: boolean;
  chatId: string;
  threadId?: string | null;
  botToken?: string | null;
  sendSqlite: boolean;
  sendJson: boolean;
  autoBackupEnabled?: boolean;
  scheduleTime?: string;
  lastBackupSentAt?: string | null;
  lastBackupStatus?: 'SUCCESS' | 'FAILED' | null;
  lastBackupError?: string | null;
  lastBackupFiles?: string[];
  lastTestedAt?: string | null;
  lastTestStatus?: 'SUCCESS' | 'FAILED' | null;
  lastTestError?: string | null;
}

interface SystemBotInfo {
  isConfigured: boolean;
  botUsername?: string | null;
  botFirstName?: string | null;
}

interface DatabaseBackupManagerProps {
  currentUser: LoginUser;
}

export default function DatabaseBackupManager({ currentUser }: DatabaseBackupManagerProps) {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [localBackups, setLocalBackups] = useState<LocalBackupFile[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<BackupTelegramConfigItem | null>(null);
  const [systemBotInfo, setSystemBotInfo] = useState<SystemBotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Snapshot Creation & Telegram Sending
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSavingTelegramConfig, setIsSavingTelegramConfig] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'sqlite' | 'json'>('all');

  // Telegram Config Form States
  const [isTelegramSectionOpen, setIsTelegramSectionOpen] = useState(true);
  const [telChatId, setTelChatId] = useState('');
  const [telThreadId, setTelThreadId] = useState('');
  const [useCustomBot, setUseCustomBot] = useState(false);
  const [telBotToken, setTelBotToken] = useState('');
  const [telSendSqlite, setTelSendSqlite] = useState(true);
  const [telSendJson, setTelSendJson] = useState(true);
  const [telIsEnabled, setTelIsEnabled] = useState(true);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBackupData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setLocalBackups(data.localBackups || []);
        if (data.telegramConfig) {
          setTelegramConfig(data.telegramConfig);
          setTelChatId(data.telegramConfig.chatId || '');
          setTelThreadId(data.telegramConfig.threadId || '');
          setTelSendSqlite(data.telegramConfig.sendSqlite ?? true);
          setTelSendJson(data.telegramConfig.sendJson ?? true);
          setTelIsEnabled(data.telegramConfig.isEnabled ?? true);
          const hasCustom = !!data.telegramConfig.botToken;
          setUseCustomBot(hasCustom);
          setTelBotToken(data.telegramConfig.botToken || '');
        }
        if (data.systemBotInfo) {
          setSystemBotInfo(data.systemBotInfo);
        }
      } else {
        showToast(data.error || 'Không thể tải thông tin cơ sở dữ liệu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupData();
  }, [fetchBackupData]);

  // Handle direct download from live DB
  const handleDirectDownload = (format: 'sqlite' | 'json') => {
    showToast(`Đang chuẩn bị tải về file ${format.toUpperCase()}...`, 'info');
    const url = `/api/backup?download=true&format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      showToast(`Đã bắt đầu tải file sao lưu ${format.toUpperCase()}`, 'success');
      fetchBackupData();
    }, 1000);
  };

  // Handle downloading an existing saved file on server
  const handleDownloadSavedFile = (filename: string) => {
    showToast(`Đang tải file ${filename}...`, 'info');
    const url = `/api/backup?download=true&file=${encodeURIComponent(filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle creating snapshot on server
  const handleCreateServerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_SNAPSHOT', format: selectedFormat }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tạo bản sao lưu thành công!', 'success');
        if (data.stats) setStats(data.stats);
        if (data.localBackups) setLocalBackups(data.localBackups);
      } else {
        showToast(data.error || 'Không thể tạo bản sao lưu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ khi sao lưu', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Handle deleting a backup file
  const handleDeleteBackup = async (filename: string) => {
    setDeletingFilename(filename);
    try {
      const res = await fetch('/api/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Đã xoá ${filename}`, 'success');
        setLocalBackups((prev) => prev.filter((f) => f.name !== filename));
      } else {
        showToast(data.error || 'Không thể xoá bản sao lưu', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi khi gửi yêu cầu xoá bản sao lưu', 'error');
    } finally {
      setDeletingFilename(null);
      setConfirmDeleteFile(null);
    }
  };

  // Handle saving Telegram Cloud Backup configuration
  const handleSaveTelegramConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!telChatId.trim()) {
      showToast('Vui lòng nhập Chat ID nhận file backup', 'error');
      return;
    }

    setIsSavingTelegramConfig(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_TELEGRAM_CONFIG',
          chatId: telChatId.trim(),
          threadId: telThreadId.trim() || null,
          botToken: useCustomBot && telBotToken.trim() ? telBotToken.trim() : null,
          isEnabled: telIsEnabled,
          sendSqlite: telSendSqlite,
          sendJson: telSendJson,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Đã lưu cấu hình gửi backup lên Telegram thành công!', 'success');
        if (data.telegramConfig) setTelegramConfig(data.telegramConfig);
      } else {
        showToast(data.error || 'Không thể lưu cấu hình Telegram', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi khi lưu cấu hình Telegram', 'error');
    } finally {
      setIsSavingTelegramConfig(false);
    }
  };

  // Handle testing Telegram target
  const handleTestTelegramTarget = async () => {
    if (!telChatId.trim()) {
      showToast('Vui lòng nhập Chat ID để kiểm tra', 'error');
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_TELEGRAM_TARGET',
          chatId: telChatId.trim(),
          threadId: telThreadId.trim() || null,
          botToken: useCustomBot && telBotToken.trim() ? telBotToken.trim() : null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã gửi tin nhắn test thành công lên Telegram!', 'success');
        fetchBackupData();
      } else {
        showToast(data.error || 'Kiểm tra kết nối Telegram thất bại', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi khi gửi test Telegram', 'error');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Handle sending backup immediately to Telegram
  const handleSendBackupToTelegram = async () => {
    setIsSendingTelegram(true);
    showToast('Đang tạo bản sao lưu và gửi lên Telegram...', 'info');

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_TELEGRAM',
          format: selectedFormat,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã gửi file sao lưu lên Telegram thành công!', 'success');
        if (data.telegramConfig) setTelegramConfig(data.telegramConfig);
        fetchBackupData();
      } else {
        showToast(data.error || 'Không thể gửi file backup lên Telegram', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ khi gửi backup', 'error');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-inner">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Sao Lưu & Xuất Dữ Liệu Cơ Sở Dữ Liệu
                </h1>
                <p className="text-slate-400 text-sm">
                  Quản lý sao lưu an toàn (Tải về máy, Lưu trên máy chủ, và Gửi trực tiếp lên Telegram)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBackupData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* DB File Size */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Dung Lượng Database</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {stats ? stats.dbFileSizeFormatted : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              {stats?.dbLastModified
                ? new Date(stats.dbLastModified).toLocaleString('vi-VN')
                : 'dev.db SQLite'}
            </span>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Tổng Bản Ghi</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {stats ? stats.totalRecords.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">14 bảng dữ liệu hệ thống</div>
        </div>

        {/* Students & Users */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Sinh Viên & Tài Khoản</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 tracking-tight">
            {stats ? stats.tables.students.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats ? `${stats.tables.users.toLocaleString('vi-VN')} tài khoản đăng nhập` : '...'}
          </div>
        </div>

        {/* Exam Records */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4.5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Lịch Thi & Ca Thi</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {stats ? stats.tables.examRecords.toLocaleString('vi-VN') : '...'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats ? `${stats.tables.examBatches} đợt thi đã tạo` : '...'}
          </div>
        </div>
      </div>

      {/* SECTION: TELEGRAM CLOUD BACKUP INTEGRATION */}
      <div className="bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl shadow-inner">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Gửi File Sao Lưu Lên Telegram</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    telegramConfig?.chatId
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {telegramConfig?.chatId ? '● Đã Cấu Hình' : '○ Chưa Cấu Hình'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động gửi file SQLite (.sqlite) và JSON (.json) trực tiếp vào Kênh / Nhóm Telegram riêng của Quản trị viên
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendBackupToTelegram}
              disabled={isSendingTelegram || !telegramConfig?.chatId}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {isSendingTelegram ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang gửi file...
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  Sao Lưu & Gửi Ngay Lên Telegram
                </>
              )}
            </button>
          </div>
        </div>

        {/* Last Telegram Status Banner */}
        {telegramConfig?.lastBackupSentAt && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              telegramConfig.lastBackupStatus === 'SUCCESS'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {telegramConfig.lastBackupStatus === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="font-bold">Lần gửi Telegram gần nhất:</span>{' '}
                <span>{new Date(telegramConfig.lastBackupSentAt).toLocaleString('vi-VN')}</span>
                {telegramConfig.lastBackupFiles && telegramConfig.lastBackupFiles.length > 0 && (
                  <span className="ml-2 opacity-80">({telegramConfig.lastBackupFiles.join(', ')})</span>
                )}
                {telegramConfig.lastBackupError && (
                  <div className="text-[11px] text-rose-300 mt-0.5">{telegramConfig.lastBackupError}</div>
                )}
              </div>
            </div>
            <span className="text-[11px] font-mono opacity-70">Đích: {telegramConfig.chatId}</span>
          </div>
        )}

        {/* Telegram Configuration Form */}
        <form onSubmit={handleSaveTelegramConfig} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chat ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  Chat ID / Nhóm / Kênh Telegram <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Ví dụ: -100123456789 hoặc 123456789</span>
              </label>
              <input
                type="text"
                value={telChatId}
                onChange={(e) => setTelChatId(e.target.value)}
                placeholder="Nhập ID kênh, nhóm hoặc chat của Admin"
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono transition"
                required
              />
            </div>

            {/* Thread ID (Topic) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  Topic ID / Thread ID (Tùy chọn)
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Nếu gửi vào chủ đề nhóm diễn đàn</span>
              </label>
              <input
                type="text"
                value={telThreadId}
                onChange={(e) => setTelThreadId(e.target.value)}
                placeholder="Để trống nếu là chat thường hoặc không dùng topic"
                className="w-full bg-slate-950/60 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono transition"
              />
            </div>
          </div>

          {/* Bot Source Selection */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200">Bot Telegram Gửi File</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCustomBot(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    !useCustomBot
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Bot Hệ Thống {systemBotInfo?.botUsername ? `(@${systemBotInfo.botUsername})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomBot(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    useCustomBot
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Dùng Token Riêng
                </button>
              </div>
            </div>

            {useCustomBot && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Bot Token riêng được cấp bởi @BotFather:
                </label>
                <input
                  type="password"
                  value={telBotToken}
                  onChange={(e) => setTelBotToken(e.target.value)}
                  placeholder="Nhập 123456789:ABCdefGhIJKlmNoPQRstuVWXyz..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 font-mono"
                />
              </div>
            )}
          </div>

          {/* Options & Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telSendSqlite}
                  onChange={(e) => setTelSendSqlite(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span>Gửi file SQLite (.sqlite)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telSendJson}
                  onChange={(e) => setTelSendJson(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span>Gửi file JSON (.json)</span>
              </label>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleTestTelegramTarget}
                disabled={isTestingTelegram || !telChatId.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isTestingTelegram ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                )}
                Kiểm Tra Kết Nối (Ping)
              </button>

              <button
                type="submit"
                disabled={isSavingTelegramConfig || !telChatId.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-950/40 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingTelegramConfig ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Lưu Cấu Hình Telegram
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Actions Panel: Export & Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Direct Instant Download (SQLite Live) */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">File SQLite Gốc (.sqlite)</h3>
                <span className="text-xs text-indigo-400 font-medium">Sao lưu nhị phân đầy đủ 100%</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Tải trực tiếp bản sao lưu file SQLite live (<code className="text-indigo-300 font-mono">dev.db</code>). Phù hợp để phục hồi tức thì, mở bằng DB Browser hoặc Prisma Studio.
            </p>
          </div>
          <button
            onClick={() => handleDirectDownload('sqlite')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition cursor-pointer active:scale-98"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Tải File SQLite (.sqlite)
          </button>
        </div>

        {/* Card 2: Direct Instant Download (JSON Dump) */}
        <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Dữ Liệu JSON Toàn Bộ (.json)</h3>
                <span className="text-xs text-emerald-400 font-medium">Dễ đọc, chuyển đổi & di chuyển</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Xuất toàn bộ 14 bảng dữ liệu cùng metadata thành định dạng JSON chuẩn. Thích hợp cho việc phân tích, di chuyển sang cơ sở dữ liệu khác (Postgres, MySQL).
            </p>
          </div>
          <button
            onClick={() => handleDirectDownload('json')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer active:scale-98"
          >
            <Download className="w-4 h-4" />
            Tải Bản JSON Đầy Đủ (.json)
          </button>
        </div>

        {/* Card 3: Server Snapshot Creation */}
        <div className="bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Lưu Trữ Trên Máy Chủ</h3>
                <span className="text-xs text-sky-400 font-medium">Tạo snapshot trong thư mục backups/</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Tạo bản lưu trữ đóng dấu thời gian trực tiếp trên máy chủ. Bạn có thể tải lại hoặc quản lý bất kỳ lúc nào.
            </p>
            {/* Format choice */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'sqlite', 'json'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {fmt === 'all' ? 'Cả 2 File' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateServerBackup}
            disabled={isCreatingBackup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-900/30 transition cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang sao lưu...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Tạo Snapshot Máy Chủ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Server Backups List Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-base">Danh Sách Bản Sao Lưu Trên Máy Chủ</h2>
              <p className="text-xs text-slate-400">
                Thư mục <code className="text-indigo-400 font-mono">backups/</code> trên máy chủ ({localBackups.length} file)
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
            Dòng lệnh CLI: <code className="text-amber-300 font-mono">npm run db:backup -- --telegram</code>
          </div>
        </div>

        {localBackups.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Archive className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-sm font-medium text-slate-300">Chưa có file sao lưu nào được lưu trên máy chủ</p>
            <p className="text-xs text-slate-500 mt-1">
              Bấm &quot;Tạo Snapshot Máy Chủ&quot; ở trên hoặc chạy <code className="text-slate-400 font-mono">npm run db:backup</code> từ terminal
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Tên File</th>
                  <th className="py-3 px-4 font-semibold">Định Dạng</th>
                  <th className="py-3 px-4 font-semibold">Dung Lượng</th>
                  <th className="py-3 px-4 font-semibold">Thời Gian Tạo</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {localBackups.map((file) => (
                  <tr key={file.name} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-200 flex items-center gap-2">
                      {file.format === 'sqlite' ? (
                        <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-semibold">{file.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          file.format === 'sqlite'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {file.format.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{file.sizeFormatted}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(file.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadSavedFile(file.name)}
                          title="Tải về máy tính"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg border border-indigo-500/30 transition cursor-pointer font-medium text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Tải về
                        </button>
                        {confirmDeleteFile === file.name ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteBackup(file.name)}
                              disabled={deletingFilename === file.name}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition disabled:opacity-50"
                            >
                              {deletingFilename === file.name ? '...' : 'Xác nhận xoá'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteFile(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[11px] cursor-pointer"
                            >
                              Huỷ
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteFile(file.name)}
                            title="Xoá file sao lưu"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-900/50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table Breakdown Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-white text-base">Chi Tiết 14 Bảng Dữ Liệu Trong Database</h2>
              <p className="text-xs text-slate-400">
                Thống kê số lượng bản ghi thực tế được bao gồm trong mỗi lần xuất/sao lưu
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Tên Model / Bảng</th>
                <th className="py-3 px-4 font-semibold">Mô Tả & Ý Nghĩa Dữ Liệu</th>
                <th className="py-3 px-4 font-semibold text-right">Số Lượng Bản Ghi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.tableBreakdown?.map((tbl) => (
                <tr key={tbl.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                    {tbl.name}
                    <div className="text-[11px] font-sans font-normal text-slate-400 mt-0.5">{tbl.label}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 leading-relaxed">{tbl.description}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {tbl.count.toLocaleString('vi-VN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
