'use client';

import React from 'react';
import { SortKey, SortDirection } from '../types/exam.types';
import { DataTableProps } from './data-table/types';
import { useDataTable } from './data-table/useDataTable';
import { DataTableHeader } from './data-table/DataTableHeader';
import { DataTableRow } from './data-table/DataTableRow';
import { DataTablePagination } from './data-table/DataTablePagination';

export type { SortKey, SortDirection };

export default function DataTable({
  records,
  totalRecords: propTotalRecords,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  itemsPerPage: propItemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  sortConfig,
  onSortChange,
  onStudentClick,
  onClassClick,
  onRowClick,
  onTogglePostpone,
  canEditPostpone = false,
  hideStatusColumn = false,
  showRoomClassmatesColumn = false,
  onViewRoomReviewMembers,
  isLoading = false,
}: DataTableProps) {
  const {
    activeCurrentPage,
    activeItemsPerPage,
    totalCount,
    calculatedTotalPages,
    startIndex,
    currentRecords,
    goToPage,
    handleSort,
  } = useDataTable({
    records,
    propTotalRecords,
    propCurrentPage,
    propTotalPages,
    propItemsPerPage,
    onPageChange,
    sortConfig,
    onSortChange,
  });

  if (isLoading && records.length === 0) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Đang tải danh sách lịch thi...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700 bg-white/95 px-3 py-1 rounded-full shadow-xs border border-slate-200">
            Đang tải dữ liệu...
          </span>
        </div>
      )}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <DataTableHeader
            sortConfig={sortConfig}
            onSort={handleSort}
            showRoomClassmatesColumn={showRoomClassmatesColumn}
            hideStatusColumn={hideStatusColumn}
          />
          <tbody className="divide-y divide-slate-100">
            {currentRecords.map((record, index) => (
              <DataTableRow
                key={record.id || `${record.MaSV}-${record.MaMH}-${startIndex + index}`}
                record={record}
                index={index}
                startIndex={startIndex}
                onStudentClick={onStudentClick}
                onClassClick={onClassClick}
                onRowClick={onRowClick}
                onTogglePostpone={onTogglePostpone}
                canEditPostpone={canEditPostpone}
                hideStatusColumn={hideStatusColumn}
                showRoomClassmatesColumn={showRoomClassmatesColumn}
                onViewRoomReviewMembers={onViewRoomReviewMembers}
              />
            ))}
          </tbody>
        </table>
      </div>

      <DataTablePagination
        startIndex={startIndex}
        activeItemsPerPage={activeItemsPerPage}
        totalCount={totalCount}
        activeCurrentPage={activeCurrentPage}
        calculatedTotalPages={calculatedTotalPages}
        onItemsPerPageChange={onItemsPerPageChange}
        onGoToPage={goToPage}
      />
    </div>
  );
}
