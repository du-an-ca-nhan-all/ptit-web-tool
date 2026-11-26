import React from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  Sun,
} from 'lucide-react';
import ClassScheduleScannerCard from './ClassScheduleScannerCard';

interface RemindersTabProps {
  customReminderDate: string;
  setCustomReminderDate: (value: string) => void;
  forceAllReminders: boolean;
  setForceAllReminders: (value: boolean) => void;
  isTriggeringReminders: boolean;
  reminderRunResult: any | null;
  onRunReminders: () => void;
  classReminderDays: number;
  setClassReminderDays: (days: number) => void;
  isTriggeringClassReminders: boolean;
  classReminderRunResult: any | null;
  onRunClassNearestReminders: () => void;
}

export default function RemindersTab({
  customReminderDate,
  setCustomReminderDate,
  forceAllReminders,
  setForceAllReminders,
  isTriggeringReminders,
  reminderRunResult,
  onRunReminders,
  classReminderDays,
  setClassReminderDays,
  isTriggeringClassReminders,
  classReminderRunResult,
  onRunClassNearestReminders,
}: RemindersTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 font-black text-sm text-amber-900 mb-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <span>Mốc 1: Nhắc Trước Ngày Thi 1 Ngày</span>
            </div>
            <p className="text-xs text-amber-800/80 leading-relaxed mb-4">
              Hệ thống tự động quét và gửi danh sách các ca thi của <strong>ngày mai</strong> tới
              toàn bộ sinh viên có lịch thi để chuẩn bị kỹ càng phòng thi, SBD và giấy tờ.
            </p>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 border border-amber-200 text-xs text-amber-900 font-mono">
            📅 Trigger: Hàng ngày quét ca thi ngày <code>T + 1</code>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 font-black text-sm text-sky-900 mb-2">
              <div className="p-2 bg-sky-500 text-white rounded-xl shadow-xs">
                <Sun className="w-4 h-4" />
              </div>
              <span>Mốc 2: Nhắc 7:00 Sáng Đúng Hôm Thi (Giờ VN)</span>
            </div>
            <p className="text-xs text-sky-800/80 leading-relaxed mb-4">
              Vào đúng <strong>7:00 sáng (Giờ Việt Nam - UTC+7)</strong> ngày thi, hệ thống gửi
              thông báo chúc thi tốt và nhắc nhở chi tiết ca thi trong ngày hôm đó.
            </p>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 border border-sky-200 text-xs text-sky-900 font-mono">
            ⏰ Trigger: 07:00 AM VN (00:00 UTC) ngày <code>T</code>
          </div>
        </div>
      </div>

      {/* Trigger Runner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                Trình Điều Khiển Quét & Nhắc Lịch Thi Tự Động
              </h3>
              <p className="text-xs text-slate-500">
                Sử dụng bảng theo dõi{' '}
                <code className="font-mono text-indigo-600">ExamReminderLog</code> để đảm bảo không
                gửi trùng lặp.
              </p>
            </div>
          </div>
        </div>

        {reminderRunResult && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 animate-in fade-in ${
              reminderRunResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {reminderRunResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {reminderRunResult.success
                  ? 'Quét nhắc lịch thi hoàn tất!'
                  : 'Lỗi khi quét nhắc lịch thi'}
              </div>
              {reminderRunResult.success ? (
                <div className="font-normal text-xs mt-1 leading-relaxed opacity-90">
                  • Thời gian VN: <b>{reminderRunResult.timestampVN}</b>
                  <br />• Ngày hôm nay quét: <code>{reminderRunResult.todayStr}</code> ➔ Đã gửi{' '}
                  <b>{reminderRunResult.remindersSameDaySent}</b> ca thi (7h sáng)
                  <br />• Ngày mai quét: <code>{reminderRunResult.tomorrowStr}</code> ➔ Đã gửi{' '}
                  <b>{reminderRunResult.reminders1DaySent}</b> ca thi (trước 1 ngày)
                  <br />• Tổng sinh viên có bật nhận lịch thi:{' '}
                  <b>{reminderRunResult.totalSubscribers}</b>
                </div>
              ) : (
                <div className="font-normal text-xs mt-1">{reminderRunResult.error}</div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ngày Thử Nghiệm Tùy Chọn (Mặc định là Hôm Nay theo Giờ VN)
            </label>
            <input
              type="text"
              value={customReminderDate}
              onChange={(e) => setCustomReminderDate(e.target.value)}
              placeholder="Ví dụ: 16/08/2026 (để trống để lấy ngày thực tế)"
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Định dạng: <code className="font-mono font-bold">DD/MM/YYYY</code>.
            </p>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:border-amber-300 transition-colors">
              <input
                type="checkbox"
                checked={forceAllReminders}
                onChange={(e) => setForceAllReminders(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs font-bold text-slate-700">
                <span>Bỏ qua kiểm tra đã gửi (Gửi lại toàn bộ - Force All)</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-mono">
            API Endpoint: <code>GET /api/cron/exam-reminders</code>
          </div>

          <button
            type="button"
            onClick={onRunReminders}
            disabled={isTriggeringReminders}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isTriggeringReminders ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang quét ca thi & gửi nhắc nhở...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Chạy Quét & Gửi Nhắc Lịch Thi Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Class Schedule Scanner Card (10 Days Ahead) */}
      <ClassScheduleScannerCard
        classReminderDays={classReminderDays}
        setClassReminderDays={setClassReminderDays}
        isTriggeringClassReminders={isTriggeringClassReminders}
        classReminderRunResult={classReminderRunResult}
        onRunClassNearestReminders={onRunClassNearestReminders}
      />
    </div>
  );
}
