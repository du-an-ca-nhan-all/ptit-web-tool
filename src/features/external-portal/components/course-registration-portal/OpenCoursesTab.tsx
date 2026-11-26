'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { MonitorFlowConfigInfo } from '../../hooks/useCourseRegistration';
import {
  CourseRegistrationHookResult,
  CourseRegistrationSubTab,
  CourseStatusFilter,
  CourseViewMode,
  GroupedSubject,
} from './types';
import { OpenCoursesFilterBar } from './OpenCoursesFilterBar';
import { OpenCoursesAccordionView } from './OpenCoursesAccordionView';
import { OpenCoursesFlatTable } from './OpenCoursesFlatTable';

interface OpenCoursesTabProps {
  isLoading: boolean;
  openCourses: CourseRegistrationHookResult['openCourses'];
  registeredCourses: CourseRegistrationHookResult['registeredCourses'];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: CourseStatusFilter;
  setStatusFilter: (filter: CourseStatusFilter) => void;
  viewMode: CourseViewMode;
  setViewMode: (mode: CourseViewMode) => void;
  expandedSubjects: Record<string, boolean>;
  toggleExpandSubject: (maMon: string) => void;
  expandAllSubjects: () => void;
  collapseAllSubjects: () => void;
  groupedOpenCourses: GroupedSubject[];
  flatFilteredGroups: any[];
  registeredSubjectCodeMap: Map<string, string>;
  registeringIds: Record<string, boolean>;
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  handleRegister: CourseRegistrationHookResult['handleRegister'];
  addSniperTarget: CourseRegistrationHookResult['addSniperTarget'];
  setConfirmCancelGroup: (group: any | null) => void;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function OpenCoursesTab({
  isLoading,
  openCourses,
  registeredCourses,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  expandedSubjects,
  toggleExpandSubject,
  expandAllSubjects,
  collapseAllSubjects,
  groupedOpenCourses,
  flatFilteredGroups,
  registeredSubjectCodeMap,
  registeringIds,
  monitorFlowConfig,
  handleRegister,
  addSniperTarget,
  setConfirmCancelGroup,
  setActiveSubTab,
}: OpenCoursesTabProps) {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <OpenCoursesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalOpenGroupsCount={openCourses.ds_nhom_to?.length || 0}
        totalRegisteredCoursesCount={registeredCourses.totalCourses || 0}
        expandAllSubjects={expandAllSubjects}
        collapseAllSubjects={collapseAllSubjects}
      />

      {/* Loading or Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Đang tải danh sách môn học mở từ Cổng QLDTTX...</p>
        </div>
      ) : openCourses.ds_nhom_to?.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Chưa có môn học nào đang mở</p>
          <p className="text-xs text-slate-400 max-w-md">
            Hiện tại trường chưa mở đợt đăng ký môn học hoặc tài khoản chưa liên kết.
          </p>
        </div>
      ) : viewMode === 'ACCORDION' ? (
        /* ACCORDION VIEW */
        <OpenCoursesAccordionView
          groupedOpenCourses={groupedOpenCourses}
          expandedSubjects={expandedSubjects}
          toggleExpandSubject={toggleExpandSubject}
          registeredSubjectCodeMap={registeredSubjectCodeMap}
          registeringIds={registeringIds}
          monitorFlowConfig={monitorFlowConfig}
          handleRegister={handleRegister}
          addSniperTarget={addSniperTarget}
          setConfirmCancelGroup={setConfirmCancelGroup}
          setActiveSubTab={setActiveSubTab}
        />
      ) : (
        /* FLAT VIEW */
        <OpenCoursesFlatTable
          flatFilteredGroups={flatFilteredGroups}
          registeredSubjectCodeMap={registeredSubjectCodeMap}
          registeringIds={registeringIds}
          monitorFlowConfig={monitorFlowConfig}
          handleRegister={handleRegister}
          addSniperTarget={addSniperTarget}
          setConfirmCancelGroup={setConfirmCancelGroup}
          setActiveSubTab={setActiveSubTab}
        />
      )}
    </div>
  );
}
