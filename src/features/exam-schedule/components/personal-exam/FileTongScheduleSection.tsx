import React from 'react';
import { CalendarDays, FileSpreadsheet, RefreshCw } from 'lucide-react';
import type { StudentPersonalExamScheduleProps } from '../../types/studentPersonalExam.types';
import type { ExamRecord } from '../../types/exam.types';
import FilterBar from '../FilterBar';
import DataTable from '../DataTable';
import ExamRoomMembers from '../ExamRoomMembers';
import FileTongMobileSection from './FileTongMobileSection';

interface FileTongScheduleSectionProps extends StudentPersonalExamScheduleProps {
  onOpenReviewMembers: (record: ExamRecord) => void;
}

export default function FileTongScheduleSection(props: FileTongScheduleSectionProps) {
  const {
    currentUser,
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
    isLoadingBatchData,
    activeBatch,
    loadDataFromApi,
    onOpenReviewMembers,
  } = props;

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

  if (totalRecords === 0 && records.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded-2xl sm:rounded-3xl flex items-center justify-center text-blue-600 mb-3 sm:mb-4 shadow-sm">
          <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-1.5 sm:mb-2">
          Chưa Có Dữ Liệu Lịch Thi File Tổng
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 sm:mb-6 leading-relaxed">
          Bạn không có lịch thi nào trong đợt thi này hoặc file lịch thi tổng chưa được Quản trị
          viên import. Bạn có thể chuyển sang tab <b>&quot;Cổng QLDTTX&quot;</b> ở trên để xem trực
          tiếp từ trường.
        </p>
        <button
          onClick={() => loadDataFromApi(activeBatch?.code)}
          disabled={isLoadingBatchData}
          className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingBatchData ? 'animate-spin' : ''}`}
          />
          {isLoadingBatchData ? 'Đang tải lại...' : 'Tải lại dữ liệu đợt thi'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-sm shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-lg font-black text-slate-800">
                Lịch Thi Cá Nhân (File Tổng Hợp)
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {totalRecords} môn thi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
              Đợt thi: <strong className="text-slate-800">{activeBatch?.name || 'Đợt thi học kỳ'}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => loadDataFromApi(activeBatch?.code)}
          disabled={isLoadingBatchData}
          className="px-3.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-stretch sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-600 ${isLoadingBatchData ? 'animate-spin' : ''}`}
          />
          <span>Tải lại</span>
        </button>
      </div>

      <FileTongMobileSection
        currentUser={currentUser}
        records={records}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        filters={filters}
        setFilters={setFilters}
        subjects={subjects}
        dates={dates}
        onSelectExamRoom={setSelectedExamRoom}
        onOpenReviewMembers={onOpenReviewMembers}
      />

      <div className="hidden md:block space-y-6">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          totalRecords={totalRecords}
          filteredCount={totalRecords}
          hideClassFilter={true}
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
          hideStatusColumn={true}
          showRoomClassmatesColumn={true}
          onViewRoomReviewMembers={onOpenReviewMembers}
          isLoading={isLoadingBatchData}
        />
      </div>
    </div>
  );
}
