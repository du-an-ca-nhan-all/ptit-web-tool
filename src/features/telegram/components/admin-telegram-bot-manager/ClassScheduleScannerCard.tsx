import React from 'react';
import { AlertCircle, BookOpen, CalendarDays, CheckCircle2, RefreshCw } from 'lucide-react';
import { CLASS_REMINDER_DAY_OPTIONS } from './types';

interface ClassScheduleScannerCardProps {
  classReminderDays: number;
  setClassReminderDays: (days: number) => void;
  isTriggeringClassReminders: boolean;
  classReminderRunResult: any | null;
  onRunClassNearestReminders: () => void;
}

export default function ClassScheduleScannerCard({
  classReminderDays,
  setClassReminderDays,
  isTriggeringClassReminders,
  classReminderRunResult,
  onRunClassNearestReminders,
}: ClassScheduleScannerCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">
              Trình Quét Lịch Học Gần Nhất (Trong 10 Ngày Tới)
            </h3>
            <p className="text-xs text-slate-500">
              Quét thời khóa biểu của toàn bộ sinh viên, tìm ngày học gần nhất trong 10 ngày tới và
              gửi thông báo qua Telegram nếu có lịch học.
            </p>
          </div>
        </div>
      </div>

      {classReminderRunResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 animate-in fade-in ${
            classReminderRunResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {classReminderRunResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {classReminderRunResult.success
                ? 'Quét lịch học gần nhất hoàn tất!'
                : 'Lỗi khi quét lịch học'}
            </div>
            {classReminderRunResult.success ? (
              <div className="font-normal text-xs mt-1 leading-relaxed opacity-90">
                • Đã quét trong vòng: <b>{classReminderRunResult.maxDays} ngày tới</b>
                <br />• Tổng sinh viên có bật nhận lịch học:{' '}
                <b>{classReminderRunResult.totalSubscribers}</b>
                <br />• Đã gửi thông báo thành công: <b>{classReminderRunResult.totalSent}</b> tài
                khoản (Không có lịch: {classReminderRunResult.notFoundCount})
              </div>
            ) : (
              <div className="font-normal text-xs mt-1">{classReminderRunResult.error}</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Số Ngày Quét Tới (Mặc định: 10 Ngày)
          </label>
          <div className="flex items-center gap-2">
            {CLASS_REMINDER_DAY_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setClassReminderDays(days)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  classReminderDays === days
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {days} ngày
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Khi kích hoạt, hệ thống sẽ kiểm tra từng ngày từ hôm nay đến {classReminderDays} ngày tới.
          Nếu tìm thấy ngày có ca học đầu tiên, hệ thống sẽ trích xuất chi tiết và gửi thông báo
          Telegram cho sinh viên.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 font-mono">
          API Endpoint:{' '}
          <code>GET /api/cron/class-reminders?type=nearest&days={classReminderDays}</code>
        </div>

        <button
          type="button"
          onClick={onRunClassNearestReminders}
          disabled={isTriggeringClassReminders}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isTriggeringClassReminders ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang quét lịch học & gửi Telegram...</span>
            </>
          ) : (
            <>
              <CalendarDays className="w-4 h-4" />
              <span>Quét Lịch Học Gần Nhất ({classReminderDays} Ngày) Ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
