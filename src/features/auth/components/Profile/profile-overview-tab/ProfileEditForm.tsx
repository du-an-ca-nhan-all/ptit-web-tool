'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ProfileEditFormProps } from './types';

export function ProfileEditForm({
  maSV,
  maLop,
  phone,
  setPhone,
  note,
  setNote,
  isSaving,
  onSaveProfile,
  onCancel,
}: ProfileEditFormProps) {
  return (
    <form onSubmit={onSaveProfile} className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Mã sinh viên:</span>
          <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
        </div>
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
          <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Lớp học chính:</span>
          <span className="font-bold text-blue-600 text-sm sm:text-base">{maLop}</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại liên hệ</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
          className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú cá nhân / Ghi chú ban cán sự</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Thêm ghi chú cá nhân, phân công, trực nhật..."
          rows={3}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-base sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-colors cursor-pointer text-center justify-center flex items-center"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Lưu Thay Đổi</span>
        </button>
      </div>
    </form>
  );
}
