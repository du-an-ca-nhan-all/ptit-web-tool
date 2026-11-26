import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  BookOpen,
  ExternalLink,
  Video,
  User,
  Users,
  CheckCheck,
  Copy,
  GraduationCap,
} from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SessionNumberInfo } from './types';

interface ClassEventModalContentProps {
  event: TimetableCalendarEvent;
  sessionInfo?: SessionNumberInfo;
  subjectProgress?: SubjectProgressItem;
  copiedLink: boolean;
  onCopyLink: (link: string) => void;
  onClose: () => void;
}

export default function ClassEventModalContent({
  event,
  sessionInfo,
  subjectProgress,
  copiedLink,
  onCopyLink,
  onClose,
}: ClassEventModalContentProps) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
              {event.subjectCode} • Tổ {event.group}
            </span>
            {sessionInfo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Buổi {sessionInfo.current}/{sessionInfo.total}
              </span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-800 leading-tight mt-0.5">
            {event.subjectName}
          </h3>
        </div>
      </div>

      {/* Subject Progress Card in Modal */}
      {subjectProgress && (
        <div className="mb-3.5 p-3 bg-gradient-to-br from-indigo-50/80 to-slate-50 border border-indigo-100/90 rounded-2xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Tiến độ môn học:</span>
            </span>
            <span className="text-indigo-700 font-bold">
              Đã học {subjectProgress.stats.completed}/{subjectProgress.stats.total} buổi ({subjectProgress.stats.percentage}%)
            </span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, subjectProgress.stats.percentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>✓ Đã học: <b className="text-emerald-700">{subjectProgress.stats.completed}</b> buổi</span>
            <span>•</span>
            <span>⏳ Còn: <b className="text-amber-700">{subjectProgress.stats.remaining}</b> buổi</span>
            <span>•</span>
            <span className={subjectProgress.isFinished ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}>
              {subjectProgress.isFinished ? 'Đã hoàn thành môn' : 'Đang học'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" /> Ngày học:
          </span>
          <span className="font-bold text-slate-800 font-mono">
            {event.dayOfWeekStr}, {new Date(event.date).toLocaleDateString('vi-VN')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Giờ học:
          </span>
          <span className="font-bold text-slate-800 font-mono">
            {event.startTime} - {event.endTime} ({event.periodStr})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Phòng học:
          </span>
          <span className="font-bold text-slate-800">
            {event.room}
          </span>
        </div>

        {event.lecturer && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" /> Giảng viên:
            </span>
            <span className="font-bold text-slate-800">
              {event.lecturer}
            </span>
          </div>
        )}

        {event.classCode && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-600" /> Lớp học phần:
            </span>
            <span className="font-bold text-slate-800 font-mono">
              {event.classCode}
            </span>
          </div>
        )}
      </div>

      {event.onlineLink && (
        <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="text-xs font-bold text-sky-900 truncate">
              {event.onlineLink}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onCopyLink(event.onlineLink!)}
              className="p-1.5 bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-xl text-xs transition cursor-pointer"
              title="Sao chép link"
            >
              {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={event.onlineLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <span>Vào học</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </>
  );
}
