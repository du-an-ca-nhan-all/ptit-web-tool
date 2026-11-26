import React from 'react';
import {
  Send,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Globe,
  CalendarDays,
} from 'lucide-react';

interface NotificationSchedulePanelsProps {
  isTelegramReady: boolean;
  isQldttxAvailable: boolean;
  isSlinkAvailable: boolean;
  notifyClassSchedule: boolean;
  classReminderBefore: number;
  onChangeClassReminderBefore: (val: number) => void;
  isCheckingClassSchedule: boolean;
  isCheckingNearestClassSchedule: boolean;
  onCheckClassScheduleNow: () => void;
  onCheckNearestClassSchedule: () => void;
  classScheduleCheckMsg: string;
  nearestClassScheduleMsg: string;
  notifyQldtAnnouncements: boolean;
  qldtCheckInterval: number;
  onChangeQldtCheckInterval: (val: number) => void;
  isCheckingQldt: boolean;
  onCheckQldtNow: () => void;
  qldtCheckMsg: string;
  notifySlinkAnnouncements: boolean;
  slinkCheckInterval: number;
  onChangeSlinkCheckInterval: (val: number) => void;
  isCheckingSlink: boolean;
  onCheckSlinkNow: () => void;
  slinkCheckMsg: string;
}

export default function NotificationSchedulePanels({
  isTelegramReady,
  isQldttxAvailable,
  isSlinkAvailable,
  notifyClassSchedule,
  classReminderBefore,
  onChangeClassReminderBefore,
  isCheckingClassSchedule,
  isCheckingNearestClassSchedule,
  onCheckClassScheduleNow,
  onCheckNearestClassSchedule,
  classScheduleCheckMsg,
  nearestClassScheduleMsg,
  notifyQldtAnnouncements,
  qldtCheckInterval,
  onChangeQldtCheckInterval,
  isCheckingQldt,
  onCheckQldtNow,
  qldtCheckMsg,
  notifySlinkAnnouncements,
  slinkCheckInterval,
  onChangeSlinkCheckInterval,
  isCheckingSlink,
  onCheckSlinkNow,
  slinkCheckMsg,
}: NotificationSchedulePanelsProps) {
  return (
    <>
      {/* Class Schedule Setting Panel */}
      {isTelegramReady && isQldttxAvailable && notifyClassSchedule && (
        <div className="mt-2 p-3 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Tự động nhắc lịch học & thời khóa biểu:</span>
            </div>
            <div className="text-[11px] text-amber-700">
              Sáng từ <strong>7h00 - 10h00</strong> tự động gửi tổng hợp các ca học hôm nay. Chọn thời gian nhắc nhở:
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 30, label: '30 phút trước' },
              { value: 60, label: '1 tiếng trước' },
              { value: 0, label: 'Cả 30p & 1 tiếng' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChangeClassReminderBefore(item.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  classReminderBefore === item.value
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onCheckClassScheduleNow}
              disabled={isCheckingClassSchedule || isCheckingNearestClassSchedule}
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Kiểm tra lịch học hôm nay và gửi tin nhắn thử nghiệm ngay"
            >
              {isCheckingClassSchedule ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Kiểm Tra Hôm Nay</span>
            </button>

            <button
              type="button"
              onClick={onCheckNearestClassSchedule}
              disabled={isCheckingNearestClassSchedule || isCheckingClassSchedule}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Quét lịch học gần nhất trong 10 ngày tới và gửi thông báo Telegram nếu có"
            >
              {isCheckingNearestClassSchedule ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CalendarDays className="w-3 h-3" />}
              <span>Quét Lịch 10 Ngày Tới</span>
            </button>
          </div>
        </div>
      )}

      {isTelegramReady && classScheduleCheckMsg && (
        <div className="p-3 bg-amber-50/80 border border-amber-300 text-amber-900 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{classScheduleCheckMsg}</span>
        </div>
      )}

      {isTelegramReady && nearestClassScheduleMsg && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{nearestClassScheduleMsg}</span>
        </div>
      )}

      {/* QLDTTX Check Interval Selector */}
      {isTelegramReady && isQldttxAvailable && notifyQldtAnnouncements && (
        <div className="mt-1 p-3 sm:p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <div className="font-bold text-sky-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Tần suất kiểm tra thông báo mới từ QLDTTX:</span>
            </div>
            <div className="text-[11px] text-sky-700">
              Hệ thống sẽ quét định kỳ trang <a href="https://qldttx.pttc1.edu.vn/#/xemthongbao" target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-800 hover:text-sky-950">/#/xemthongbao</a> và bắn tin nhắn khi có thông báo mới.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 1, label: '1 tiếng' },
              { value: 2, label: '2 tiếng (Khuyên dùng)' },
              { value: 5, label: '5 tiếng' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChangeQldtCheckInterval(item.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  qldtCheckInterval === item.value
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onCheckQldtNow}
              disabled={isCheckingQldt}
              className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Kiểm tra thông báo ngay lập tức"
            >
              {isCheckingQldt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Kiểm Tra Ngay</span>
            </button>
          </div>
        </div>
      )}

      {isTelegramReady && qldtCheckMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{qldtCheckMsg}</span>
        </div>
      )}

      {/* S-Link Check Interval Selector */}
      {isTelegramReady && isSlinkAvailable && notifySlinkAnnouncements && (
        <div className="mt-1 p-3 sm:p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <div className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Tần suất kiểm tra thông báo mới từ PTIT S-Link:</span>
            </div>
            <div className="text-[11px] text-indigo-700">
              Hệ thống sẽ quét định kỳ ứng dụng <a href="https://slink.ptit.edu.vn/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-indigo-800 hover:text-indigo-950">PTIT S-Link</a>, bắn tin nhắn Telegram khi có thông báo mới và <strong>tự động đánh dấu đã đọc</strong>.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 1, label: '1 tiếng' },
              { value: 2, label: '2 tiếng (Khuyên dùng)' },
              { value: 5, label: '5 tiếng' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onChangeSlinkCheckInterval(item.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  slinkCheckInterval === item.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={onCheckSlinkNow}
              disabled={isCheckingSlink}
              className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Kiểm tra thông báo S-Link ngay lập tức"
            >
              {isCheckingSlink ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Kiểm Tra Ngay</span>
            </button>
          </div>
        </div>
      )}

      {isTelegramReady && slinkCheckMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{slinkCheckMsg}</span>
        </div>
      )}
    </>
  );
}
