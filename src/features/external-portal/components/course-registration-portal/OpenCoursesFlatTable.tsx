'use client';

import React from 'react';
import { Flame, Lock } from 'lucide-react';
import { MonitorFlowConfigInfo } from '../../hooks/useCourseRegistration';
import { CourseRegistrationHookResult, CourseRegistrationSubTab } from './types';
import { sanitizeHtml } from '@/src/lib/htmlSanitizer';

interface OpenCoursesFlatTableProps {
  flatFilteredGroups: any[];
  registeredSubjectCodeMap: Map<string, string>;
  registeringIds: Record<string, boolean>;
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  handleRegister: CourseRegistrationHookResult['handleRegister'];
  addSniperTarget: CourseRegistrationHookResult['addSniperTarget'];
  setConfirmCancelGroup: (group: any | null) => void;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function OpenCoursesFlatTable({
  flatFilteredGroups,
  registeredSubjectCodeMap,
  registeringIds,
  monitorFlowConfig,
  handleRegister,
  addSniperTarget,
  setConfirmCancelGroup,
  setActiveSubTab,
}: OpenCoursesFlatTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 text-center w-12">STT</th>
              <th className="px-4 py-3.5">Mã Môn</th>
              <th className="px-4 py-3.5">Tên Môn Học</th>
              <th className="px-4 py-3.5 text-center">TC</th>
              <th className="px-4 py-3.5 text-center">Nhóm</th>
              <th className="px-4 py-3.5">Lớp HP</th>
              <th className="px-4 py-3.5 text-center">Sĩ Số / Slot</th>
              <th className="px-4 py-3.5">Thời Khóa Biểu</th>
              <th className="px-4 py-3.5 text-right">Học Phí</th>
              <th className="px-4 py-3.5 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {flatFilteredGroups.map((group, idx) => {
              const isRegistered = registeredSubjectCodeMap.has(group.ma_mon?.toUpperCase());
              const registeredGroup = registeredSubjectCodeMap.get(group.ma_mon?.toUpperCase());
              const isThisGroupRegistered = isRegistered && group.nhom_to === registeredGroup;
              const isRegistering = registeringIds[group.id_to_hoc];
              const isAvailable = group.enable && group.sl_cl > 0;

              return (
                <tr
                  key={group.id_to_hoc}
                  className={`hover:bg-indigo-50/40 transition-colors ${
                    isThisGroupRegistered ? 'bg-emerald-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{group.ma_mon}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">{group.ten_mon}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                    {group.so_tc || group.so_tc_hp}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {group.nhom_to}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">{group.lop || '—'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={group.sl_cl > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                      {group.sl_cl}/{group.sl_cp}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs">
                    {group.tkb ? (
                      <div
                        className="text-[11px] text-slate-600 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(group.tkb) }}
                      />
                    ) : (
                      <span className="text-slate-400 italic">Chưa có TKB</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                    {Number(group.phai_dong || group.hoc_phi_tam_tinh || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {isThisGroupRegistered ? (
                      <button
                        onClick={() => setConfirmCancelGroup(group)}
                        disabled={monitorFlowConfig?.isEnabled}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          monitorFlowConfig?.isEnabled
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer'
                        }`}
                        title={
                          monitorFlowConfig?.isEnabled
                            ? 'Tính năng hủy môn tạm khóa do đang bật Flow theo Lớp trưởng'
                            : 'Hủy đăng ký môn học này'
                        }
                      >
                        {monitorFlowConfig?.isEnabled ? 'Đã ĐK (Flow LT)' : 'Hủy Môn'}
                      </button>
                    ) : monitorFlowConfig?.isEnabled ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs"
                        title="Tài khoản đang bật Flow theo Lớp trưởng - Đăng ký do Lớp trưởng điều phối"
                      >
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Khóa bởi Flow LT</span>
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRegister(group.id_to_hoc)}
                          disabled={!isAvailable || isRegistering}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isAvailable
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isRegistering ? 'Đang ĐK...' : 'Đăng Ký'}
                        </button>
                        <button
                          onClick={() => {
                            addSniperTarget({
                              maMon: group.ma_mon,
                              tenMon: group.ten_mon,
                              idToHoc: group.id_to_hoc,
                              nhomTo: group.nhom_to,
                              autoAnyGroup: false,
                            });
                            setActiveSubTab('SNIPER_BOT');
                          }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 cursor-pointer"
                          title="Thêm vào Auto Canh Slot"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    )}
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
