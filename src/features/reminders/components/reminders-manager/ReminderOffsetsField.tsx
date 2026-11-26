'use client';

import React from 'react';
import { Send, Check } from 'lucide-react';
import { PRESET_REMINDER_OFFSETS, formatOffsetMinutes } from '../../types/reminder.types';
import { ReminderFormData } from './types';

interface ReminderOffsetsFieldProps {
  formData: ReminderFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReminderFormData>>;
  onToggleOffset: (minutes: number) => void;
  onAddCustomOffset: () => void;
  onRemoveOffset: (minutes: number) => void;
}

export function ReminderOffsetsField({
  formData,
  setFormData,
  onToggleOffset,
  onAddCustomOffset,
  onRemoveOffset,
}: ReminderOffsetsFieldProps) {
  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-sky-500" />
          <span>Thông báo Telegram trước bao lâu:</span>
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          Có thể chọn nhiều mốc
        </span>
      </div>

      {/* Preset Chips */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
        {PRESET_REMINDER_OFFSETS.map((offset) => {
          const isSelected = formData.offsetMinutesList.includes(offset.value);
          return (
            <button
              key={offset.value}
              type="button"
              onClick={() => onToggleOffset(offset.value)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{offset.label}</span>
              {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Custom Offset Addition */}
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          min="1"
          placeholder="Nhập số..."
          value={formData.customOffsetVal}
          onChange={(e) => setFormData((prev) => ({ ...prev, customOffsetVal: e.target.value }))}
          className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
        <select
          value={formData.customOffsetUnit}
          onChange={(e) => setFormData((prev) => ({ ...prev, customOffsetUnit: e.target.value as any }))}
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        >
          <option value="minutes">Phút trước</option>
          <option value="hours">Giờ trước</option>
          <option value="days">Ngày trước</option>
        </select>
        <button
          type="button"
          onClick={onAddCustomOffset}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          + Thêm mốc
        </button>
      </div>

      {/* Selected Badges Preview */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 self-center">Các mốc đã chọn:</span>
        {formData.offsetMinutesList.sort((a, b) => b - a).map((m) => (
          <span
            key={m}
            className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[11px] font-medium flex items-center gap-1"
          >
            <span>{formatOffsetMinutes(m)}</span>
            <button
              type="button"
              onClick={() => onRemoveOffset(m)}
              className="hover:text-rose-600 cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
