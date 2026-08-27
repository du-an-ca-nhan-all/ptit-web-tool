import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Megaphone,
  User,
  ExternalLink,
  Hash,
  Radio,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  HelpCircle,
  Layers,
  Clock,
  Link as LinkIcon,
  Filter,
} from 'lucide-react';
import { parseTelegramInput, ParsedTelegramInput } from '../utils/telegramParser';
import { DetectedTelegramChat } from '../server/telegramServerService';

interface TelegramAutoDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToken?: string;
  botUsername?: string | null;
  onSelectChat: (selected: {
    chatId: string;
    chatTitle: string;
    chatType: string;
    threadId?: string;
    topicName?: string;
  }) => void;
}

export default function TelegramAutoDetectModal({
  isOpen,
  onClose,
  botToken = '',
  botUsername,
  onSelectChat,
}: TelegramAutoDetectModalProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PRIVATE' | 'GROUP' | 'CHANNEL' | 'LINK'>('ALL');
  const [chats, setChats] = useState<DetectedTelegramChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Link Parser state
  const [rawLinkInput, setRawLinkInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTelegramInput | null>(null);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [resolvedChatInfo, setResolvedChatInfo] = useState<any | null>(null);
  const [resolveError, setResolveError] = useState('');

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch / Scan recent updates from Bot
  const fetchRecentUpdates = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DETECT_RECENT_CHATS',
          botToken: botToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChats(data.chats || []);
      } else {
        if (!isBackground) {
          setErrorMsg(data.error || 'Không thể quét các cuộc trò chuyện gần đây.');
        }
      }
    } catch (err: any) {
      if (!isBackground) {
        setErrorMsg('Lỗi kết nối khi quét cập nhật Telegram.');
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // Initial fetch and Auto-polling setup
  useEffect(() => {
    if (isOpen) {
      fetchRecentUpdates(false);
      setIsAutoScanning(true);

      // Start 3.5s interval polling
      pollingTimerRef.current = setInterval(() => {
        if (isAutoScanning) {
          fetchRecentUpdates(true);
        }
      }, 3500);
    } else {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      setSearchQuery('');
      setRawLinkInput('');
      setParsedResult(null);
      setResolvedChatInfo(null);
      setResolveError('');
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [isOpen, isAutoScanning, botToken]);

  // Handle Link Input Change & Resolution
  const handleLinkInputChange = (val: string) => {
    setRawLinkInput(val);
    setResolveError('');
    setResolvedChatInfo(null);

    const parsed = parseTelegramInput(val);
    setParsedResult(parsed);
  };

  // Resolve Link or Username via Backend
  const handleResolveLink = async () => {
    if (!rawLinkInput.trim()) return;
    setIsResolvingLink(true);
    setResolveError('');
    setResolvedChatInfo(null);

    try {
      const parsed = parseTelegramInput(rawLinkInput);
      const targetIdentifier = parsed.chatId || parsed.username || rawLinkInput.trim();

      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_CHAT',
          botToken: botToken.trim() || undefined,
          identifier: targetIdentifier,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.chat) {
        setResolvedChatInfo(data.chat);
      } else {
        setResolveError(data.error || 'Không thể tìm thấy Kênh/Nhóm Telegram từ link này.');
      }
    } catch {
      setResolveError('Lỗi kết nối máy chủ khi kiểm tra liên kết.');
    } finally {
      setIsResolvingLink(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Chats
  const filteredChats = useMemo(() => {
    let result = chats;

    // Filter by tab
    if (activeTab === 'PRIVATE') {
      result = result.filter((c) => c.type === 'private');
    } else if (activeTab === 'GROUP') {
      result = result.filter((c) => c.type === 'group' || c.type === 'supergroup');
    } else if (activeTab === 'CHANNEL') {
      result = result.filter((c) => c.type === 'channel');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.chatId.includes(q) ||
          (c.username && c.username.toLowerCase().includes(q)) ||
          c.topics.some((t) => t.name.toLowerCase().includes(q) || t.threadId.includes(q))
      );
    }

    return result;
  }, [chats, activeTab, searchQuery]);

  if (!isOpen) return null;

  const botHandle = botUsername ? `@${botUsername}` : 'Bot';

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 sm:p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-xs shrink-0">
              <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold mb-1">
                <Radio className="w-3 h-3 text-emerald-300 animate-ping" />
                <span>Trợ Lý Bắt ID Thông Minh</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Tự Động Nhận Diện Chat ID & Topic ID
              </h3>
              <p className="text-[11px] sm:text-xs text-sky-100 mt-0.5">
                Không cần tra cứu thủ công - Chỉ cần gửi tin nhắn hoặc dán link Telegram là nhận diện ngay!
              </p>
            </div>
          </div>

          {/* Bot info badge */}
          {botUsername && (
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <div className="flex items-center gap-2">
                <span className="opacity-80">Bot đang lắng nghe:</span>
                <span className="font-bold text-sky-200 font-mono">@{botUsername}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-medium text-emerald-200">
                  {isAutoScanning ? 'Đang tự động quét (3s/lần)' : 'Tạm dừng quét'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Tất Cả Phát Hiện ({chats.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRIVATE')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PRIVATE'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>Chat Cá Nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GROUP')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'GROUP'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhóm & Topic Lớp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CHANNEL')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CHANNEL'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600" />
            <span>Kênh Thông Báo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LINK')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'LINK'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
            <span>Dán Link Bất Kỳ</span>
          </button>
        </div>

        {/* Action / Help Banner depending on active Tab */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          {activeTab === 'PRIVATE' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">👉 Cách lấy Chat ID cá nhân nhanh nhất:</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Bấm nút bên cạnh để mở Bot Telegram $\rightarrow$ Bấm <strong>Start</strong> (hoặc gửi bất kỳ tin nhắn gì) $\rightarrow$ ID sẽ xuất hiện ngay bên dưới!
                </p>
              </div>
              {botUsername && (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Bot Telegram</span>
                </a>
              )}
            </div>
          )}

          {activeTab === 'GROUP' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">👉 Cách lấy ID Nhóm hoặc Topic diễn đàn:</p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  1. Thêm Bot vào Nhóm $\rightarrow$ 2. Gửi 1 tin nhắn bất kỳ (hoặc gõ <code className="font-bold text-indigo-600">/id</code>) vào Topic bạn muốn nhận tin.
                </p>
              </div>
              {botUsername && (
                <a
                  href={`https://t.me/${botUsername}?startgroup=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Thêm Bot Vào Nhóm</span>
                </a>
              )}
            </div>
          )}

          {activeTab === 'CHANNEL' && (
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Yêu cầu quan trọng đối với Kênh Telegram (Channel):</strong>
                  <span className="text-[11px] text-amber-800">
                    Bạn phải thêm {botHandle} làm <strong>Quản trị viên (Administrator)</strong> của Kênh và bật quyền <strong>"Post Messages" (Đăng bài)</strong> $\rightarrow$ Sau đó đăng 1 bài viết bất kỳ lên Kênh.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LINK' && (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-bold text-slate-800">
                Dán đường link bất kỳ từ Telegram (Link bài viết, Link Topic, Link Kênh, hoặc Telegram Web):
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rawLinkInput}
                    onChange={(e) => handleLinkInputChange(e.target.value)}
                    placeholder="Ví dụ: https://t.me/c/1987654321/42 hoặc https://t.me/ptit_k21"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResolveLink}
                  disabled={isResolvingLink || !rawLinkInput.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isResolvingLink ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>Phân Tích</span>
                </button>
              </div>

              {/* Parsed link preview */}
              {parsedResult && parsedResult.chatId && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{parsedResult.explanation}</span>
                    </div>
                    <div className="text-[11px] text-purple-700 mt-1 flex items-center gap-3 font-mono">
                      <span>Chat ID: <strong>{parsedResult.chatId}</strong></span>
                      {parsedResult.threadId && (
                        <span>Topic ID: <strong>#{parsedResult.threadId}</strong></span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChat({
                        chatId: parsedResult.chatId!,
                        chatTitle: 'Đã phân tách từ Link',
                        chatType: parsedResult.type,
                        threadId: parsedResult.threadId,
                      });
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Áp Dụng ID Này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Resolved Chat Info Result */}
              {resolvedChatInfo && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Tìm thấy: {resolvedChatInfo.title}</span>
                      <span className="px-2 py-0.2 bg-emerald-200 text-emerald-800 rounded-md text-[10px] uppercase font-bold">
                        {resolvedChatInfo.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-3 font-mono">
                      <span>ID: <strong>{resolvedChatInfo.id}</strong></span>
                      {resolvedChatInfo.memberCount !== undefined && (
                        <span>Thành viên: <strong>{resolvedChatInfo.memberCount}</strong></span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChat({
                        chatId: String(resolvedChatInfo.id),
                        chatTitle: resolvedChatInfo.title,
                        chatType: resolvedChatInfo.type,
                        threadId: parsedResult?.threadId,
                      });
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Áp Dụng ID Này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {resolveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resolveError}</span>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'LINK' && (
            <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc theo tên hoặc Chat ID..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoScanning(!isAutoScanning)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isAutoScanning
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                  title={isAutoScanning ? 'Bấm để tạm dừng tự động quét' : 'Bấm để bật tự động quét'}
                >
                  <Radio className={`w-3 h-3 ${isAutoScanning ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{isAutoScanning ? 'Auto Scan: BẬT' : 'Auto Scan: TẮT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchRecentUpdates(false)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Quét Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Body: Discovered Chats List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[260px] max-h-[480px]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2.5">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <span className="text-xs font-bold text-slate-600">Đang quét cập nhật từ Telegram Bot...</span>
            </div>
          ) : filteredChats.length === 0 && activeTab !== 'LINK' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-black text-sm text-slate-800 mb-1">Chưa phát hiện tin nhắn nào gần đây</h4>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Vui lòng mở Telegram, tìm bot <strong className="text-sky-600">{botHandle}</strong> và gửi một tin nhắn bất kỳ (hoặc gõ <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/id</code>). Hệ thống sẽ tự động bắt ID ngay lập tức.
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isChannel = chat.type === 'channel';
              const isGroup = chat.type === 'group' || chat.type === 'supergroup';
              const isPrivate = chat.type === 'private';

              return (
                <div
                  key={chat.chatId}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col gap-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                          isChannel
                            ? 'bg-amber-100 text-amber-700'
                            : isGroup
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isChannel ? (
                          <Megaphone className="w-5 h-5" />
                        ) : isGroup ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {chat.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isChannel
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : isGroup
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isChannel ? 'Kênh (Channel)' : isGroup ? 'Nhóm (Group)' : 'Cá nhân (Private)'}
                          </span>
                          {chat.isForum && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              Forum Topics
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span>Chat ID:</span>
                          <span className="font-bold text-indigo-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            {chat.chatId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(chat.chatId)}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                            title="Sao chép Chat ID"
                          >
                            {copiedId === chat.chatId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {chat.username && (
                            <span className="text-slate-400 font-sans">({chat.username})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Direct Apply Button without topic */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChat({
                          chatId: chat.chatId,
                          chatTitle: chat.title,
                          chatType: chat.type,
                        });
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Áp Dụng Chat ID Này</span>
                    </button>
                  </div>

                  {/* Last message preview */}
                  {chat.lastMessageSnippet && (
                    <div className="text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-bold text-slate-700">Tin gần nhất:</span> "{chat.lastMessageSnippet}"
                      </div>
                      {chat.lastActivityDate && (
                        <span className="text-slate-400 text-[10px] shrink-0">
                          {new Date(chat.lastActivityDate).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* If Topics Detected */}
                  {chat.topics && chat.topics.length > 0 && (
                    <div className="mt-1 flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Hash className="w-3.5 h-3.5 text-sky-600" />
                        <span>Các Topic (Chủ đề) đã phát hiện trong nhóm:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {chat.topics.map((topic) => (
                          <div
                            key={topic.threadId}
                            className="p-2.5 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 hover:border-sky-300 rounded-xl flex items-center justify-between gap-2 transition"
                          >
                            <div className="truncate">
                              <div className="font-bold text-xs text-sky-900 truncate">
                                {topic.name}
                              </div>
                              <div className="text-[10px] text-sky-600 font-mono">
                                Thread ID: #{topic.threadId}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectChat({
                                  chatId: chat.chatId,
                                  chatTitle: chat.title,
                                  chatType: chat.type,
                                  threadId: topic.threadId,
                                  topicName: topic.name,
                                });
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer shadow-2xs active:scale-95"
                            >
                              Chọn Topic
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            💡 Mẹo: Bạn có thể sao chép link tin nhắn bất kỳ từ Telegram và dán vào tab "Dán Link Bất Kỳ".
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-pointer transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
