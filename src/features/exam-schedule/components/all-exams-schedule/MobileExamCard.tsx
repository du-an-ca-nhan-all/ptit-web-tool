'use client';

import React from 'react';
import { CalendarDays, Building, User, Users, Clock } from 'lucide-react';
import { ExamRecord } from '../../types/exam.types';
import { getDayOfWeekVietnamese, getFormatBadgeColor } from './utils';

interface MobileExamCardProps {
  record: ExamRecord;
  onSelectExamRoom: (room: ExamRecord) => void;
  onStudentClick: (id: string | null) => void;
  onClassClick: (code: string | null) => void;
  onTogglePostpone: (record: ExamRecord, newStatus: boolean) => Promise<void>;
  canAccessMonitorTools: boolean;
}

export default function MobileExamCard({
  record: rec,
  onSelectExamRoom,
  onStudentClick,
  onClassClick,
  onTogglePostpone,
  canAccessMonitorTools,
}: MobileExamCardProps) {
  const dow = getDayOfWeekVietnamese(rec.NgayThi);

  return (
    <div
      onClick={() => onSelectExamRoom(rec)}
      className={`p-4 rounded-2xl bg-white border transition shadow-2xs flex flex-col gap-3 relative overflow-hidden active:scale-98 cursor-pointer ${
        rec.isPostponed
          ? 'border-amber-200 bg-amber-50/20'
          : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          rec.isPostponed ? 'bg-amber-500' : 'bg-indigo-600'
        }`}
      />

      <div className="flex items-start justify-between gap-2 pt-0.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            {rec.HoLotSV} {rec.TenSV}
          </h3>

          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStudentClick(rec.MaSV);
              }}
              className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition shadow-2xs"
            >
              {rec.MaSV}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onClassClick(rec.MaLop);
              }}
              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition shadow-2xs truncate max-w-[140px]"
            >
              {rec.MaLop}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {rec.MaHTThi && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getFormatBadgeColor(
                rec.MaHTThi
              )}`}
            >
              {rec.MaHTThi}
            </span>
          )}

          {rec.isPostponed && (
            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md uppercase">
              Hoãn
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
        <div className="text-xs font-black text-slate-900 leading-snug">
          {rec.TenMH}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Mã môn: {rec.MaMH}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-indigo-600" /> Ngày Thi
          </span>
          <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
            {rec.NgayThi || 'Chưa rõ'} {dow && <span className="text-indigo-600 font-semibold">({dow})</span>}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-600" /> Giờ Thi
          </span>
          <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
            {rec.GioThi || 'Chưa rõ'}
            {rec.SoPhutThi && (
              <span className="text-[10px] text-slate-400 font-normal ml-1">
                ({rec.SoPhutThi}p)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3 text-amber-600" /> Phòng Thi
          </span>
          <span className="font-mono font-black text-indigo-700 text-xs mt-0.5">
            {rec.MAPTHI || rec.PhongThi || 'Chưa rõ'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3 text-purple-600" /> Tổ / Nhóm
          </span>
          <span className="font-mono font-bold text-slate-800 text-xs mt-0.5">
            Tổ {rec['To thi'] || rec.ToThi || '-'} • N{rec.NhomThi || rec.NhomHoc || '-'}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <span className="text-indigo-600 font-bold flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>Xem Phòng Thi</span>
        </span>

        {canAccessMonitorTools ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePostpone(rec, !rec.isPostponed);
            }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
              rec.isPostponed
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            {rec.isPostponed ? '✕ Đã hoãn thi' : 'Hoãn thi?'}
          </button>
        ) : (
          <span className="text-indigo-600 font-bold">Chi tiết &rarr;</span>
        )}
      </div>
    </div>
  );
}
