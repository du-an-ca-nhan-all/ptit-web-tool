import React, { useState, useEffect } from 'react';
import { TelegramConfigItem, SystemTelegramBotInfo, LoginUser } from '../../../types';
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
  ListFilter,
  X as CloseIcon,
  Users,
  Settings,
  ShieldCheck,
  Globe,
  CalendarDays,
  Lock,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import TelegramTopicSelectorModal from './TelegramTopicSelectorModal';

interface TelegramConfigSectionProps {
  currentUser?: LoginUser | null;
  targetUsername?: string;
  onConfigUpdated?: (config: TelegramConfigItem | null) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function TelegramConfigSection({
  currentUser,
  targetUsername,
  onConfigUpdated,
  onNavigateTab,
}: TelegramConfigSectionProps) {
  const [config, setConfig] = useState<TelegramConfigItem | null>(null);
  const [systemBot, setSystemBot] = useState<SystemTelegramBotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bot mode toggle: false = System Bot (default), true = Custom Bot
  const [isCustomBot, setIsCustomBot] = useState(false);

  // Form states
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [threadId, setThreadId] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [notifyExamSchedule, setNotifyExamSchedule] = useState(true);
  const [notifyClassActivity, setNotifyClassActivity] = useState(true);
  const [notifyQldtAnnouncements, setNotifyQldtAnnouncements] = useState(true);
  const [qldtCheckInterval, setQldtCheckInterval] = useState<number>(2);
  const [isCheckingQldt, setIsCheckingQldt] = useState(false);
  const [qldtCheckMsg, setQldtCheckMsg] = useState('');
  const [notifyClassSchedule, setNotifyClassSchedule] = useState(true);
  const [classReminderBefore, setClassReminderBefore] = useState<number>(30);
  const [isCheckingClassSchedule, setIsCheckingClassSchedule] = useState(false);
  const [classScheduleCheckMsg, setClassScheduleCheckMsg] = useState('');
  const [isCheckingNearestClassSchedule, setIsCheckingNearestClassSchedule] = useState(false);
  const [nearestClassScheduleMsg, setNearestClassScheduleMsg] = useState('');

  // Admin System Bot Config states
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminSystemToken, setAdminSystemToken] = useState('');
  const [isSavingSystemBot, setIsSavingSystemBot] = useState(false);
  const [systemBotMsg, setSystemBotMsg] = useState('');
  const [systemBotError, setSystemBotError] = useState('');

  // QLDTTX Account Status
  const [qldttxStatus, setQldttxStatus] = useState<{
    isConfigured: boolean;
    status: string;
    syncMessage?: string | null;
    lastSyncAt?: string | null;
  } | null>(null);

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

  const isAdmin = Boolean(
    currentUser?.activeRole === 'admin' ||
    (currentUser?.isAdmin && currentUser?.activeRole !== 'sinh_vien' && currentUser?.activeRole !== 'lop_truong') ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );
  const usernameToQuery = targetUsername || currentUser?.username;

  const isQldttxConnected = Boolean(qldttxStatus?.isConfigured && qldttxStatus?.status === 'CONNECTED');
  const isQldttxError = Boolean(qldttxStatus?.isConfigured && qldttxStatus?.status === 'ERROR');
  const isQldttxAvailable = isQldttxConnected;

  // Fetch current user's Telegram config and System Bot info
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
        if (data.systemBot) {
          setSystemBot(data.systemBot);
        }
        if (data.systemBotConfig && data.systemBotConfig.botToken) {
          setAdminSystemToken(data.systemBotConfig.botToken);
        }
        if (data.qldttxStatus) {
          setQldttxStatus(data.qldttxStatus);
        }

        if (data.config) {
          setConfig(data.config);
          const hasCustom = !!data.config.botToken;
          setIsCustomBot(hasCustom);
          setBotToken(data.config.botToken || '');
          setChatId(data.config.chatId || '');
          setThreadId(data.config.threadId || '');
          setIsEnabled(data.config.isEnabled ?? true);
          setNotifyExamSchedule(data.config.notifyExamSchedule ?? true);
          setNotifyClassActivity(data.config.notifyClassActivity ?? true);
          setNotifyQldtAnnouncements(data.config.notifyQldtAnnouncements ?? true);
          setQldtCheckInterval(data.config.qldtCheckInterval ?? 2);
          setNotifyClassSchedule(data.config.notifyClassSchedule ?? true);
          setClassReminderBefore(data.config.classReminderBefore ?? 30);
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
          setIsCustomBot(false);
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

  // Admin Save System Bot (Global Config)
  const handleSaveSystemBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSystemToken.trim()) {
      setSystemBotError('Vui lòng nhập Bot Token cho hệ thống.');
      return;
    }

    setIsSavingSystemBot(true);
    setSystemBotMsg('');
    setSystemBotError('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SYSTEM_BOT',
          botToken: adminSystemToken.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSystemBotMsg(data.message || 'Đã lưu Bot Hệ Thống thành công!');
        fetchConfig();
        setTimeout(() => setSystemBotMsg(''), 5000);
      } else {
        setSystemBotError(data.error || 'Không thể lưu Bot Hệ Thống.');
      }
    } catch (err) {
      setSystemBotError('Lỗi kết nối khi lưu Bot Hệ Thống.');
    } finally {
      setIsSavingSystemBot(false);
    }
  };

  // Handle Save User Configuration
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isCustomBot && !botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token riêng.');
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
          botToken: isCustomBot ? botToken.trim() : null,
          chatId: chatId.trim(),
          threadId: threadId.trim() || null,
          isEnabled,
          notifyExamSchedule,
          notifyClassActivity,
          notifyQldtAnnouncements,
          qldtCheckInterval,
          notifyClassSchedule,
          classReminderBefore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã lưu cấu hình Telegram thành công!');
        setConfig(data.config);
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

  // Check QLDTTX announcements now
  const handleCheckQldtNow = async () => {
    setIsCheckingQldt(true);
    setQldtCheckMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_QLDT_ANNOUNCEMENTS',
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQldtCheckMsg(
          data.totalAnnouncementsDispatched > 0
            ? `Đã quét cổng QLDTTX: Phát hiện và đã gửi ${data.totalAnnouncementsDispatched} thông báo mới về Telegram của bạn!`
            : 'Đã quét cổng QLDTTX: Không có thông báo mới nào hoặc đã được gửi trước đó.'
        );
      } else {
        setErrorMsg(data.error || 'Lỗi khi kiểm tra thông báo cổng QLDTTX.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để kiểm tra thông báo QLDTTX.');
    } finally {
      setIsCheckingQldt(false);
    }
  };

  // Check Class schedule now
  const handleCheckClassScheduleNow = async () => {
    setIsCheckingClassSchedule(true);
    setClassScheduleCheckMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_CLASS_SCHEDULE_NOW',
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.morningSummariesSent > 0 || data.preClassAlertsSent > 0) {
          setClassScheduleCheckMsg(
            `Đã gọi API kiểm tra lịch học (${data.todayDowName} - ${data.todayStr}) và đã gửi thông báo lên Telegram!`
          );
        } else {
          setClassScheduleCheckMsg(
            `Đã gọi API kiểm tra lịch học (${data.todayDowName} - ${data.todayStr}): Hôm nay bạn không có ca học nào trên hệ thống (đã gửi thông báo xác nhận lên Telegram).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Lỗi khi kiểm tra lịch học.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để kiểm tra lịch học.');
    } finally {
      setIsCheckingClassSchedule(false);
    }
  };

  // Check nearest class schedule in next 10 days
  const handleCheckNearestClassSchedule = async () => {
    setIsCheckingNearestClassSchedule(true);
    setNearestClassScheduleMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_NEAREST_CLASS_SCHEDULE',
          maxDays: 10,
          targetUsername: targetUsername || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.totalSent > 0 && data.results && data.results[0]?.found) {
          const r = data.results[0];
          const offsetText =
            r.dayOffset === 0
              ? 'Hôm nay'
              : r.dayOffset === 1
              ? 'Ngày mai'
              : `sau ${r.dayOffset} ngày nữa`;
          setNearestClassScheduleMsg(
            `Đã gọi API quét lịch học: Tìm thấy ngày học gần nhất vào ${r.dowName}, ngày ${r.dateStr} (${offsetText}) gồm ${r.sessionsCount} ca học và đã gửi chi tiết lên Telegram!`
          );
        } else {
          setNearestClassScheduleMsg(
            `Đã gọi API quét thời khóa biểu: Trong 10 ngày tới bạn không có ca học nào trên hệ thống (đã gửi thông báo xác nhận lên Telegram).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Lỗi khi quét lịch học 10 ngày tới.');
      }
    } catch {
      setErrorMsg('Không thể kết nối máy chủ để quét lịch học.');
    } finally {
      setIsCheckingNearestClassSchedule(false);
    }
  };

  // Handle Test Send Notification
  const handleTest = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setTestResult(null);

    if (isCustomBot && !botToken.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot Token riêng trước khi gửi thử nghiệm.');
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
          botToken: isCustomBot ? botToken.trim() : undefined,
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
        fetchConfig();
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
        setSelectedTopicName(null);
        setTestResult(null);
        setIsCustomBot(false);
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
  const isCustomConfigValid = !isCustomBot || !!(config?.botToken && config.botToken.trim());
  const isTelegramConfigured = Boolean(isConnected && config?.chatId && isCustomConfigValid);
  const isTelegramTestSuccess = Boolean(
    testResult ? testResult.success : config?.lastTestStatus === 'SUCCESS'
  );
  const isTelegramReady = Boolean(isTelegramConfigured && isTelegramTestSuccess);
  const activeBotUsername =
    !isCustomBot ? systemBot?.botUsername : (config?.botUsername || 'CustomBot');

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-lg shadow-sky-500/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 text-white/20 hidden sm:block">
          <Send className="w-24 h-24 stroke-[1.2]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white mb-2 sm:mb-3">
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Bot Notifications</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-1.5 sm:mb-2 tracking-tight">
            Thông Báo Tức Thì Qua Telegram
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
            Nhận thông báo lịch thi, phòng thi, môn thi mới, kết quả đăng ký môn học và các thông tin học vụ quan trọng trực tiếp qua tài khoản cá nhân hoặc Group/Channel lớp trên Telegram.
          </p>

          <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-white/20 active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Ẩn Hướng Dẫn' : 'Xem Hướng Dẫn'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isAdmin && (
              <>
                {onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('telegram_admin')}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-indigo-400/40 shadow-xs active:scale-95"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Quản Trị Bot ➜</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-amber-400/25 hover:bg-amber-400/35 text-amber-100 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-amber-300/30 active:scale-95"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAdminPanelOpen ? 'Đóng Quản Trị' : 'Cấu Hình Bot Toàn Trường'}</span>
                  </button>
                )}
              </>
            )}

            {isConnected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 rounded-xl sm:rounded-2xl text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Đã kết nối ({isCustomBot ? 'Bot Riêng' : 'Bot Hệ Thống'})</span>
                {activeBotUsername && <span className="opacity-90">(@{activeBotUsername})</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ADMIN GLOBAL BOT CONFIGURATION PANEL */}
      {isAdmin && isAdminPanelOpen && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs animate-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3.5 sm:pb-4 mb-4 sm:mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-xs shadow-amber-300 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Cấu Hình Bot Telegram Hệ Thống (Toàn Trường)
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600">
                  Dành riêng cho Quản trị viên: Toàn bộ sinh viên có thể dùng bot này mà không cần tự tạo bot.
                </p>
              </div>
            </div>

            {systemBot?.isConfigured && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đang Hoạt Động (@{systemBot.botUsername})</span>
              </span>
            )}
          </div>

          {systemBotMsg && (
            <div className="mb-4 p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl sm:rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{systemBotMsg}</span>
            </div>
          )}

          {systemBotError && (
            <div className="mb-4 p-3.5 bg-rose-100 border border-rose-300 rounded-xl sm:rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{systemBotError}</span>
            </div>
          )}

          <form onSubmit={handleSaveSystemBot} className="flex flex-col gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                System Bot API Token
              </label>
              <input
                type="text"
                value={adminSystemToken}
                onChange={(e) => setAdminSystemToken(e.target.value)}
                placeholder="Nhập Token của Bot hệ thống (ví dụ: 123456789:ABCdef...)"
                className="w-full bg-white border border-amber-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tạo 1 bot đại diện duy nhất (ví dụ: <code className="font-bold">@PTIT_EduSync_Bot</code>) qua @BotFather và dán token vào đây.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingSystemBot}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-xs shadow-amber-300 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isSavingSystemBot ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Lưu & Kích Hoạt Bot Toàn Trường</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Setup Guide Accordion */}
      {showGuide && (
        <div className="bg-slate-50 border border-sky-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-3.5 sm:mb-4 text-sky-800 font-black text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Hướng Dẫn Sử Dụng Bot Telegram Trong 3 Bước</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] shrink-0">1</span>
                <span>Thêm Bot Vào Kênh / Chat Riêng</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                Nếu dùng <strong>Bot Hệ Thống</strong>, chỉ cần bấm nút <em>"Thêm Bot vào Nhóm"</em>. Nếu dùng Bot Riêng, tạo bot qua @BotFather và dán token.
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] shrink-0">2</span>
                <span>Lấy Chat ID Nhận Tin</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                Chat với{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-600 hover:underline inline-flex items-center gap-0.5"
                >
                  @userinfobot <ExternalLink className="w-3 h-3" />
                </a>{' '}
                để lấy ID cá nhân (ví dụ: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-indigo-600">987654321</code>). Nếu là Nhóm, ID thường có dấu trừ (<code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-indigo-600">-100123456789</code>).
              </p>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] shrink-0">3</span>
                <span>Chọn Topic & Lưu</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
                Nếu nhóm có bật <em>Forum Topics</em>, bấm nút <strong>"Quét Topic"</strong> để chọn chủ đề nhận thông báo, sau đó bấm <strong>"Gửi Thử Tin Nhắn"</strong> để kiểm tra.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Alerts */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Test Status Banner */}
      {testResult && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium shadow-2xs ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {testResult.success ? 'Kiểm tra gửi tin nhắn thành công!' : 'Kiểm tra gửi tin nhắn thất bại!'}
              </div>
              <div className="text-[11px] sm:text-xs opacity-90 mt-0.5">
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
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-sky-50 text-sky-600 rounded-xl sm:rounded-2xl shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">Cấu Hình Thông Báo Telegram</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Tài khoản: <span className="font-mono font-bold text-indigo-600">{usernameToQuery}</span>
              </p>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <label className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
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

        {/* BOT MODE SELECTOR */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-800">Lựa Chọn Bot Sử Dụng</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Option 1: System Bot */}
            <div
              onClick={() => {
                setIsCustomBot(false);
                setBotToken('');
              }}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 sm:gap-2 relative ${
                !isCustomBot
                  ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Bot Hệ Thống (Khuyên Dùng)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                  Tiện Lợi Nhất
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sử dụng bot chính thức của trường. Bạn chỉ cần thêm bot vào nhóm/kênh hoặc chat riêng mà không cần tạo bot.
              </p>
            </div>

            {/* Option 2: Custom Bot */}
            <div
              onClick={() => setIsCustomBot(true)}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 sm:gap-2 relative ${
                isCustomBot
                  ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Key className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Tự Tạo & Cấu Hình Bot Riêng</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                  Tùy chỉnh
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dành cho bạn muốn dùng bot riêng của cá nhân. Yêu cầu nhập Telegram Bot API Token từ @BotFather.
              </p>
            </div>
          </div>
        </div>

        {/* SYSTEM BOT SHORTCUT ACTIONS CARD */}
        {!isCustomBot && (
          <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-sky-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-slate-900">
                    {systemBot?.botFirstName || 'PTIT EduSync Official Bot'}
                  </span>
                  {systemBot?.botUsername && (
                    <span className="font-mono text-[11px] text-sky-700 font-bold bg-sky-100 px-2 py-0.2 rounded-md">
                      @{systemBot.botUsername}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bot hệ thống đã sẵn sàng kết nối và gửi thông báo tự động.
                </p>
              </div>
            </div>

            {systemBot?.botUsername ? (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <a
                  href={systemBot.addToGroupUrl || `https://t.me/${systemBot.botUsername}?startgroup=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Thêm Vào Nhóm</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            ) : (
              <div className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                ⚠️ Admin chưa cấu hình Bot Toàn Trường.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4 sm:gap-5">
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
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Ví dụ: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-12 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required={isCustomBot}
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
          )}

          {/* Grid: Chat ID and Thread ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Input 1: Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chat ID / Group ID Nhận Tin</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">@userinfobot</span>
              </div>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Ví dụ: 123456789 hoặc -100123456789"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ID tài khoản cá nhân hoặc ID của Nhóm/Kênh nhận thông báo.
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
                  onClick={() => {
                    setErrorMsg('');
                    if (!chatId.trim()) {
                      setErrorMsg('Vui lòng nhập Chat ID nhóm trước khi quét Topic.');
                      return;
                    }
                    if (isCustomBot && !botToken.trim()) {
                      setErrorMsg('Vui lòng nhập Bot Token riêng trước khi quét Topic.');
                      return;
                    }
                    setIsTopicModalOpen(true);
                  }}
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
                  onChange={(e) => {
                    setThreadId(e.target.value);
                    setSelectedTopicName(null);
                  }}
                  placeholder="Ví dụ: 24 (để trống nếu chat thường)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-28 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    if (!chatId.trim()) {
                      setErrorMsg('Vui lòng nhập Chat ID nhóm trước khi quét Topic.');
                      return;
                    }
                    if (isCustomBot && !botToken.trim()) {
                      setErrorMsg('Vui lòng nhập Bot Token riêng trước khi quét Topic.');
                      return;
                    }
                    setIsTopicModalOpen(true);
                  }}
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
                    onClick={() => {
                      setThreadId('');
                      setSelectedTopicName(null);
                    }}
                    className="p-0.5 text-sky-500 hover:text-sky-700 ml-1 cursor-pointer"
                    title="Bỏ chọn topic"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Bấm <strong>"Chọn Topic"</strong> để quét chủ đề trong nhóm hoặc tự nhập Thread ID.
              </p>
            </div>
          </div>

          {/* Notification Types Filter Checkboxes */}
          <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col gap-3 transition-colors ${
            !isTelegramReady
              ? 'bg-slate-100/70 border-slate-300'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Bell className="w-3.5 h-3.5 text-sky-600" />
                <span>Tùy Chọn Nhận Các Loại Thông Báo</span>
              </div>
              <div>
                {isTelegramReady ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Đã sẵn sàng</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-600" />
                    <span>Chưa kích hoạt</span>
                  </span>
                )}
              </div>
            </div>

            {/* Telegram Configuration & Test Readiness Alert Banner */}
            {!isTelegramReady && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in">
                <div className="flex items-start sm:items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <strong className="font-bold block text-rose-950">
                      {!isTelegramConfigured
                        ? 'Chưa hoàn tất cấu hình kết nối Telegram'
                        : testResult?.success === false || config?.lastTestStatus === 'FAILED'
                        ? 'Kiểm tra gửi tin nhắn Telegram thất bại'
                        : 'Yêu cầu kiểm tra kết nối Telegram thành công'}
                    </strong>
                    <span className="text-[11px] text-rose-800">
                      {!isTelegramConfigured
                        ? 'Vui lòng nhập Chat ID (và Bot Token nếu dùng Bot riêng), sau đó bấm "Gửi Tin Nhắn Thử Nghiệm" hoặc "Lưu Cấu Hình" để mở khóa nhận thông báo.'
                        : testResult?.success === false || config?.lastTestStatus === 'FAILED'
                        ? 'Lần gửi thử nghiệm gần nhất không thành công. Vui lòng kiểm tra lại Chat ID / Token và gửi thử nghiệm thành công để kích hoạt nhận thông báo.'
                        : 'Để sử dụng các tùy chọn nhận thông báo, bạn cần bấm "Gửi Tin Nhắn Thử Nghiệm" thành công ít nhất một lần để xác thực kết nối.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !chatId.trim() || (isCustomBot && !botToken.trim())}
                  className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Gửi Thử Nghiệm Ngay</span>
                </button>
              </div>
            )}

            {/* QLDTTX Dependency Alert Banner */}
            {isTelegramReady && !isQldttxAvailable && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
                <div className="flex items-start sm:items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <strong className="font-bold block text-amber-950">
                      {isQldttxError
                        ? 'Tài khoản Cổng QLDTTX (PTTC1) bị sai mật khẩu hoặc lỗi xác thực'
                        : 'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)'}
                    </strong>
                    <span className="text-[11px] text-amber-800">
                      {isQldttxError
                        ? 'Các tính năng nhận "Lịch Học & TKB" và "Thông Báo Cổng QLDTTX" tạm thời bị khóa. Vui lòng cập nhật lại mật khẩu chính xác.'
                        : 'Để mở khóa nhận "Lịch Học & TKB" và "Thông Báo Cổng QLDTTX", bạn cần liên kết tài khoản QLDTTX trước.'}
                    </span>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('EXTERNAL_ACCOUNTS')}
                    className="w-full sm:w-auto px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isQldttxError ? 'Cập Nhật Mật Khẩu' : 'Liên Kết Ngay'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
              {/* Option 1: Exam Schedule */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
                !isTelegramReady
                  ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                  : 'bg-white border-slate-200 hover:border-sky-300 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  disabled={!isTelegramReady}
                  checked={isTelegramReady && notifyExamSchedule}
                  onChange={(e) => isTelegramReady && setNotifyExamSchedule(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                />
                <div className="text-xs flex-1">
                  <div className="font-bold flex items-center justify-between gap-1">
                    <span className={isTelegramReady ? 'text-slate-800' : 'text-slate-500'}>Lịch Thi & Ca Thi</span>
                    {!isTelegramReady && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Khóa
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Nhắc trước 1 ngày & 7h sáng hôm thi</div>
                </div>
              </label>

              {/* Option 2: Class Schedule & Timetable (Requires Telegram Ready & QLDTTX) */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  !isTelegramReady || !isQldttxAvailable
                    ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-amber-300 bg-amber-50/40 hover:border-amber-400 cursor-pointer'
                }`}
              >
                <label className={`flex items-start gap-2.5 ${!isTelegramReady || !isQldttxAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={!isTelegramReady || !isQldttxAvailable}
                    checked={isTelegramReady && isQldttxAvailable && notifyClassSchedule}
                    onChange={(e) => isTelegramReady && isQldttxAvailable && setNotifyClassSchedule(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                  />
                  <div className="text-xs flex-1">
                    <div className="font-bold flex items-center justify-between gap-1">
                      <span className={isTelegramReady && isQldttxAvailable ? 'text-amber-900' : 'text-slate-500'}>
                        Lịch Học & Thời Khóa Biểu
                      </span>
                      {!isTelegramReady ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Khóa
                        </span>
                      ) : !isQldttxAvailable ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          {isQldttxError ? 'Lỗi xác thực' : 'Chưa liên kết'}
                        </span>
                      ) : null}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isTelegramReady && isQldttxAvailable ? 'text-amber-700' : 'text-slate-400'}`}>
                      {!isTelegramReady
                        ? 'Yêu cầu cấu hình & test Telegram thành công.'
                        : !isQldttxAvailable
                        ? isQldttxError
                          ? 'Mật khẩu QLDTTX sai/hết hạn. Cần cập nhật lại.'
                          : 'Yêu cầu liên kết tài khoản Cổng QLDTTX.'
                        : 'Tổng hợp sáng 7h-10h & nhắc trước giờ học'}
                    </div>
                  </div>
                </label>
              </div>

              {/* Option 3: Class Activity */}
              <label className={`flex items-start gap-2.5 p-3 rounded-xl border transition-colors ${
                !isTelegramReady
                  ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                  : 'bg-white border-slate-200 hover:border-sky-300 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  disabled={!isTelegramReady}
                  checked={isTelegramReady && notifyClassActivity}
                  onChange={(e) => isTelegramReady && setNotifyClassActivity(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                />
                <div className="text-xs flex-1">
                  <div className="font-bold flex items-center justify-between gap-1">
                    <span className={isTelegramReady ? 'text-slate-800' : 'text-slate-500'}>Biến Động Lớp Học</span>
                    {!isTelegramReady && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Khóa
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Phân công nước uống & bù trừ lớp</div>
                </div>
              </label>

              {/* Option 5: QLDTTX Portal Announcements (Requires Telegram Ready & QLDTTX) */}
              <div
                className={`p-3 rounded-xl border transition-all sm:col-span-2 lg:col-span-2 ${
                  !isTelegramReady || !isQldttxAvailable
                    ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-sky-300 bg-sky-50/40 hover:border-sky-400 cursor-pointer'
                }`}
              >
                <label className={`flex items-start gap-2.5 ${!isTelegramReady || !isQldttxAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={!isTelegramReady || !isQldttxAvailable}
                    checked={isTelegramReady && isQldttxAvailable && notifyQldtAnnouncements}
                    onChange={(e) => isTelegramReady && isQldttxAvailable && setNotifyQldtAnnouncements(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-sky-600 rounded focus:ring-sky-500 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                  />
                  <div className="text-xs flex-1">
                    <div className="font-bold flex items-center justify-between gap-1">
                      <span className={isTelegramReady && isQldttxAvailable ? 'text-sky-900' : 'text-slate-500'}>
                        Thông Báo Cổng QLDTTX
                      </span>
                      {!isTelegramReady ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Khóa
                        </span>
                      ) : !isQldttxAvailable ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          {isQldttxError ? 'Lỗi xác thực' : 'Chưa liên kết'}
                        </span>
                      ) : null}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isTelegramReady && isQldttxAvailable ? 'text-sky-700' : 'text-slate-400'}`}>
                      {!isTelegramReady
                        ? 'Yêu cầu cấu hình & test Telegram thành công.'
                        : !isQldttxAvailable
                        ? isQldttxError
                          ? 'Mật khẩu QLDTTX sai/hết hạn. Cần cập nhật lại.'
                          : 'Yêu cầu liên kết tài khoản Cổng QLDTTX.'
                        : '/#/xemthongbao (Thông báo mới từ Học viện)'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Class Schedule Setting Panel */}
            {isTelegramReady && isQldttxAvailable && notifyClassSchedule && (
              <div className="mt-2 p-3 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Tự động nhắc lịch học & thời khóa biểu:</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Sáng từ <strong>7h00 - 10h00</strong> tự động gửi tổng hợp các ca học hôm nay. Chọn thời gian nhắc nhở:
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { value: 30, label: '30 phút trước' },
                    { value: 60, label: '1 tiếng trước' },
                    { value: 0, label: 'Cả 30p & 1 tiếng' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setClassReminderBefore(item.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        classReminderBefore === item.value
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleCheckClassScheduleNow}
                    disabled={isCheckingClassSchedule || isCheckingNearestClassSchedule}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Kiểm tra lịch học hôm nay và gửi tin nhắn thử nghiệm ngay"
                  >
                    {isCheckingClassSchedule ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Kiểm Tra Hôm Nay</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckNearestClassSchedule}
                    disabled={isCheckingNearestClassSchedule || isCheckingClassSchedule}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Quét lịch học gần nhất trong 10 ngày tới và gửi thông báo Telegram nếu có"
                  >
                    {isCheckingNearestClassSchedule ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CalendarDays className="w-3 h-3" />}
                    <span>Quét Lịch 10 Ngày Tới</span>
                  </button>
                </div>
              </div>
            )}

            {isTelegramReady && classScheduleCheckMsg && (
              <div className="p-3 bg-amber-50/80 border border-amber-300 text-amber-900 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{classScheduleCheckMsg}</span>
              </div>
            )}

            {isTelegramReady && nearestClassScheduleMsg && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{nearestClassScheduleMsg}</span>
              </div>
            )}

            {/* QLDTTX Check Interval Selector */}
            {isTelegramReady && isQldttxAvailable && notifyQldtAnnouncements && (
              <div className="mt-1 p-3 sm:p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-0.5">
                  <div className="font-bold text-sky-900 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Tần suất kiểm tra thông báo mới từ QLDTTX:</span>
                  </div>
                  <div className="text-[11px] text-sky-700">
                    Hệ thống sẽ quét định kỳ trang <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao" target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-800 hover:text-sky-950">/#/xemthongbao</a> và bắn tin nhắn khi có thông báo mới.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { value: 1, label: '1 tiếng' },
                    { value: 2, label: '2 tiếng (Khuyên dùng)' },
                    { value: 5, label: '5 tiếng' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setQldtCheckInterval(item.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        qldtCheckInterval === item.value
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleCheckQldtNow}
                    disabled={isCheckingQldt}
                    className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
                    title="Kiểm tra thông báo ngay lập tức"
                  >
                    {isCheckingQldt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>Kiểm Tra Ngay</span>
                  </button>
                </div>
              </div>
            )}

            {isTelegramReady && qldtCheckMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{qldtCheckMsg}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Delete / Clear button */}
            {isConnected ? (
              <button
                type="button"
                onClick={handleDelete}
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
                onClick={handleTest}
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
        </form>
      </div>

      {/* Telegram Message Preview Card */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3.5 sm:mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Mẫu Tin Nhắn Telegram ({!isCustomBot ? 'Bot Hệ Thống' : 'Bot Riêng'})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">HTML Format</span>
        </div>

        <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-700/60 font-mono text-xs text-slate-200 leading-relaxed max-w-lg overflow-x-auto">
          <div className="font-bold text-sky-300 mb-1">🤖 THÔNG BÁO THỬ NGHIỆM - PTIT WEB TOOL</div>
          <div className="text-slate-500 mb-2">━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          <div className="text-emerald-400 font-bold mb-2">
            🎉 Chúc mừng! Cấu hình Telegram Bot đã hoạt động chính xác.
          </div>
          <div className="text-slate-300">
            👤 <b>Họ và tên:</b> {currentUser?.fullName || currentUser?.username || 'Nguyễn Văn A'}<br />
            🆔 <b>Mã sinh viên:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{currentUser?.username || 'B25DCCN001'}</code><br />
            🏫 <b>Lớp:</b> <b>{currentUser?.lop || 'D25TXCN11-K'}</b><br />
            🤖 <b>Bot gửi:</b> <b>{activeBotUsername ? `@${activeBotUsername}` : '@PTIT_Notification_bot'}</b><br />
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

      {/* Topic Selector Popup Modal */}
      <TelegramTopicSelectorModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        botToken={isCustomBot ? botToken : undefined}
        chatId={chatId}
        currentSelectedThreadId={threadId}
        onSelectTopic={(topic) => {
          setThreadId(topic.threadId);
          setSelectedTopicName(topic.name);
          setSuccessMsg(`Đã chọn Topic: "${topic.name}" (ID: ${topic.threadId})`);
          setTimeout(() => setSuccessMsg(''), 3000);
        }}
      />
    </div>
  );
}
