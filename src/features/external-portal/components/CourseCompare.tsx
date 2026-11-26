import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CourseCompareProps } from './course-compare/types';
import { useCourseCompare } from './course-compare/useCourseCompare';
import { CompareHeader } from './course-compare/CompareHeader';
import { CompareFiltersAndSummary } from './course-compare/CompareFiltersAndSummary';
import { ComparisonSections } from './course-compare/ComparisonSections';
import { CourseStatsModal } from './course-compare/CourseStatsModal';

export type { SemesterInfo } from './course-compare/types';

export default function CourseCompare({
  data: initialData,
  currentUser,
  onNavigateTab,
  onReload,
  embedded = false,
  onSubTabChange,
}: CourseCompareProps) {
  const {
    data,
    isLoading,
    selectedSemester,
    setSelectedSemester,
    loadCompareData,
    selectedStudentUsername,
    setSelectedStudentUsername,
    selectedCourse,
    setSelectedCourse,
    isPulling,
    pullMsg,
    handlePullMyCourses,
    availableSemesters,
    hasMonitorData,
    isCurrentUserMonitor,
    popupStats,
    comparison,
    currentStudentName,
    handleGoToMyCourses,
  } = useCourseCompare({
    initialData,
    currentUser,
    onNavigateTab,
    onReload,
    onSubTabChange,
  });

  if (isLoading && !data) {
    return (
      <div className={embedded ? 'w-full' : 'p-4 md:p-8 max-w-7xl mx-auto w-full'}>
        <div className="flex flex-col items-center justify-center py-28 gap-3.5 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-700">Đang đối chiếu dữ liệu đăng ký môn học...</p>
          <p className="text-xs text-slate-400">Đang tải và so sánh danh sách môn học với Lớp trưởng</p>
        </div>
      </div>
    );
  }

  const canNavigateToMyCourses = !!(onNavigateTab || onSubTabChange);

  return (
    <div
      className={
        embedded
          ? 'space-y-6 animate-in fade-in duration-200'
          : 'p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300'
      }
    >
      {/* Toast */}
      {pullMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pullMsg}</span>
        </div>
      )}

      <CompareHeader
        hasMonitorData={hasMonitorData}
        currentStudentName={currentStudentName}
        monitorUsername={data?.main?.username}
        currentUser={currentUser}
        isCurrentUserMonitor={isCurrentUserMonitor}
        isPulling={isPulling}
        canNavigateToMyCourses={canNavigateToMyCourses}
        onReloadClick={() => {
          loadCompareData();
          if (onReload) onReload();
        }}
        onPullMyCourses={handlePullMyCourses}
        onGoToMyCourses={handleGoToMyCourses}
      />

      <CompareFiltersAndSummary
        data={data}
        currentUser={currentUser}
        selectedSemester={selectedSemester}
        availableSemesters={availableSemesters}
        selectedStudentUsername={selectedStudentUsername}
        hasMonitorData={hasMonitorData}
        comparison={comparison}
        canNavigateToMyCourses={canNavigateToMyCourses}
        onSemesterChange={(sem) => {
          setSelectedSemester(sem);
          loadCompareData(sem);
        }}
        onStudentChange={setSelectedStudentUsername}
        onGoToMyCourses={handleGoToMyCourses}
      />

      {/* Comparison Sections (When Monitor has data) */}
      {hasMonitorData && (
        <ComparisonSections comparison={comparison} onSelectCourse={setSelectedCourse} />
      )}

      {/* Modal Popup Stats */}
      {selectedCourse && popupStats && (
        <CourseStatsModal
          selectedCourse={selectedCourse}
          popupStats={popupStats}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
