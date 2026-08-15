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
  Megaphone,
} from 'lucide-react';
import { LoginUser } from '../types';

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
  notifyCourseRegistration: boolean;
  notifyClassActivity: boolean;
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
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'SUBSCRIBERS' | 'BROADCAST'>('CONFIG');
  const [isLoading, setIsLoading] = useState(true);

  // Global bot state
  const [systemBot, setSystemBot] = useState<any | null>(null);
  const [systemBotConfig, setSystemBotConfig] = useState<any | null>(null);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSavingBot, setIsSavingBot] = useState(false);
  const [isTogglingBot, setIsTogglingBot] = useState(false);

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

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config?view=all');
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribers(data.configs || []);
        setSystemBot(data.systemBot || null);
        if (data.systemBotConfig) {
          setSystemBotConfig(data.systemBotConfig);
          setBotTokenInput(data.systemBotConfig.botToken || '');
          setBotDescription(data.systemBotConfig.description || '');
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu cấu hình Telegram.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
  const totalCustomBotUsers = subscribers.filter((s) => s.isCustomBot).length;

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
            Cấu Hình Bot Toàn Cục & Nhật Ký Nhận Tin
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thiết lập Bot Telegram đại diện toàn trường trong bảng <code className="text-sky-300 font-mono font-bold">TelegramGlobalConfig</code>, quản lý các kênh/nhóm đăng ký nhận tin của sinh viên và phát sóng thông báo học vụ tức thì.
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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
          onClick={() => setActiveSubTab('BROADCAST')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'BROADCAST'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>3. Phát Sóng Thông Báo (Broadcast)</span>
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
                    Lưu trữ trong bảng SQLite <code className="font-mono text-indigo-600">TelegramGlobalConfig</code>
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
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Chat ID người nhận
                  </label>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    placeholder="Ví dụ: 123456789"
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
                    onChange={(e) => setTestThreadId(e.target.value)}
                    placeholder="Ví dụ: 24"
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
                          {sub.notifyCourseRegistration && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                              ĐKMH
                            </span>
                          )}
                          {sub.notifyClassActivity && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">
                              Lớp Học
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

      {/* TAB 3: BROADCAST ANNOUNCEMENT */}
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
    </div>
  );
}
