'use client';

import React from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { MonitorFlowConfigInfo } from '../../hooks/useCourseRegistration';
import {
  CourseRegistrationHookResult,
  CourseRegistrationSubTab,
  GroupedSubject,
} from './types';
import { OpenCourseAccordionRow } from './OpenCourseAccordionRow';

interface OpenCoursesAccordionViewProps {
  groupedOpenCourses: GroupedSubject[];
  expandedSubjects: Record<string, boolean>;
  toggleExpandSubject: (maMon: string) => void;
  registeredSubjectCodeMap: Map<string, string>;
  registeringIds: Record<string, boolean>;
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  handleRegister: CourseRegistrationHookResult['handleRegister'];
  addSniperTarget: CourseRegistrationHookResult['addSniperTarget'];
  setConfirmCancelGroup: (group: any | null) => void;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function OpenCoursesAccordionView({
  groupedOpenCourses,
  expandedSubjects,
  toggleExpandSubject,
  registeredSubjectCodeMap,
  registeringIds,
  monitorFlowConfig,
  handleRegister,
  addSniperTarget,
  setConfirmCancelGroup,
  setActiveSubTab,
}: OpenCoursesAccordionViewProps) {
  return (
    <div className="space-y-3">
      {groupedOpenCourses.map((subject) => {
        const isExpanded = expandedSubjects[subject.ma_mon] ?? true;
        const isRegistered = registeredSubjectCodeMap.has(subject.ma_mon);
        const registeredGroup = registeredSubjectCodeMap.get(subject.ma_mon);

        const totalAvailableSlots = subject.groups.reduce(
          (acc, g) => acc + (g.sl_cl > 0 ? g.sl_cl : 0),
          0
        );

        return (
          <div
            key={subject.ma_mon}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
          >
            {/* Subject Header */}
            <div
              onClick={() => toggleExpandSubject(subject.ma_mon)}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                  {subject.groups.length}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs border border-indigo-100">
                      {subject.ma_mon}
                    </span>
                    <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">
                      {subject.ten_mon}
                    </h3>
                    <span className="text-slate-400 text-xs font-bold">
                      • {subject.so_tc} Tín Chỉ
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isRegistered && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã ĐK: Nhóm {registeredGroup}
                  </span>
                )}

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                    totalAvailableSlots > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {totalAvailableSlots > 0 ? `Còn ${totalAvailableSlots} slot` : 'Hết slot'}
                </span>

                <div className="p-1 text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Subject Groups Table */}
            {isExpanded && (
              <div className="border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">Nhóm</th>
                      <th className="px-4 py-3">Lớp Học Phần</th>
                      <th className="px-4 py-3 text-center">Sĩ Số / Slot</th>
                      <th className="px-4 py-3">Thời Khóa Biểu (TKB)</th>
                      <th className="px-4 py-3 text-right">Học Phí</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subject.groups.map((group) => (
                      <OpenCourseAccordionRow
                        key={group.id_to_hoc}
                        group={group}
                        isRegistered={isRegistered}
                        registeredGroup={registeredGroup}
                        registeringIds={registeringIds}
                        monitorFlowConfig={monitorFlowConfig}
                        handleRegister={handleRegister}
                        addSniperTarget={addSniperTarget}
                        setConfirmCancelGroup={setConfirmCancelGroup}
                        setActiveSubTab={setActiveSubTab}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
