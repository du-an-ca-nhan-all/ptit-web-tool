'use client';

import React, { useState } from 'react';
import { Crown, GraduationCap, Copy, CheckCheck } from 'lucide-react';
import { LoginUser, ExamRecord } from '../../types/auth.types';

interface ProfileHeroBannerProps {
  currentUser: LoginUser & { student?: any };
  currentEffectiveRole: string;
  fullName: string;
  maSV: string;
  maLop: string;
  trangThai: string;
  phone: string;
  hasExamSchedule?: boolean;
  exams: ExamRecord[];
  configuredCount: number;
  onOpenExternalAccountsTab: () => void;
}

export function ProfileHeroBanner({
  currentUser,
  currentEffectiveRole,
  fullName,
  maSV,
  maLop,
  trangThai,
  phone,
  hasExamSchedule = false,
  exams = [],
  configuredCount,
  onOpenExternalAccountsTab,
}: ProfileHeroBannerProps) {
  const [copiedMssv, setCopiedMssv] = useState(false);

  const handleCopyMssv = () => {
    navigator.clipboard.writeText(maSV);
    setCopiedMssv(true);
    setTimeout(() => setCopiedMssv(false), 2000);
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        {/* User Identity Info */}
        <div className="flex items-center sm:items-start md:items-center gap-3.5 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-2xl shrink-0 overflow-hidden ring-2 sm:ring-4 ring-white/20">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${maSV}`}
              alt={fullName}
              className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight break-words">
                {fullName}
              </h1>
              {currentEffectiveRole === 'admin' && (
                <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shadow-xs shrink-0">
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" /> Admin
                </span>
              )}
              {currentEffectiveRole === 'lop_truong' && (
                <span className="bg-amber-400 text-slate-900 text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shadow-xs shrink-0">
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Lớp Trưởng
                </span>
              )}
              {currentEffectiveRole === 'sinh_vien' && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                  <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sinh Viên
                </span>
              )}
            </div>

            {/* Badges Line */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 mt-2 text-blue-100 text-xs sm:text-sm font-mono flex-wrap">
              <button
                onClick={handleCopyMssv}
                className="bg-black/30 hover:bg-black/45 active:scale-95 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Sao chép MSSV"
              >
                <span className="font-bold text-white tracking-wider">{maSV}</span>
                {copiedMssv ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-75" />
                )}
              </button>
              <span className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-xl font-bold text-white text-[11px] sm:text-xs shrink-0">
                Lớp {maLop}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-sans font-semibold shrink-0">
                {trangThai === 'DANG_HOC'
                  ? '● Đang theo học'
                  : trangThai === 'BAO_LUU'
                  ? '● Đang bảo lưu'
                  : '● Đã chuyển lớp'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Metrics on Banner */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/10 md:border-t-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center flex flex-col justify-center">
            <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">
              Lịch Thi
            </div>
            <div className="text-sm sm:text-base md:text-lg font-black text-white mt-0.5">
              {hasExamSchedule ? `${exams.length} môn` : 'Đang đóng'}
            </div>
          </div>

          <div
            onClick={onOpenExternalAccountsTab}
            className="bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-95 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center cursor-pointer transition-all flex flex-col justify-center"
            title="Nhấp để xem liên kết QLĐT"
          >
            <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">
              Cổng QLĐT
            </div>
            <div className="text-sm sm:text-base md:text-lg font-black text-emerald-300 mt-0.5">
              {configuredCount > 0 ? 'Đã kết nối' : 'Chưa kết nối'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center flex flex-col justify-center">
            <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">
              Số ĐT
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5 truncate">
              {phone || 'Chưa có'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
