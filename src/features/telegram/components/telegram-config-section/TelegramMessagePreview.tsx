import React from 'react';
import { Zap } from 'lucide-react';
import { LoginUser } from '../../../../types';

interface TelegramMessagePreviewProps {
  isCustomBot: boolean;
  currentUser?: LoginUser | null;
  activeBotUsername?: string | null;
  chatId: string;
  threadId: string;
}

export default function TelegramMessagePreview({
  isCustomBot,
  currentUser,
  activeBotUsername,
  chatId,
  threadId,
}: TelegramMessagePreviewProps) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3.5 sm:mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
          <Zap className="w-3.5 h-3.5" />
          <span>Mẫu Tin Nhắn Telegram ({!isCustomBot ? 'Bot Hệ Thống' : 'Bot Riêng'})</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">HTML Format</span>
      </div>

      <div className="bg-slate-800/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-700/60 font-mono text-xs text-slate-200 leading-relaxed max-w-lg overflow-x-auto">
        <div className="font-bold text-sky-300 mb-1">🤖 THÔNG BÁO THỬ NGHIỆM - PTIT WEB TOOL</div>
        <div className="text-slate-500 mb-2">━━━━━━━━━━━━━━━━━━━━━━━━━</div>
        <div className="text-emerald-400 font-bold mb-2">
          🎉 Chúc mừng! Cấu hình Telegram Bot đã hoạt động chính xác.
        </div>
        <div className="text-slate-300">
          👤 <b>Họ và tên:</b> {currentUser?.fullName || currentUser?.username || 'Nguyễn Văn A'}<br />
          🆔 <b>Mã sinh viên:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{currentUser?.username || 'B25DCCN001'}</code><br />
          🏫 <b>Lớp:</b> <b>{currentUser?.lop || 'D25TXCN11-K'}</b><br />
          🤖 <b>Bot gửi:</b> <b>{activeBotUsername ? `@${activeBotUsername}` : '@PTIT_Notification_bot'}</b><br />
          📌 <b>Chat ID nhận:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{chatId || '123456789'}</code><br />
          {threadId && (
            <>
              🧵 <b>Thread / Topic ID:</b> <code className="bg-slate-700 px-1 rounded text-sky-200">{threadId}</code><br />
            </>
          )}
          ⏰ <b>Thời gian test:</b> <i>{new Date().toLocaleTimeString('vi-VN')} - {new Date().toLocaleDateString('vi-VN')}</i>
        </div>
        <div className="text-slate-500 my-2">━━━━━━━━━━━━━━━━━━━━━━━━━</div>
        <div className="text-slate-400 text-[11px] italic">
          🔔 Từ bây giờ, hệ thống sẽ tự động gửi thông báo lịch thi, cập nhật phòng thi và học vụ trực tiếp đến Telegram này.
        </div>
      </div>
    </div>
  );
}
