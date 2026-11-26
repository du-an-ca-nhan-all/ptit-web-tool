'use client';

import React from 'react';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { CourseRegistrationHookResult, CourseRegistrationSubTab } from './types';
import { sanitizeHtml } from '@/src/lib/htmlSanitizer';

interface RegisteredCoursesTabProps {
  registeredCourses: CourseRegistrationHookResult['registeredCourses'];
  cancellingIds: Record<string, boolean>;
  setConfirmCancelGroup: (group: any | null) => void;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function RegisteredCoursesTab({
  registeredCourses,
  cancellingIds,
  setConfirmCancelGroup,
  setActiveSubTab,
}: RegisteredCoursesTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-800 text-sm sm:text-base">
              Danh Sách Môn Học Đã Đăng Ký Thành Công
            </h3>
          </div>
          <div className="text-xs text-slate-500 font-bold">
            Tổng cộng:{' '}
            <strong className="text-emerald-600">
              {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}
            </strong>{' '}
            môn ({registeredCourses.totalCredits} tín chỉ)
          </div>
        </div>

        <div className="overflow-x-auto">
          {(registeredCourses.ds_kqdkmh || []).length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Bạn chưa đăng ký môn học nào trong kỳ này</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Chuyển sang tab "Danh Sách Môn Học Mở" để chọn môn và bấm Đăng Ký.
              </p>
              <button
                onClick={() => setActiveSubTab('OPEN_COURSES')}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Danh Sách Môn Mở</span>
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
                  <th className="px-4 py-3.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(registeredCourses.ds_kqdkmh || []).map((item: any, index: number) => {
                  const toHoc = item.to_hoc || {};
                  const soTC = toHoc.so_tc || toHoc.so_tc_hp || 0;
                  const fee = toHoc.phai_dong || item.hoc_phi_tam_tinh || 0;
                  const formattedFee = Number(fee).toLocaleString('vi-VN');
                  const isCancelling = cancellingIds[toHoc.id_to_hoc];

                  return (
                    <tr key={item.id_kqdk || index} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                        {toHoc.ma_mon}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 text-sm block">{toHoc.ten_mon}</span>
                        {item.ngay_dang_ky && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Đăng ký lúc:{' '}
                            {new Date(item.ngay_dang_ky).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                          {soTC} TC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                          {toHoc.nhom_to || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">{toHoc.lop || '—'}</td>
                      <td className="px-4 py-3.5 max-w-xs">
                        {toHoc.tkb ? (
                          <div
                            className="text-[11px] text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(toHoc.tkb) }}
                          />
                        ) : (
                          <span className="text-slate-400 italic">Chưa xếp lịch</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                        {formattedFee} đ
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setConfirmCancelGroup(toHoc)}
                          disabled={isCancelling}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors border border-rose-200 cursor-pointer disabled:opacity-50"
                        >
                          {isCancelling ? 'Đang hủy...' : 'Hủy Môn'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
