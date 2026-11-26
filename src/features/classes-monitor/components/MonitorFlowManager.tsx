'use client';

import React from 'react';
import FlowQueueMonitor from './FlowQueueMonitor';
import ImportFlowStudentsModal from './ImportFlowStudentsModal';
import { MonitorFlowManagerProps } from './monitor-flow-manager/types';
import { useMonitorFlowManagerState } from './monitor-flow-manager/useMonitorFlowManagerState';
import { MonitorFlowHeader } from './monitor-flow-manager/MonitorFlowHeader';
import { AllCompareTab } from './monitor-flow-manager/AllCompareTab';
import { FlowConfigTab } from './monitor-flow-manager/FlowConfigTab';
import { MonitorCoursesTab } from './monitor-flow-manager/MonitorCoursesTab';
import { StudentInspectionModal } from './monitor-flow-manager/StudentInspectionModal';
import { QuickActionModals } from './monitor-flow-manager/QuickActionModals';
import { ExecutionResultModal } from './monitor-flow-manager/ExecutionResultModal';

export default function MonitorFlowManager({
  currentUser,
  availableClasses = [],
  initialClassCode,
  onNavigateTab,
}: MonitorFlowManagerProps) {
  void onNavigateTab;
  const state = useMonitorFlowManagerState(currentUser, availableClasses, initialClassCode);

  const monitorDisplayName = state.monitorData?.hoTen || currentUser.fullName || currentUser.username;

  return (
    <div className="p-3 sm:p-4 md:p-8 max-w-7xl 2xl:max-w-[1700px] mx-auto w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <MonitorFlowHeader
        currentUser={currentUser}
        selectedClass={state.selectedClass}
        monitorData={state.monitorData}
        monitorCoursesCount={state.monitorCourses.length}
        studentsCount={state.students.length}
        activeFollowersCount={state.activeFollowersCount}
        activeSubTab={state.activeSubTab}
        onSelectSubTab={state.setActiveSubTab}
        successMsg={state.successMsg}
        onClearSuccessMsg={() => state.setSuccessMsg('')}
        errorMsg={state.errorMsg}
        onClearErrorMsg={() => state.setErrorMsg('')}
        isLoading={state.isLoading}
        isSaving={state.isSaving}
        isPullingCourses={state.isPullingCourses}
        hasUnsavedChanges={state.hasUnsavedChanges}
        onPullAllCourses={state.pullAllCourses}
        onOpenImportModal={() => state.setShowImportModal(true)}
        onReload={() => state.fetchFlowData(state.selectedClass)}
        onSaveAllConfigs={state.saveAllConfigs}
      />

      {state.activeSubTab === 'ALL_COMPARE' && (
        <AllCompareTab
          selectedClass={state.selectedClass}
          students={state.students}
          filteredStudents={state.filteredStudents}
          monitorData={state.monitorData}
          monitorCourses={state.monitorCourses}
          matched100Count={state.matched100Count}
          needsAttentionCount={state.needsAttentionCount}
          activeFollowersCount={state.activeFollowersCount}
          linkedAccountsCount={state.linkedAccountsCount}
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          compareFilter={state.compareFilter}
          onFilterChange={state.setCompareFilter}
          isLoading={state.isLoading}
          isExecuting={state.isExecuting}
          isPullingCourses={state.isPullingCourses}
          onOpenSyncAllModal={() => state.setShowSyncAllModal(true)}
          onOpenImportModal={() => state.setShowImportModal(true)}
          onPullAllCourses={state.pullAllCourses}
          onInspectStudent={state.setInspectingStudent}
          onUpdateFollowerConfig={state.updateFollowerConfig}
          onExecuteFlow={state.executeFlow}
        />
      )}

      {state.activeSubTab === 'FLOW_CONFIG' && (
        <FlowConfigTab
          activeFollowersCount={state.activeFollowersCount}
          isExecuting={state.isExecuting}
          isLoading={state.isLoading}
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          filteredStudents={state.filteredStudents}
          monitorCoursesCount={state.monitorCourses.length}
          onOpenSyncAllModal={() => state.setShowSyncAllModal(true)}
          onOpenQuickRegisterModal={() => state.setShowQuickRegisterModal(true)}
          onOpenQuickCancelModal={() => state.setShowQuickCancelModal(true)}
          onOpenImportModal={() => state.setShowImportModal(true)}
          onDisableAllFollowers={() => state.setAllFollowersStatus(false)}
          onUpdateFollowerConfig={state.updateFollowerConfig}
          onInspectStudent={state.setInspectingStudent}
        />
      )}

      {state.activeSubTab === 'MONITOR_COURSES' && (
        <MonitorCoursesTab
          monitorData={state.monitorData}
          monitorCourses={state.monitorCourses}
          activeFollowersCount={state.activeFollowersCount}
          isPullingCourses={state.isPullingCourses}
          isLoading={state.isLoading}
          isExecuting={state.isExecuting}
          onPullAllCourses={state.pullAllCourses}
          onOpenSyncAllModal={() => state.setShowSyncAllModal(true)}
          onExecuteFlow={state.executeFlow}
        />
      )}

      {state.activeSubTab === 'FLOW_QUEUE' && (
        <FlowQueueMonitor currentUser={currentUser} selectedClass={state.selectedClass} />
      )}

      <StudentInspectionModal
        student={state.inspectingStudent}
        monitorCourses={state.monitorCourses}
        isExecuting={state.isExecuting}
        onClose={() => state.setInspectingStudent(null)}
        onExecuteFlow={state.executeFlow}
      />

      <QuickActionModals
        monitorDisplayName={monitorDisplayName}
        activeFollowersCount={state.activeFollowersCount}
        isExecuting={state.isExecuting}
        showQuickRegisterModal={state.showQuickRegisterModal}
        quickTargetIdToHoc={state.quickTargetIdToHoc}
        quickTargetGroupName={state.quickTargetGroupName}
        onQuickTargetIdChange={state.setQuickTargetIdToHoc}
        onQuickTargetGroupNameChange={state.setQuickTargetGroupName}
        onCloseQuickRegister={() => state.setShowQuickRegisterModal(false)}
        showQuickCancelModal={state.showQuickCancelModal}
        cancelTargetIdToHoc={state.cancelTargetIdToHoc}
        onCancelTargetIdChange={state.setCancelTargetIdToHoc}
        onCloseQuickCancel={() => state.setShowQuickCancelModal(false)}
        showSyncAllModal={state.showSyncAllModal}
        onCloseSyncAll={() => state.setShowSyncAllModal(false)}
        onExecuteFlow={state.executeFlow}
      />

      <ExecutionResultModal
        result={state.lastExecutionResult}
        onClose={() => state.setLastExecutionResult(null)}
      />

      <ImportFlowStudentsModal
        isOpen={state.showImportModal}
        onClose={() => state.setShowImportModal(false)}
        selectedClass={state.selectedClass}
        monitorUsername={state.monitorData?.username || currentUser.username}
        monitorFullName={state.monitorData?.hoTen || currentUser.fullName}
        existingClassStudents={state.students}
        onConfirmImport={async (payload) => {
          await state.importFlowConfigs(payload);
        }}
        isSubmitting={state.isLoading || state.isSaving}
      />
    </div>
  );
}
