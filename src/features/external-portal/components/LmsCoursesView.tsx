'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { LmsCoursesViewProps } from './lms-courses-view/types';
import { useLmsCourses } from './lms-courses-view/useLmsCourses';
import { LmsUnconfiguredState } from './lms-courses-view/LmsUnconfiguredState';
import { LmsHeaderAndMetrics } from './lms-courses-view/LmsHeaderAndMetrics';
import { LmsFilterBar } from './lms-courses-view/LmsFilterBar';
import { LmsCourseCard } from './lms-courses-view/LmsCourseCard';
import { LmsCourseDetailsModal } from './lms-courses-view/LmsCourseDetailsModal';

export default function LmsCoursesView({ currentUser, onNavigateToExternalAccounts }: LmsCoursesViewProps) {
  const {
    data,
    isConfigured,
    isLoading,
    isRefreshing,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedSemester,
    setSelectedSemester,
    sortBy,
    setSortBy,
    activeCourseDetails,
    setActiveCourseDetails,
    fetchLmsCourses,
    handleOpenCourseDetails,
    semestersList,
    filterCounts,
    filteredCourses,
  } = useLmsCourses();

  // ==============================================================
  // UNCONFIGURED STATE (Chưa liên kết tài khoản LMS)
  // ==============================================================
  if (!isLoading && isConfigured === false) {
    return <LmsUnconfiguredState onNavigateToExternalAccounts={onNavigateToExternalAccounts} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <LmsHeaderAndMetrics
        currentUser={currentUser}
        data={data}
        filterCounts={filterCounts}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissSuccess={() => setSuccessMsg('')}
        onDismissError={() => setErrorMsg('')}
        onRefresh={() => fetchLmsCourses(true)}
      />

      <LmsFilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        filterCounts={filterCounts}
        semestersList={semestersList}
        selectedSemester={selectedSemester}
        onSelectedSemesterChange={setSelectedSemester}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Courses List Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Đang tải dữ liệu khóa học...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Không tìm thấy môn học nào phù hợp</p>
          <p className="text-xs text-slate-400">Thử chọn tab "Tất cả" hoặc thay đổi bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((course) => (
            <LmsCourseCard key={course.id} course={course} onOpenDetails={handleOpenCourseDetails} />
          ))}
        </div>
      )}

      {/* Modal: Course Sections & Activities Detail */}
      {activeCourseDetails && (
        <LmsCourseDetailsModal
          details={activeCourseDetails}
          onClose={() => setActiveCourseDetails(null)}
        />
      )}
    </div>
  );
}
