'use client';

import React from 'react';
import {
  Clock,
  BookOpen,
  User,
  ExternalLink,
  MapPin,
  Send,
  X,
  Check,
  FileText,
  Copy,
} from 'lucide-react';
import { ReminderItemDto, formatOffsetMinutes } from '../../types/reminder.types';
import { FormattedTextWithLinks } from './FormattedTextWithLinks';
import { parseUrl, getCountdownLabel } from './utils';
import { ReminderDetailFooter } from './ReminderDetailFooter';

interface ReminderDetailModalProps {
  reminder: ReminderItemDto;
  currentUsername: string;
  copiedKey: string;
  onCopyText: (text: string, key: string) => void;
  onToggleComplete: (reminder: ReminderItemDto) => void;
  onEdit: (reminder: ReminderItemDto) => void;
  onDelete: (reminder: ReminderItemDto) => void;
  onDismiss: (reminder: ReminderItemDto) => void;
  onClose: () => void;
}

export function ReminderDetailModal({
  reminder,
  currentUsername,
  copiedKey,
  onCopyText,
  onToggleComplete,
  onEdit,
  onDelete,
  onDismiss,
  onClose,
}: ReminderDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                reminder.type === 'PERSONAL'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {reminder.type === 'PERSONAL' ? <User className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                Chi Tiết Lịch Nhắc Hẹn
              </h3>
              <p className="text-xs text-slate-500">
                {reminder.type === 'PERSONAL'
                  ? 'Nhắc hẹn cá nhân'
                  : `Môn học: ${reminder.tenMon || reminder.maMon || 'Chung'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4 scrollbar-thin">
          {/* Badges & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                  reminder.type === 'PERSONAL'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {reminder.type === 'PERSONAL' ? <User className="w-3.5 h-3.5 text-blue-600" /> : <BookOpen className="w-3.5 h-3.5 text-amber-600" />}
                <span>{reminder.type === 'PERSONAL' ? 'Cá Nhân' : 'Môn Học'}</span>
              </span>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  reminder.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {reminder.isCompleted ? '✓ Đã hoàn thành' : 'Đang theo dõi'}
              </span>
            </div>

            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {getCountdownLabel(reminder.eventTime)}
            </span>
          </div>

          {/* Title */}
          <div>
            <h2
              className={`text-lg sm:text-xl font-black leading-snug ${
                reminder.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
              }`}
            >
              {reminder.title}
            </h2>

            {reminder.type === 'COURSE' && (
              <div className="mt-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1">
                <div className="font-bold text-sm text-amber-950">
                  {reminder.tenMon || reminder.maMon} {reminder.maMon && `(${reminder.maMon})`}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-amber-800">
                  {reminder.nhomTo && <span>Nhóm/Tổ: <b>{reminder.nhomTo}</b></span>}
                  {reminder.lop && <span>Lớp: <b>{reminder.lop}</b></span>}
                  {reminder.giangVien && <span>GV: <b>{reminder.giangVien}</b></span>}
                </div>
              </div>
            )}
          </div>

          {/* Event Time */}
          <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thời gian diễn ra</div>
              <div className="font-bold text-slate-800">
                {new Date(reminder.eventTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(reminder.eventTime).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Location or Online link */}
          {reminder.location && (
            <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Địa điểm / Đường dẫn học online</span>
                </span>
                <button
                  type="button"
                  onClick={() => onCopyText(reminder.location || '', 'loc')}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'loc' ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
              </div>

              {(() => {
                const parsedUrl = parseUrl(reminder.location);
                if (parsedUrl) {
                  return (
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={parsedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 font-bold break-all"
                      >
                        <span>{reminder.location}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  );
                }
                return (
                  <div className="font-bold text-slate-800 break-words mt-0.5">
                    {reminder.location}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Full Description / Notes */}
          {reminder.description ? (
            <div className="flex flex-col gap-1.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dặn dò / Ghi chú chi tiết</span>
                </span>
                <button
                  type="button"
                  onClick={() => onCopyText(reminder.description || '', 'desc')}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'desc' ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="mt-1 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words max-h-72 overflow-y-auto pr-1">
                <FormattedTextWithLinks text={reminder.description} />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
              Không có ghi chú dặn dò bổ sung.
            </div>
          )}

          {/* Notification Alerts List */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-500" />
              <span>Các mốc thông báo Telegram ({reminder.alerts?.length || 0})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {reminder.alerts && reminder.alerts.length > 0 ? (
                reminder.alerts.map((alert, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                      alert.isSent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {alert.isSent ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{alert.label || formatOffsetMinutes(alert.offsetMinutes)}</span>
                    {alert.isSent && <span className="text-[10px] text-emerald-600 font-normal">(Đã phát)</span>}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-xs">Không có mốc báo trước</span>
              )}
            </div>
          </div>

          {/* Meta: Creator & Participants */}
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              Người tạo: <b>{reminder.creatorName || reminder.creatorUsername}</b>
              {reminder.createdAt && ` (${new Date(reminder.createdAt).toLocaleDateString('vi-VN')})`}
            </span>
            {reminder.type === 'COURSE' && (
              <span className="text-emerald-600 font-medium">
                {reminder.totalParticipants || 1} bạn học • {reminder.telegramRecipientCount || 0} nhận Telegram
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <ReminderDetailFooter
          reminder={reminder}
          currentUsername={currentUsername}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onDismiss={onDismiss}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
