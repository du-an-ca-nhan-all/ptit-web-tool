import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { ClassMembersProps } from './class-members/types';
import { useClassMembersData } from './class-members/useClassMembersData';
import { useMonitorAssignment } from './class-members/useMonitorAssignment';
import { useClassMemberActions } from './class-members/useClassMemberActions';
import ClassMembersHeader from './class-members/ClassMembersHeader';
import ClassMembersStats from './class-members/ClassMembersStats';
import ClassMembersToolbar from './class-members/ClassMembersToolbar';
import StudentMobileCards from './class-members/StudentMobileCards';
import StudentDesktopTable from './class-members/StudentDesktopTable';
import ClassMembersModals from './class-members/ClassMembersModals';

export default function ClassMembers({
  records,
  selectedClass,
  onClassChange,
  currentUser,
  loginUsers = [],
  onSelectStudentSchedule,
  hasExamSchedule = false,
  onImpersonate,
  onTogglePostpone,
  onReloadMonitors,
}: ClassMembersProps) {
  const data = useClassMembersData({
    records,
    selectedClass,
    onClassChange,
    currentUser,
    loginUsers,
    hasExamSchedule,
  });

  const monitor = useMonitorAssignment({
    selectedClass,
    activeStudents: data.activeStudents,
    classMonitor: data.classMonitor,
    showToast: data.showToast,
    onReloadMonitors,
  });

  const actions = useClassMemberActions({
    selectedClass,
    classes: data.classes,
    fetchClassMembers: data.fetchClassMembers,
    showToast: data.showToast,
  });

  return (
    <div className="p-3 sm:p-4 md:p-8 flex-1 flex flex-col gap-4 sm:gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      {data.toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            data.toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200/50'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-200/50'
          }`}
        >
          {data.toastMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{data.toastMessage.text}</span>
        </div>
      )}

      <ClassMembersHeader
        selectedClass={selectedClass}
        userOwnClass={data.userOwnClass}
        isMyClass={data.isMyClass}
        isAdmin={data.isAdmin}
        canManageClass={data.canManageClass}
        classMonitor={data.classMonitor}
        classes={data.classes}
        onClassChange={onClassChange}
        onOpenAssignMonitorModal={monitor.openAssignMonitorModal}
        onOpenImportModal={() => actions.setIsImportModalOpen(true)}
        onOpenReceiveModal={actions.openReceiveModal}
        onExportCSV={data.handleExportCSV}
      />

      <ClassMembersStats
        stats={data.stats}
        excludedCount={data.excludedStudents.length}
        hasExamSchedule={hasExamSchedule}
      />

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col shrink-0 sm:flex-1">
        <ClassMembersToolbar
          activeTab={data.activeTab}
          onTabChange={data.setActiveTab}
          activeCount={data.activeStudents.length}
          excludedCount={data.excludedStudents.length}
          search={data.search}
          onSearchChange={data.setSearch}
          genderFilter={data.genderFilter}
          onGenderFilterChange={data.setGenderFilter}
        />

        {/* Member Table View (Desktop & Mobile) */}
        {data.isLoadingList ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-medium">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Đang tải danh sách thành viên lớp {selectedClass}...
            </span>
          </div>
        ) : data.filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            {data.activeTab === 'ACTIVE'
              ? 'Không tìm thấy thành viên nào phù hợp với bộ lọc.'
              : 'Không có sinh viên nào trong danh sách biến động/bảo lưu.'}
          </div>
        ) : (
          <>
            <StudentMobileCards
              students={data.filteredStudents}
              activeTab={data.activeTab}
              hasExamSchedule={hasExamSchedule}
              canManageClass={data.canManageClass}
              isAdmin={data.isAdmin}
              onSelectStudentDetail={actions.setSelectedStudentDetail}
              onSelectStudentSchedule={onSelectStudentSchedule}
              onEditStudent={actions.openEditStudentModal}
              onExcludeStudent={actions.openExcludeModal}
              onResetPassword={actions.openResetPasswordModal}
              onImpersonate={onImpersonate}
              onRestoreStudent={actions.handleRestoreStudent}
            />

            <StudentDesktopTable
              students={data.filteredStudents}
              activeTab={data.activeTab}
              hasExamSchedule={hasExamSchedule}
              canManageClass={data.canManageClass}
              isAdmin={data.isAdmin}
              classMonitor={data.classMonitor}
              onSelectStudentDetail={actions.setSelectedStudentDetail}
              onEditStudent={actions.openEditStudentModal}
              onExcludeStudent={actions.openExcludeModal}
              onResetPassword={actions.openResetPasswordModal}
              onOpenAssignMonitorModal={monitor.openAssignMonitorModal}
              onImpersonate={onImpersonate}
              onRestoreStudent={actions.handleRestoreStudent}
            />
          </>
        )}
      </div>

      <ClassMembersModals
        selectedClass={selectedClass}
        hasExamSchedule={hasExamSchedule}
        classes={data.classes}
        activeStudents={data.activeStudents}
        classMonitor={data.classMonitor}
        actions={actions}
        monitor={monitor}
        showToast={data.showToast}
        fetchClassMembers={data.fetchClassMembers}
        onSelectStudentSchedule={onSelectStudentSchedule}
        onTogglePostpone={onTogglePostpone}
        onReloadMonitors={onReloadMonitors}
      />
    </div>
  );
}
