import React from 'react';
import { Mail, Coffee, Settings } from 'lucide-react';
import PricingConfigModal from './PricingConfigModal';
import AssignEnvelopeModal from './AssignEnvelopeModal';
import QuickEditPriceModal from './QuickEditPriceModal';
import RoomStudentsModal from './RoomStudentsModal';
import { AllMonitorsEnvelopesProps } from './all-monitors-envelopes/types';
import { useAllMonitorsEnvelopes } from './all-monitors-envelopes/useAllMonitorsEnvelopes';
import EnvelopeFilterBar from './all-monitors-envelopes/EnvelopeFilterBar';
import EnvelopeSummaryCards from './all-monitors-envelopes/EnvelopeSummaryCards';
import MobileEnvelopeList from './all-monitors-envelopes/MobileEnvelopeList';
import DesktopEnvelopeTable from './all-monitors-envelopes/DesktopEnvelopeTable';
import EnvelopePagination from './all-monitors-envelopes/EnvelopePagination';

export default function AllMonitorsEnvelopes({
  sessions = [],
  records = [],
  loginUsers = [],
  isAdmin,
}: AllMonitorsEnvelopesProps) {
  const {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterDate,
    setFilterDate,
    filterClass,
    setFilterClass,
    page,
    setPage,
    pageSize,
    setPageSize,
    isPricingModalOpen,
    setIsPricingModalOpen,
    envelopeAssignments,
    loadingClaimId,
    assigningSession,
    setAssigningSession,
    assigningInitialClass,
    quickEditSession,
    setQuickEditSession,
    viewingStudentsSession,
    setViewingStudentsSession,
    viewingStudentsClassFilter,
    userClass,
    effectiveIsAdmin,
    monitorClasses,
    enhancedSessions,
    availableDates,
    availableClasses,
    counts,
    displayedSessions,
    totalPages,
    paginatedSessions,
    isFilterActive,
    totalExpectedMoney,
    claimedCountInDisplayed,
    handleOpenRoomStudents,
    handleOpenAssignModal,
    handleConfirmAssign,
    handleSaveQuickPrice,
    handleCancelClaim,
    handleResetFilters,
  } = useAllMonitorsEnvelopes({ sessions, loginUsers, isAdmin });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0" />
            <span>Phân Công Nước Uống & Hỗ Trợ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Danh sách tất cả phòng thi. Lớp đông SV nhất được gợi ý phụ trách chuẩn bị nước uống & hỗ trợ phòng thi, các lớp có thể chủ động nhận hoặc gán sinh viên hỗ trợ.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Tùy chỉnh định mức kinh phí phòng thi"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấu hình kinh phí phòng</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <EnvelopeFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
        availableDates={availableDates}
        availableClasses={availableClasses}
        userClass={userClass}
        counts={counts}
        isFilterActive={isFilterActive}
        handleResetFilters={handleResetFilters}
      />

      {/* Summary Cards */}
      <EnvelopeSummaryCards
        isFilterActive={isFilterActive}
        displayedCount={displayedSessions.length}
        totalEnhancedCount={enhancedSessions.length}
        totalExpectedMoney={totalExpectedMoney}
        claimedCountInDisplayed={claimedCountInDisplayed}
      />

      {/* Main Content Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {displayedSessions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
            <Mail className="w-12 h-12 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600">Không tìm thấy phòng thi nào phù hợp.</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử xóa hoặc thay đổi điều kiện bộ lọc.</p>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <MobileEnvelopeList
              paginatedSessions={paginatedSessions}
              page={page}
              pageSize={pageSize}
              monitorClasses={monitorClasses}
              userClass={userClass}
              loginUsers={loginUsers}
              loadingClaimId={loadingClaimId}
              onOpenRoomStudents={handleOpenRoomStudents}
              onQuickEditSession={setQuickEditSession}
              onOpenAssignModal={handleOpenAssignModal}
              onCancelClaim={handleCancelClaim}
            />

            <DesktopEnvelopeTable
              paginatedSessions={paginatedSessions}
              page={page}
              pageSize={pageSize}
              monitorClasses={monitorClasses}
              userClass={userClass}
              loginUsers={loginUsers}
              loadingClaimId={loadingClaimId}
              onOpenRoomStudents={handleOpenRoomStudents}
              onQuickEditSession={setQuickEditSession}
              onOpenAssignModal={handleOpenAssignModal}
              onCancelClaim={handleCancelClaim}
            />

            <EnvelopePagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              totalItems={displayedSessions.length}
              setPage={setPage}
              setPageSize={setPageSize}
            />
          </>
        )}
      </div>

      <AssignEnvelopeModal
        isOpen={Boolean(assigningSession)}
        onClose={() => setAssigningSession(null)}
        session={assigningSession}
        initialClass={assigningInitialClass}
        records={records}
        loginUsers={loginUsers}
        currentAssignment={assigningSession ? envelopeAssignments[assigningSession.id] : undefined}
        onConfirm={handleConfirmAssign}
        isLoading={loadingClaimId === assigningSession?.id}
      />

      <RoomStudentsModal
        isOpen={Boolean(viewingStudentsSession)}
        onClose={() => setViewingStudentsSession(null)}
        session={viewingStudentsSession}
        records={records}
        userClass={userClass}
        initialClassFilter={viewingStudentsClassFilter}
      />

      <QuickEditPriceModal
        isOpen={Boolean(quickEditSession)}
        onClose={() => setQuickEditSession(null)}
        session={quickEditSession}
        onSave={handleSaveQuickPrice}
        isLoading={loadingClaimId === quickEditSession?.id}
      />

      <PricingConfigModal
        isOpen={isPricingModalOpen && effectiveIsAdmin}
        onClose={() => setIsPricingModalOpen(false)}
        isAdmin={effectiveIsAdmin}
      />
    </div>
  );
}
