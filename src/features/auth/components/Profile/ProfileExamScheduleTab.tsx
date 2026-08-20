'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { ExamRecord } from '../../types/auth.types';

interface ProfileExamScheduleTabProps {
  exams: ExamRecord[];
  maSV: string;
}

export function ProfileExamScheduleTab({ exams, maSV }: ProfileExamScheduleTabProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">Lịch Thi Đã Đăng Ký Của Bạn</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng cộng: <strong className="text-blue-600">{exams.length} môn thi</strong>
            </p>
          </div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="py-16 text-center text-slate-400 italic text-sm">
          Không tìm thấy lịch thi nào cho sinh viên {maSV}.
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {exams.map((ex: ExamRecord, idx: number) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                  ex.isPostponed
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header: Date, Time & Index */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {ex.NgayThi} • {ex.GioThi}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ex.isPostponed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                    </span>
                  </div>
                </div>

                {/* Subject Name & Code */}
                <div>
                  <div className="font-mono text-xs font-bold text-indigo-700">{ex.MaMH}</div>
                  <div
                    className={`font-black text-slate-800 text-sm mt-0.5 ${
                      ex.isPostponed ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {ex.TenMH}
                  </div>
                </div>

                {/* Highlights Grid: Room, Format, Group */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Phòng Thi</span>
                    <span className="text-xs font-black text-emerald-900 font-mono mt-0.5 block truncate">
                      {ex.MAPTHI || '—'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Hình Thức</span>
                    <span className="text-xs font-bold text-slate-700 mt-0.5 block truncate">
                      {ex.MaHTThi || '—'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổ/Nhóm</span>
                    <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block truncate">
                      {ex['To thi'] || ex.NhomThi || '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block border border-slate-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center">STT</th>
                  <th className="px-4 py-3">Ngày Thi</th>
                  <th className="px-4 py-3">Giờ Thi</th>
                  <th className="px-4 py-3">Mã Môn</th>
                  <th className="px-4 py-3">Tên Môn Học</th>
                  <th className="px-4 py-3 text-center">Phòng Thi</th>
                  <th className="px-4 py-3 text-center">Hình Thức</th>
                  <th className="px-4 py-3 text-center">Tổ/Nhóm</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex: ExamRecord, idx: number) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      ex.isPostponed ? 'bg-amber-50/40' : 'hover:bg-blue-50/40'
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{ex.NgayThi}</td>
                    <td className="px-4 py-3 font-semibold text-blue-600">{ex.GioThi}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{ex.MaMH}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className={ex.isPostponed ? 'line-through text-slate-400' : ''}>
                          {ex.TenMH}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                      {ex.MAPTHI || '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-600">{ex.MaHTThi || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {ex['To thi'] || ex.NhomThi || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ex.isPostponed
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
