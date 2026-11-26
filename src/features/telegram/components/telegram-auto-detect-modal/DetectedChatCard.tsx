import React from 'react';
import {
  Users,
  Megaphone,
  User,
  Hash,
  Copy,
  Check,
} from 'lucide-react';
import { DetectedTelegramChat } from '../../server/telegramServerService';
import { SelectedTelegramChat } from './types';

interface DetectedChatCardProps {
  chat: DetectedTelegramChat;
  copiedId: string | null;
  onCopy: (text: string) => void;
  onSelectChat: (selected: SelectedTelegramChat) => void;
  onClose: () => void;
}

export function DetectedChatCard({
  chat,
  copiedId,
  onCopy,
  onSelectChat,
  onClose,
}: DetectedChatCardProps) {
  const isChannel = chat.type === 'channel';
  const isGroup = chat.type === 'group' || chat.type === 'supergroup';

  return (
    <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col gap-3 group">
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
                onClick={() => onCopy(chat.chatId)}
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
}
