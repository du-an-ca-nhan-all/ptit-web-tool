'use client';

import React from 'react';
import { Phone, Mail, CreditCard, MapPin, Flag } from 'lucide-react';
import { ProfileInfoGridProps } from './types';

export function ProfileInfoGrid({
  maSV,
  fullName,
  gioiTinh,
  ngaySinh,
  maLop,
  phone,
  note,
  student,
}: ProfileInfoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Mã sinh viên</span>
        <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Họ và Tên</span>
        <span className="font-black text-slate-800 text-sm sm:text-base">{fullName}</span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Giới tính</span>
        <span className="font-bold text-slate-800 text-xs sm:text-sm">{gioiTinh}</span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ngày sinh</span>
        <span className="font-bold text-slate-800 text-xs sm:text-sm">{ngaySinh}</span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Lớp biên chế</span>
        <span className="font-bold text-blue-600 text-xs sm:text-sm">{maLop}</span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Số điện thoại</span>
        <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Số CMND / CCCD</span>
        <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {student?.soCMND || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Email 1</span>
        <span className="font-medium text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 break-all">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {student?.email1 || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Email 2</span>
        <span className="font-medium text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 break-all">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {student?.email2 || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Nơi sinh</span>
        <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {student?.noiSinh || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
        <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Quốc tịch</span>
        <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {student?.quocTich || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
        </span>
      </div>

      {note && (
        <div className="sm:col-span-2 p-3.5 sm:p-4 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60">
          <span className="text-amber-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ghi chú cá nhân</span>
          <p className="text-slate-700 text-xs italic break-words">"{note}"</p>
        </div>
      )}
    </div>
  );
}
