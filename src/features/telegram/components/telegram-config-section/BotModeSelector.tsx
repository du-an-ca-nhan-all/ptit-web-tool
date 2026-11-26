import React from 'react';
import { Bot, Key, ExternalLink, Users, Globe } from 'lucide-react';
import { SystemTelegramBotInfo } from '../../../../types';

interface BotModeSelectorProps {
  isCustomBot: boolean;
  systemBot: SystemTelegramBotInfo | null;
  onSelectSystemBot: () => void;
  onSelectCustomBot: () => void;
}

export default function BotModeSelector({
  isCustomBot,
  systemBot,
  onSelectSystemBot,
  onSelectCustomBot,
}: BotModeSelectorProps) {
  return (
    <>
      {/* BOT MODE SELECTOR */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-800">Lựa Chọn Bot Sử Dụng</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Option 1: System Bot */}
          <div
            onClick={onSelectSystemBot}
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 sm:gap-2 relative ${
              !isCustomBot
                ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-200'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Globe className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Bot Hệ Thống (Khuyên Dùng)</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">
                Tiện Lợi Nhất
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sử dụng bot chính thức của trường. Bạn chỉ cần thêm bot vào nhóm/kênh hoặc chat riêng mà không cần tạo bot.
            </p>
          </div>

          {/* Option 2: Custom Bot */}
          <div
            onClick={onSelectCustomBot}
            className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 sm:gap-2 relative ${
              isCustomBot
                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Key className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Tự Tạo & Cấu Hình Bot Riêng</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                Tùy chỉnh
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dành cho bạn muốn dùng bot riêng của cá nhân. Yêu cầu nhập Telegram Bot API Token từ @BotFather.
            </p>
          </div>
        </div>
      </div>

      {/* SYSTEM BOT SHORTCUT ACTIONS CARD */}
      {!isCustomBot && (
        <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-sky-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-slate-900">
                  {systemBot?.botFirstName || 'PTIT EduSync Official Bot'}
                </span>
                {systemBot?.botUsername && (
                  <span className="font-mono text-[11px] text-sky-700 font-bold bg-sky-100 px-2 py-0.2 rounded-md">
                    @{systemBot.botUsername}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bot hệ thống đã sẵn sàng kết nối và gửi thông báo tự động.
              </p>
            </div>
          </div>

          {systemBot?.botUsername ? (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <a
                href={systemBot.addToGroupUrl || `https://t.me/${systemBot.botUsername}?startgroup=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Thêm Vào Nhóm</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          ) : (
            <div className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              ⚠️ Admin chưa cấu hình Bot Toàn Trường.
            </div>
          )}
        </div>
      )}
    </>
  );
}
