'use client';

import React from 'react';
import { CalendarDays, RefreshCw, Layers, Power } from 'lucide-react';
import {
  UploadSection,
  AllExamsSchedule,
  StudentPersonalExamSchedule,
} from '../../../features/exam-schedule';
import { buildSessions } from '../../../utils/dataModel';
import type { HomeMainContentProps } from './types';

export function ExamScheduleFallbackView(props: HomeMainContentProps) {
  const {
    isLoading,
    activeTab,
    effectiveUser,
    records,
    setRecords,
    setSessions,
    activeBatch,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    selectedExamRoom,
    setSelectedExamRoom,
    setConfirmStudentId,
    setConfirmClassCode,
    handleTabChange,
    handleToggleExamPostpone,
    loadDataFromApi,
    isAdmin,
    canAccessMonitorTools,
    hasActiveBatch,
    classes,
    subjects,
    dates,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages,
  } = props;

  const scheduleProps = {
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
    activeBatch,
    loadDataFromApi,
  };

  if (!hasActiveBatch && activeTab === 'schedule') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
          <Power className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">
          Hệ Thống Thi Đang Tạm Đóng
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Hiện tại tất cả các đợt thi đã được tạm khóa hoặc kết thúc. Màn hình
          tra cứu lịch thi sẽ tự động hiển thị trở lại khi Quản trị viên kích
          hoạt đợt thi mới.
        </p>
        {isAdmin && (
          <button
            onClick={() => handleTabChange('batches')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" /> Đi đến Quản Lý Đợt Thi
          </button>
        )}
      </div>
    );
  }

  if (activeTab === 'personal_schedule' && effectiveUser) {
    return (
      <StudentPersonalExamSchedule
        currentUser={effectiveUser}
        onNavigateToExternalAccounts={() => handleTabChange('profile')}
        isLoadingBatchData={isLoading}
        {...scheduleProps}
      />
    );
  }

  if (activeTab === 'schedule') {
    return <AllExamsSchedule isLoading={isLoading} {...scheduleProps} />;
  }

  if (records.length === 0 && totalRecords === 0) {
    if (isAdmin) {
      return (
        <UploadSection
          onDataLoaded={(loadedData) => {
            setRecords(loadedData);
            setSessions(buildSessions(loadedData));
          }}
          onRefreshFromDb={() => loadDataFromApi()}
        />
      );
    }

    return (
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <CalendarDays className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Chưa Có Dữ Liệu Lịch Thi
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          Hiện tại chưa có dữ liệu lịch thi cho đợt thi này. Vui lòng thử tải
          lại dữ liệu hoặc quay lại sau.
        </p>
        <button
          onClick={() => loadDataFromApi(activeBatch?.code)}
          disabled={isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Đang tải lại...' : 'Tải lại dữ liệu'}
        </button>
      </div>
    );
  }

  return <AllExamsSchedule isLoading={isLoading} {...scheduleProps} />;
}
