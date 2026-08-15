import React, { useState, useEffect } from 'react';
import { TelegramConfigItem, LoginUser } from '../types';
import {
  Send,
  Bot,
  Key,
  MessageSquare,
  Hash,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Bell,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Check,
  Zap,
} from 'lucide-react';

interface TelegramConfigSectionProps {
  currentUser?: LoginUser | null;
  targetUsername?: string;
  onConfigUpdated?: (config: TelegramConfigItem | null) => void;
}

export default function TelegramConfigSection({
  currentUser,
  targetUsername,
  onConfigUpdated,
}: TelegramConfigSectionProps) {
  const [config, setConfig] = useState<TelegramConfigItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [notifyExamSchedule, setNotifyExamSchedule] = useState(true);
  const [notifyCourseRegistration, setNotifyCourseRegistration] = useState(true);
  const [notifyClassActivity, setNotifyClassActivity] = useState(true);

  // UI helpers
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    botInfo?: any;
    error?: string;
  } | null>(null);

  const usernameToQuery = targetUsername || currentUser?.username;

  // Fetch current user's Telegram config
  const fetchConfig = async () => {
    if (!usernameToQuery) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const url = targetUsername
        ? `/api/telegram-config?username=${encodeURIComponent(targetUsername)}`
        : '/api/telegram-config';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.config) {
          setConfig(data.config);
          setBotToken(data.config.botToken || '');
          setChatId(data.config.chatId || '');
          setThreadId(data.config.threadId || '');
          setIsEnabled(data.config.isEnabled ?? true);
          setNotifyExamSchedule(data.config.notifyExamSchedule ?? true);
          setNotifyCourseRegistration(data.config.notifyCourseRegistration ?? true);
          setNotifyClassActivity(data.config.notifyClassActivity ?? true);
          if (data.config.lastTestStatus) {
            setTestResult({
              success: data.config.lastTestStatus === 'SUCCESS',
              message: data.config.lastTestStatus === 'SUCCESS' ? 'Lần kiểm tra gần nhất thành công' : undefined,
              error: data.config.lastTestError || undefined,
              botInfo: data.config.botUsername ? { username: data.config.botUsername, firstName: data.config.botFirstName } : null,
            });
          }
        } else {
          setConfig(null);
          // Don't wipe if user already typed
        }
      }
    } catch (err: any) {
      console.error('Fetch Telegram config error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [usernameToQuery]);

  // Handle Save Configuration
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token.');
      return;
    }
    if (!chatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE',
          targetUsername: targetUsername || undefined,
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          threadId: threadId.trim() || null,
          isEnabled,
          notifyExamSchedule,
          notifyCourseRegistration,
          notifyClassActivity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã lưu cấu hình Telegram thành công!');
        setConfig(data.config);
        if (data.botInfo) {
          setTestResult((prev) => ({
            success: true,
            message: `Xác thực Bot @${data.botInfo.username || data.botInfo.firstName} thành công`,
            botInfo: data.botInfo,
          }));
        }
        if (onConfigUpdated) onConfigUpdated(data.config);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể lưu cấu hình.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Test Send Notification
  const handleTest = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setTestResult(null);

    if (!botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token trước khi gửi thử nghiệm.');
      return;
    }
    if (!chatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận trước khi gửi thử nghiệm.');
      return;
    }

    setIsTesting(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          targetUsername: targetUsername || undefined,
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          threadId: threadId.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          botInfo: data.botInfo,
        });
        setSuccessMsg(data.message || 'Đã gửi tin nhắn thử nghiệm thành công!');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Gửi thử nghiệm thất bại.',
        });
        setErrorMsg(data.error || 'Gửi tin nhắn thử nghiệm thất bại.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ để gửi tin nhắn thử nghiệm.');
      setTestResult({
        success: false,
        error: 'Lỗi kết nối mạng hoặc máy chủ.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Handle Delete / Disconnect
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy liên kết và xóa cấu hình Telegram này không?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          targetUsername: targetUsername || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã xóa cấu hình Telegram.');
        setConfig(null);
        setBotToken('');
        setChatId('');
        setThreadId('');
        setTestResult(null);
        if (onConfigUpdated) onConfigUpdated(null);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể xóa cấu hình.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-sm font-medium">Đang tải thông tin cấu hình Telegram...</span>
      </div>
    );
  }

  const isConnected = !!config?.id;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-500/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 text-white/20">
          <Send className="w-24 h-24 stroke-[1.2]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white mb-3">
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot Notifications</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">
            Thông Báo Tức Thì Qua Telegram
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Nhận thông báo lịch thi, phòng thi, môn thi mới, kết quả đăng ký môn học và các thông tin học vụ quan trọng trực tiếp qua tài khoản cá nhân hoặc Group/Channel lớp trên Telegram.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-white/20"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Ẩn Hướng Dẫn Cài Đặt' : 'Xem Hướng Dẫn Lấy Token & Chat ID'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 rounded-2xl text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Đã kết nối</span>
                {config.botUsername && <span className="opacity-90">(@{config.botUsername})</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Setup Guide Accordion */}
      {showGuide && (
        <div className="bg-slate-50 border border-sky-200 rounded-3xl p-6 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-4 text-sky-800 font-black text-sm">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>4 Bước Đơn Giản Để Cấu Hình Telegram Bot</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px]">1</span>
                <span>Tạo Bot & Lấy Bot Token</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Mở ứng dụng Telegram, tìm kiếm bot{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                >
                  @BotFather <ExternalLink className="w-3 h-3" />
                </a>
                . Gửi lệnh <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">/newbot</code> và làm theo hướng dẫn để nhận API Token dạng: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">123456789:ABCdefGhI...</code>
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px]">2</span>
                <span>Khởi Động Bot (/start)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Sau khi tạo bot, hãy bấm vào liên kết bot của bạn và nhấn nút <span className="font-bold text-emerald-600">Start (/start)</span>. Nếu bạn muốn gửi vào Nhóm lớp, hãy thêm bot vào nhóm đó và cấp quyền nhắn tin.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px]">3</span>
                <span>Lấy Chat ID Người Nhận</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Chat với{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                >
                  @userinfobot <ExternalLink className="w-3 h-3" />
                </a>{' '}
                để xem ID tài khoản của bạn (Ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">987654321</code>). Nếu là Nhóm chat, ID nhóm thường bắt đầu bằng dấu trừ (Ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">-100123456789</code>).
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px]">4</span>
                <span>Thread ID / Topic ID (Tùy chọn)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Nếu nhóm Telegram của bạn bật tính năng <span className="font-medium">Forum Topics</span> và bạn muốn tin nhắn chỉ gửi vào một Topic cụ thể (ví dụ topic "Lịch Thi"), hãy nhập ID của Topic đó. Để trống nếu là Chat cá nhân hoặc nhóm thường.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Test Status Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="font-bold text-sm">
                {testResult.success ? 'Kiểm tra gửi tin nhắn thành công!' : 'Kiểm tra gửi tin nhắn thất bại!'}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                {testResult.success
                  ? testResult.message || `Đã gửi tin nhắn thử nghiệm tới Chat ID: ${chatId}`
                  : testResult.error}
              </div>
            </div>
          </div>

          {testResult.botInfo && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-mono font-bold self-start sm:self-auto">
              <Bot className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {testResult.botInfo.username ? `@${testResult.botInfo.username}` : testResult.botInfo.firstName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Configuration Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Thông Tin Cấu Hình Telegram Bot</h3>
              <p className="text-xs text-slate-500">
                Tài khoản: <span className="font-mono font-bold text-indigo-600">{usernameToQuery}</span>
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <label className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
            <span className="text-xs font-bold text-slate-700">
              {isEnabled ? 'Đang BẬT nhận thông báo' : 'Đang TẮT nhận thông báo'}
            </span>
          </label>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Input 1: Bot Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Telegram Bot API Token</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Được cấp bởi @BotFather</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Ví dụ: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 pr-20 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                required
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={showToken ? 'Ẩn Token' : 'Hiện Token'}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Chat ID and Thread ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input 2: Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chat ID / Group ID</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">@userinfobot</span>
              </div>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Ví dụ: 123456789 hoặc -100123456789"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ID cá nhân hoặc ID của Nhóm/Kênh nhận thông báo.
              </p>
            </div>

            {/* Input 3: Message Thread ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>Thread ID / Topic ID</span>
                  <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                </label>
                <span className="text-[11px] text-slate-400">Supergroup Topics</span>
              </div>
              <input
                type="text"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                placeholder="Ví dụ: 24 (để trống nếu không dùng Topic)"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Chỉ nhập nếu bạn muốn gửi vào một Topic trong Group Telegram.
              </p>
            </div>
          </div>

          {/* Notification Types Filter Checkboxes */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Bell className="w-3.5 h-3.5 text-sky-600" />
              <span>Tùy Chọn Nhận Các Loại Thông Báo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyExamSchedule}
                  onChange={(e) => setNotifyExamSchedule(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-700">
                  <span>Lịch Thi & Ca Thi</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyCourseRegistration}
                  onChange={(e) => setNotifyCourseRegistration(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-700">
                  <span>ĐKMH & Học Phí</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyClassActivity}
                  onChange={(e) => setNotifyClassActivity(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer"
                />
                <div className="text-xs font-bold text-slate-700">
                  <span>Biến Động Lớp Học</span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Delete / Clear button */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                onClick={handleTest}
                disabled={isTesting || !botToken || !chatId}
                className="px-5 py-2.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
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
                className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-500/20 disabled:opacity-50"
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
        </form>
      </div>

      {/* Telegram Message Preview Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Mẫu Tin Nhắn Sẽ Nhận Trên Telegram</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">HTML Format</span>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 font-mono text-xs text-slate-200 leading-relaxed max-w-lg">
          <div className="font-bold text-sky-300 mb-1">🤖 THÔNG BÁO THỬ NGHIỆM - PTIT WEB TOOL</div>
          <div className="text-slate-500 mb-2">━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div className="text-emerald-400 font-bold mb-2">
            🎉 Chúc mừng! Cấu hình Telegram Bot đã hoạt động chính xác.
          </div>
          <div className="text-slate-300">
            👤 <b>Họ và tên:</b> {currentUser?.fullName || currentUser?.username || 'Nguyễn Văn A'}<br />
            🆔 <b>Mã sinh viên:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{currentUser?.username || 'B25DCCN001'}</code><br />
            🏫 <b>Lớp:</b> <b>{currentUser?.lop || 'D25TXCN11-K'}</b><br />
            🤖 <b>Bot gửi:</b> <b>{config?.botUsername ? `@${config.botUsername}` : '@MyPTITBot'}</b><br />
            📌 <b>Chat ID nhận:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{chatId || '123456789'}</code><br />
            {threadId && (
              <>
                🧵 <b>Thread / Topic ID:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{threadId}</code><br />
              </>
            )}
            ⏰ <b>Thời gian test:</b> <i>{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</i>
          </div>
          <div className="text-slate-500 my-2">━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div className="text-slate-400 text-[11px] italic">
            🔔 Từ bây giờ, hệ thống sẽ tự động gửi thông báo lịch thi, cập nhật phòng thi và học vụ trực tiếp đến Telegram này.
          </div>
        </div>
      </div>
    </div>
  );
}
