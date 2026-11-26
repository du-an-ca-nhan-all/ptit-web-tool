'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  CheckCircle2,
  Crown,
  GitBranch,
  HelpCircle,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import {
  AnalyzedStudentRecord,
  ExamDateTimeSortOrder,
  SplitRoomStatus,
  StudentScope,
  formatGroupLabel,
} from '../types/roomAnalysis.types';

interface RoomAnalysisSplitTableProps {
  records: AnalyzedStudentRecord[];
  scope: StudentScope;
  examTimeSort: ExamDateTimeSortOrder;
  onToggleExamTimeSort: () => void;
  onStudentClick?: (maSV: string) => void;
}

const STATUS_BADGE_MAP: Record<
  SplitRoomStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  SPLIT_SAME_GROUP: {
    label: 'Cùng tổ/nhóm · Bị tách',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
  },
  SPLIT_DIFF_GROUP: {
    label: 'Khác tổ/nhóm · Bị tách',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <GitBranch className="w-3.5 h-3.5 shrink-0" />,
  },
  SAME_ROOM: {
    label: 'Cùng phòng LT',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
  },
  NO_MONITOR_EXAM: {
    label: 'LT không thi môn này',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" />,
  },
};

export default function RoomAnalysisSplitTable({
  records,
  scope,
  examTimeSort,
  onToggleExamTimeSort,
  onStudentClick,
}: RoomAnalysisSplitTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16 px-4 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Không có sinh viên nào khớp bộ lọc</p>
        <p className="text-xs text-slate-400">
          Thử thay đổi trạng thái tách phòng, phạm vi lọc hoặc điều kiện sĩ số phòng.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 px-4 text-center w-12">STT</th>
            <th className="py-3.5 px-4 min-w-[200px]">Sinh viên</th>
            <th className="py-3.5 px-4 min-w-[180px]">Môn thi</th>
            <th className="py-3.5 px-4 min-w-[175px]">
              <button
                type="button"
                onClick={onToggleExamTimeSort}
                title={
                  examTimeSort === 'DATE_ASC'
                    ? 'Đang sắp xếp ngày giờ thi: Sớm → Muộn (nhấn để đảo chiều)'
                    : 'Đang sắp xếp ngày giờ thi: Muộn → Sớm (nhấn để đảo chiều)'
                }
                className="inline-flex items-center gap-1 uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>Phòng &amp; Ngày giờ thi</span>
                {examTimeSort === 'DATE_ASC' ? (
                  <ArrowUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" />
                )}
              </button>
            </th>
            <th className="py-3.5 px-4 min-w-[165px]">Phòng Lớp Trưởng</th>
            <th className="py-3.5 px-4 min-w-[160px]">Tổ / Nhóm</th>
            <th className="py-3.5 px-4 min-w-[185px]">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {records.map((rec, idx) => {
            const badge = STATUS_BADGE_MAP[rec.splitStatus];
            const studentGroup = formatGroupLabel(rec);
            const monitorGroup = formatGroupLabel({
              nhomHoc: rec.monitorNhomHoc,
              toThi: rec.monitorToThi,
              nhomThi: rec.monitorNhomThi,
            });
            const rowHighlight =
              rec.splitStatus === 'SPLIT_SAME_GROUP'
                ? 'bg-rose-50/35 hover:bg-rose-50/65'
                : rec.splitStatus === 'SPLIT_DIFF_GROUP'
                ? 'bg-amber-50/25 hover:bg-amber-50/55'
                : idx % 2 === 1
                ? 'bg-slate-50/30 hover:bg-slate-50'
                : 'bg-white hover:bg-slate-50';

            return (
              <tr key={`${rec.id}-${rec.maSV}-${idx}`} className={`transition-colors ${rowHighlight}`}>
                <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                  {idx + 1}
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {onStudentClick ? (
                        <button
                          type="button"
                          onClick={() => onStudentClick(rec.maSV)}
                          className="font-mono font-bold text-indigo-700 hover:underline cursor-pointer"
                        >
                          {rec.maSV}
                        </button>
                      ) : (
                        <span className="font-mono font-bold text-indigo-700">{rec.maSV}</span>
                      )}
                      {rec.isReviewRegistered && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <BookOpenCheck className="w-2.5 h-2.5" /> Ôn tập
                        </span>
                      )}
                      {rec.isPostponed && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                          Hoãn thi
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-800">{rec.hoTen}</span>
                    {rec.soDienThoai && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        {rec.soDienThoai}
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 leading-snug">{rec.tenMH}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <span>{rec.maMH}</span>
                      {rec.maHTThi && (
                        <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-sans font-semibold text-slate-600">
                          {rec.maHTThi}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-mono font-black px-2 py-0.5 rounded-lg border text-xs ${
                          rec.splitStatus === 'SAME_ROOM'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.splitStatus === 'NO_MONITOR_EXAM'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {rec.mapThi || '—'}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md"
                        title={
                          scope === 'REVIEW'
                            ? `${rec.reviewRoomCount} AE ôn tập / ${rec.classRoomCount} SV lớp / ${rec.roomTotalCount} tổng phòng`
                            : `${rec.classRoomCount} SV lớp / ${rec.roomTotalCount} tổng phòng`
                        }
                      >
                        <Users className="w-2.5 h-2.5" />
                        {rec.scopeRoomCount}
                        {rec.roomTotalCount > 0 ? `/${rec.roomTotalCount}` : ''}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-mono">
                      {rec.ngayThi} · {rec.gioThi}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  {rec.monitorRoom ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg w-fit">
                        <Crown className="w-3 h-3 text-amber-600" />
                        {rec.monitorRoom}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rec.monitorDate} · {rec.monitorTime}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">LT không thi</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-700">SV: {studentGroup}</span>
                    {rec.monitorRoom && (
                      <span className="text-[11px] text-slate-500">LT: {monitorGroup}</span>
                    )}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badge.className}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
