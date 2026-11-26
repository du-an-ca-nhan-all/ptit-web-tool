'use client';

import React from 'react';
import { BookOpen, Zap } from 'lucide-react';
import { CourseItem } from '../../server/monitorFlowServerService';
import { ExecuteFlowFn } from './types';

interface MonitorCoursesMobileListProps {
  monitorCourses: CourseItem[];
  activeFollowersCount: number;
  isPullingCourses: boolean;
  isExecuting: boolean;
  onPullAllCourses: () => void;
  onExecuteFlow: ExecuteFlowFn;
}

export function MonitorCoursesMobileList({
  monitorCourses,
  activeFollowersCount,
  isPullingCourses,
  isExecuting,
  onPullAllCourses,
  onExecuteFlow,
}: MonitorCoursesMobileListProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100">
      {monitorCourses.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu môn học</p>
          <button
            onClick={onPullAllCourses}
            disabled={isPullingCourses}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Kéo Dữ Liệu Từ QLDTTX
          </button>
        </div>
      ) : (
        monitorCourses.map((course, idx) => (
          <div key={course.id_to_hoc || idx} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
            {/* Course header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded text-xs">
                    {course.ma_mon}
                  </span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                    {course.so_tc} TC
                  </span>
                </div>
                <p className="font-bold text-slate-800 text-xs sm:text-sm mt-1">{course.ten_mon}</p>
              </div>
              <span className="font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 text-xs shrink-0">
                {course.nhom_to || '—'}
              </span>
            </div>

            {/* Course details */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Lớp HP</span>
                <span className="text-slate-700 font-mono">{course.lop || '—'}</span>
              </div>
              <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Học Phí</span>
                <span className="text-emerald-700 font-bold font-mono">{(course.phai_dong || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* TKB + Flow button */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1 min-w-0">
                {course.tkb ? (
                  <div
                    className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: course.tkb }}
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Chưa xếp TKB</span>
                )}
              </div>
              <button
                onClick={() =>
                  onExecuteFlow({
                    flowAction: 'REGISTER',
                    id_to_hoc: course.id_to_hoc,
                    nhom_to: course.nhom_to,
                  })
                }
                disabled={isExecuting || activeFollowersCount === 0}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Flow</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
