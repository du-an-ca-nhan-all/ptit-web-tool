import React from 'react';
import CourseCompare from './CourseCompare';
import {
  RegisteredCoursesSubTab,
  SemesterInfo,
  StudentCourseRegistrationProps,
} from './student-course-registration/types';
import { useStudentCourseRegistration } from './student-course-registration/useStudentCourseRegistration';
import RegistrationHeader from './student-course-registration/RegistrationHeader';
import RegistrationSummarySection from './student-course-registration/RegistrationSummarySection';
import RegisteredCoursesTable from './student-course-registration/RegisteredCoursesTable';
import CourseDetailModal from './student-course-registration/CourseDetailModal';

export type { RegisteredCoursesSubTab, SemesterInfo };

export default function StudentCourseRegistration({
  currentUser,
  onNavigateTab,
  initialSubTab = 'COURSES',
  courseCompareData,
  onReloadCourseCompare,
}: StudentCourseRegistrationProps) {
  const {
    courses,
    semesters,
    selectedSemester,
    selectedSemesterName,
    summary,
    isLoading,
    isPulling,
    isBatchPulling,
    searchQuery,
    setSearchQuery,
    selectedCourseDetail,
    setSelectedCourseDetail,
    activeSubTab,
    setActiveSubTab,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    isAdmin,
    isMonitor,
    filteredCourses,
    fetchRegisteredCourses,
    handleSemesterChange,
    handlePullFromQLDTTX,
    handleBatchPullClass,
  } = useStudentCourseRegistration({
    currentUser,
    initialSubTab,
    onReloadCourseCompare,
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <RegistrationHeader
        currentUser={currentUser}
        selectedSemesterName={selectedSemesterName}
        semesters={semesters}
        totalCourses={summary.totalCourses}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        successMsg={successMsg}
        onClearSuccess={() => setSuccessMsg('')}
        errorMsg={errorMsg}
        onClearError={() => setErrorMsg('')}
        isLoading={isLoading}
        isPulling={isPulling}
        isBatchPulling={isBatchPulling}
        isAdmin={isAdmin}
        isMonitor={isMonitor}
        onReload={() => {
          fetchRegisteredCourses();
          if (onReloadCourseCompare) onReloadCourseCompare();
        }}
        onPullFromQLDTTX={handlePullFromQLDTTX}
        onBatchPullClass={handleBatchPullClass}
        onNavigateTab={onNavigateTab}
      />

      {/* Subtab 1: Môn Học Đã Đăng Ký Content */}
      {activeSubTab === 'COURSES' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <RegistrationSummarySection
            summary={summary}
            semesters={semesters}
            selectedSemester={selectedSemester}
            selectedSemesterName={selectedSemesterName}
            onSemesterChange={handleSemesterChange}
            onNavigateTab={onNavigateTab}
          />

          <RegisteredCoursesTable
            courses={courses}
            filteredCourses={filteredCourses}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedSemester={selectedSemester}
            selectedSemesterName={selectedSemesterName}
            isLoading={isLoading}
            isPulling={isPulling}
            isExternalAccountConfigured={!!summary.externalAccount?.isConfigured}
            onPullFromQLDTTX={handlePullFromQLDTTX}
            onSelectCourseDetail={setSelectedCourseDetail}
          />

          <CourseDetailModal
            course={selectedCourseDetail}
            onClose={() => setSelectedCourseDetail(null)}
          />
        </div>
      )}

      {/* Subtab 2: So Sánh ĐKMH Content */}
      {activeSubTab === 'COMPARE' && (
        <CourseCompare
          embedded={true}
          data={courseCompareData || null}
          currentUser={currentUser}
          onNavigateTab={onNavigateTab}
          onReload={onReloadCourseCompare}
          onSubTabChange={(tab) => setActiveSubTab(tab)}
        />
      )}
    </div>
  );
}
