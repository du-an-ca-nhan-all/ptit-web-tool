'use client';

import React from 'react';
import { CheckCircle2, Edit, Trash2, EyeOff } from 'lucide-react';
import { ReminderItemDto } from '../../types/reminder.types';

interface ReminderDetailFooterProps {
  reminder: ReminderItemDto;
  currentUsername: string;
  onToggleComplete: (reminder: ReminderItemDto) => void;
  onEdit: (reminder: ReminderItemDto) => void;
  onDelete: (reminder: ReminderItemDto) => void;
  onDismiss: (reminder: ReminderItemDto) => void;
  onClose: () => void;
}

export function ReminderDetailFooter({
  reminder,
  currentUsername,
  onToggleComplete,
  onEdit,
  onDelete,
  onDismiss,
  onClose,
}: ReminderDetailFooterProps) {
  return (
    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleComplete(reminder)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            reminder.isCompleted
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{reminder.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}</span>
        </button>

        {reminder.creatorUsername === currentUsername ? (
          <>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(reminder);
              }}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200/60"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Sửa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(reminder);
              }}
              className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onDismiss(reminder);
            }}
            className="px-3 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-200/60"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Ẩn khỏi lịch</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
      >
        Đóng
      </button>
    </div>
  );
}
