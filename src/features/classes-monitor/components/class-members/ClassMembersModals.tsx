import React from 'react';
import AdminResetPasswordModal from '../../../auth/components/AdminResetPasswordModal';
import ImportClassMembersModal from '../ImportClassMembersModal';
import { ExamRecord, LoginUser } from '../../types/class.types';
import { useClassMemberActions } from './useClassMemberActions';
import { useMonitorAssignment } from './useMonitorAssignment';
import ReceiveStudentModal from './ReceiveStudentModal';
import ExcludeStudentModal from './ExcludeStudentModal';
import StudentDetailModal from './StudentDetailModal';
import EditStudentContactModal from './EditStudentContactModal';
import AssignMonitorModal from './AssignMonitorModal';

interface ClassMembersModalsProps {
  selectedClass: string;
  hasExamSchedule: boolean;
  classes: string[];
  activeStudents: any[];
  classMonitor: LoginUser | null;
  actions: ReturnType<typeof useClassMemberActions>;
  monitor: ReturnType<typeof useMonitorAssignment>;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchClassMembers: () => Promise<void>;
  onSelectStudentSchedule?: (studentId: string) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  onReloadMonitors?: () => void;
}

export default function ClassMembersModals({
  selectedClass,
  hasExamSchedule,
  classes,
  activeStudents,
  classMonitor,
  actions,
  monitor,
  showToast,
  fetchClassMembers,
  onSelectStudentSchedule,
  onTogglePostpone,
  onReloadMonitors,
}: ClassMembersModalsProps) {
  return (
    <>
      <ReceiveStudentModal
        isOpen={actions.isReceiveModalOpen}
        selectedClass={selectedClass}
        hasExamSchedule={hasExamSchedule}
        searchGlobalQuery={actions.searchGlobalQuery}
        onSearchGlobalQueryChange={actions.setSearchGlobalQuery}
        globalSearchResults={actions.globalSearchResults}
        isSearchingGlobal={actions.isSearchingGlobal}
        selectedStudentToReceive={actions.selectedStudentToReceive}
        onSelectStudentToReceive={actions.setSelectedStudentToReceive}
        receiveReason={actions.receiveReason}
        onReceiveReasonChange={actions.setReceiveReason}
        isProcessingAction={actions.isProcessingAction}
        onClose={() => actions.setIsReceiveModalOpen(false)}
        onConfirmReceive={actions.handleConfirmReceiveStudent}
      />

      <ExcludeStudentModal
        studentToExclude={actions.studentToExclude}
        selectedClass={selectedClass}
        classes={classes}
        excludeType={actions.excludeType}
        onExcludeTypeChange={actions.setExcludeType}
        excludeTargetClass={actions.excludeTargetClass}
        onExcludeTargetClassChange={actions.setExcludeTargetClass}
        excludeReason={actions.excludeReason}
        onExcludeReasonChange={actions.setExcludeReason}
        isProcessingAction={actions.isProcessingAction}
        onClose={() => actions.setStudentToExclude(null)}
        onSubmit={actions.handleConfirmExclude}
      />

      <StudentDetailModal
        student={actions.selectedStudentDetail}
        selectedClass={selectedClass}
        hasExamSchedule={hasExamSchedule}
        onClose={() => actions.setSelectedStudentDetail(null)}
        onSelectStudentSchedule={onSelectStudentSchedule}
        onTogglePostpone={onTogglePostpone}
        onUpdateStudentDetail={actions.setSelectedStudentDetail}
      />

      <EditStudentContactModal
        editingStudent={actions.editingStudent}
        formData={actions.formData}
        onFormDataChange={actions.setFormData}
        onClose={() => actions.setEditingStudent(null)}
        onSubmit={actions.handleSaveStudentEdit}
      />

      <AssignMonitorModal
        isOpen={monitor.isAssignMonitorModalOpen}
        selectedClass={selectedClass}
        classMonitor={classMonitor}
        activeStudentsCount={activeStudents.length}
        candidateList={monitor.candidateList}
        selectedCandidateMaSV={monitor.selectedCandidateMaSV}
        onSelectCandidate={monitor.setSelectedCandidateMaSV}
        candidateSearchQuery={monitor.candidateSearchQuery}
        onCandidateSearchQueryChange={monitor.setCandidateSearchQuery}
        assignReason={monitor.assignReason}
        onAssignReasonChange={monitor.setAssignReason}
        isSubmittingMonitor={monitor.isSubmittingMonitor}
        monitorModalError={monitor.monitorModalError}
        onClose={() => monitor.setIsAssignMonitorModalOpen(false)}
        onAssignMonitor={monitor.handleAssignMonitor}
      />

      <AdminResetPasswordModal
        isOpen={actions.isResetPasswordModalOpen}
        onClose={() => actions.setIsResetPasswordModalOpen(false)}
        initialUsername={actions.resetPasswordStudent.username}
        initialFullName={actions.resetPasswordStudent.fullName}
        initialClass={actions.resetPasswordStudent.lop}
        onSuccess={() => {
          showToast(`Đã cập nhật mật khẩu cho ${actions.resetPasswordStudent.username}!`);
        }}
      />

      <ImportClassMembersModal
        isOpen={actions.isImportModalOpen}
        onClose={() => actions.setIsImportModalOpen(false)}
        selectedClass={selectedClass}
        existingActiveStudents={activeStudents}
        onImportSuccess={(message) => {
          showToast(message, 'success');
          fetchClassMembers();
          if (onReloadMonitors) {
            onReloadMonitors();
          }
        }}
      />
    </>
  );
}
