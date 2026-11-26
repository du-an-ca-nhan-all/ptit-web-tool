'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { ExamRecord } from '../../types/exam.types';
import { getHTColor } from './utils';

interface DataTableRowProps {
  record: ExamRecord;
  index: number;
  startIndex: number;
  onStudentClick: (maSV: string) => void;
  onClassClick: (maLop: string) => void;
  onRowClick?: (record: ExamRecord) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  canEditPostpone: boolean;
  hideStatusColumn: boolean;
  showRoomClassmatesColumn: boolean;
  onViewRoomReviewMembers?: (record: ExamRecord) => void;
}

export function DataTableRow({
  record,
  index,
  startIndex,
  onStudentClick,
  onClassClick,
  onRowClick,
  onTogglePostpone,
  canEditPostpone,
  hideStatusColumn,
  showRoomClassmatesColumn,
  onViewRoomReviewMembers,
}: DataTableRowProps) {
  return (
    <tr
      className={`transition-colors ${
        record.isPostponed
          ? 'bg-amber-50/40 text-slate-600'
          : index % 2 === 1
          ? 'bg-slate-50/30'
          : ''
      } ${onRowClick ? 'cursor-pointer hover:bg-slate-100' : 'hover:bg-slate-50'}`}
      onClick={() => onRowClick && onRowClick(record)}
    >
      <td className="px-6 py-4 text-sm text-slate-500">{startIndex + index + 1}</td>
      <td
        className="px-6 py-4 text-sm font-mono text-blue-600 cursor-pointer hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          onStudentClick(record.MaSV);
        }}
      >
        {record.MaSV}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
        <div className="flex items-center gap-2">
          <span className={record.isPostponed ? 'line-through text-slate-500' : ''}>
            {record.HoLotSV} {record.TenSV}
          </span>
          {record.isPostponed && (
            <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">
              Hoãn thi
            </span>
          )}
        </div>
      </td>
      <td
        className="px-6 py-4 text-sm text-slate-600 cursor-pointer hover:underline text-blue-600 font-medium"
        onClick={(e) => {
          e.stopPropagation();
          onClassClick(record.MaLop);
        }}
      >
        {record.MaLop}
      </td>
      <td
        className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate"
        title={record.TenMH}
      >
        {record.TenMH}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-700">{record.MAPTHI}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{record.NgayThi}</td>
      <td className="px-6 py-4 text-sm text-slate-500">{record.GioThi}</td>
      <td className="px-6 py-4 text-center">
        <span
          className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${getHTColor(
            record.MaHTThi
          )}`}
        >
          {record.MaHTThi || 'Thi'}
        </span>
      </td>
      {showRoomClassmatesColumn && (
        <td className="px-6 py-4 text-center">
          {record.roomClassmateCount !== undefined ? (
            <div className="flex flex-col items-center gap-1">
              <span
                title={`Có ${record.roomClassmateCount} sinh viên lớp ${record.MaLop || 'của bạn'}${
                  record.roomTotalCount !== undefined ? ` / tổng ${record.roomTotalCount} SV` : ''
                } trong phòng ${record.MAPTHI || ''}. Bấm để xem danh sách phòng thi.`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  record.roomClassmateCount > 1
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {record.roomClassmateCount} SV
                  {record.roomTotalCount !== undefined && (
                    <span className="font-medium opacity-75"> / {record.roomTotalCount}</span>
                  )}
                </span>
              </span>
              {record.isUserInReviewBatch && record.roomReviewSameClassCount !== undefined && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewRoomReviewMembers?.(record);
                  }}
                  title={`Bấm để xem danh sách tên đăng ký ôn tập trong phòng ${record.MAPTHI || ''}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                >
                  Ôn tập: {record.roomReviewSameClassCount} lớp mình •{' '}
                  {record.roomReviewOtherClassCount ?? 0} lớp khác
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      )}
      {!hideStatusColumn && (
        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
          {onTogglePostpone && canEditPostpone ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePostpone(record, !record.isPostponed);
              }}
              title={
                record.isPostponed
                  ? 'Bấm để chuyển về Dự thi (sẽ tính tiền)'
                  : 'Bấm để đánh dấu Hoãn thi / Không thi (không tính chia tiền)'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                record.isPostponed
                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
              }`}
            >
              {record.isPostponed ? '✕ Hoãn thi' : '✓ Dự thi'}
            </button>
          ) : (
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                record.isPostponed
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {record.isPostponed ? 'Hoãn thi' : 'Dự thi'}
            </span>
          )}
        </td>
      )}
    </tr>
  );
}
