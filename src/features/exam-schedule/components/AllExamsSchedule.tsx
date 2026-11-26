'use client';

import React from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import FilterBar from './FilterBar';
import DataTable from './DataTable';
import ExamRoomMembers from './ExamRoomMembers';
import { AllExamsScheduleProps } from './all-exams-schedule/types';
import MobileFilterBar from './all-exams-schedule/MobileFilterBar';
import MobileExamCard from './all-exams-schedule/MobileExamCard';
import MobilePaginationBar from './all-exams-schedule/MobilePaginationBar';

export default function AllExamsSchedule({
  records,
  totalRecords,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  sortConfig,
  setSortConfig,
  filters,
  setFilters,
  classes,
  subjects,
  dates,
  selectedExamRoom,
  setSelectedExamRoom,
  setConfirmStudentId,
  setConfirmClassCode,
  handleToggleExamPostpone,
  canAccessMonitorTools,
  isLoading,
  activeBatch,
  loadDataFromApi,
}: AllExamsScheduleProps) {
  if (selectedExamRoom) {
    return (
      <ExamRoomMembers
        roomRecord={selectedExamRoom}
        allRecords={records}
        batchCode={activeBatch?.code}
        onBack={() => setSelectedExamRoom(null)}
        onStudentClick={setConfirmStudentId}
        onClassClick={setConfirmClassCode}
        onTogglePostpone={handleToggleExamPostpone}
        canEditPostpone={canAccessMonitorTools}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl sm:rounded-2xl shadow-sm shrink-0">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">Lịch Thi Tổng Hợp Toàn Trường</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalRecords.toLocaleString()} ca thi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Đợt thi: <strong className="text-slate-800">{activeBatch?.name || 'Đợt thi học kỳ'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => loadDataFromApi(activeBatch?.code)}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-stretch sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* MOBILE VIEW */}
      <div className="block md:hidden space-y-3">
        <MobileFilterBar
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
        />

        {/* Mobile Exam Cards List */}
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            Không tìm thấy ca thi nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec, index) => (
              <MobileExamCard
                key={rec.id || `${rec.MaSV}-${rec.MaMH}-${index}`}
                record={rec}
                onSelectExamRoom={setSelectedExamRoom}
                onStudentClick={setConfirmStudentId}
                onClassClick={setConfirmClassCode}
                onTogglePostpone={handleToggleExamPostpone}
                canAccessMonitorTools={canAccessMonitorTools}
              />
            ))}
          </div>
        )}

        <MobilePaginationBar
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block space-y-6">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          totalRecords={totalRecords}
          filteredCount={totalRecords}
          hideClassFilter={false}
        />
        <DataTable
          records={records}
          totalRecords={totalRecords}
          currentPage={page}
          totalPages={totalPages}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
          sortConfig={sortConfig}
          onSortChange={setSortConfig}
          onStudentClick={setConfirmStudentId}
          onClassClick={setConfirmClassCode}
          onRowClick={setSelectedExamRoom}
          onTogglePostpone={handleToggleExamPostpone}
          canEditPostpone={canAccessMonitorTools}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
