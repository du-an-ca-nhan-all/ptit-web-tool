import React from 'react';
import { Building, CalendarDays, Clock, MapPin, User } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import {
  getDayOfWeekVietnamese,
  getFormatBadgeColor,
} from '../../utils/studentExamScheduleUtils';

interface QldtMobileCardsProps {
  exams: StudentQldtExamItem[];
  onSelectExam: (exam: StudentQldtExamItem) => void;
}

export default function QldtMobileCards({ exams, onSelectExam }: QldtMobileCardsProps) {
  return (
    <div className="block md:hidden space-y-3">
      {exams.map((exam) => {
        const isUpcoming = exam.daysUntil >= 0;
        const isToday = exam.daysUntil === 0;

        return (
          <div
            key={exam.id}
            onClick={() => onSelectExam(exam)}
            className={`p-4 rounded-2xl bg-white border transition shadow-2xs flex flex-col gap-3 relative overflow-hidden active:scale-98 cursor-pointer ${
              isToday
                ? 'border-rose-400 ring-2 ring-rose-400/20'
                : isUpcoming
                ? 'border-indigo-200 hover:border-indigo-300'
                : 'border-slate-200'
            }`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                isToday ? 'bg-rose-500' : isUpcoming ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />

            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                  {exam.maMon}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getFormatBadgeColor(
                    exam.hinhThucThi
                  )}`}
                >
                  {exam.hinhThucThi}
                </span>
              </div>

              <div>
                {isToday ? (
                  <span className="text-[10px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-full animate-pulse">
                    HÔM NAY THI
                  </span>
                ) : isUpcoming ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Còn {exam.daysUntil} ngày
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Đã thi xong
                  </span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                {exam.tenMon}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {exam.kyThi} {exam.dotThi ? `• ${exam.dotThi}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-indigo-600" /> Ngày Thi
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                  {exam.ngayThi || 'Chưa công bố'}
                </div>
                {exam.ngayThi && (
                  <span className="text-[10px] text-slate-500">
                    {getDayOfWeekVietnamese(exam.ngayThi)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" /> Giờ Thi
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                  {exam.gioBatDau || 'Chưa rõ'}
                </div>
                {exam.soPhut && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    Thời lượng: {exam.soPhut}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3 h-3 text-amber-600" /> Phòng Thi
                </span>
                <span className="font-mono font-black text-indigo-700 text-xs mt-0.5">
                  {exam.maPhong || 'Chưa rõ'}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-600" /> SBD / Tổ
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  Tổ {exam.toThi || '-'} {exam.nhomThi ? `(Nhóm ${exam.nhomThi})` : ''}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
              {exam.diaDiemThi ? (
                <div className="flex items-center gap-1 text-slate-600 truncate flex-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{exam.diaDiemThi}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[10px]">Theo thông báo cơ sở</span>
              )}

              <span className="text-indigo-600 font-bold shrink-0 flex items-center gap-0.5">
                Chi tiết &rarr;
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
