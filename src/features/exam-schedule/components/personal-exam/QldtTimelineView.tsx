import React from 'react';
import { Users } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { ExamRecord } from '../../types/exam.types';
import type {
  RoomClassStatsLookupFn,
  TimelineGroup,
} from '../../types/studentPersonalExam.types';
import { getFormatBadgeColor } from '../../utils/studentExamScheduleUtils';

interface QldtTimelineViewProps {
  timelineGroups: TimelineGroup[];
  roomClassStatsLookup: RoomClassStatsLookupFn;
  onSelectExam: (exam: StudentQldtExamItem) => void;
  onOpenRoomMembers: (record: ExamRecord) => void;
  onOpenReviewMembers: (record: ExamRecord) => void;
}

export default function QldtTimelineView({
  timelineGroups,
  roomClassStatsLookup,
  onSelectExam,
  onOpenRoomMembers,
  onOpenReviewMembers,
}: QldtTimelineViewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {timelineGroups.map((group) => {
        const isGroupUpcoming = group.daysUntil >= 0;
        const isGroupToday = group.daysUntil === 0;

        return (
          <div
            key={group.dateStr}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-black text-center min-w-[50px] sm:min-w-[55px] ${
                    isGroupToday
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                      : isGroupUpcoming
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] uppercase">{group.dayOfWeek || 'NGÀY'}</div>
                  <div className="text-sm sm:text-base font-mono">
                    {group.dateStr.split('/')[0]}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      {group.dayOfWeek ? `${group.dayOfWeek}, ` : ''}Ngày {group.dateStr}
                    </h4>
                    {isGroupToday ? (
                      <span className="text-[10px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-full animate-pulse">
                        HÔM NAY THI
                      </span>
                    ) : isGroupUpcoming ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Còn {group.daysUntil} ngày
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Đã kết thúc
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Gồm <b>{group.items.length} môn thi</b> diễn ra trong ngày này
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-5 space-y-3 sm:space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200/80 before:hidden sm:before:block">
              {group.items.map((exam) => {
                const roomStat = roomClassStatsLookup(exam.maMon, exam.ngayThi, exam.maPhong);
                return (
                  <div
                    key={exam.id}
                    onClick={() => onSelectExam(exam)}
                    className="sm:pl-10 relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 transition cursor-pointer group active:scale-98"
                  >
                    <div className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-xs items-center justify-center group-hover:scale-125 transition-transform" />

                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200 text-center font-mono shrink-0">
                        <span className="text-xs font-black text-indigo-700 block">
                          {exam.gioBatDau}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{exam.soPhut}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {exam.maMon}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getFormatBadgeColor(
                              exam.hinhThucThi
                            )}`}
                          >
                            {exam.hinhThucThi}
                          </span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-black text-slate-900 mt-1 truncate group-hover:text-indigo-600 transition">
                          {exam.tenMon}
                        </h5>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-700">
                            Phòng: {exam.maPhong || 'Chưa rõ'}
                          </span>
                          {roomStat && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenRoomMembers(roomStat.record);
                                }}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                  roomStat.classmates > 1
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                }`}
                              >
                                <Users className="w-3 h-3 shrink-0" />
                                {roomStat.classmates} SV cùng lớp
                                {roomStat.total !== undefined ? ` / ${roomStat.total}` : ''}
                              </button>
                              {roomStat.record.isUserInReviewBatch &&
                                roomStat.record.roomReviewSameClassCount !== undefined && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenReviewMembers(roomStat.record);
                                    }}
                                    title="Bấm để xem danh sách tên đăng ký ôn tập trong phòng"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                  >
                                    Ôn tập: {roomStat.record.roomReviewSameClassCount} lớp mình •{' '}
                                    {roomStat.record.roomReviewOtherClassCount ?? 0} lớp khác
                                  </button>
                                )}
                            </>
                          )}
                          <span>•</span>
                          <span>Tổ {exam.toThi || '-'}</span>
                          {exam.diaDiemThi && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{exam.diaDiemThi}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                        Chi tiết &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
