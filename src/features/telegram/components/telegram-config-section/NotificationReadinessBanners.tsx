import React from 'react';
import { Send, RefreshCw, Globe, Lock, ShieldAlert } from 'lucide-react';
import { TelegramConfigItem } from '../../../../types';
import { TelegramTestResult } from './types';

interface NotificationReadinessBannersProps {
  isTelegramReady: boolean;
  isTelegramConfigured: boolean;
  testResult: TelegramTestResult | null;
  config: TelegramConfigItem | null;
  isTesting: boolean;
  chatId: string;
  isCustomBot: boolean;
  botToken: string;
  onTest: () => void;
  isQldttxAvailable: boolean;
  isQldttxError: boolean;
  onNavigateTab?: (tab: string) => void;
}

export default function NotificationReadinessBanners({
  isTelegramReady,
  isTelegramConfigured,
  testResult,
  config,
  isTesting,
  chatId,
  isCustomBot,
  botToken,
  onTest,
  isQldttxAvailable,
  isQldttxError,
  onNavigateTab,
}: NotificationReadinessBannersProps) {
  return (
    <>
      {/* Telegram Configuration & Test Readiness Alert Banner */}
      {!isTelegramReady && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-bold block text-rose-950">
                {!isTelegramConfigured
                  ? 'Chưa hoàn tất cấu hình kết nối Telegram'
                  : testResult?.success === false || config?.lastTestStatus === 'FAILED'
                  ? 'Kiểm tra gửi tin nhắn Telegram thất bại'
                  : 'Yêu cầu kiểm tra kết nối Telegram thành công'}
              </strong>
              <span className="text-[11px] text-rose-800">
                {!isTelegramConfigured
                  ? 'Vui lòng nhập Chat ID (và Bot Token nếu dùng Bot riêng), sau đó bấm "Gửi Tin Nhắn Thử Nghiệm" hoặc "Lưu Cấu Hình" để mở khóa nhận thông báo.'
                  : testResult?.success === false || config?.lastTestStatus === 'FAILED'
                  ? 'Lần gửi thử nghiệm gần nhất không thành công. Vui lòng kiểm tra lại Chat ID / Token và gửi thử nghiệm thành công để kích hoạt nhận thông báo.'
                  : 'Để sử dụng các tùy chọn nhận thông báo, bạn cần bấm "Gửi Tin Nhắn Thử Nghiệm" thành công ít nhất một lần để xác thực kết nối.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onTest}
            disabled={isTesting || !chatId.trim() || (isCustomBot && !botToken.trim())}
            className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Gửi Thử Nghiệm Ngay</span>
          </button>
        </div>
      )}

      {/* QLDTTX Dependency Alert Banner */}
      {isTelegramReady && !isQldttxAvailable && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-bold block text-amber-950">
                {isQldttxError
                  ? 'Tài khoản Cổng QLDTTX (PTTC1) bị sai mật khẩu hoặc lỗi xác thực'
                  : 'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)'}
              </strong>
              <span className="text-[11px] text-amber-800">
                {isQldttxError
                  ? 'Các tính năng nhận "Lịch Học & TKB" và "Thông Báo Cổng QLDTTX" tạm thời bị khóa. Vui lòng cập nhật lại mật khẩu chính xác.'
                  : 'Để mở khóa nhận "Lịch Học & TKB" và "Thông Báo Cổng QLDTTX", bạn cần liên kết tài khoản QLDTTX trước.'}
              </span>
            </div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('EXTERNAL_ACCOUNTS')}
              className="w-full sm:w-auto px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isQldttxError ? 'Cập Nhật Mật Khẩu' : 'Liên Kết Ngay'}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
