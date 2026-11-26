import React from 'react';
import { ExternalLink, Radio, RefreshCw, Send, Users, Zap } from 'lucide-react';
import { parseTopicInput } from '../../utils/telegramParser';
import { applyTelegramChatInput } from './utils';

interface GlobalBotSidebarCardsProps {
  systemBot: any | null;
  testChatId: string;
  setTestChatId: (value: string) => void;
  testThreadId: string;
  setTestThreadId: (value: string) => void;
  isTesting: boolean;
  testResult: any | null;
  onAdminTest: (e: React.FormEvent) => void;
  onOpenAutoDetectForTest: () => void;
}

export default function GlobalBotSidebarCards({
  systemBot,
  testChatId,
  setTestChatId,
  testThreadId,
  setTestThreadId,
  isTesting,
  testResult,
  onAdminTest,
  onOpenAutoDetectForTest,
}: GlobalBotSidebarCardsProps) {
  return (
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
            Bot hệ thống dùng chung giúp sinh viên nhận thông báo ca thi, môn thi và học vụ mà không
            cần tạo bot riêng.
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
              href={
                systemBot.addToGroupUrl || `https://t.me/${systemBot.botUsername}?startgroup=true`
              }
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

        <form onSubmit={onAdminTest} className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-600">
                Chat ID người nhận
              </label>
              <button
                type="button"
                onClick={onOpenAutoDetectForTest}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 cursor-pointer"
              >
                <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
                <span>Bắt ID Tự Động</span>
              </button>
            </div>
            <input
              type="text"
              value={testChatId}
              onChange={(e) =>
                applyTelegramChatInput(e.target.value, setTestChatId, setTestThreadId)
              }
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
  );
}
