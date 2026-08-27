import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Key,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare,
  Hash,
  Filter,
  Check,
  Copy,
  CheckCheck,
  Play,
  Pause,
  Trash2,
  Layers,
  Sparkles,
  Zap,
  Radio,
  Clock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  BellRing,
  Calendar,
  CalendarDays,
  BookOpen,
  Sun,
  Flame,
  Database,
  HardDrive,
  AlarmClock,
  Bell,
  SendHorizontal,
  Activity,
  Inbox,
  AlertTriangle,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import TelegramAutoDetectModal from './TelegramAutoDetectModal';
import { parseTelegramInput, parseTopicInput } from '../utils/telegramParser';

interface SubscriberItem {
  id: number;
  username: string;
  fullName: string;
  maLop: string;
  soDienThoai: string;
  isCustomBot: boolean;
  botToken: string;
  rawBotToken?: string;
  chatId: string;
  threadId?: string | null;
  isEnabled: boolean;
  notifyExamSchedule: boolean;
  notifyClassActivity: boolean;
  notifyQldtAnnouncements?: boolean;
  qldtCheckInterval?: number;
  lastQldtCheckedAt?: string | null;
  notifySlinkAnnouncements?: boolean;
  slinkCheckInterval?: number;
  lastSlinkCheckedAt?: string | null;
  notifyClassSchedule?: boolean;
  classReminderBefore?: number;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastTestError: string | null;
  botUsername: string | null;
  botFirstName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminTelegramBotManagerProps {
  currentUser: LoginUser;
}

export default function AdminTelegramBotManager({ currentUser }: AdminTelegramBotManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'SUBSCRIBERS' | 'REMINDERS' | 'BROADCAST' | 'BACKUP_ALERTS' | 'QUEUE'>('CONFIG');
  const [isLoading, setIsLoading] = useState(true);

  // Global bot state
  const [systemBot, setSystemBot] = useState<any | null>(null);
  const [systemBotConfig, setSystemBotConfig] = useState<any | null>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);

  // Global Queue state
  const [queueStats, setQueueStats] = useState<any | null>(null);
  const [isClearingQueue, setIsClearingQueue] = useState(false);
  const [isTogglingQueuePause, setIsTogglingQueuePause] = useState(false);
  const [isFetchingQueue, setIsFetchingQueue] = useState(false);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'CUSTOM' | 'SYSTEM'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Direct Test state
  const [testChatId, setTestChatId] = useState('');
  const [testThreadId, setTestThreadId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isAdminAutoDetectOpen, setIsAdminAutoDetectOpen] = useState(false);
  const [adminDetectTarget, setAdminDetectTarget] = useState<'TEST' | 'BACKUP'>('TEST');

  // Exam Reminders state
  const [isTriggeringReminders, setIsTriggeringReminders] = useState(false);
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [forceAllReminders, setForceAllReminders] = useState(false);
  const [reminderRunResult, setReminderRunResult] = useState<any | null>(null);

  // Class Schedule Reminders state (10 days scan)
  const [isTriggeringClassReminders, setIsTriggeringClassReminders] = useState(false);
  const [classReminderDays, setClassReminderDays] = useState<number>(10);
  const [classReminderRunResult, setClassReminderRunResult] = useState<any | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // Backup & Admin Alerts Configuration state
  const [backupConfig, setBackupConfig] = useState<any | null>(null);
  const [telChatId, setTelChatId] = useState('');
  const [telThreadId, setTelThreadId] = useState('');
  const [telIsEnabled, setTelIsEnabled] = useState(true);
  const [telSendSql, setTelSendSql] = useState(true);
  const [telAutoBackupEnabled, setTelAutoBackupEnabled] = useState(true);
  const [telScheduleTime, setTelScheduleTime] = useState('10:00');
  const [telNotifyOnDbBackup, setTelNotifyOnDbBackup] = useState(true);
  const [telNotifyOnNewUser, setTelNotifyOnNewUser] = useState(true);
  const [telNotifyOnDbRestore, setTelNotifyOnDbRestore] = useState(true);
  const [telNotifyOnExamBatchImport, setTelNotifyOnExamBatchImport] = useState(true);
  const [useCustomBackupBot, setUseCustomBackupBot] = useState(false);
  const [telBackupBotToken, setTelBackupBotToken] = useState('');
  const [isSavingBackupConfig, setIsSavingBackupConfig] = useState(false);
  const [isTestingBackupConfig, setIsTestingBackupConfig] = useState(false);
  const [isSendingInstantBackup, setIsSendingInstantBackup] = useState(false);
  const [backupTestResult, setBackupTestResult] = useState<any | null>(null);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [res, backupRes] = await Promise.all([
        fetch('/api/telegram-config?view=all'),
        fetch('/api/backup').catch(() => null),
      ]);

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribers(data.configs || []);
        setSystemBot(data.systemBot || null);
        if (data.queueStats) {
          setQueueStats(data.queueStats);
        }
        if (data.systemBotConfig) {
          setSystemBotConfig(data.systemBotConfig);
          setBotTokenInput(data.systemBotConfig.botToken || '');
          setBotDescription(data.systemBotConfig.description || '');
        }

        if (data.telegramAdmin) {
          setTelChatId(data.telegramAdmin.chatId || '');
          setTelThreadId(data.telegramAdmin.threadId || '');
          setTelIsEnabled(data.telegramAdmin.isEnabled !== false);
          setTelNotifyOnDbBackup(data.telegramAdmin.notifyOnDbBackup !== false);
          setTelNotifyOnNewUser(data.telegramAdmin.notifyOnNewUser !== false);
          setTelNotifyOnDbRestore(data.telegramAdmin.notifyOnDbRestore !== false);
          setTelNotifyOnExamBatchImport(data.telegramAdmin.notifyOnExamBatchImport !== false);
          if (data.telegramAdmin.botToken) {
            setUseCustomBackupBot(true);
            setTelBackupBotToken(data.telegramAdmin.botToken);
          }
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu cấu hình Telegram.');
      }

      if (backupRes && backupRes.ok) {
        const backupData = await backupRes.json();
        if (backupData.telegramConfig) {
          setBackupConfig(backupData.telegramConfig);
          if (!data?.telegramAdmin?.chatId) {
            setTelChatId(backupData.telegramConfig.chatId || '');
            setTelThreadId(backupData.telegramConfig.threadId || '');
          }
          setTelSendSql(backupData.telegramConfig.sendSql !== false);
          setTelAutoBackupEnabled(backupData.telegramConfig.autoBackupEnabled !== false);
          setTelScheduleTime(backupData.telegramConfig.scheduleTime || '10:00');
        }
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      setIsFetchingQueue(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_QUEUE_STATS' }),
      });
      const data = await res.json();
      if (res.ok && data.queueStats) {
        setQueueStats(data.queueStats);
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingQueue(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ tin nhắn đang chờ trong hàng đợi Telegram?')) return;
    try {
      setIsClearingQueue(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_QUEUE' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (data.queueStats) setQueueStats(data.queueStats);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Xóa hàng đợi thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xóa hàng đợi');
    } finally {
      setIsClearingQueue(false);
    }
  };

  const handleToggleQueuePause = async (pause: boolean) => {
    try {
      setIsTogglingQueuePause(true);
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_QUEUE_PAUSE', isPaused: pause }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (data.queueStats) setQueueStats(data.queueStats);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi cập nhật trạng thái hàng đợi');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi cập nhật trạng thái hàng đợi');
    } finally {
      setIsTogglingQueuePause(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poll queue stats when on QUEUE tab or when there are pending items
  useEffect(() => {
    if (activeSubTab === 'QUEUE') {
      fetchQueueStats();
      const interval = setInterval(fetchQueueStats, 2500);
      return () => clearInterval(interval);
    }
  }, [activeSubTab]);

  // Save Global System Bot
  const handleSaveGlobalBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) {
      setErrorMsg('Vui lòng nhập Telegram Bot API Token.');
      return;
    }

    setIsSavingBot(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SYSTEM_BOT',
          botToken: botTokenInput.trim(),
          description: botDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã lưu cấu hình Bot Hệ Thống thành công!');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Không thể lưu Bot Hệ Thống.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsSavingBot(false);
    }
  };

  // Toggle Global Bot Active/Pause
  const handleToggleGlobalBot = async () => {
    if (!systemBotConfig) return;
    const newStatus = !systemBotConfig.isActive;

    setIsTogglingBot(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_SYSTEM_BOT',
          isActive: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã cập nhật trạng thái Bot Hệ Thống.');
        fetchData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể cập nhật trạng thái.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsTogglingBot(false);
    }
  };

  // Admin Direct Test Message
  const handleAdminTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID người nhận để gửi thử nghiệm.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          chatId: testChatId.trim(),
          threadId: testThreadId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Đã gửi tin nhắn thử nghiệm thành công!',
          botInfo: data.botInfo,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Gửi tin nhắn thử nghiệm thất bại.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi gửi tin nhắn.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Run Exam Schedule Reminders (Cron Dispatcher)
  const handleRunReminders = async () => {
    setIsTriggeringReminders(true);
    setReminderRunResult(null);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (forceAllReminders) params.append('force', 'true');
      if (customReminderDate.trim()) params.append('date', customReminderDate.trim());

      const res = await fetch(`/api/cron/exam-reminders?${params.toString()}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReminderRunResult(data);
        setSuccessMsg(`Quét nhắc lịch thi hoàn tất: Đã gửi ${data.reminders1DaySent} nhắc trước 1 ngày, ${data.remindersSameDaySent} nhắc 7h sáng hôm thi.`);
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setReminderRunResult({
          success: false,
          error: data.error || 'Lỗi khi kích hoạt quét nhắc lịch thi.',
        });
      }
    } catch (err: any) {
      setReminderRunResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi chạy quét nhắc lịch thi.',
      });
    } finally {
      setIsTriggeringReminders(false);
    }
  };

  // Run Nearest Class Schedule Scan (10 days) for all subscribers
  const handleRunClassNearestReminders = async () => {
    setIsTriggeringClassReminders(true);
    setClassReminderRunResult(null);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/cron/class-reminders?type=nearest&days=${classReminderDays}&force=true`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClassReminderRunResult(data);
        setSuccessMsg(
          `Quét lịch học gần nhất hoàn tất: Đã gửi thông báo tới ${data.totalSent} sinh viên có lịch học trong ${classReminderDays} ngày tới.`
        );
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setClassReminderRunResult({
          success: false,
          error: data.error || 'Lỗi khi kích hoạt quét lịch học gần nhất.',
        });
      }
    } catch (err: any) {
      setClassReminderRunResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi chạy quét lịch học.',
      });
    } finally {
      setIsTriggeringClassReminders(false);
    }
  };

  // Send Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung phát sóng.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn gửi phát sóng thông báo này tới ${subscribers.filter(s => s.isEnabled).length} tài khoản đang nhận thông báo không?`)) {
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BROADCAST',
          title: broadcastTitle.trim(),
          content: broadcastContent.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastResult({
          success: true,
          message: data.message,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
        });
        setBroadcastTitle('');
        setBroadcastContent('');
      } else {
        setBroadcastResult({
          success: false,
          error: data.error || 'Phát sóng thông báo thất bại.',
        });
      }
    } catch (err) {
      setBroadcastResult({
        success: false,
        error: 'Lỗi kết nối máy chủ khi gửi phát sóng.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Save Backup & Admin Alerts Configuration (telegram_admin & backup_telegram)
  const handleSaveBackupTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID nhận thông báo và sao lưu.');
      return;
    }
    setIsSavingBackupConfig(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const [resAdmin, resBackup] = await Promise.all([
        fetch('/api/telegram-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_ADMIN_CONFIG',
            chatId: telChatId.trim(),
            threadId: telThreadId.trim() || null,
            botToken: useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
            isEnabled: telIsEnabled,
            notifyOnNewUser: telNotifyOnNewUser,
            notifyOnDbBackup: telNotifyOnDbBackup,
            notifyOnDbRestore: telNotifyOnDbRestore,
            notifyOnExamBatchImport: true,
          }),
        }),
        fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_TELEGRAM_CONFIG',
            chatId: telChatId.trim(),
            threadId: telThreadId.trim() || null,
            botToken: useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
            isEnabled: telIsEnabled,
            sendSql: telSendSql,
            sendSqlite: telSendSql,
            autoBackupEnabled: telAutoBackupEnabled,
            scheduleTime: telScheduleTime || '10:00',
            notifyOnDbBackup: telNotifyOnDbBackup,
            notifyOnNewUser: telNotifyOnNewUser,
            notifyOnDbRestore: telNotifyOnDbRestore,
          }),
        }),
      ]);

      const dataAdmin = await resAdmin.json();
      const dataBackup = await resBackup.json();

      if (resAdmin.ok && resBackup.ok) {
        setSuccessMsg('Đã lưu cấu hình kênh thông báo Admin (telegram_admin) & sao lưu thành công!');
        if (dataBackup.telegramConfig) setBackupConfig(dataBackup.telegramConfig);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(dataAdmin.error || dataBackup.error || 'Lưu cấu hình Telegram thất bại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi lưu cấu hình.');
    } finally {
      setIsSavingBackupConfig(false);
    }
  };

  // Test Ping Backup / Admin Destination (telegram_admin)
  const handleTestBackupTelegram = async () => {
    if (!telChatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID để kiểm tra.');
      return;
    }
    setIsTestingBackupConfig(true);
    setBackupTestResult(null);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_ADMIN_TARGET',
          chatId: telChatId.trim(),
          threadId: telThreadId.trim() || null,
          botToken: useCustomBackupBot && telBackupBotToken.trim() ? telBackupBotToken.trim() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupTestResult({ success: true, message: data.message || 'Đã gửi tin nhắn kiểm tra thành công tới kênh Admin!' });
      } else {
        setBackupTestResult({ success: false, error: data.error || 'Kiểm tra kết nối thất bại.' });
      }
    } catch {
      setBackupTestResult({ success: false, error: 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsTestingBackupConfig(false);
    }
  };

  // Instant Manual Backup and Send
  const handleSendInstantBackupToTelegram = async () => {
    setIsSendingInstantBackup(true);
    setErrorMsg('');
    setSuccessMsg('Đang thực hiện sao lưu toàn bộ dữ liệu PostgreSQL sang file .sql và gửi lên Telegram...');
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEND_TELEGRAM', format: 'sql' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã gửi file sao lưu lên Telegram thành công!');
        if (data.telegramConfig) setBackupConfig(data.telegramConfig);
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.error || 'Gửi file sao lưu lên Telegram thất bại.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ khi gửi sao lưu.');
    } finally {
      setIsSendingInstantBackup(false);
    }
  };

  // Filter Subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        sub.username.toLowerCase().includes(query) ||
        sub.fullName.toLowerCase().includes(query) ||
        sub.maLop.toLowerCase().includes(query) ||
        sub.chatId.toLowerCase().includes(query) ||
        (sub.botUsername && sub.botUsername.toLowerCase().includes(query));

      let matchFilter = true;
      if (filterStatus === 'ACTIVE') matchFilter = sub.isEnabled;
      if (filterStatus === 'INACTIVE') matchFilter = !sub.isEnabled;
      if (filterStatus === 'CUSTOM') matchFilter = sub.isCustomBot;
      if (filterStatus === 'SYSTEM') matchFilter = !sub.isCustomBot;

      return matchSearch && matchFilter;
    });
  }, [subscribers, searchQuery, filterStatus]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalActive = subscribers.filter((s) => s.isEnabled).length;
  const totalSystemBotUsers = subscribers.filter((s) => !s.isCustomBot).length;
  const isAdmin = Boolean(
    currentUser?.activeRole === 'admin' ||
    (currentUser?.isAdmin && currentUser?.activeRole !== 'sinh_vien' && currentUser?.activeRole !== 'lop_truong') ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto my-8">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Màn hình Quản trị Bot Toàn Cục chỉ hiển thị và cho phép truy cập với người quản trị (Admin).
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-sm font-medium">Đang tải trung tâm quản trị Telegram Bot...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-6 text-white/10">
          <Bot className="w-28 h-28 stroke-[1.2]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-sky-300 mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản Trị Hệ Thống Thông Báo Telegram (Admin)</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black mb-2 tracking-tight">
            Cấu Hình Bot Toàn Cục & Tự Động Nhắc Lịch Thi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thiết lập Bot Telegram đại diện toàn trường trong bảng cấu hình mở rộng <code className="text-sky-300 font-mono font-bold">GlobalConfig</code> (key: <code className="text-sky-200 font-mono">telegram_bot</code>), quản lý các kênh/nhóm đăng ký nhận tin của sinh viên và kích hoạt tự động nhắc lịch thi trước 1 ngày & lúc 7h sáng hôm thi.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Trạng thái Bot</div>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                {systemBot?.isConfigured && systemBotConfig?.isActive ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Hoạt động</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>Chưa sẵn sàng</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Tổng Đăng Ký</div>
              <div className="text-base font-black text-sky-300 mt-0.5 font-mono">
                {subscribers.length} <span className="text-xs font-normal text-slate-300">kênh</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Đang Nhận Tin</div>
              <div className="text-base font-black text-emerald-300 mt-0.5 font-mono">
                {totalActive} <span className="text-xs font-normal text-slate-300">tài khoản</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Dùng Bot Hệ Thống</div>
              <div className="text-base font-black text-amber-300 mt-0.5 font-mono">
                {totalSystemBotUsers} <span className="text-xs font-normal text-slate-300">({Math.round((totalSystemBotUsers / (subscribers.length || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('CONFIG')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CONFIG'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>1. Cấu Hình Bot Hệ Thống (Global)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SUBSCRIBERS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'SUBSCRIBERS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Danh Sách Người Nhận ({subscribers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('REMINDERS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'REMINDERS'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>3. Tự Động Nhắc Lịch Thi (Cron)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BROADCAST')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'BROADCAST'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>4. Phát Sóng Thông Báo (Broadcast)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('BACKUP_ALERTS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'BACKUP_ALERTS'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>5. Cấu Hình Sao Lưu & Thông Báo Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('QUEUE')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'QUEUE'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>6. Hàng Đợi Gửi Tin (Global Queue)</span>
          {queueStats && queueStats.pending > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse shadow-sm">
              {queueStats.pending}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: GLOBAL BOT CONFIGURATION */}
      {activeSubTab === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bot Settings Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Cấu Hình Telegram Bot Toàn Cục
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lưu trữ trong bảng PostgreSQL <code className="font-mono text-indigo-600">GlobalConfig</code> (key: <code className="font-mono text-slate-600">telegram_bot</code>)
                  </p>
                </div>
              </div>

              {systemBotConfig && (
                <button
                  type="button"
                  onClick={handleToggleGlobalBot}
                  disabled={isTogglingBot}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    systemBotConfig.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {systemBotConfig.isActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đang Kích Hoạt (Tạm dừng)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-slate-600" />
                      <span>Đang Tạm Dừng (Kích hoạt)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <form onSubmit={handleSaveGlobalBot} className="flex flex-col gap-5">
              {/* Bot Token Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Telegram Bot API Token Toàn Hệ Thống</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Từ @BotFather</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="Ví dụ: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 pr-20 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
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

              {/* Bot Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mô Tả / Ghi Chú Bot Hệ Thống
                </label>
                <input
                  type="text"
                  value={botDescription}
                  onChange={(e) => setBotDescription(e.target.value)}
                  placeholder="Ví dụ: Bot Telegram thông báo chính thức của PTIT EduSync"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={fetchData}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tải Lại</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingBot}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingBot ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu & Xác Thực Bot Hệ Thống</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bot Live Card & Fast Links */}
          <div className="flex flex-col gap-6">
            {/* Live Bot Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold">
                    Official Bot Card
                  </span>
                  {systemBot?.isConfigured && (
                    <span className="px-2 py-0.5 bg-emerald-400/30 border border-emerald-300 text-emerald-100 text-[10px] font-bold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                      Online
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {systemBot?.botFirstName || 'PTIT EduSync Official Bot'}
                    </h4>
                    <p className="text-xs text-indigo-100 font-mono font-bold">
                      {systemBot?.botUsername ? `@${systemBot.botUsername}` : 'Chưa thiết lập'}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-100 leading-relaxed mb-4">
                  Bot hệ thống dùng chung giúp sinh viên nhận thông báo ca thi, môn thi và học vụ mà không cần tạo bot riêng.
                </p>
              </div>

              {systemBot?.botUsername && (
                <div className="flex flex-col gap-2 pt-3 border-t border-white/20">
                  <a
                    href={systemBot.botUrl || `https://t.me/${systemBot.botUsername}?start=start`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-white hover:bg-slate-100 text-indigo-700 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mở Bot Trên Telegram</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={systemBot.addToGroupUrl || `https://t.me/${systemBot.botUsername}?startgroup=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 border border-white/20"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Thêm Bot Vào Nhóm Lớp</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              )}
            </div>

            {/* Test Send Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Gửi Thử Tin Nhắn Từ Bot Hệ Thống</span>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? testResult.message : testResult.error}
                </div>
              )}

              <form onSubmit={handleAdminTest} className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Chat ID người nhận
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminDetectTarget('TEST');
                        setIsAdminAutoDetectOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 cursor-pointer"
                    >
                      <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
                      <span>Bắt ID Tự Động</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseTelegramInput(val);
                      if (parsed.isLink && parsed.chatId) {
                        setTestChatId(parsed.chatId);
                        if (parsed.threadId) setTestThreadId(parsed.threadId);
                      } else if (parsed.username && parsed.isLink) {
                        setTestChatId(parsed.username);
                        if (parsed.threadId) setTestThreadId(parsed.threadId);
                      } else {
                        setTestChatId(val);
                      }
                    }}
                    placeholder="Ví dụ: 123456789 hoặc dán link Telegram"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Thread ID (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={testThreadId}
                    onChange={(e) => {
                      const parsedTopic = parseTopicInput(e.target.value);
                      setTestThreadId(parsedTopic || e.target.value);
                    }}
                    placeholder="Ví dụ: 24 (hoặc dán link topic)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTesting || !testChatId}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>Gửi Thử Nghiệm Ngay</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIBERS LIST & METRICS */}
      {activeSubTab === 'SUBSCRIBERS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Danh Sách Kênh & Tài Khoản Đã Liên Kết ({filteredSubscribers.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ sinh viên, lớp trưởng đã cấu hình nhận thông báo qua Telegram.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo Mã SV, họ tên, lớp, Chat ID..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang Bật nhận tin</option>
                <option value="INACTIVE">Đang Tắt</option>
                <option value="SYSTEM">Dùng Bot Hệ Thống</option>
                <option value="CUSTOM">Dùng Bot Riêng</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Sinh Viên / Tài Khoản</th>
                  <th className="py-3 px-4">Lớp Học</th>
                  <th className="py-3 px-4">Loại Bot</th>
                  <th className="py-3 px-4">Chat ID & Topic</th>
                  <th className="py-3 px-4">Bộ Lọc Nhận Tin</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Lần Test Gần Nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSubscribers.length > 0 ? (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sub.fullName}</div>
                        <div className="font-mono text-[11px] text-indigo-600 font-bold">{sub.username}</div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                          {sub.maLop}
                        </span>
                      </td>

                      {/* Bot Type */}
                      <td className="py-3 px-4">
                        {sub.isCustomBot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold">
                            <Key className="w-3 h-3 text-indigo-500" />
                            <span>Bot Riêng</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[11px] font-bold">
                            <Globe className="w-3 h-3 text-sky-500" />
                            <span>Bot Hệ Thống</span>
                          </span>
                        )}
                        {sub.botUsername && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">@{sub.botUsername}</div>
                        )}
                      </td>

                      {/* Chat ID & Thread */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                          <span>{sub.chatId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.chatId, `chat-${sub.id}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Sao chép Chat ID"
                          >
                            {copiedId === `chat-${sub.id}` ? (
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {sub.threadId && (
                          <span className="inline-block mt-0.5 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-mono border border-sky-200">
                            Topic #{sub.threadId}
                          </span>
                        )}
                      </td>

                      {/* Notification Filters */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {sub.notifyExamSchedule && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">
                              Lịch Thi
                            </span>
                          )}
                          {sub.notifyClassActivity && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">
                              Lớp Học
                            </span>
                          )}
                          {sub.notifyClassSchedule && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                              Lịch Học ({sub.classReminderBefore === 0 ? '30p & 1h' : `${sub.classReminderBefore || 30}p`})
                            </span>
                          )}
                          {sub.notifyQldtAnnouncements && (
                            <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold">
                              QLDTTX ({sub.qldtCheckInterval || 2}h)
                            </span>
                          )}
                          {sub.notifySlinkAnnouncements && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                              S-Link ({sub.slinkCheckInterval || 2}h)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Enabled Status */}
                      <td className="py-3 px-4">
                        {sub.isEnabled ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang Nhận
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Đang Tắt
                          </span>
                        )}
                      </td>

                      {/* Last Tested Status */}
                      <td className="py-3 px-4">
                        {sub.lastTestStatus === 'SUCCESS' ? (
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Thành công</span>
                          </span>
                        ) : sub.lastTestStatus === 'FAILED' ? (
                          <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1" title={sub.lastTestError || ''}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Thất bại</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa test</span>
                        )}
                        {sub.lastTestedAt && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(sub.lastTestedAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy tài khoản Telegram nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULED EXAM REMINDERS (CRON & TIMERS) */}
      {activeSubTab === 'REMINDERS' && (
        <div className="flex flex-col gap-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 font-black text-sm text-amber-900 mb-2">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Mốc 1: Nhắc Trước Ngày Thi 1 Ngày</span>
                </div>
                <p className="text-xs text-amber-800/80 leading-relaxed mb-4">
                  Hệ thống tự động quét và gửi danh sách các ca thi của <strong>ngày mai</strong> tới toàn bộ sinh viên có lịch thi để chuẩn bị kỹ càng phòng thi, SBD và giấy tờ.
                </p>
              </div>
              <div className="bg-white/80 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 font-mono">
                📅 Trigger: Hàng ngày quét ca thi ngày <code>T + 1</code>
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 font-black text-sm text-sky-900 mb-2">
                  <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span>Mốc 2: Nhắc 7:00 Sáng Đúng Hôm Thi (Giờ VN)</span>
                </div>
                <p className="text-xs text-sky-800/80 leading-relaxed mb-4">
                  Vào đúng <strong>7:00 sáng (Giờ Việt Nam - UTC+7)</strong> ngày thi, hệ thống gửi thông báo chúc thi tốt và nhắc nhở chi tiết ca thi trong ngày hôm đó.
                </p>
              </div>
              <div className="bg-white/80 rounded-2xl p-3 border border-sky-200 text-xs text-sky-900 font-mono">
                ⏰ Trigger: 07:00 AM VN (00:00 UTC) ngày <code>T</code>
              </div>
            </div>
          </div>

          {/* Trigger Runner Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Trình Điều Khiển Quét & Nhắc Lịch Thi Tự Động
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sử dụng bảng theo dõi <code className="font-mono text-indigo-600">ExamReminderLog</code> để đảm bảo không gửi trùng lặp.
                  </p>
                </div>
              </div>
            </div>

            {reminderRunResult && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 animate-in fade-in ${
                  reminderRunResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {reminderRunResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {reminderRunResult.success ? 'Quét nhắc lịch thi hoàn tất!' : 'Lỗi khi quét nhắc lịch thi'}
                  </div>
                  {reminderRunResult.success ? (
                    <div className="font-normal text-xs mt-1 leading-relaxed opacity-90">
                      • Thời gian VN: <b>{reminderRunResult.timestampVN}</b><br />
                      • Ngày hôm nay quét: <code>{reminderRunResult.todayStr}</code> ➔ Đã gửi <b>{reminderRunResult.remindersSameDaySent}</b> ca thi (7h sáng)<br />
                      • Ngày mai quét: <code>{reminderRunResult.tomorrowStr}</code> ➔ Đã gửi <b>{reminderRunResult.reminders1DaySent}</b> ca thi (trước 1 ngày)<br />
                      • Tổng sinh viên có bật nhận lịch thi: <b>{reminderRunResult.totalSubscribers}</b>
                    </div>
                  ) : (
                    <div className="font-normal text-xs mt-1">{reminderRunResult.error}</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngày Thử Nghiệm Tùy Chọn (Mặc định là Hôm Nay theo Giờ VN)
                </label>
                <input
                  type="text"
                  value={customReminderDate}
                  onChange={(e) => setCustomReminderDate(e.target.value)}
                  placeholder="Ví dụ: 16/08/2026 (để trống để lấy ngày thực tế)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Định dạng: <code className="font-mono font-bold">DD/MM/YYYY</code>.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={forceAllReminders}
                    onChange={(e) => setForceAllReminders(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs font-bold text-slate-700">
                    <span>Bỏ qua kiểm tra đã gửi (Gửi lại toàn bộ - Force All)</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-mono">
                API Endpoint: <code>GET /api/cron/exam-reminders</code>
              </div>

              <button
                type="button"
                onClick={handleRunReminders}
                disabled={isTriggeringReminders}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTriggeringReminders ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang quét ca thi & gửi nhắc nhở...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    <span>Chạy Quét & Gửi Nhắc Lịch Thi Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Class Schedule Scanner Card (10 Days Ahead) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Trình Quét Lịch Học Gần Nhất (Trong 10 Ngày Tới)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quét thời khóa biểu của toàn bộ sinh viên, tìm ngày học gần nhất trong 10 ngày tới và gửi thông báo qua Telegram nếu có lịch học.
                  </p>
                </div>
              </div>
            </div>

            {classReminderRunResult && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 animate-in fade-in ${
                  classReminderRunResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {classReminderRunResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {classReminderRunResult.success ? 'Quét lịch học gần nhất hoàn tất!' : 'Lỗi khi quét lịch học'}
                  </div>
                  {classReminderRunResult.success ? (
                    <div className="font-normal text-xs mt-1 leading-relaxed opacity-90">
                      • Đã quét trong vòng: <b>{classReminderRunResult.maxDays} ngày tới</b><br />
                      • Tổng sinh viên có bật nhận lịch học: <b>{classReminderRunResult.totalSubscribers}</b><br />
                      • Đã gửi thông báo thành công: <b>{classReminderRunResult.totalSent}</b> tài khoản (Không có lịch: {classReminderRunResult.notFoundCount})
                    </div>
                  ) : (
                    <div className="font-normal text-xs mt-1">{classReminderRunResult.error}</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số Ngày Quét Tới (Mặc định: 10 Ngày)
                </label>
                <div className="flex items-center gap-2">
                  {[7, 10, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setClassReminderDays(days)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        classReminderDays === days
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Khi kích hoạt, hệ thống sẽ kiểm tra từng ngày từ hôm nay đến {classReminderDays} ngày tới. Nếu tìm thấy ngày có ca học đầu tiên, hệ thống sẽ trích xuất chi tiết và gửi thông báo Telegram cho sinh viên.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-mono">
                API Endpoint: <code>GET /api/cron/class-reminders?type=nearest&days={classReminderDays}</code>
              </div>

              <button
                type="button"
                onClick={handleRunClassNearestReminders}
                disabled={isTriggeringClassReminders}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTriggeringClassReminders ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang quét lịch học & gửi Telegram...</span>
                  </>
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4" />
                    <span>Quét Lịch Học Gần Nhất ({classReminderDays} Ngày) Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST ANNOUNCEMENT */}
      {activeSubTab === 'BROADCAST' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6 max-w-4xl">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Phát Sóng Thông Báo Toàn Trường Qua Telegram
                </h3>
                <p className="text-xs text-slate-500">
                  Gửi thông báo khẩn cấp hoặc tin tức chung đến toàn bộ <strong className="text-indigo-600">{totalActive} tài khoản</strong> đang kích hoạt nhận tin.
                </p>
              </div>
            </div>
          </div>

          {broadcastResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 ${
                broadcastResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {broadcastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <div>{broadcastResult.message || broadcastResult.error}</div>
                {broadcastResult.success && (
                  <div className="font-normal text-[11px] opacity-80 mt-0.5">
                    Thành công: {broadcastResult.totalSent} | Thất bại: {broadcastResult.totalFailed}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleBroadcast} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tiêu Đề Thông Báo
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Ví dụ: THAY ĐỔI LỊCH THI HỌC KỲ 2 NĂM HỌC 2025-2026"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nội Dung Thông Báo (Hỗ trợ định dạng HTML / Text)
              </label>
              <textarea
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết cần thông báo tới toàn bộ sinh viên..."
                rows={6}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isBroadcasting || !broadcastTitle || !broadcastContent}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi phát sóng tới {totalActive} tài khoản...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Phát Sóng Tới Toàn Bộ Sinh Viên</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: BACKUP & ADMIN ALERTS CONFIGURATION */}
      {activeSubTab === 'BACKUP_ALERTS' && (
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
                    Quản lý kênh tiếp nhận bản sao lưu tự động & các sự kiện cảnh báo quan trọng trong hệ thống
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  telIsEnabled && telChatId
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${telIsEnabled && telChatId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {telIsEnabled && telChatId ? 'Đang kích hoạt' : 'Chưa cấu hình'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveBackupTelegramConfig} className="flex flex-col gap-5">
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
                      onClick={() => {
                        setAdminDetectTarget('BACKUP');
                        setIsAdminAutoDetectOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 cursor-pointer shadow-2xs"
                    >
                      <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
                      <span>Bắt ID Tự Động</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={telChatId}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseTelegramInput(val);
                      if (parsed.isLink && parsed.chatId) {
                        setTelChatId(parsed.chatId);
                        if (parsed.threadId) setTelThreadId(parsed.threadId);
                      } else if (parsed.username && parsed.isLink) {
                        setTelChatId(parsed.username);
                        if (parsed.threadId) setTelThreadId(parsed.threadId);
                      } else {
                        setTelChatId(val);
                      }
                    }}
                    placeholder="Ví dụ: -100123456789 hoặc dán link Telegram"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">ID cá nhân, hoặc ID Group/Channel mà bạn thêm Bot vào làm Quản trị viên (có thể dán link).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-sky-600" />
                    <span>Topic ID / Thread ID (Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={telThreadId}
                    onChange={(e) => {
                      const parsedTopic = parseTopicInput(e.target.value);
                      setTelThreadId(parsedTopic || e.target.value);
                    }}
                    placeholder="Để trống hoặc dán link Topic"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Dành riêng cho nhóm Supergroup bật tính năng phân chủ đề (Topics/Forums).</p>
                </div>
              </div>

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
                      <span className="text-xs font-bold text-slate-800">
                        💾 Sao Lưu & Xuất DB
                      </span>
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
                      <span className="text-xs font-bold text-slate-800">
                        👤 Người Đăng Ký Mới
                      </span>
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
                      <span className="text-xs font-bold text-slate-800">
                        🛡️ Phục Hồi Dữ Liệu DB
                      </span>
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
                      <span className="text-xs font-bold text-slate-800">
                        📥 Import Đợt Thi Mới
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Thông báo khi Admin import danh sách lịch thi đợt mới thành công
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Schedule & Attachments */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Lịch Tự Động Sao Lưu Định Kỳ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={telAutoBackupEnabled}
                        onChange={(e) => setTelAutoBackupEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />
                      <span>Bật sao lưu tự động</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                      <span className="text-[11px] text-slate-500">Giờ:</span>
                      <input
                        type="time"
                        value={telScheduleTime}
                        onChange={(e) => setTelScheduleTime(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 font-mono outline-none cursor-pointer"
                      />
                      <span className="text-[10px] text-indigo-600 font-bold">(VN)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60 text-xs font-medium text-slate-700">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">File đính kèm:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telSendSql}
                      onChange={(e) => setTelSendSql(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                    />
                    <span>Tự động đính kèm file SQL Dump chuẩn PostgreSQL (.sql)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTestBackupTelegram}
                  disabled={isTestingBackupConfig || !telChatId.trim()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingBackupConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                  ) : (
                    <Send className="w-4 h-4 text-sky-600" />
                  )}
                  <span>Kiểm Tra Kết Nối (Ping Test)</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingBackupConfig || !telChatId.trim()}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingBackupConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Lưu Cấu Hình Sao Lưu Telegram</span>
                </button>
              </div>

              {backupTestResult && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
                  backupTestResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {backupTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{backupTestResult.success ? backupTestResult.message : backupTestResult.error}</span>
                </div>
              )}
            </form>
          </div>

          {/* Right Info & Instant Action Card */}
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
                Nhấn nút bên dưới để hệ thống lập tức xuất toàn bộ cơ sở dữ liệu PostgreSQL (file .sql) và gửi thẳng vào kênh Telegram cấu hình.
              </p>

              <button
                type="button"
                onClick={handleSendInstantBackupToTelegram}
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
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Để nhận tin vào tài khoản cá nhân: Mở bot <b>@userinfobot</b> trên Telegram và lấy ID số của bạn.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Để nhận vào Group/Kênh: Mời Bot của bạn vào Group, cấp quyền <b>Admin</b>, rồi dùng <b>@RawDataBot</b> để lấy ID Group (dạng <code className="text-indigo-600 font-mono">-100...</code>).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Bấm nút <b>Kiểm Tra Kết Nối (Ping Test)</b> để xác nhận Bot gửi tin nhắn thành công trước khi lưu.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL TELEGRAM QUEUE MONITOR */}
      {activeSubTab === 'QUEUE' && (
        <div className="flex flex-col gap-6">
          {/* Header & Action Bar */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-2xs">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-800">
                    Hàng Đợi Gửi Tin Toàn Cục (Global Telegram Queue)
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      queueStats?.isPaused
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : queueStats?.rateLimitedUntil
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                        : queueStats?.sending > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse'
                        : queueStats?.pending > 0
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {queueStats?.isPaused
                      ? 'ĐANG TẠM DỪNG'
                      : queueStats?.rateLimitedUntil
                      ? 'ĐANG HOÃN (429 COOLDOWN)'
                      : queueStats?.sending > 0
                      ? 'ĐANG GỬI TIN...'
                      : queueStats?.pending > 0
                      ? 'CÓ TIN ĐANG CHỜ'
                      : 'SẴN SÀNG (IDLE)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Điều phối gửi tin tuần tự có kiểm soát tốc độ (Rate Limit) để không bị Telegram chặn HTTP 429 Too Many Requests.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={fetchQueueStats}
                disabled={isFetchingQueue}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isFetchingQueue ? 'animate-spin' : ''}`} />
                <span>Làm Mới</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleQueuePause(!queueStats?.isPaused)}
                disabled={isTogglingQueuePause}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  queueStats?.isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                }`}
              >
                {queueStats?.isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Tiếp Tục Chạy</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Tạm Dừng Hàng Đợi</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearQueue}
                disabled={isClearingQueue || (!queueStats?.pending && !queueStats?.sending)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Chờ Gửi</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Card 1: Pending */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Đang Chờ Gửi</span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Inbox className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  {queueStats?.pending ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">tin trong hàng đợi</div>
              </div>
            </div>

            {/* Card 2: Active Sending */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Đang Gửi Đi</span>
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Send className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-purple-600 font-mono">
                  {queueStats?.sending ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">kết nối đồng thời</div>
              </div>
            </div>

            {/* Card 3: Sent Success */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Đã Gửi Thành Công</span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {queueStats?.sentCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">tin nhắn / file</div>
              </div>
            </div>

            {/* Card 4: Failed */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Thất Bại</span>
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600 font-mono">
                  {queueStats?.failedCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">vượt quá số lần thử</div>
              </div>
            </div>

            {/* Card 5: 429 Pauses */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Lần Chạm 429</span>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {queueStats?.rateLimitPauses ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">tự động hoãn thành công</div>
              </div>
            </div>

            {/* Card 6: Total Processed */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">Tổng Đã Xử Lý</span>
                <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-800 font-mono">
                  {queueStats?.totalProcessed ?? 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">kể từ khi khởi động</div>
              </div>
            </div>
          </div>

          {/* Rate Limiting Specs & Parameters */}
          <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Chính Sách Chống Giới Hạn Tốc Độ (Rate Limit Rules)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Khoảng cách gửi toàn cục (Global)</span>
                </div>
                <div className="text-slate-200 font-semibold font-mono text-sm">
                  {queueStats?.minGlobalIntervalMs || 50}ms / tin (Tối đa ~20 tin/s)
                </div>
                <div className="text-[11px] text-slate-400">
                  Telegram cho phép tối đa 30 tin/s. Giới hạn 20 tin/s bảo đảm an toàn 100% không bị ngắt kết nối.
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Khoảng cách cùng 1 Chat ID</span>
                </div>
                <div className="text-slate-200 font-semibold font-mono text-sm">
                  {queueStats?.minPerChatIntervalMs || 1100}ms / tin (Tối đa 1 tin / 1.1s)
                </div>
                <div className="text-[11px] text-slate-400">
                  Telegram giới hạn 1 tin/s đối với mỗi nhóm/chat. Queue tự động phân bổ xen kẽ các chat khác nhau.
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Cơ chế Xếp hàng Ưu tiên</span>
                </div>
                <div className="text-slate-200 font-semibold text-[11px] leading-relaxed">
                  <span className="text-rose-300 font-bold">CRITICAL / HIGH</span> (Ping test, khẩn cấp) &gt;{' '}
                  <span className="text-indigo-300 font-bold">NORMAL</span> (Nhắc lịch thi, thông báo) &gt;{' '}
                  <span className="text-slate-400 font-bold">BULK</span> (Phát thanh hàng loạt).
                </div>
                <div className="text-[11px] text-slate-400">
                  Tự động đọc `retry_after` nếu gặp 429 và tạm dừng hàng đợi đúng số giây yêu cầu.
                </div>
              </div>
            </div>
          </div>

          {/* History Log Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  Lịch Sử Gửi Tin Gần Đây ({queueStats?.recentHistory?.length || 0})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Tự động cập nhật mỗi 2.5 giây</span>
            </div>

            {(!queueStats?.recentHistory || queueStats.recentHistory.length === 0) ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Inbox className="w-10 h-10 stroke-1 text-slate-300" />
                <p className="text-xs">Chưa có tin nhắn nào được xử lý qua hàng đợi trong phiên làm việc này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Người nhận (Chat ID)</th>
                      <th className="py-2.5 px-3">Độ ưu tiên</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Lần thử</th>
                      <th className="py-2.5 px-3">Độ trễ</th>
                      <th className="py-2.5 px-3">Xem trước / Lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueStats.recentHistory.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                          {item.completedAt ? new Date(item.completedAt).toLocaleTimeString('vi-VN') : '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.type === 'document' ? (
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-[10px]">
                              TẬP TIN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-bold text-[10px]">
                              VĂN BẢN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          <code>{item.chatId}</code>
                          {item.threadId ? (
                            <span className="ml-1 text-[10px] text-purple-600 font-normal">
                              (Topic: {item.threadId})
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              item.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : item.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : item.priority === 'NORMAL'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Thành công</span>
                            </span>
                          ) : item.status === 'RETRYING' ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang thử lại</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Thất bại</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {item.attempts}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                          {item.durationMs !== undefined ? `${item.durationMs}ms` : '-'}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-600">
                          {item.error ? (
                            <span className="text-rose-600 font-semibold">{item.error}</span>
                          ) : item.filename ? (
                            <span className="font-mono text-sky-700">{item.filename}</span>
                          ) : (
                            <span>{item.textPreview || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto Detect Chat ID Wizard Modal for Admin */}
      <TelegramAutoDetectModal
        isOpen={isAdminAutoDetectOpen}
        onClose={() => setIsAdminAutoDetectOpen(false)}
        botToken={useCustomBackupBot && adminDetectTarget === 'BACKUP' ? telBackupBotToken : undefined}
        botUsername={systemBot?.botUsername}
        onSelectChat={({ chatId: selectedChatId, chatTitle, chatType, threadId: selectedThreadId, topicName }) => {
          if (adminDetectTarget === 'TEST') {
            setTestChatId(selectedChatId);
            if (selectedThreadId) setTestThreadId(selectedThreadId);
          } else {
            setTelChatId(selectedChatId);
            if (selectedThreadId) setTelThreadId(selectedThreadId);
          }
          setSuccessMsg(`Đã áp dụng: ${chatTitle} (${selectedChatId}${selectedThreadId ? ` - Topic #${selectedThreadId}` : ''})`);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
}
