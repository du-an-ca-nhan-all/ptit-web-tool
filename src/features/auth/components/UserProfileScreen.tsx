'use client';

import React, { useState } from 'react';
import { ExamRecord } from '../types/auth.types';
import { ProfileSubTab } from '../../../types/navigation';
import { ProfileHeroBanner } from './Profile/ProfileHeroBanner';
import { ProfileOverviewTab } from './Profile/ProfileOverviewTab';
import { ProfileSecurityTab } from './Profile/ProfileSecurityTab';
import { ProfileExternalAccountsTab } from './Profile/ProfileExternalAccountsTab';
import { TelegramConfigSection } from '../../telegram';
import { StudentTimetableCalendar, StudentGradesView, LmsCoursesView } from '../../external-portal';
import { UserProfileScreenProps } from './user-profile-screen/types';
import { useProfileEditor } from './user-profile-screen/useProfileEditor';
import { useExternalAccounts } from './user-profile-screen/useExternalAccounts';
import { ProfileSubTabsNav } from './user-profile-screen/ProfileSubTabsNav';

export type { UserProfileScreenProps };

export default function UserProfileScreen({
  currentUser,
  onLogout,
  onProfileUpdated,
  hasExamSchedule = false,
  onNavigateTab,
  userRoles = [],
  activeRole,
  onSelectRole,
  activeSubTab: activeSubTabProp,
  onSubTabChange,
}: UserProfileScreenProps) {
  const student = currentUser?.student || {};
  const [internalSubTab, setInternalSubTab] = useState<ProfileSubTab>(activeSubTabProp || 'OVERVIEW');
  const activeSubTab = activeSubTabProp !== undefined ? activeSubTabProp : internalSubTab;

  const setActiveSubTab = (subTab: ProfileSubTab) => {
    setInternalSubTab(subTab);
    onSubTabChange?.(subTab);
  };

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    isEditing,
    setIsEditing,
    phone,
    setPhone,
    note,
    setNote,
    isSaving,
    isSyncingProfile,
    handleSaveProfile,
    handleSyncProfileFromQlht,
  } = useProfileEditor({
    currentUser,
    student,
    onProfileUpdated,
    setSuccessMsg,
    setErrorMsg,
  });

  const {
    externalAccounts,
    isLoadingExternal,
    extForm,
    setExtForm,
    configuredCount,
    fetchExternalAccounts,
    handleSaveExternalAccount,
    handleTestConnection,
    handleDeleteExternalAccount,
  } = useExternalAccounts({
    currentUsername: currentUser.username,
    setSuccessMsg,
    setErrorMsg,
  });

  const currentEffectiveRole =
    activeRole || (currentUser?.isAdmin ? 'admin' : currentUser?.isMonitor ? 'lop_truong' : 'sinh_vien');
  const isAdmin = currentEffectiveRole === 'admin';
  const fullName = student?.hoTen || currentUser.fullName || currentUser.username;
  const maSV = currentUser.username;
  const maLop = student?.maLop || currentUser.lop || 'Chưa cập nhật';
  const gioiTinh = student?.gioiTinh || 'Chưa cập nhật';
  const ngaySinh = student?.ngaySinh || 'Chưa cập nhật';
  const trangThai = student?.trangThai || 'DANG_HOC';
  const exams: ExamRecord[] = student?.exams || [];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Main Profile Hero Banner */}
      <ProfileHeroBanner
        currentUser={currentUser}
        currentEffectiveRole={currentEffectiveRole}
        fullName={fullName}
        maSV={maSV}
        maLop={maLop}
        trangThai={trangThai}
        phone={phone}
        hasExamSchedule={hasExamSchedule}
        exams={exams}
        configuredCount={configuredCount}
        onOpenExternalAccountsTab={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
      />

      {/* Screen Sub-Tabs Navigation */}
      <ProfileSubTabsNav
        activeSubTab={activeSubTab}
        configuredCount={configuredCount}
        onSelectSubTab={setActiveSubTab}
      />

      {/* SUB-TAB 1: OVERVIEW & PERSONAL INFO */}
      {activeSubTab === 'OVERVIEW' && (
        <ProfileOverviewTab
          currentUser={currentUser}
          maSV={maSV}
          fullName={fullName}
          gioiTinh={gioiTinh}
          ngaySinh={ngaySinh}
          maLop={maLop}
          phone={phone}
          setPhone={setPhone}
          note={note}
          setNote={setNote}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          isSyncingProfile={isSyncingProfile}
          onSyncProfileFromQlht={handleSyncProfileFromQlht}
          onSaveProfile={handleSaveProfile}
          onLogout={onLogout}
          hasExamSchedule={hasExamSchedule}
          onNavigateTab={onNavigateTab}
          onSelectSubTab={setActiveSubTab}
        />
      )}

      {/* SUB-TAB: CLASS SCHEDULE & TIMETABLE (CALENDAR VIEW) */}
      {activeSubTab === 'SCHEDULE' && (
        <StudentTimetableCalendar
          currentUser={currentUser}
          onNavigateToExternalAccounts={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
          onNavigateToReminders={() => (onNavigateTab ? onNavigateTab('reminders') : undefined)}
        />
      )}

      {/* SUB-TAB: STUDENT GRADES & ACADEMIC ANALYTICS */}
      {activeSubTab === 'GRADES' && (
        <StudentGradesView
          currentUser={currentUser}
          onNavigateToExternalAccounts={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
        />
      )}

      {/* SUB-TAB: LMS COURSES & LEARNING PROGRESS */}
      {activeSubTab === 'LMS' && (
        <LmsCoursesView
          currentUser={currentUser}
          onNavigateToExternalAccounts={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
        />
      )}

      {/* SUB-TAB 2: EXTERNAL ACCOUNTS */}
      {activeSubTab === 'EXTERNAL_ACCOUNTS' && (
        <ProfileExternalAccountsTab
          currentUser={currentUser}
          externalAccounts={externalAccounts}
          isLoadingExternal={isLoadingExternal}
          extForm={extForm}
          setExtForm={setExtForm}
          onFetchExternalAccounts={fetchExternalAccounts}
          onTestConnection={handleTestConnection}
          onSaveExternalAccount={handleSaveExternalAccount}
          onDeleteExternalAccount={handleDeleteExternalAccount}
        />
      )}

      {/* SUB-TAB: TELEGRAM CONFIGURATION */}
      {activeSubTab === 'TELEGRAM' && (
        <TelegramConfigSection
          currentUser={{ ...currentUser, isAdmin, activeRole: currentEffectiveRole }}
          onNavigateTab={(tab) => {
            if (tab === 'EXTERNAL_ACCOUNTS') setActiveSubTab('EXTERNAL_ACCOUNTS');
            else if (tab === 'SCHEDULE') setActiveSubTab('SCHEDULE');
            else if (onNavigateTab) onNavigateTab(tab);
          }}
        />
      )}

      {/* SUB-TAB: SECURITY & SETTINGS */}
      {activeSubTab === 'SECURITY' && <ProfileSecurityTab />}
    </div>
  );
}
