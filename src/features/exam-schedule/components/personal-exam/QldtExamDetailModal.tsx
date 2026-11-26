import React from 'react';
import { CheckCheck, Copy, MapPin, Users, X } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { ExamRecord } from '../../types/exam.types';
import type { RoomClassStatsLookupFn } from '../../types/studentPersonalExam.types';
import { getFormatBadgeColor } from '../../utils/studentExamScheduleUtils';

interface QldtExamDetailModalProps {
  exam: StudentQldtExamItem;
  copiedId: string | null;
  roomClassStatsLookup: RoomClassStatsLookupFn;
  onClose: () => void;
  onCopyText: (text: string, id: string) => void;
  onOpenRoomMembers: (record: ExamRecord) => void;
  onOpenReviewMembers: (record: ExamRecord) => void;
}

export default function QldtExamDetailModal({
  exam,
  copiedId,
  roomClassStatsLookup,
  onClose,
  onCopyText,
  onOpenRoomMembers,
  onOpenReviewMembers,
}: QldtExamDetailModalProps) {
  const roomStat = roomClassStatsLookup(exam.maMon, exam.ngayThi, exam.maPhong);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-7 relative max-h-[88vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
          <span className="font-mono text-[11px] sm:text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
            {exam.maMon}
          </span>
          <span
            className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border ${getFormatBadgeColor(
              exam.hinhThucThi
            )}`}
          >
            {exam.hinhThucThi}
          </span>
        </div>

        <h3 className="text-base sm:text-xl font-black text-slate-900 mb-3 sm:mb-4 leading-snug">
          {exam.tenMon}
        </h3>

        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Kỳ thi / Đợt thi:</span>
            <strong className="text-slate-800">
              {exam.kyThi} ({exam.dotThi})
            </strong>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Ngày thi:</span>
            <strong className="text-slate-900 font-mono text-sm">{exam.ngayThi}</strong>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Giờ bắt đầu:</span>
            <strong className="text-slate-900 font-mono text-sm">
              {exam.gioBatDau} {exam.soPhut && `(${exam.soPhut})`}
            </strong>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Phòng thi:</span>
            <strong className="text-indigo-700 font-mono text-sm">
              {exam.maPhong || 'Chưa rõ'}
            </strong>
          </div>

          {roomStat && (
            <>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200/60 flex-wrap">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cùng lớp trong phòng (từ file):</span>
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      roomStat.classmates > 1
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {roomStat.classmates} SV
                    {roomStat.total !== undefined ? ` / ${roomStat.total} SV` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenRoomMembers(roomStat.record)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Xem danh sách &rarr;
                  </button>
                </div>
              </div>
              {roomStat.record.isUserInReviewBatch &&
                roomStat.record.roomReviewSameClassCount !== undefined && (
                  <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200/60 flex-wrap">
                    <span className="text-emerald-700 font-semibold">ĐK Ôn tập trong phòng:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {roomStat.record.roomReviewSameClassCount} lớp mình
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {roomStat.record.roomReviewOtherClassCount ?? 0} lớp khác
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenReviewMembers(roomStat.record)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                      >
                        Xem tên &rarr;
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}

          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Tổ thi / Nhóm thi:</span>
            <strong className="text-slate-800 font-mono">
              Tổ {exam.toThi || '-'} | Nhóm {exam.nhomThi || '-'}
            </strong>
          </div>

          {exam.siSo > 0 && (
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Sĩ số phòng thi:</span>
              <strong className="text-slate-800">{exam.siSo} thí sinh</strong>
            </div>
          )}

          {exam.ghepPhong && (
            <div className="py-1 border-b border-slate-200/60">
              <div className="text-slate-500 font-medium mb-1">Ghép phòng thi:</div>
              <div className="text-slate-800 font-medium bg-white p-2 rounded-xl border border-slate-200">
                {exam.ghepPhong}
              </div>
            </div>
          )}

          {exam.diaDiemThi && (
            <div className="py-1">
              <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Địa điểm thi:</span>
                </span>
                <button
                  onClick={() => onCopyText(exam.diaDiemThi, 'addr')}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                >
                  {copiedId === 'addr' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === 'addr' ? 'Đã chép' : 'Sao chép địa chỉ'}</span>
                </button>
              </div>
              <div className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                {exam.diaDiemThi}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
