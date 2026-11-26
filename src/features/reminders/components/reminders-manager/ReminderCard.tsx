'use client';

import React from 'react';
import {
  Clock,
  BookOpen,
  User,
  Users,
  Trash2,
  Edit,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Send,
  EyeOff,
  Check,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ReminderItemDto, formatOffsetMinutes } from '../../types/reminder.types';
import { FormattedTextWithLinks } from './FormattedTextWithLinks';
import { parseUrl, getCountdownLabel } from './utils';

interface ReminderCardProps {
  reminder: ReminderItemDto;
  currentUsername: string;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onView: (reminder: ReminderItemDto) => void;
  onToggleComplete: (reminder: ReminderItemDto) => void;
  onEdit: (reminder: ReminderItemDto) => void;
  onDelete: (reminder: ReminderItemDto) => void;
  onDismiss: (reminder: ReminderItemDto) => void;
}

export function ReminderCard({
  reminder,
  currentUsername,
  isExpanded,
  onToggleExpand,
  onView,
  onToggleComplete,
  onEdit,
  onDelete,
  onDismiss,
}: ReminderCardProps) {
  const isCreator = reminder.creatorUsername === currentUsername;
  const isPersonal = reminder.type === 'PERSONAL';
  const countdown = getCountdownLabel(reminder.eventTime);
  const isPassed = countdown.startsWith('Đã qua');
  const eventDateObj = new Date(reminder.eventTime);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        reminder.isCompleted
          ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80'
          : isPassed
          ? 'border-slate-200'
          : isPersonal
          ? 'border-blue-200/80 hover:border-blue-300'
          : 'border-amber-200/80 hover:border-amber-300'
      }`}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Top Bar: Type Badge & Countdown */}
        <div className="flex items-center justify-between gap-2">
          {isPersonal ? (
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 flex items-center gap-1.5">
              <User className="w-3 h-3 text-blue-600" />
              <span>Cá Nhân</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 flex items-center gap-1.5 truncate max-w-[200px]">
              <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">{reminder.tenMon || reminder.maMon || 'Môn học'}</span>
            </span>
          )}

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              reminder.isCompleted
                ? 'bg-emerald-100 text-emerald-700'
                : isPassed
                ? 'bg-slate-100 text-slate-500'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono'
            }`}
          >
            {reminder.isCompleted ? '✓ Đã xong' : countdown}
          </span>
        </div>

        {/* Title & Info */}
        <div>
          <h4
            onClick={() => onView(reminder)}
            className={`font-bold text-sm sm:text-base leading-snug cursor-pointer hover:text-indigo-600 transition-colors ${
              reminder.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
            }`}
            title="Bấm để xem chi tiết đầy đủ"
          >
            {reminder.title}
          </h4>

          {!isPersonal && (
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
              {reminder.maMon && <span className="font-bold text-indigo-600">{reminder.maMon}</span>}
              {reminder.nhomTo && <span>Tổ: {reminder.nhomTo}</span>}
              {reminder.lop && <span>Lớp: {reminder.lop}</span>}
              {reminder.giangVien && <span>GV: {reminder.giangVien}</span>}
            </div>
          )}
        </div>

        {/* Event Time */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {eventDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
            {eventDateObj.toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Location or Online link */}
        {reminder.location && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            {(() => {
              const parsedUrl = parseUrl(reminder.location);
              if (parsedUrl) {
                return (
                  <a
                    href={parsedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline flex items-center gap-1 truncate font-semibold"
                    title={reminder.location}
                  >
                    <span className="truncate">{reminder.location}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                );
              }
              return <span className="truncate" title={reminder.location}>{reminder.location}</span>;
            })()}
          </div>
        )}

        {/* Description */}
        {reminder.description && (
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-1 mb-1 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-500" />
                <span>Ghi chú chi tiết:</span>
              </span>
              {(reminder.description.length > 80 || reminder.description.includes('\n')) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(reminder.id);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div
              className={`leading-relaxed whitespace-pre-line break-words ${
                !isExpanded && (reminder.description.length > 80 || reminder.description.includes('\n'))
                  ? 'line-clamp-2 text-slate-600'
                  : 'text-slate-800 max-h-60 overflow-y-auto pr-1'
              }`}
            >
              <FormattedTextWithLinks text={reminder.description} />
            </div>
          </div>
        )}

        {/* Notification Alerts List */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Send className="w-3 h-3 text-sky-500" />
              <span>Mốc thông báo Telegram</span>
            </div>
            <span className="text-[10px] text-slate-400">{reminder.alerts?.length || 0} mốc</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {reminder.alerts?.map((alert, idx) => (
              <span
                key={idx}
                className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 ${
                  alert.isSent
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {alert.isSent ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                <span>{alert.label || formatOffsetMinutes(alert.offsetMinutes)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Participants Count for Course */}
        {!isPersonal && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{reminder.totalParticipants || 1} bạn học được thêm vào lịch</span>
            </span>
            <span className="text-emerald-600 font-medium">{reminder.telegramRecipientCount || 0} nhận Telegram</span>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 truncate">
          {isCreator ? (
            <span className="font-semibold text-slate-600">Bạn đã tạo</span>
          ) : (
            <span>Người tạo: <b>{reminder.creatorName || reminder.creatorUsername}</b></span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(reminder)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
            title="Xem chi tiết đầy đủ nhắc hẹn"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleComplete(reminder)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              reminder.isCompleted
                ? 'text-emerald-600 hover:bg-emerald-100'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-200'
            }`}
            title={reminder.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>

          {isCreator ? (
            <>
              <button
                onClick={() => onEdit(reminder)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                title="Chỉnh sửa nhắc hẹn"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(reminder)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                title="Xóa nhắc hẹn"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onDismiss(reminder)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
              title="Ẩn khỏi lịch cá nhân"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
