'use client';

import React from 'react';
import { Check, CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react';
import { CourseItem, FollowerStudentItem } from '../../server/monitorFlowServerService';
import { ExecuteFlowFn, UpdateFollowerConfigFn } from './types';

interface AllCompareMatrixRowProps {
  student: FollowerStudentItem;
  index: number;
  monitorCourses: CourseItem[];
  isExecuting: boolean;
  onInspectStudent: (student: FollowerStudentItem) => void;
  onUpdateFollowerConfig: UpdateFollowerConfigFn;
  onExecuteFlow: ExecuteFlowFn;
}

export function AllCompareMatrixRow({
  student,
  index,
  monitorCourses,
  isExecuting,
  onInspectStudent,
  onUpdateFollowerConfig,
  onExecuteFlow,
}: AllCompareMatrixRowProps) {
  const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
  const is100 = diff.matchPercent === 100 && monitorCourses.length > 0;

  // Extra courses outside monitor list
  const extraCourses = student.courses.filter(
    (c) =>
      !monitorCourses.some(
        (m) => String(m.ma_mon).toUpperCase() === String(c.ma_mon).toUpperCase()
      )
  );

  return (
    <tr
      className={`hover:bg-indigo-50/20 transition-colors ${
        is100 ? 'bg-emerald-50/10' : student.isEnabled ? 'bg-white' : 'bg-slate-50/50 opacity-80'
      }`}
    >
      {/* STT */}
      <td className="px-3.5 py-3 text-center text-slate-400 font-mono border-r border-slate-100">
        {index + 1}
      </td>

      {/* Thành Viên */}
      <td className="px-3.5 py-3 border-r border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px] border border-indigo-100">
                {student.maSV}
              </span>
              <strong className="text-slate-800 text-xs">{student.hoTen}</strong>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{student.courses.length} môn ({student.totalCredits} TC)</span>
              {!student.isExternalConfigured && (
                <span className="text-rose-600 font-bold">(Chưa có TK)</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onInspectStudent(student)}
            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
            title="Xem đối chiếu chi tiết 1-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </td>

      {/* Switch Bật/Tắt Flow */}
      <td className="px-3 py-3 text-center border-r border-slate-100">
        <button
          type="button"
          onClick={() => onUpdateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
          }`}
          title={student.isEnabled ? 'Đang BẬT Flow' : 'Đang TẮT Flow'}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              student.isEnabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </td>

      {/* Tỷ Lệ Khớp Progress Badge */}
      <td className="px-3 py-3 text-center border-r border-slate-100">
        <div className="space-y-1">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${
              is100
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : diff.matchPercent > 0
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}
          >
            {diff.matchPercent}% Khớp
          </span>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                is100 ? 'bg-emerald-500' : diff.matchPercent > 0 ? 'bg-amber-500' : 'bg-rose-400'
              }`}
              style={{ width: `${diff.matchPercent}%` }}
            />
          </div>
        </div>
      </td>

      {/* Course Cells for Each Monitor Course */}
      {monitorCourses.map((mCourse, mIdx) => {
        const monCode = String(mCourse.ma_mon || '').toUpperCase();
        const folCourse = student.courses.find(
          (c) => String(c.ma_mon || '').toUpperCase() === monCode
        );

        const isMatched = folCourse && String(folCourse.id_to_hoc).trim() === String(mCourse.id_to_hoc).trim();
        const isDiffGroup = folCourse && !isMatched;

        return (
          <td
            key={mCourse.id_to_hoc || mIdx}
            className={`px-2 py-2.5 text-center border-r border-slate-100 ${
              isMatched
                ? 'bg-emerald-50/30'
                : isDiffGroup
                ? 'bg-amber-50/40'
                : 'bg-rose-50/40'
            }`}
          >
            {isMatched ? (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black shadow-2xs">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Nhóm {folCourse.nhom_to}</span>
              </div>
            ) : isDiffGroup ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                  <span>Nhóm {folCourse.nhom_to}</span>
                </div>
                <button
                  onClick={async () => {
                    if (folCourse?.id_to_hoc) {
                      await onExecuteFlow({
                        flowAction: 'CANCEL',
                        id_to_hoc: folCourse.id_to_hoc,
                        targetFollowerUsernames: [student.maSV],
                      });
                    }
                    await onExecuteFlow({
                      flowAction: 'REGISTER',
                      id_to_hoc: mCourse.id_to_hoc,
                      targetFollowerUsernames: [student.maSV],
                    });
                  }}
                  disabled={isExecuting}
                  className="block w-full text-[9px] font-bold px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                  title={`Chuyển sang nhóm ${mCourse.nhom_to} của Lớp trưởng`}
                >
                  🔄 Đổi sang {mCourse.nhom_to}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                  Chưa ĐK
                </span>
                <button
                  onClick={() =>
                    onExecuteFlow({
                      flowAction: 'REGISTER',
                      id_to_hoc: mCourse.id_to_hoc,
                      targetFollowerUsernames: [student.maSV],
                    })
                  }
                  disabled={isExecuting}
                  className="block w-full text-[9px] font-black px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                  title={`Flow đăng ký nhóm ${mCourse.nhom_to} cho bạn này`}
                >
                  + Đăng Ký
                </button>
              </div>
            )}
          </td>
        );
      })}

      {/* Môn Thừa Ngoài */}
      <td className="px-3 py-3 text-center border-r border-slate-100">
        {extraCourses.length > 0 ? (
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {extraCourses.map((ex) => (
              <span
                key={ex.id_to_hoc}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded text-[10px] font-bold"
                title={`${ex.ten_mon} (Nhóm ${ex.nhom_to})`}
              >
                <span>{ex.ma_mon}</span>
                <button
                  onClick={() =>
                    onExecuteFlow({
                      flowAction: 'CANCEL',
                      id_to_hoc: ex.id_to_hoc,
                      targetFollowerUsernames: [student.maSV],
                    })
                  }
                  disabled={isExecuting}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  title="Hủy môn thừa này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-300 font-mono text-[10px]">Không có</span>
        )}
      </td>

      {/* Hành Động Đồng Bộ Riêng */}
      <td className="px-3.5 py-3 text-center">
        {is100 ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Khớp
          </span>
        ) : (
          <button
            onClick={() =>
              onExecuteFlow({
                flowAction: 'SYNC_ALL_COURSES',
                targetFollowerUsernames: [student.maSV],
              })
            }
            disabled={isExecuting || !student.isExternalConfigured}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all shadow-xs flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-40"
            title="Đồng bộ 2 chiều đưa toàn bộ môn của bạn này khớp 100% với Lớp trưởng"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Đồng Bộ 100%</span>
          </button>
        )}
      </td>
    </tr>
  );
}
