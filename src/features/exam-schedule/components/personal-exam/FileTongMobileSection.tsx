import React from 'react';
import {
  Building,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
} from 'lucide-react';
import type { ExamRecord, LoginUser } from '../../types/exam.types';
import type { FilterState } from '../FilterBar';
import {
  getDayOfWeekVietnamese,
  getFormatBadgeColor,
} from '../../utils/studentExamScheduleUtils';
import FileTongMobileFilters from './FileTongMobileFilters';

interface FileTongMobileSectionProps {
  currentUser: LoginUser;
  records: ExamRecord[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  subjects: { code: string; name: string }[];
  dates: string[];
  onSelectExamRoom: (record: ExamRecord) => void;
  onOpenReviewMembers: (record: ExamRecord) => void;
}

export default function FileTongMobileSection({
  currentUser,
  records,
  page,
  totalPages,
  setPage,
  filters,
  setFilters,
  subjects,
  dates,
  onSelectExamRoom,
  onOpenReviewMembers,
}: FileTongMobileSectionProps) {
  return (
    <div className="block md:hidden space-y-3">
      <FileTongMobileFilters
        filters={filters}
        setFilters={setFilters}
        subjects={subjects}
        dates={dates}
      />

      <div className="space-y-3">
        {records.map((rec, index) => (
          <div
            key={rec.id || index}
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

            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                  {rec.MaMH}
                </span>
                {rec.MaHTThi && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getFormatBadgeColor(
                      rec.MaHTThi
                    )}`}
                  >
                    {rec.MaHTThi}
                  </span>
                )}
              </div>

              {rec.isPostponed && (
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    Hoãn Thi / Miễn Chia
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                {rec.TenMH}
              </h4>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Lớp: {rec.MaLop || currentUser.lop || 'Chưa cập nhật'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-indigo-600" /> Ngày Thi
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                  {rec.NgayThi || 'Chưa rõ'}
                </div>
                {rec.NgayThi && (
                  <span className="text-[10px] text-slate-500">
                    {getDayOfWeekVietnamese(rec.NgayThi)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" /> Giờ Thi
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                  {rec.GioThi || 'Chưa rõ'}
                </div>
                {rec.SoPhutThi && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    {rec.SoPhutThi} phút
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3 h-3 text-amber-600" /> Phòng Thi
                </span>
                <span className="font-mono font-black text-indigo-700 text-xs mt-0.5">
                  {rec.MAPTHI || rec.PhongThi || 'Chưa rõ'}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-600" /> Tổ / Nhóm
                </span>
                <span className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  Tổ {rec['To thi'] || rec.ToThi || '-'} • Nhóm {rec.NhomThi || rec.NhomHoc || '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`font-bold flex items-center gap-1 ${
                    rec.roomClassmateCount !== undefined && rec.roomClassmateCount > 1
                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full'
                      : 'text-indigo-600'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {rec.roomClassmateCount !== undefined
                      ? `Cùng lớp: ${rec.roomClassmateCount} SV${
                          rec.roomTotalCount !== undefined ? ` / ${rec.roomTotalCount} SV` : ''
                        }`
                      : 'Xem Bạn Cùng Phòng Thi'}
                  </span>
                </span>

                <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                  Xem phòng thi &rarr;
                </span>
              </div>

              {rec.isUserInReviewBatch && rec.roomReviewSameClassCount !== undefined && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReviewMembers(rec);
                    }}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                  >
                    Ôn tập: {rec.roomReviewSameClassCount} lớp mình •{' '}
                    {rec.roomReviewOtherClassCount ?? 0} lớp khác (Xem tên)
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Trước</span>
          </button>

          <span className="text-xs font-bold text-slate-700 font-mono">
            Trang {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <span>Sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
