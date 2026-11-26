import React from 'react';
import { X, Hash, CheckCircle2, AlertCircle, Users, Info } from 'lucide-react';
import type { TelegramTopicSelectorModalProps } from './telegram-topic-selector-modal/types';
import { useTelegramTopicSelector } from './telegram-topic-selector-modal/useTelegramTopicSelector';
import { TopicControlsBar } from './telegram-topic-selector-modal/TopicControlsBar';
import { TopicListBody } from './telegram-topic-selector-modal/TopicListBody';

export type { ForumTopicItem } from './telegram-topic-selector-modal/types';

export default function TelegramTopicSelectorModal({
  isOpen,
  onClose,
  botToken = '',
  chatId,
  currentSelectedThreadId,
  onSelectTopic,
}: TelegramTopicSelectorModalProps) {
  const {
    chatInfo,
    isLoading,
    errorMsg,
    searchQuery,
    setSearchQuery,
    isCreatingTopic,
    setIsCreatingTopic,
    newTopicName,
    setNewTopicName,
    isSubmittingCreate,
    createSuccessMsg,
    filteredTopics,
    handlePullTopics,
    handleCreateTopic,
  } = useTelegramTopicSelector({
    isOpen,
    onClose,
    botToken,
    chatId,
    onSelectTopic,
  });

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

        <TopicControlsBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isLoading={isLoading}
          onPullTopics={handlePullTopics}
          isCreatingTopic={isCreatingTopic}
          onToggleCreatingTopic={() => setIsCreatingTopic(!isCreatingTopic)}
          newTopicName={newTopicName}
          onNewTopicNameChange={setNewTopicName}
          isSubmittingCreate={isSubmittingCreate}
          onCreateTopic={handleCreateTopic}
          onCancelCreate={() => {
            setIsCreatingTopic(false);
            setNewTopicName('');
          }}
        />

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

        {/* API Limitation Note */}
        <div className="mx-4 mt-3.5 p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <span className="font-bold text-amber-950">Lưu ý do giới hạn của Telegram API:</span> Telegram không có API lấy trực tiếp toàn bộ danh sách topic, bot chỉ phát hiện được các chủ đề có tin nhắn mới hoặc vừa tạo gần đây (tối đa 100 cập nhật mới nhất) nên <strong>tính năng này có thể quét thiếu topic</strong>.
            <div className="mt-1 text-amber-800 space-y-0.5">
              <span>• Nếu thiếu topic: Hãy <strong>gửi 1 tin nhắn bất kỳ</strong> vào topic đó trên Telegram rồi bấm <strong>"Quét Lại"</strong>.</span><br />
              <span>• Hoặc bạn có thể <strong>tự nhập trực tiếp Thread ID</strong> vào ô cấu hình hoặc bấm <strong>"Tạo Topic"</strong> mới.</span>
            </div>
          </div>
        </div>

        <TopicListBody
          isLoading={isLoading}
          filteredTopics={filteredTopics}
          searchQuery={searchQuery}
          currentSelectedThreadId={currentSelectedThreadId}
          onSelectTopic={onSelectTopic}
          onClose={onClose}
        />

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
