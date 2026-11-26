import React from 'react';
import { Bot, CheckCircle2, AlertCircle } from 'lucide-react';
import { TelegramTestResult } from './types';

interface TelegramFeedbackBannersProps {
  successMsg: string;
  errorMsg: string;
  testResult: TelegramTestResult | null;
  chatId: string;
}

export default function TelegramFeedbackBanners({
  successMsg,
  errorMsg,
  testResult,
  chatId,
}: TelegramFeedbackBannersProps) {
  return (
    <>
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {testResult && (
        <div
          className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium shadow-2xs ${
            testResult.success
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="font-bold text-xs sm:text-sm">
                {testResult.success ? 'Kiểm tra gửi tin nhắn thành công!' : 'Kiểm tra gửi tin nhắn thất bại!'}
              </div>
              <div className="text-[11px] sm:text-xs opacity-90 mt-0.5">
                {testResult.success
                  ? testResult.message || `Đã gửi tin nhắn thử nghiệm tới Chat ID: ${chatId}`
                  : testResult.error}
              </div>
            </div>
          </div>

          {testResult.botInfo && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-mono font-bold self-start sm:self-auto">
              <Bot className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {testResult.botInfo.username ? `@${testResult.botInfo.username}` : testResult.botInfo.firstName}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
