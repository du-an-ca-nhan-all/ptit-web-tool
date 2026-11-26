'use client';

import React from 'react';
import { BookOpen, Calendar, Clock, DollarSign, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { CourseItem, MonitorProfileData } from '../../server/monitorFlowServerService';
import { ExecuteFlowFn } from './types';
import { MonitorCoursesMobileList } from './MonitorCoursesMobileList';
import { sanitizeHtml } from '@/src/lib/htmlSanitizer';

interface MonitorCoursesTabProps {
  monitorData: MonitorProfileData | null;
  monitorCourses: CourseItem[];
  activeFollowersCount: number;
  isPullingCourses: boolean;
  isLoading: boolean;
  isExecuting: boolean;
  onPullAllCourses: () => void;
  onOpenSyncAllModal: () => void;
  onExecuteFlow: ExecuteFlowFn;
}

export function MonitorCoursesTab({
  monitorData,
  monitorCourses,
  activeFollowersCount,
  isPullingCourses,
  isLoading,
  isExecuting,
  onPullAllCourses,
  onOpenSyncAllModal,
  onExecuteFlow,
}: MonitorCoursesTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Tổng Số Môn</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{monitorCourses.length} môn</div>
            <div className="text-[10px] sm:text-[11px] text-indigo-600 font-bold mt-0.5">Lớp trưởng {monitorData?.hoTen}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Tổng Tín Chỉ</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{monitorData?.totalCredits || 0} TC</div>
            <div className="text-[10px] sm:text-[11px] text-amber-700 font-bold mt-0.5">Kỳ học hiện tại</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Học Phí Tạm Tính</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {(monitorData?.tuitionFee || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5">Học phí theo nhóm tổ</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 text-sm">Môn Học Lớp Trưởng Đăng Ký</h3>
              {monitorData?.lastPulledAt && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-lg font-mono">
                  Cập nhật: {new Date(monitorData.lastPulledAt).toLocaleTimeString('vi-VN')} {new Date(monitorData.lastPulledAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Các môn này làm chuẩn để Flow đồng bộ cho cả lớp</p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onPullAllCourses}
              disabled={isPullingCourses || isLoading}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl sm:rounded-2xl border border-indigo-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              title="Kéo danh sách môn học mới nhất từ Cổng QLDTTX"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isPullingCourses ? 'animate-spin' : ''}`} />
              <span>{isPullingCourses ? 'Đang kéo...' : 'Pull QLDTTX'}</span>
            </button>

            <button
              onClick={onOpenSyncAllModal}
              disabled={isExecuting || monitorCourses.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold text-xs rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Đồng Bộ Cả Lớp</span>
            </button>
          </div>
        </div>

        {/* Mobile Cards for Courses */}
        <MonitorCoursesMobileList
          monitorCourses={monitorCourses}
          activeFollowersCount={activeFollowersCount}
          isPullingCourses={isPullingCourses}
          isExecuting={isExecuting}
          onPullAllCourses={onPullAllCourses}
          onExecuteFlow={onExecuteFlow}
        />

        {/* Desktop Table for Courses */}
        <div className="hidden md:block overflow-x-auto">
          {monitorCourses.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Lớp trưởng chưa đăng ký môn học nào hoặc chưa kéo dữ liệu</p>
              <button
                onClick={onPullAllCourses}
                disabled={isPullingCourses}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Kéo Dữ Liệu Từ QLDTTX Ngay
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">STT</th>
                  <th className="px-4 py-3.5">Mã Môn</th>
                  <th className="px-4 py-3.5">Tên Môn Học</th>
                  <th className="px-4 py-3.5 text-center">Số TC</th>
                  <th className="px-4 py-3.5 text-center">Nhóm / Tổ</th>
                  <th className="px-4 py-3.5">Lớp Học Phần</th>
                  <th className="px-4 py-3.5">Thời Khóa Biểu (TKB)</th>
                  <th className="px-4 py-3.5 text-right">Học Phí</th>
                  <th className="px-4 py-3.5 text-center">Flow Cho Cả Lớp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monitorCourses.map((course, idx) => (
                  <tr key={course.id_to_hoc || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                      {course.ma_mon}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 text-sm block">{course.ten_mon}</span>
                      {course.ngay_dang_ky && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Đăng ký: {new Date(course.ngay_dang_ky).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                        {course.so_tc} TC
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                        {course.nhom_to || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">{course.lop || '—'}</td>
                    <td className="px-4 py-3.5 max-w-xs">
                      {course.tkb ? (
                        <div
                          className="text-[11px] text-slate-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.tkb) }}
                        />
                      ) : (
                        <span className="text-slate-400 italic">Chưa xếp lịch</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                      {(course.phai_dong || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() =>
                          onExecuteFlow({
                            flowAction: 'REGISTER',
                            id_to_hoc: course.id_to_hoc,
                            nhom_to: course.nhom_to,
                          })
                        }
                        disabled={isExecuting || activeFollowersCount === 0}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                        title="Flow đăng ký tổ này cho toàn bộ thành viên đang bật Flow"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Flow Cho Lớp</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
