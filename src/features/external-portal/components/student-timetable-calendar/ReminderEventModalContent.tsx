import React from 'react';
import {
  Calendar as CalendarIcon,
  MapPin,
  BookOpen,
  ExternalLink,
  Users,
  Bell,
} from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';

interface ReminderEventModalContentProps {
  event: TimetableCalendarEvent;
  onClose: () => void;
  onNavigateToReminders?: () => void;
}

export default function ReminderEventModalContent({
  event,
  onClose,
  onNavigateToReminders,
}: ReminderEventModalContentProps) {
  const rem = event.rawSession?.reminder;
  const isPersonal = rem?.type === 'PERSONAL';

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-2xl ${isPersonal ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
          <Bell className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isPersonal ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {isPersonal ? 'Lịch Nhắc Cá Nhân' : `Môn Học • ${rem?.maMon || 'Chung'}`}
            </span>
            {rem?.isCompleted && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Đã hoàn thành
              </span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-800 leading-tight mt-1 truncate">
            {rem?.title || event.subjectName}
          </h3>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" /> Thời gian hẹn:
          </span>
          <span className="font-bold text-slate-800 font-mono">
            {new Date(rem?.eventTime || event.date).toLocaleString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {!isPersonal && rem?.tenMon && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Tên môn học:
            </span>
            <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
              {rem.tenMon}
            </span>
          </div>
        )}

        {!isPersonal && rem?.nhomTo && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-600" /> Nhóm tổ:
            </span>
            <span className="font-bold text-slate-800 font-mono">
              Tổ {rem.nhomTo} {rem.lop ? `• Lớp ${rem.lop}` : ''}
            </span>
          </div>
        )}

        {rem?.location && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Địa điểm / Link:
            </span>
            {(() => {
              const loc = rem.location.trim();
              const isHttp = /^https?:\/\//i.test(loc);
              const isDomain = /^(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com|[a-zA-Z0-9-]+\.(?:edu|com|org|net|vn|io|app|me|gg|link)\b)/i.test(loc);
              if (isHttp || isDomain) {
                const href = isHttp ? loc : `https://${loc}`;
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[220px]"
                    title={loc}
                  >
                    <span className="truncate">{loc}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                );
              }
              return (
                <span className="font-bold text-slate-800 truncate max-w-[200px]" title={loc}>
                  {loc}
                </span>
              );
            })()}
          </div>
        )}

        {rem?.description && (
          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold block mb-1">Ghi chú / Mô tả:</span>
            <p className="text-slate-700 whitespace-pre-line break-words leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 text-xs max-h-60 overflow-y-auto">
              {rem.description}
            </p>
          </div>
        )}

        {rem?.alerts && rem.alerts.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold flex items-center gap-1 mb-1.5">
              <Bell className="w-3 h-3 text-amber-500" /> Lịch gửi Telegram ({rem.alerts.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rem.alerts.map((al: any, idx: number) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                    al.isSent
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {al.isSent ? '✓' : '⏱'} {al.label || `Trước ${al.offsetMinutes}p`}
                </span>
              ))}
            </div>
          </div>
        )}

        {!isPersonal && rem?.participantsCount !== undefined && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Số SV cùng lớp nhận thông báo:</span>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {rem.participantsCount} sinh viên
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {onNavigateToReminders ? (
          <button
            onClick={() => {
              onClose();
              onNavigateToReminders();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Mở trang Nhắc Hẹn</span>
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
