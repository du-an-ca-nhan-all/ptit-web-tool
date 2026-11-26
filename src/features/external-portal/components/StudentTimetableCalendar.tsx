import React from 'react';
import SubjectsProgressModal from './SubjectsProgressModal';
import { StudentTimetableCalendarProps } from './student-timetable-calendar/types';
import { useStudentTimetable } from './student-timetable-calendar/useStudentTimetable';
import TimetableHeader from './student-timetable-calendar/TimetableHeader';
import TimetableStatusBanners from './student-timetable-calendar/TimetableStatusBanners';
import TimetableFilterBar from './student-timetable-calendar/TimetableFilterBar';
import TimetableStatusStates from './student-timetable-calendar/TimetableStatusStates';
import MonthDesktopView from './student-timetable-calendar/MonthDesktopView';
import MonthMobileView from './student-timetable-calendar/MonthMobileView';
import WeekDesktopView from './student-timetable-calendar/WeekDesktopView';
import WeekMobileView from './student-timetable-calendar/WeekMobileView';
import AgendaView from './student-timetable-calendar/AgendaView';
import SessionDetailsModal from './student-timetable-calendar/SessionDetailsModal';
import ExternalCalendarSyncModal from './student-timetable-calendar/ExternalCalendarSyncModal';

export default function StudentTimetableCalendar({
  currentUser,
  onNavigateToExternalAccounts,
  onNavigateToReminders,
}: StudentTimetableCalendarProps) {
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    currentDate,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
    selectedEventModal,
    setSelectedEventModal,
    copiedLink,
    isSyncModalOpen,
    setIsSyncModalOpen,
    copiedIcsUrl,
    setCopiedIcsUrl,
    isProgressModalOpen,
    setIsProgressModalOpen,
    fetchTimetable,
    allEvents,
    overallProgressStats,
    subjectsProgressList,
    subjectProgressMap,
    eventSessionNumberMap,
    currentContextStats,
    filteredEvents,
    monthGridDays,
    weekDays,
    todayIso,
    selectedDayEvents,
    handlePrev,
    handleNext,
    handleToday,
    handleJumpToNextClass,
    handleCopyLink,
  } = useStudentTimetable();

  const hasStatusState =
    isLoading ||
    errorType === 'NOT_CONFIGURED' ||
    errorType === 'INVALID_CREDENTIALS' ||
    Boolean(error) ||
    allEvents.length === 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <TimetableHeader
        data={data}
        selectedSubjectFilter={selectedSubjectFilter}
        onResetSubjectFilter={() => setSelectedSubjectFilter('ALL')}
        currentContextStats={currentContextStats}
        overallProgressStats={overallProgressStats}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onRefresh={() => fetchTimetable(true)}
        onOpenProgressModal={() => setIsProgressModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onNavigateToReminders={onNavigateToReminders}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      <TimetableStatusBanners
        syncFeedback={syncFeedback}
        onDismissSyncFeedback={() => setSyncFeedback(null)}
        hasLinkedAccount={data?.hasLinkedAccount}
        onNavigateToExternalAccounts={onNavigateToExternalAccounts}
      />

      <TimetableFilterBar
        viewMode={viewMode}
        currentDate={currentDate}
        weekDays={weekDays}
        data={data}
        selectedSubjectFilter={selectedSubjectFilter}
        onChangeSubjectFilter={setSelectedSubjectFilter}
        overallProgressStats={overallProgressStats}
        subjectProgressMap={subjectProgressMap}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        onPrev={handlePrev}
        onToday={handleToday}
        onNext={handleNext}
      />

      {hasStatusState ? (
        <TimetableStatusStates
          isLoading={isLoading}
          errorType={errorType}
          error={error}
          isEmpty={allEvents.length === 0}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchTimetable(true)}
          onNavigateToExternalAccounts={onNavigateToExternalAccounts}
        />
      ) : (
        <>
          {viewMode === 'MONTH' && (
            <>
              <MonthDesktopView
                monthGridDays={monthGridDays}
                selectedDay={selectedDay}
                todayIso={todayIso}
                selectedDayEvents={selectedDayEvents}
                eventSessionNumberMap={eventSessionNumberMap}
                subjectProgressMap={subjectProgressMap}
                onSelectDay={setSelectedDay}
                onSelectEvent={setSelectedEventModal}
              />
              <MonthMobileView
                currentDate={currentDate}
                monthGridDays={monthGridDays}
                selectedDay={selectedDay}
                todayIso={todayIso}
                selectedDayEvents={selectedDayEvents}
                copiedLink={copiedLink}
                onPrev={handlePrev}
                onToday={handleToday}
                onNext={handleNext}
                onSelectDay={setSelectedDay}
                onJumpToNextClass={handleJumpToNextClass}
                onSelectEvent={setSelectedEventModal}
                onCopyLink={handleCopyLink}
              />
            </>
          )}

          {viewMode === 'WEEK' && (
            <>
              <WeekDesktopView
                weekDays={weekDays}
                eventSessionNumberMap={eventSessionNumberMap}
                subjectProgressMap={subjectProgressMap}
                onSelectEvent={setSelectedEventModal}
              />
              <WeekMobileView
                weekDays={weekDays}
                eventSessionNumberMap={eventSessionNumberMap}
                subjectProgressMap={subjectProgressMap}
                onSelectEvent={setSelectedEventModal}
              />
            </>
          )}

          {viewMode === 'AGENDA' && (
            <AgendaView
              filteredEvents={filteredEvents}
              todayIso={todayIso}
              eventSessionNumberMap={eventSessionNumberMap}
              subjectProgressMap={subjectProgressMap}
              onSelectEvent={setSelectedEventModal}
            />
          )}
        </>
      )}

      <SessionDetailsModal
        event={selectedEventModal}
        eventSessionNumberMap={eventSessionNumberMap}
        subjectProgressMap={subjectProgressMap}
        copiedLink={copiedLink}
        onCopyLink={handleCopyLink}
        onClose={() => setSelectedEventModal(null)}
        onNavigateToReminders={onNavigateToReminders}
      />

      <ExternalCalendarSyncModal
        isOpen={isSyncModalOpen}
        username={currentUser.username}
        copiedIcsUrl={copiedIcsUrl}
        onSetCopiedIcsUrl={setCopiedIcsUrl}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <SubjectsProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        subjectsProgress={subjectsProgressList}
        overallStats={overallProgressStats}
        semesterName={data?.semesterName}
        onSelectSubject={(code) => setSelectedSubjectFilter(code)}
        selectedSubjectCode={selectedSubjectFilter}
      />
    </div>
  );
}
