import React from 'react';
import { Building, CalendarDays, Clock, MapPin, User, Users } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { ExamRecord } from '../../types/exam.types';
import type { RoomClassStatsLookupFn } from '../../types/studentPersonalExam.types';
import { getFormatBadgeColor } from '../../utils/studentExamScheduleUtils';

interface QldtGridViewProps {
  exams: StudentQldtExamItem[];
  roomClassStatsLookup: RoomClassStatsLookupFn;
  onSelectExam: (exam: StudentQldtExamItem) => void;
  onOpenRoomMembers: (record: ExamRecord) => void;
  onOpenReviewMembers: (record: ExamRecord) => void;
}

export default function QldtGridView({
  exams,
  roomClassStatsLookup,
  onSelectExam,
  onOpenRoomMembers,
  onOpenReviewMembers,
}: QldtGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {exams.map((exam) => {
        const isUpcoming = exam.daysUntil >= 0;
        const isToday = exam.daysUntil === 0;
        const roomStat = roomClassStatsLookup(exam.maMon, exam.ngayThi, exam.maPhong);

        return (
          <div
            key={exam.id}
            onClick={() => onSelectExam(exam)}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 sm:gap-4 cursor-pointer group relative overflow-hidden active:scale-98"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                isToday ? 'bg-rose-500' : isUpcoming ? 'bg-indigo-500' : 'bg-slate-300'
              }`}
            />

            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5 pt-0.5">
                <span className="font-mono text-[10px] sm:text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                  {exam.maMon}
                </span>

                <span
                  className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border ${getFormatBadgeColor(
                    exam.hinhThucThi
                  )}`}
                >
                  {exam.hinhThucThi}
                </span>

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
                    Đã thi
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                {exam.tenMon}
              </h4>

              <div className="mt-3 bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-slate-100 flex flex-col gap-1.5 sm:gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] sm:text-xs">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ngày thi:</span>
                  </div>
                  <strong className="text-slate-900 font-mono text-xs">
                    {exam.ngayThi || 'Chưa công bố'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] sm:text-xs">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Giờ bắt đầu:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 font-mono text-xs">
                      {exam.gioBatDau || 'Chưa rõ'}
                    </strong>
                    {exam.soPhut && (
                      <span className="text-[10px] text-slate-500 font-normal">({exam.soPhut})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] sm:text-xs">
                    <Building className="w-3.5 h-3.5 text-amber-600" />
                    <span>Phòng thi:</span>
                  </div>
                  <strong className="text-indigo-700 font-mono text-xs">
                    {exam.maPhong || 'Chưa xếp phòng'}
                  </strong>
                </div>

                {roomStat && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px] sm:text-xs">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cùng lớp trong phòng:</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRoomMembers(roomStat.record);
                        }}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          roomStat.classmates > 1
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                      >
                        {roomStat.classmates} SV
                        {roomStat.total !== undefined ? ` / ${roomStat.total}` : ''}
                      </button>
                    </div>
                    {roomStat.record.isUserInReviewBatch &&
                      roomStat.record.roomReviewSameClassCount !== undefined && (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Ôn tập trong phòng:
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenReviewMembers(roomStat.record);
                            }}
                            title="Bấm để xem danh sách tên đăng ký ôn tập trong phòng"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                          >
                            {roomStat.record.roomReviewSameClassCount} lớp mình •{' '}
                            {roomStat.record.roomReviewOtherClassCount ?? 0} lớp khác
                          </button>
                        </div>
                      )}
                  </>
                )}

                {exam.toThi && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px] sm:text-xs">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>SBD / Tổ:</span>
                    </div>
                    <strong className="text-slate-900 font-mono text-xs">
                      Tổ {exam.toThi} {exam.nhomThi ? `(Nhóm ${exam.nhomThi})` : ''}
                    </strong>
                  </div>
                )}
              </div>

              {exam.diaDiemThi && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500 line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{exam.diaDiemThi}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium truncate">{exam.kyThi}</span>
              <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                Chi tiết &rarr;
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
