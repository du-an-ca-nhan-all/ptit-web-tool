'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { CourseItem, FollowerStudentItem, MonitorProfileData } from '../../server/monitorFlowServerService';
import { CompareFilter, ExecuteFlowFn, UpdateFollowerConfigFn } from './types';
import { AllCompareKpiBanner } from './AllCompareKpiBanner';
import { AllCompareToolbar } from './AllCompareToolbar';
import { AllCompareMatrixRow } from './AllCompareMatrixRow';

interface AllCompareTabProps {
  selectedClass: string;
  students: FollowerStudentItem[];
  filteredStudents: FollowerStudentItem[];
  monitorData: MonitorProfileData | null;
  monitorCourses: CourseItem[];
  matched100Count: number;
  needsAttentionCount: number;
  activeFollowersCount: number;
  linkedAccountsCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  compareFilter: CompareFilter;
  onFilterChange: (filter: CompareFilter) => void;
  isLoading: boolean;
  isExecuting: boolean;
  isPullingCourses: boolean;
  onOpenSyncAllModal: () => void;
  onOpenImportModal: () => void;
  onPullAllCourses: () => void;
  onInspectStudent: (student: FollowerStudentItem) => void;
  onUpdateFollowerConfig: UpdateFollowerConfigFn;
  onExecuteFlow: ExecuteFlowFn;
}

export function AllCompareTab({
  selectedClass,
  students,
  filteredStudents,
  monitorData,
  monitorCourses,
  matched100Count,
  needsAttentionCount,
  activeFollowersCount,
  linkedAccountsCount,
  searchQuery,
  onSearchChange,
  compareFilter,
  onFilterChange,
  isLoading,
  isExecuting,
  isPullingCourses,
  onOpenSyncAllModal,
  onOpenImportModal,
  onPullAllCourses,
  onInspectStudent,
  onUpdateFollowerConfig,
  onExecuteFlow,
}: AllCompareTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      <AllCompareKpiBanner
        monitorCoursesCount={monitorCourses.length}
        monitorTotalCredits={monitorData?.totalCredits || 0}
        matched100Count={matched100Count}
        needsAttentionCount={needsAttentionCount}
        activeFollowersCount={activeFollowersCount}
        linkedAccountsCount={linkedAccountsCount}
        studentsCount={students.length}
        isExecuting={isExecuting}
        isLoading={isLoading}
        isPullingCourses={isPullingCourses}
        onOpenSyncAllModal={onOpenSyncAllModal}
        onOpenImportModal={onOpenImportModal}
        onPullAllCourses={onPullAllCourses}
      />

      {/* All-in-One Matrix Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <AllCompareToolbar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          compareFilter={compareFilter}
          onFilterChange={onFilterChange}
          studentsCount={students.length}
          needsAttentionCount={needsAttentionCount}
          activeFollowersCount={activeFollowersCount}
          matched100Count={matched100Count}
          linkedAccountsCount={linkedAccountsCount}
        />

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải và tính toán đối chiếu môn học cho cả lớp...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Không có thành viên nào khớp bộ lọc</p>
              <p className="text-xs text-slate-400">Thử bấm "Tất Cả" hoặc tìm kiếm với từ khóa khác.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  {/* Fixed Left Columns */}
                  <th className="px-3.5 py-3 text-center w-10 bg-slate-50 border-r border-slate-200">STT</th>
                  <th className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 min-w-[200px]">
                    Thành Viên Trong Lớp
                  </th>
                  <th className="px-3 py-3 text-center bg-slate-50 border-r border-slate-200 min-w-[90px]">
                    Flow
                  </th>
                  <th className="px-3 py-3 text-center bg-slate-50 border-r border-slate-200 min-w-[110px]">
                    Tỷ Lệ Khớp
                  </th>

                  {/* Dynamic Columns: Each of Monitor's Courses */}
                  {monitorCourses.map((mCourse, mIdx) => (
                    <th
                      key={mCourse.id_to_hoc || mIdx}
                      className="px-3 py-3 text-center border-r border-slate-200 min-w-[145px] bg-slate-50"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] block truncate">
                          {mCourse.ma_mon}
                        </span>
                        <span className="font-bold text-slate-800 text-[11px] block truncate" title={mCourse.ten_mon}>
                          {mCourse.ten_mon}
                        </span>
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-black rounded border border-amber-300">
                            Nhóm {mCourse.nhom_to || '—'}
                          </span>
                          <span className="text-slate-400 font-normal">({mCourse.so_tc} TC)</span>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Right Columns: Môn Thừa & Thao Tác */}
                  <th className="px-3.5 py-3 text-center border-r border-slate-200 min-w-[130px] bg-slate-50">
                    Môn Thừa Ngoài
                  </th>
                  <th className="px-3.5 py-3 text-center bg-slate-50 min-w-[120px]">
                    Hành Động
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <AllCompareMatrixRow
                    key={student.maSV}
                    student={student}
                    index={idx}
                    monitorCourses={monitorCourses}
                    isExecuting={isExecuting}
                    onInspectStudent={onInspectStudent}
                    onUpdateFollowerConfig={onUpdateFollowerConfig}
                    onExecuteFlow={onExecuteFlow}
                  />
                ))}
              </tbody>

              {/* Summary Footer Row */}
              <tfoot className="bg-slate-100/90 text-slate-700 font-bold border-t-2 border-slate-300 text-[11px]">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-black uppercase text-slate-600 border-r border-slate-200">
                    Tổng Số Thành Viên Đã Khớp Môn:
                  </td>
                  {monitorCourses.map((mCourse, mIdx) => {
                    const monCode = String(mCourse.ma_mon || '').toUpperCase();
                    const enrolledCount = students.filter((s) => {
                      const fol = s.courses.find((c) => String(c.ma_mon || '').toUpperCase() === monCode);
                      return fol && String(fol.id_to_hoc).trim() === String(mCourse.id_to_hoc).trim();
                    }).length;

                    const isAllEnrolled = enrolledCount === students.length && students.length > 0;

                    return (
                      <td key={mCourse.id_to_hoc || mIdx} className="px-2 py-3 text-center border-r border-slate-200">
                        <span
                          className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                            isAllEnrolled
                              ? 'bg-emerald-200 text-emerald-900'
                              : enrolledCount > 0
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-rose-200 text-rose-900'
                          }`}
                        >
                          {enrolledCount} / {students.length}
                        </span>
                      </td>
                    );
                  })}
                  <td colSpan={2} className="px-4 py-3 text-center text-slate-500 font-mono text-[10px]">
                    Lớp {selectedClass}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
