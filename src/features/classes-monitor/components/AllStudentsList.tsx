import React from 'react';
import { GraduationCap, RefreshCw } from 'lucide-react';
import AdminResetPasswordModal from '../../auth/components/AdminResetPasswordModal';
import { AllStudentsListProps } from './all-students-list/types';
import { useAllStudentsList } from './all-students-list/useAllStudentsList';
import { AllStudentsHeader } from './all-students-list/AllStudentsHeader';
import { AllStudentsFilters } from './all-students-list/AllStudentsFilters';
import { StudentsMobileCards } from './all-students-list/StudentsMobileCards';
import { StudentsDesktopTable } from './all-students-list/StudentsDesktopTable';
import { StudentsPagination } from './all-students-list/StudentsPagination';

export type { StudentItem } from './all-students-list/types';

export default function AllStudentsList({
  currentUser,
  onSelectStudentSchedule,
  onImpersonate,
  onClassClick,
}: AllStudentsListProps) {
  const {
    students,
    classesList,
    isLoading,
    searchQuery,
    selectedClass,
    selectedStatus,
    currentPage,
    setCurrentPage,
    pageSize,
    totalStudents,
    totalPages,
    isResetModalOpen,
    resetTarget,
    isAdmin,
    fetchStudents,
    handleSearchChange,
    handleClassChange,
    handleStatusChange,
    handlePageSizeChange,
    openResetModal,
    closeResetModal,
  } = useAllStudentsList(currentUser);

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full gap-4 sm:gap-6 animate-in fade-in duration-300">
      <AllStudentsHeader
        totalStudents={totalStudents}
        totalClasses={classesList.length}
        displayedCount={students.length}
        isAdmin={isAdmin}
        isLoading={isLoading}
        onOpenResetModal={() => openResetModal({ username: '', fullName: '', lop: '' })}
        onRefresh={() => fetchStudents()}
      />

      <AllStudentsFilters
        isAdmin={isAdmin}
        searchQuery={searchQuery}
        selectedClass={selectedClass}
        selectedStatus={selectedStatus}
        pageSize={pageSize}
        classesList={classesList}
        onSearchChange={handleSearchChange}
        onClassChange={handleClassChange}
        onStatusChange={handleStatusChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Main Content View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-medium">Đang tải danh sách sinh viên...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px] text-center">
          <GraduationCap className="w-12 h-12 text-slate-300" />
          <span className="text-sm font-bold text-slate-700">Không tìm thấy sinh viên nào</span>
          <span className="text-xs text-slate-400 max-w-sm">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo lớp khác.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <StudentsMobileCards
            students={students}
            isAdmin={isAdmin}
            onSelectStudentSchedule={onSelectStudentSchedule}
            onImpersonate={onImpersonate}
            onClassClick={onClassClick}
            onOpenResetModal={openResetModal}
          />

          <StudentsDesktopTable
            students={students}
            currentPage={currentPage}
            pageSize={pageSize}
            isAdmin={isAdmin}
            onSelectStudentSchedule={onSelectStudentSchedule}
            onImpersonate={onImpersonate}
            onClassClick={onClassClick}
            onOpenResetModal={openResetModal}
          />

          <StudentsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalStudents={totalStudents}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {isAdmin && (
        <AdminResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={closeResetModal}
          initialUsername={resetTarget.username}
          initialFullName={resetTarget.fullName}
          initialClass={resetTarget.lop}
          onSuccess={() => {
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
