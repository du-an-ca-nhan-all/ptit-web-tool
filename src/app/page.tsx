'use client';

import React from 'react';
import LoginScreen from '../components/LoginScreen';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ImpersonationBanner from '../components/layout/ImpersonationBanner';
import HomeMainContent from '../components/layout/HomeMainContent';
import ImpersonateModal from '../components/modals/ImpersonateModal';
import {
  ConfirmStudentModal,
  ConfirmClassModal,
} from '../components/modals/ConfirmationModals';
import { useHomeState } from '../hooks/useHomeState';

export default function Home() {
  const state = useHomeState();

  if (!state.isMounted) {
    return (
      <div className="flex h-screen w-full bg-[#0F172A] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Đang khởi động PTIT EduSync...</p>
        </div>
      </div>
    );
  }

  if (!state.currentUser) {
    return (
      <LoginScreen
        users={state.loginUsers}
        records={state.records}
        onLogin={(user) => {
          state.setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.lop) state.setMonitorClass(user.lop);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden relative">
      <Sidebar
        activeTab={state.activeTab}
        onTabChange={state.handleTabChange}
        isMobileMenuOpen={state.isMobileMenuOpen}
        onCloseMobileMenu={() => state.setIsMobileMenuOpen(false)}
        currentUser={state.currentUser}
        hasExamSchedule={state.hasExamSchedule}
        canAccessMonitorTools={state.canAccessMonitorTools}
        isAdmin={state.isAdmin}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ImpersonationBanner
          currentUser={state.currentUser}
          isRevertingImpersonate={state.isRevertingImpersonate}
          onRevertImpersonate={state.handleRevertImpersonate}
        />

        <Header
          activeTab={state.activeTab}
          onTabChange={state.handleTabChange}
          onOpenMobileMenu={() => state.setIsMobileMenuOpen(true)}
          hasActiveBatch={state.hasActiveBatch}
          activeBatch={state.activeBatch}
          examBatches={state.examBatches}
          onBatchChange={(batchCode) => {
            if (batchCode === 'ALL') {
              state.setActiveBatch(null);
              state.loadDataFromApi('ALL');
            } else {
              const selected = state.examBatches.find((b) => b.code === batchCode);
              if (selected) {
                state.setActiveBatch(selected);
                state.loadDataFromApi(selected.code);
              }
            }
          }}
          recordsCount={state.totalRecords || state.records?.length || 0}
          baseRecordsCount={state.totalRecords || state.baseRecords?.length || 0}
          searchInput={state.searchInput}
          onSearchChange={state.setSearchInput}
          currentUser={state.currentUser}
          userRoles={state.userRoles}
          activeRole={state.activeRole}
          isRoleDropdownOpen={state.isRoleDropdownOpen}
          setIsRoleDropdownOpen={state.setIsRoleDropdownOpen}
          onSelectRole={state.handleSelectRole}
          canImpersonate={state.canImpersonate}
          onOpenImpersonateModal={() => {
            state.setImpersonateError('');
            state.setShowImpersonateModal(true);
          }}
          isLoading={state.isLoading}
          onRefresh={() => state.loadDataFromApi()}
          onLogout={state.handleLogout}
        />

        <HomeMainContent
          isLoading={state.isLoading}
          activeTab={state.activeTab}
          currentUser={state.currentUser}
          effectiveUser={state.effectiveUser}
          records={state.records}
          setRecords={state.setRecords}
          sessions={state.sessions}
          setSessions={state.setSessions}
          examBatches={state.examBatches}
          activeBatch={state.activeBatch}
          setActiveBatch={state.setActiveBatch}
          loginUsers={state.loginUsers}
          monitorClass={state.monitorClass}
          setMonitorClass={state.setMonitorClass}
          filters={state.filters}
          setFilters={state.setFilters}
          sortConfig={state.sortConfig}
          setSortConfig={state.setSortConfig}
          selectedExamRoom={state.selectedExamRoom}
          setSelectedExamRoom={state.setSelectedExamRoom}
          setConfirmStudentId={state.setConfirmStudentId}
          setConfirmClassCode={state.setConfirmClassCode}
          setSearchInput={state.setSearchInput}
          setIsClassGroupOpen={state.setIsClassGroupOpen}
          userRoles={state.userRoles}
          activeRole={state.activeRole}
          handleSelectRole={state.handleSelectRole}
          handleLogout={state.handleLogout}
          handleTabChange={state.handleTabChange}
          handleImpersonate={state.handleImpersonate}
          handleToggleExamPostpone={state.handleToggleExamPostpone}
          loadDataFromApi={state.loadDataFromApi}
          fetchMonitorsData={state.fetchMonitorsData}
          fetchCourseCompareData={state.fetchCourseCompareData}
          courseCompareData={state.courseCompareData}
          isAdmin={state.isAdmin}
          canAccessMonitorTools={state.canAccessMonitorTools}
          canImpersonate={state.canImpersonate}
          hasActiveBatch={state.hasActiveBatch}
          hasExamSchedule={state.hasExamSchedule}
          baseRecords={state.baseRecords}
          filteredRecords={state.filteredRecords}
          classes={state.classes}
          subjects={state.subjects}
          dates={state.dates}
          setCurrentUser={state.setCurrentUser}
          page={state.page}
          setPage={state.setPage}
          pageSize={state.pageSize}
          setPageSize={state.setPageSize}
          totalRecords={state.totalRecords}
          totalPages={state.totalPages}
        />
      </main>

      <ImpersonateModal
        isOpen={state.canImpersonate && state.showImpersonateModal}
        onClose={() => state.setShowImpersonateModal(false)}
        impersonateTargetInput={state.impersonateTargetInput}
        setImpersonateTargetInput={state.setImpersonateTargetInput}
        onImpersonate={state.handleImpersonate}
        isImpersonating={state.isImpersonating}
        impersonateError={state.impersonateError}
        records={state.records}
        currentUsername={state.currentUser?.username}
      />

      <ConfirmStudentModal
        studentId={state.confirmStudentId}
        onClose={() => state.setConfirmStudentId(null)}
        onConfirm={(studentId) => {
          state.setSearchInput(studentId);
          state.setFilters((prev) => ({ ...prev, search: studentId }));
          state.setConfirmStudentId(null);
        }}
      />

      <ConfirmClassModal
        classCode={state.confirmClassCode}
        onClose={() => state.setConfirmClassCode(null)}
        onConfirm={(classCode) => {
          state.handleTabChange('members');
          state.setMonitorClass(classCode);
          state.setConfirmClassCode(null);
        }}
      />
    </div>
  );
}
