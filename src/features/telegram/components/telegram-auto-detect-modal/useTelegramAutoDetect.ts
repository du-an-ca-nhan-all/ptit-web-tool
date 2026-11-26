import { useState, useEffect, useMemo, useRef } from 'react';
import { parseTelegramInput, ParsedTelegramInput } from '../../utils/telegramParser';
import { DetectedTelegramChat } from '../../server/telegramServerService';
import { DetectTabType } from './types';

interface UseTelegramAutoDetectParams {
  isOpen: boolean;
  botToken: string;
}

export function useTelegramAutoDetect({ isOpen, botToken }: UseTelegramAutoDetectParams) {
  const [activeTab, setActiveTab] = useState<DetectTabType>('ALL');
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

  return {
    activeTab,
    setActiveTab,
    chats,
    isLoading,
    isAutoScanning,
    setIsAutoScanning,
    errorMsg,
    searchQuery,
    setSearchQuery,
    copiedId,
    rawLinkInput,
    parsedResult,
    isResolvingLink,
    resolvedChatInfo,
    resolveError,
    filteredChats,
    fetchRecentUpdates,
    handleLinkInputChange,
    handleResolveLink,
    handleCopy,
  };
}
