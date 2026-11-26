import React from 'react';
import { X, Search, RefreshCw, Plus, Check } from 'lucide-react';

interface TopicControlsBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isLoading: boolean;
  onPullTopics: () => void;
  isCreatingTopic: boolean;
  onToggleCreatingTopic: () => void;
  newTopicName: string;
  onNewTopicNameChange: (value: string) => void;
  isSubmittingCreate: boolean;
  onCreateTopic: (e: React.FormEvent) => void;
  onCancelCreate: () => void;
}

export function TopicControlsBar({
  searchQuery,
  onSearchQueryChange,
  isLoading,
  onPullTopics,
  isCreatingTopic,
  onToggleCreatingTopic,
  newTopicName,
  onNewTopicNameChange,
  isSubmittingCreate,
  onCreateTopic,
  onCancelCreate,
}: TopicControlsBarProps) {
  return (
    <>
      {/* Modal Controls & Search */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo tên Topic hoặc ID..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPullTopics}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Quét lại danh sách Topic mới nhất"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Quét Lại</span>
          </button>

          <button
            type="button"
            onClick={onToggleCreatingTopic}
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
          onSubmit={onCreateTopic}
          className="p-4 bg-sky-50/70 border-b border-sky-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="flex-1">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => onNewTopicNameChange(e.target.value)}
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
              onClick={onCancelCreate}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </>
  );
}
