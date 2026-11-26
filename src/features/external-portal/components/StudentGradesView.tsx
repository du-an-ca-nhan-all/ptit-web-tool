import React from 'react';
import { StudentGradesViewProps } from './student-grades-view/types';
import { useStudentGrades } from './student-grades-view/useStudentGrades';
import { GradesHeaderSection } from './student-grades-view/GradesHeaderSection';
import { GradesStatePanels } from './student-grades-view/GradesStatePanels';
import { OverviewStatsCards } from './student-grades-view/OverviewStatsCards';
import { AnalyticsSection } from './student-grades-view/AnalyticsSection';
import { SemesterGradesSection } from './student-grades-view/SemesterGradesSection';
import { ComponentGradesModal } from './student-grades-view/ComponentGradesModal';
import { CreditsExplanationModal } from './student-grades-view/CreditsExplanationModal';
import { GpaExplanationModal } from './student-grades-view/GpaExplanationModal';

export default function StudentGradesView({
  currentUser,
  initialSource,
  onNavigateToExternalAccounts,
}: StudentGradesViewProps) {
  const {
    dataSource,
    data,
    summary,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    selectedSemester,
    setSelectedSemester,
    selectedGradeFilter,
    setSelectedGradeFilter,
    searchQuery,
    setSearchQuery,
    activeAnalyticsTab,
    setActiveAnalyticsTab,
    selectedCourseModal,
    setSelectedCourseModal,
    showCreditsModal,
    setShowCreditsModal,
    showGpaModal,
    setShowGpaModal,
    copiedSummary,
    gpaScaleView,
    setGpaScaleView,
    gpaModeView,
    setGpaModeView,
    semesters,
    filteredSemesters,
    fetchGrades,
    handleSwitchSource,
    handleExportCSV,
    handleCopySummary,
  } = useStudentGrades(currentUser, initialSource);

  const hasErrorState =
    isLoading ||
    errorType === 'NOT_CONFIGURED' ||
    errorType === 'INVALID_CREDENTIALS' ||
    Boolean(error);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <GradesHeaderSection
        dataSource={dataSource}
        data={data}
        semestersCount={semesters.length}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        copiedSummary={copiedSummary}
        syncFeedback={syncFeedback}
        onSwitchSource={handleSwitchSource}
        onRefresh={() => fetchGrades(true)}
        onCopySummary={handleCopySummary}
        onExportCSV={handleExportCSV}
        onDismissSyncFeedback={() => setSyncFeedback(null)}
        onNavigateToExternalAccounts={onNavigateToExternalAccounts}
      />

      {hasErrorState ? (
        <GradesStatePanels
          dataSource={dataSource}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          error={error}
          errorType={errorType}
          onRetry={() => fetchGrades(true)}
          onNavigateToExternalAccounts={onNavigateToExternalAccounts}
        />
      ) : (
        <>
          <OverviewStatsCards
            dataSource={dataSource}
            summary={summary}
            lastSyncAt={data?.lastSyncAt}
            onOpenGpaModal={() => setShowGpaModal(true)}
            onOpenCreditsModal={() => setShowCreditsModal(true)}
          />

          <AnalyticsSection
            data={data}
            activeAnalyticsTab={activeAnalyticsTab}
            setActiveAnalyticsTab={setActiveAnalyticsTab}
            gpaScaleView={gpaScaleView}
            setGpaScaleView={setGpaScaleView}
            gpaModeView={gpaModeView}
            setGpaModeView={setGpaModeView}
          />

          <SemesterGradesSection
            semesters={semesters}
            filteredSemesters={filteredSemesters}
            selectedSemester={selectedSemester}
            setSelectedSemester={setSelectedSemester}
            selectedGradeFilter={selectedGradeFilter}
            setSelectedGradeFilter={setSelectedGradeFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectCourse={setSelectedCourseModal}
          />
        </>
      )}

      {selectedCourseModal && (
        <ComponentGradesModal
          course={selectedCourseModal}
          onClose={() => setSelectedCourseModal(null)}
        />
      )}

      {showCreditsModal && (
        <CreditsExplanationModal
          summary={summary}
          onClose={() => setShowCreditsModal(false)}
        />
      )}

      {showGpaModal && (
        <GpaExplanationModal
          summary={summary}
          onClose={() => setShowGpaModal(false)}
        />
      )}
    </div>
  );
}
