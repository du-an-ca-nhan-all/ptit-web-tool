import React from 'react';
import { Users, Calendar, UserCheck, UserMinus } from 'lucide-react';
import { ClassMemberStats } from './types';

interface ClassMembersStatsProps {
  stats: ClassMemberStats;
  excludedCount: number;
  hasExamSchedule: boolean;
}

export default function ClassMembersStats({
  stats,
  excludedCount,
  hasExamSchedule,
}: ClassMembersStatsProps) {
  return (
    <div
      className={`grid gap-2.5 sm:gap-4 shrink-0 ${
        hasExamSchedule ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
      }`}
    >
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <Users className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Sĩ Số Đang Học</p>
          <p className="text-lg sm:text-2xl font-black text-slate-800">
            {stats.total} <span className="text-[10px] sm:text-xs font-normal text-slate-500">SV</span>
          </p>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
          <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Giới Tính</p>
          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
            <span className="text-blue-600">{stats.maleCount} Nam</span> /{' '}
            <span className="text-rose-500">{stats.femaleCount} Nữ</span>
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden flex">
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${stats.total > 0 ? (stats.maleCount / stats.total) * 100 : 0}%` }}
            ></div>
            <div
              className="bg-rose-400 h-full"
              style={{ width: `${stats.total > 0 ? (stats.femaleCount / stats.total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {hasExamSchedule && (
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Đăng Ký Thi</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">
              {stats.totalExams} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Lượt</span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <UserMinus className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Biến Động</p>
          <p className="text-lg sm:text-2xl font-black text-rose-600">
            {excludedCount}{' '}
            <span className="text-[10px] sm:text-xs font-normal text-slate-500">Bảo lưu</span>
          </p>
        </div>
      </div>
    </div>
  );
}
