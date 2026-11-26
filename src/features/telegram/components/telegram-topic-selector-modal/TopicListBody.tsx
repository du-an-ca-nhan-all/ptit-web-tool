import React from 'react';
import { Hash, RefreshCw, MessageSquare, ArrowRight, Check } from 'lucide-react';
import type { ForumTopicItem } from './types';

interface TopicListBodyProps {
  isLoading: boolean;
  filteredTopics: ForumTopicItem[];
  searchQuery: string;
  currentSelectedThreadId?: string;
  onSelectTopic: (topic: { threadId: string; name: string }) => void;
  onClose: () => void;
}

export function TopicListBody({
  isLoading,
  filteredTopics,
  searchQuery,
  currentSelectedThreadId,
  onSelectTopic,
  onClose,
}: TopicListBodyProps) {
  return (
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
                : 'Do hạn chế từ Telegram Bot API, hệ thống chỉ nhận diện được topic có tin nhắn gần đây. Hãy đảm bảo bot đã ở trong nhóm, sau đó gửi ít nhất 1 tin nhắn vào Topic đó rồi bấm "Quét Lại", hoặc tự nhập Thread ID.'}
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
  );
}
