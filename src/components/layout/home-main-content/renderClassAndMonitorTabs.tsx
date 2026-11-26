'use client';

import React from 'react';
import { ExamBatchManagement } from '../../../features/exam-schedule';
import {
  ClassMonitorTools,
  ClassMembers,
  MonitorsList,
  AllStudentsList,
  MonitorFlowManager,
  ExamReviewRegistrationManager,
  MonitorRoomAnalysis,
} from '../../../features/classes-monitor';
import {
  AllMonitorsEnvelopes,
  SettlementManager,
} from '../../../features/envelope-settlement';
import type { NavigationTab, ProfileSubTab } from '../../../types/navigation';
import type { HomeMainContentProps } from './types';

export function renderClassAndMonitorTabs(
  props: HomeMainContentProps,
): React.ReactNode {
  const {
    isLoading,
    activeTab,
    effectiveUser,
    records,
    sessions,
    examBatches,
    activeBatch,
    setActiveBatch,
    loginUsers,
    monitorClass,
    setMonitorClass,
    setIsClassGroupOpen,
    handleTabChange,
    handleImpersonate,
    handleToggleExamPostpone,
    loadDataFromApi,
    fetchMonitorsData,
    isLoadingMonitors = false,
    isAdmin,
    canAccessMonitorTools,
    canImpersonate,
    hasExamSchedule,
    classes,
  } = props;

  if (activeTab === 'batches') {
    return (
      <ExamBatchManagement
        currentUser={effectiveUser!}
        initialBatches={examBatches}
        initialActiveBatch={activeBatch}
        onBatchChanged={(batch) => {
          setActiveBatch(batch);
          loadDataFromApi(batch.code);
        }}
      />
    );
  }

  if (activeTab === 'monitors_list') {
    return (
      <MonitorsList
        users={loginUsers}
        currentUser={effectiveUser}
        onReload={fetchMonitorsData}
        isLoading={isLoadingMonitors || isLoading}
        onClassClick={(classCode) => {
          handleTabChange('members', undefined, { monitorClass: classCode });
          setIsClassGroupOpen(true);
        }}
      />
    );
  }

  if (activeTab === 'all_students') {
    return (
      <AllStudentsList
        currentUser={effectiveUser}
        onSelectStudentSchedule={(studentId) => {
          handleTabChange('schedule', undefined, { search: studentId });
        }}
        onImpersonate={canImpersonate ? handleImpersonate : undefined}
        onClassClick={(classCode) => {
          handleTabChange('members', undefined, { monitorClass: classCode });
          setIsClassGroupOpen(true);
        }}
      />
    );
  }

  if (activeTab === 'members') {
    return (
      <ClassMembers
        records={records}
        selectedClass={monitorClass}
        onClassChange={setMonitorClass}
        currentUser={effectiveUser}
        loginUsers={loginUsers}
        hasExamSchedule={hasExamSchedule}
        onImpersonate={canImpersonate ? handleImpersonate : undefined}
        onTogglePostpone={handleToggleExamPostpone}
        onReloadMonitors={fetchMonitorsData}
        onSelectStudentSchedule={(studentId) => {
          handleTabChange('schedule', undefined, { search: studentId });
        }}
      />
    );
  }

  if (activeTab === 'monitor_flow' && (isAdmin || canAccessMonitorTools)) {
    return (
      <MonitorFlowManager
        currentUser={effectiveUser!}
        availableClasses={classes}
        initialClassCode={monitorClass}
        onNavigateTab={(tab, subTab) =>
          handleTabChange(tab as NavigationTab, subTab as ProfileSubTab)
        }
      />
    );
  }

  if (activeTab === 'exam_review' && (isAdmin || canAccessMonitorTools)) {
    return (
      <ExamReviewRegistrationManager
        currentUser={effectiveUser!}
        availableClasses={classes}
        initialClassCode={monitorClass}
        examBatches={examBatches}
        activeBatch={activeBatch}
      />
    );
  }

  if (activeTab === 'room_analysis' && (isAdmin || canAccessMonitorTools)) {
    return (
      <MonitorRoomAnalysis
        currentUser={effectiveUser!}
        availableClasses={classes}
        initialClassCode={monitorClass}
        examBatches={examBatches}
        activeBatch={activeBatch}
        onSelectStudentSchedule={(studentId) => {
          handleTabChange('schedule', undefined, { search: studentId });
        }}
      />
    );
  }

  if (activeTab === 'monitor') {
    return (
      <ClassMonitorTools
        records={records}
        selectedClass={monitorClass}
        onClassChange={setMonitorClass}
      />
    );
  }

  if (activeTab === 'envelope_all' || activeTab === 'envelope') {
    return (
      <AllMonitorsEnvelopes
        records={records}
        sessions={sessions}
        loginUsers={loginUsers}
        isAdmin={isAdmin}
      />
    );
  }

  if (activeTab === 'settlement') {
    return (
      <SettlementManager
        records={records}
        sessions={sessions}
        loginUsers={loginUsers}
        onTogglePostpone={handleToggleExamPostpone}
        isAdmin={isAdmin}
      />
    );
  }

  return null;
}
