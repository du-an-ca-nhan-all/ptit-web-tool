import React from 'react';
import {
  Send,
  Bot,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';

interface TelegramHeaderBannerProps {
  showGuide: boolean;
  onToggleGuide: () => void;
  isAdmin: boolean;
  onNavigateTab?: (tab: string) => void;
  isAdminPanelOpen: boolean;
  onToggleAdminPanel: () => void;
  isConnected: boolean;
  isCustomBot: boolean;
  activeBotUsername?: string | null;
}

export default function TelegramHeaderBanner({
  showGuide,
  onToggleGuide,
  isAdmin,
  onNavigateTab,
  isAdminPanelOpen,
  onToggleAdminPanel,
  isConnected,
  isCustomBot,
  activeBotUsername,
}: TelegramHeaderBannerProps) {
  return (
    <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-lg shadow-sky-500/10 relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-6 top-6 text-white/20 hidden sm:block">
        <Send className="w-24 h-24 stroke-[1.2]" />
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white mb-2 sm:mb-3">
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Bot Notifications</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-1.5 sm:mb-2 tracking-tight">
          Thông Báo Tức Thì Qua Telegram
        </h2>
        <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
          Nhận thông báo lịch thi, phòng thi, môn thi mới, kết quả đăng ký môn học và các thông tin học vụ quan trọng trực tiếp qua tài khoản cá nhân hoặc Group/Channel lớp trên Telegram.
        </p>

        <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onToggleGuide}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-white/20 active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuide ? 'Ẩn Hướng Dẫn' : 'Xem Hướng Dẫn'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isAdmin && (
            <>
              {onNavigateTab ? (
                <button
                  type="button"
                  onClick={() => onNavigateTab('telegram_admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-indigo-400/40 shadow-xs active:scale-95"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Quản Trị Bot ➜</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onToggleAdminPanel}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-amber-400/25 hover:bg-amber-400/35 text-amber-100 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md border border-amber-300/30 active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAdminPanelOpen ? 'Đóng Quản Trị' : 'Cấu Hình Bot Toàn Trường'}</span>
                </button>
              )}
            </>
          )}

          {isConnected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 rounded-xl sm:rounded-2xl text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Đã kết nối ({isCustomBot ? 'Bot Riêng' : 'Bot Hệ Thống'})</span>
              {activeBotUsername && <span className="opacity-90">(@{activeBotUsername})</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
