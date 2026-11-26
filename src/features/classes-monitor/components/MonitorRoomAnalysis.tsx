'use client';

import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import RoomAnalysisSplitTable from './RoomAnalysisSplitTable';
import RoomAnalysisRoomsList from './RoomAnalysisRoomsList';
import { MonitorRoomAnalysisProps } from './monitor-room-analysis/types';
import { useMonitorRoomAnalysis } from './monitor-room-analysis/useMonitorRoomAnalysis';
import MonitorRoomAnalysisHeader from './monitor-room-analysis/MonitorRoomAnalysisHeader';
import MonitorRoomContextBar from './monitor-room-analysis/MonitorRoomContextBar';
import MonitorRoomSummaryCards from './monitor-room-analysis/MonitorRoomSummaryCards';
import MonitorRoomFilterToolbar from './monitor-room-analysis/MonitorRoomFilterToolbar';

export default function MonitorRoomAnalysis(props: MonitorRoomAnalysisProps) {
  const { availableClasses, examBatches, onSelectStudentSchedule } = props;
  const state = useMonitorRoomAnalysis(props);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      {/* Toast */}
      {state.toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            state.toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {state.toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{state.toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <MonitorRoomAnalysisHeader
        copied={state.copied}
        isLoading={state.isLoading}
        onCopyResult={state.handleCopyResult}
        onExportCSV={state.handleExportCSV}
        onRefresh={state.fetchAnalysis}
      />

      {/* Context Controls: Batch, Class, Reference Monitor, Scope Switch */}
      <MonitorRoomContextBar
        examBatches={examBatches}
        selectedBatchCode={state.selectedBatchCode}
        onBatchChange={state.setSelectedBatchCode}
        adminMode={state.adminMode}
        availableClasses={availableClasses}
        selectedClass={state.selectedClass}
        onClassChange={state.handleClassChange}
        selectedRefMaSV={state.selectedRefMaSV}
        onRefMaSVChange={state.setSelectedRefMaSV}
        referenceStudent={state.referenceStudent}
        candidates={state.candidates}
        scope={state.scope}
        onScopeChange={state.setScope}
        reviewRegisteredCount={state.reviewRegisteredCount}
        hidePostponed={state.hidePostponed}
        onHidePostponedChange={state.setHidePostponed}
        isLoading={state.isLoading}
      />

      {/* Summary Cards */}
      <MonitorRoomSummaryCards
        splitCounts={state.splitCounts}
        filteredRoomsCount={state.filteredRooms.length}
        totalRoomsCount={state.analyzedRooms.length}
        scope={state.scope}
      />

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <MonitorRoomFilterToolbar
          viewTab={state.viewTab}
          onViewTabChange={state.setViewTab}
          filteredRecordsCount={state.filteredRecords.length}
          filteredRoomsCount={state.filteredRooms.length}
          examTimeSort={state.examTimeSort}
          onToggleExamTimeSort={state.toggleExamTimeSort}
          selectedSubject={state.selectedSubject}
          onSubjectChange={state.setSelectedSubject}
          subjects={state.subjects}
          scope={state.scope}
          roomCountOp={state.roomCountOp}
          onRoomCountOpChange={state.setRoomCountOp}
          roomCountN={state.roomCountN}
          onRoomCountNChange={state.setRoomCountN}
          onlyNonMonitorRooms={state.onlyNonMonitorRooms}
          onOnlyNonMonitorRoomsChange={state.setOnlyNonMonitorRooms}
          splitCounts={state.splitCounts}
          splitFilter={state.splitFilter}
          onSplitFilterChange={state.setSplitFilter}
          searchQuery={state.searchQuery}
          onSearchQueryChange={state.setSearchQuery}
        />

        {/* Error banner */}
        {state.errorMsg && (
          <div className="m-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{state.errorMsg}</span>
          </div>
        )}

        {/* Data Body */}
        {state.isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold">
              Đang phân tích phòng thi lớp {state.selectedClass}...
            </p>
          </div>
        ) : state.viewTab === 'SPLIT_STUDENTS' ? (
          <RoomAnalysisSplitTable
            records={state.filteredRecords}
            scope={state.scope}
            examTimeSort={state.examTimeSort}
            onToggleExamTimeSort={state.toggleExamTimeSort}
            onStudentClick={onSelectStudentSchedule}
          />
        ) : (
          <RoomAnalysisRoomsList
            rooms={state.filteredRooms}
            scope={state.scope}
            onStudentClick={onSelectStudentSchedule}
          />
        )}
      </div>
    </div>
  );
}
