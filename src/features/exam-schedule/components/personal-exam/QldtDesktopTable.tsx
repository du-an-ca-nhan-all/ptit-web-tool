import React from 'react';
import { ArrowUpDown, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { ExamRecord } from '../../types/exam.types';
import type { RoomClassStatsLookupFn } from '../../types/studentPersonalExam.types';
import { getFormatBadgeColor } from '../../utils/studentExamScheduleUtils';

interface QldtDesktopTableProps {
  exams: StudentQldtExamItem[];
  tableSortKey: keyof StudentQldtExamItem;
  onSortTable: (key: keyof StudentQldtExamItem) => void;
  roomClassStatsLookup: RoomClassStatsLookupFn;
  onSelectExam: (exam: StudentQldtExamItem) => void;
  onOpenRoomMembers: (record: ExamRecord) => void;
  onOpenReviewMembers: (record: ExamRecord) => void;
}

const SORTABLE_COLUMNS: {
  key: keyof StudentQldtExamItem;
  label: string;
  className?: string;
  center?: boolean;
}[] = [
  { key: 'stt', label: 'STT', className: 'text-center', center: true },
  { key: 'maMon', label: 'Mã Môn' },
  { key: 'tenMon', label: 'Tên Môn Học', className: 'min-w-[200px]' },
  { key: 'ngayThi', label: 'Ngày Thi & Giờ' },
  { key: 'hinhThucThi', label: 'Hình Thức Thi' },
  { key: 'maPhong', label: 'Phòng Thi' },
];

export default function QldtDesktopTable({
  exams,
  tableSortKey,
  onSortTable,
  roomClassStatsLookup,
  onSelectExam,
  onOpenRoomMembers,
  onOpenReviewMembers,
}: QldtDesktopTableProps) {
  return (
    <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSortTable(col.key)}
                  className={`py-3 px-4 cursor-pointer hover:bg-slate-100 transition ${col.className || ''}`}
                >
                  <div className={`flex items-center gap-1 ${col.center ? 'justify-center' : ''}`}>
                    <span>{col.label}</span>
                    {tableSortKey === col.key && (
                      <ArrowUpDown className="w-3 h-3 text-indigo-600" />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4">Tổ / SBD</th>
              <th className="py-3 px-4 min-w-[220px]">Địa Điểm Thi</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Chi Tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {exams.map((exam, index) => {
              const isUpcoming = exam.daysUntil >= 0;
              const isToday = exam.daysUntil === 0;
              const roomStat = roomClassStatsLookup(exam.maMon, exam.ngayThi, exam.maPhong);

              return (
                <tr
                  key={exam.id}
                  onClick={() => onSelectExam(exam)}
                  className={`hover:bg-indigo-50/40 transition cursor-pointer ${
                    isToday ? 'bg-rose-50/30' : index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                  }`}
                >
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                    {exam.stt}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                      {exam.maMon}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{exam.tenMon}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{exam.kyThi}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{exam.ngayThi}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                      <span>{exam.gioBatDau}</span>
                      {exam.soPhut && (
                        <span className="text-slate-400 font-normal">({exam.soPhut})</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${getFormatBadgeColor(
                        exam.hinhThucThi
                      )}`}
                    >
                      {exam.hinhThucThi}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-black text-indigo-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {exam.maPhong || 'Chưa rõ'}
                    </span>
                    {exam.maCoSo && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {exam.maCoSo}
                      </span>
                    )}
                    {roomStat && (
                      <div className="mt-1 flex flex-col items-start gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRoomMembers(roomStat.record);
                          }}
                          title={`Theo File lịch thi: có ${roomStat.classmates} sinh viên lớp bạn${
                            roomStat.total !== undefined ? ` / tổng ${roomStat.total} SV` : ''
                          } trong phòng ${roomStat.record.MAPTHI || exam.maPhong}. Bấm để xem danh sách phòng thi.`}
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
                              title={`Bấm để xem danh sách tên đăng ký ôn tập trong phòng ${roomStat.record.MAPTHI || exam.maPhong}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                            >
                              Ôn tập: {roomStat.record.roomReviewSameClassCount} lớp mình •{' '}
                              {roomStat.record.roomReviewOtherClassCount ?? 0} lớp khác
                            </button>
                          )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <div className="text-slate-900 font-bold">Tổ {exam.toThi || '-'}</div>
                    {exam.nhomThi && (
                      <div className="text-[10px] text-slate-500">Nhóm {exam.nhomThi}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {exam.diaDiemThi ? (
                      <div className="flex items-start gap-1 text-[11px] text-slate-600 max-w-xs">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{exam.diaDiemThi}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Theo thông báo cơ sở
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
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
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectExam(exam);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
