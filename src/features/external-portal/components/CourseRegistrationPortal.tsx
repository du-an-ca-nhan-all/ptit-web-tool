'use client';

import React from 'react';
import { CourseRegistrationPortalProps } from './course-registration-portal/types';
import { useCourseRegistrationPortalState } from './course-registration-portal/useCourseRegistrationPortalState';
import { PortalHeaderAndAlerts } from './course-registration-portal/PortalHeaderAndAlerts';
import { PortalSummaryAndTabs } from './course-registration-portal/PortalSummaryAndTabs';
import { OpenCoursesTab } from './course-registration-portal/OpenCoursesTab';
import { RegisteredCoursesTab } from './course-registration-portal/RegisteredCoursesTab';
import { SniperBotTab } from './course-registration-portal/SniperBotTab';
import { CourseRegistrationGuideTab } from './course-registration-portal/CourseRegistrationGuideTab';
import { CourseRegistrationModals } from './course-registration-portal/CourseRegistrationModals';

export default function CourseRegistrationPortal({
  currentUser,
  onNavigateTab,
}: CourseRegistrationPortalProps) {
  const {
    openCourses,
    registeredCourses,
    externalAccount,
    monitorFlowConfig,
    isLoading,
    isRefreshing,
    registeringIds,
    cancellingIds,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    fetchPortalData,
    handleRegister,
    handleCancel,
    isSniperActive,
    sniperInterval,
    setSniperInterval,
    soundEnabled,
    setSoundEnabled,
    sniperTargets,
    sniperLogs,
    sniperStats,
    startSniper,
    stopSniper,
    addSniperTarget,
    removeSniperTarget,
    clearSniperTargets,
    clearSniperLogs,
    activeSubTab,
    setActiveSubTab,
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
    confirmCancelGroup,
    setConfirmCancelGroup,
    showAddSniperModal,
    setShowAddSniperModal,
    manualSniperSubjectCode,
    setManualSniperSubjectCode,
    manualSniperGroupId,
    setManualSniperGroupId,
    manualSniperAnyGroup,
    registeredSubjectCodeMap,
    groupedOpenCourses,
    flatFilteredGroups,
  } = useCourseRegistrationPortalState(currentUser);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <PortalHeaderAndAlerts
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
        openCourses={openCourses}
        externalAccount={externalAccount}
        monitorFlowConfig={monitorFlowConfig}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        successMsg={successMsg}
        setSuccessMsg={setSuccessMsg}
        errorMsg={errorMsg}
        setErrorMsg={setErrorMsg}
        fetchPortalData={fetchPortalData}
        setActiveSubTab={setActiveSubTab}
      />

      <PortalSummaryAndTabs
        openCourses={openCourses}
        registeredCourses={registeredCourses}
        groupedOpenCourses={groupedOpenCourses}
        sniperTargetsCount={sniperTargets.length}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />

      {activeSubTab === 'OPEN_COURSES' && (
        <OpenCoursesTab
          isLoading={isLoading}
          openCourses={openCourses}
          registeredCourses={registeredCourses}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          expandedSubjects={expandedSubjects}
          toggleExpandSubject={toggleExpandSubject}
          expandAllSubjects={expandAllSubjects}
          collapseAllSubjects={collapseAllSubjects}
          groupedOpenCourses={groupedOpenCourses}
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

      {activeSubTab === 'REGISTERED_COURSES' && (
        <RegisteredCoursesTab
          registeredCourses={registeredCourses}
          cancellingIds={cancellingIds}
          setConfirmCancelGroup={setConfirmCancelGroup}
          setActiveSubTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'SNIPER_BOT' && (
        <SniperBotTab
          monitorFlowConfig={monitorFlowConfig}
          isSniperActive={isSniperActive}
          sniperInterval={sniperInterval}
          setSniperInterval={setSniperInterval}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          sniperTargets={sniperTargets}
          sniperLogs={sniperLogs}
          sniperStats={sniperStats}
          startSniper={startSniper}
          stopSniper={stopSniper}
          removeSniperTarget={removeSniperTarget}
          clearSniperTargets={clearSniperTargets}
          clearSniperLogs={clearSniperLogs}
          setShowAddSniperModal={setShowAddSniperModal}
        />
      )}

      {activeSubTab === 'GUIDE' && <CourseRegistrationGuideTab />}

      <CourseRegistrationModals
        openCourses={openCourses}
        showAddSniperModal={showAddSniperModal}
        setShowAddSniperModal={setShowAddSniperModal}
        manualSniperSubjectCode={manualSniperSubjectCode}
        setManualSniperSubjectCode={setManualSniperSubjectCode}
        manualSniperGroupId={manualSniperGroupId}
        setManualSniperGroupId={setManualSniperGroupId}
        manualSniperAnyGroup={manualSniperAnyGroup}
        addSniperTarget={addSniperTarget}
        confirmCancelGroup={confirmCancelGroup}
        setConfirmCancelGroup={setConfirmCancelGroup}
        handleCancel={handleCancel}
      />
    </div>
  );
}
