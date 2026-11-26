import React from 'react';
import { Bot, Check, Eye, EyeOff, Key, Pause, Play, RefreshCw } from 'lucide-react';
import GlobalBotSidebarCards from './GlobalBotSidebarCards';

interface GlobalBotConfigTabProps {
  systemBot: any | null;
  systemBotConfig: any | null;
  botTokenInput: string;
  setBotTokenInput: (value: string) => void;
  botDescription: string;
  setBotDescription: (value: string) => void;
  showToken: boolean;
  setShowToken: (value: boolean) => void;
  isSavingBot: boolean;
  isTogglingBot: boolean;
  onSaveGlobalBot: (e: React.FormEvent) => void;
  onToggleGlobalBot: () => void;
  onRefresh: () => void;
  testChatId: string;
  setTestChatId: (value: string) => void;
  testThreadId: string;
  setTestThreadId: (value: string) => void;
  isTesting: boolean;
  testResult: any | null;
  onAdminTest: (e: React.FormEvent) => void;
  onOpenAutoDetectForTest: () => void;
}

export default function GlobalBotConfigTab({
  systemBot,
  systemBotConfig,
  botTokenInput,
  setBotTokenInput,
  botDescription,
  setBotDescription,
  showToken,
  setShowToken,
  isSavingBot,
  isTogglingBot,
  onSaveGlobalBot,
  onToggleGlobalBot,
  onRefresh,
  testChatId,
  setTestChatId,
  testThreadId,
  setTestThreadId,
  isTesting,
  testResult,
  onAdminTest,
  onOpenAutoDetectForTest,
}: GlobalBotConfigTabProps) {
  return (
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
                Lưu trữ trong bảng PostgreSQL{' '}
                <code className="font-mono text-indigo-600">GlobalConfig</code> (key:{' '}
                <code className="font-mono text-slate-600">telegram_bot</code>)
              </p>
            </div>
          </div>

          {systemBotConfig && (
            <button
              type="button"
              onClick={onToggleGlobalBot}
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

        <form onSubmit={onSaveGlobalBot} className="flex flex-col gap-5">
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
              onClick={onRefresh}
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
      <GlobalBotSidebarCards
        systemBot={systemBot}
        testChatId={testChatId}
        setTestChatId={setTestChatId}
        testThreadId={testThreadId}
        setTestThreadId={setTestThreadId}
        isTesting={isTesting}
        testResult={testResult}
        onAdminTest={onAdminTest}
        onOpenAutoDetectForTest={onOpenAutoDetectForTest}
      />
    </div>
  );
}
