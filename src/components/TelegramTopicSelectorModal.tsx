import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Hash,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Users,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
  Check,
  Send,
} from 'lucide-react';

export interface ForumTopicItem {
  threadId: string;
  name: string;
  iconColor?: number;
  iconCustomEmojiId?: string;
  isGeneral?: boolean;
  lastMessageSnippet?: string;
  lastMessageDate?: string;
}

interface TelegramTopicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToken: string;
  chatId: string;
  currentSelectedThreadId?: string;
  onSelectTopic: (topic: { threadId: string; name: string }) => void;
}

export default function TelegramTopicSelectorModal({
  isOpen,
  onClose,
  botToken,
  chatId,
  currentSelectedThreadId,
  onSelectTopic,
}: TelegramTopicSelectorModalProps) {
  const [topics, setTopics] = useState<ForumTopicItem[]>([]);
  const [chatInfo, setChatInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create topic state
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // Fetch / Pull topics from API
  const handlePullTopics = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setErrorMsg('Vui lòng nhập Bot Token và Chat ID trước khi quét Topic.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL_TOPICS',
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTopics(data.topics || []);
        setChatInfo(data.chat || null);
        if (!data.isForumGroup) {
          setErrorMsg(
            'Nhóm này chưa bật tính năng Diễn đàn / Topics (Forum Supergroup). Vui lòng vào Cài đặt nhóm trên Telegram -> Bật "Topics" (Chủ đề).'
          );
        }
      } else {
        setErrorMsg(data.error || 'Không thể lấy danh sách Topic từ nhóm Telegram.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi quét Topics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handlePullTopics();
    } else {
      setSearchQuery('');
      setIsCreatingTopic(false);
      setNewTopicName('');
      setCreateSuccessMsg('');
    }
  }, [isOpen]);

  // Handle Create Topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    setIsSubmittingCreate(true);
    setErrorMsg('');
    setCreateSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TOPIC',
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          topicName: newTopicName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.topic) {
        setCreateSuccessMsg(`Đã tạo topic "${data.topic.name}" thành công!`);
        const createdTopic: ForumTopicItem = {
          threadId: data.topic.threadId,
          name: data.topic.name,
          iconColor: data.topic.iconColor,
          iconCustomEmojiId: data.topic.iconCustomEmojiId,
        };

        // Add to topic list and auto select
        setTopics((prev) => [createdTopic, ...prev.filter((t) => t.threadId !== createdTopic.threadId)]);
        onSelectTopic({ threadId: createdTopic.threadId, name: createdTopic.name });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg(data.error || 'Không thể tạo Topic mới trên Telegram.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối khi tạo Topic.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase().trim();
    return topics.filter(
      (t) => t.name.toLowerCase().includes(q) || String(t.threadId).includes(q)
    );
  }, [topics, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-5 sm:p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <Hash className="w-6 h-6 text-sky-100" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Chọn Topic (Chủ Đề) Trong Nhóm</h3>
              <p className="text-xs text-sky-100 mt-0.5">
                Quét và chọn đúng Thread ID để bot gửi tin nhắn vào đúng chuyên mục
              </p>
            </div>
          </div>

          {/* Group info badge */}
          {chatInfo && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 font-medium">
              <Users className="w-3.5 h-3.5 text-sky-200" />
              <span className="font-bold truncate max-w-[200px]">{chatInfo.title || 'Nhóm Telegram'}</span>
              <span className="text-sky-200 font-mono text-[11px]">({chatInfo.id})</span>
              {chatInfo.isForum && (
                <span className="px-2 py-0.5 bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 rounded-full text-[10px] font-bold">
                  Forum Supergroup
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Controls & Search */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên Topic hoặc ID..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePullTopics}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Quét lại danh sách Topic mới nhất"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Quét Lại</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingTopic(!isCreatingTopic)}
              className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-sky-600" />
              <span>Tạo Topic</span>
            </button>
          </div>
        </div>

        {/* Inline Create Topic Form */}
        {isCreatingTopic && (
          <form
            onSubmit={handleCreateTopic}
            className="p-4 bg-sky-50/70 border-b border-sky-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex-1">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Nhập tên Topic mới (ví dụ: Lịch Thi PTIT)..."
                className="w-full bg-white border border-sky-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                required
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmittingCreate || !newTopicName.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingCreate ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Tạo & Chọn</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingTopic(false);
                  setNewTopicName('');
                }}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Feedback Messages */}
        {createSuccessMsg && (
          <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{createSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-4 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Topic List Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
              <span className="text-xs font-bold text-slate-600">Đang quét danh sách Topic từ Telegram...</span>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-slate-500 gap-3">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                <Hash className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <div className="font-bold text-sm text-slate-700 mb-1">
                  {searchQuery ? 'Không tìm thấy Topic phù hợp' : 'Chưa quét được danh sách Topic'}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {searchQuery
                    ? 'Thử tìm kiếm với từ khóa khác hoặc bấm nút "Tạo Topic" ở trên.'
                    : 'Để bot tự động phát hiện các Topic, hãy đảm bảo bot đã ở trong nhóm và bạn đã gửi ít nhất 1 tin nhắn vào Topic đó.'}
                </p>
              </div>

              {/* Direct Fallback Option */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTopic({ threadId: '1', name: 'General (Chung)' });
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                  <span>Chọn Mặc Định Topic General (ID: 1)</span>
                </button>
              </div>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isSelected = String(currentSelectedThreadId) === String(topic.threadId);

              return (
                <div
                  key={topic.threadId}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-200'
                      : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/70'
                  }`}
                  onClick={() => {
                    onSelectTopic({ threadId: topic.threadId, name: topic.name });
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        topic.isGeneral
                          ? 'bg-indigo-100 text-indigo-700'
                          : isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700'
                      }`}
                    >
                      {topic.isGeneral ? '💬' : '#'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-800 truncate">{topic.name}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px] font-bold border border-slate-200">
                          ID: {topic.threadId}
                        </span>
                        {topic.isGeneral && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                            General
                          </span>
                        )}
                      </div>

                      {topic.lastMessageSnippet && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {topic.lastMessageSnippet}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isSelected ? (
                      <span className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Đang Chọn</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTopic({ threadId: topic.threadId, name: topic.name });
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Chọn</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tip / Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-[11px]">
              Tip: Topic General luôn có Thread ID là <strong className="text-indigo-600">1</strong>.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
