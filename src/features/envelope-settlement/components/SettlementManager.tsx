import React from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import PricingConfigModal from './PricingConfigModal';
import { SettlementManagerProps } from './settlement-manager/types';
import { useSettlementState } from './settlement-manager/useSettlementState';
import { SettlementHeader } from './settlement-manager/SettlementHeader';
import { SettlementSummaryCards } from './settlement-manager/SettlementSummaryCards';
import { PartnerBalanceCard } from './settlement-manager/PartnerBalanceCard';
import { SettlementDetailModal } from './settlement-manager/SettlementDetailModal';

export default function SettlementManager({
  records,
  sessions = [],
  loginUsers = [],
  onTogglePostpone,
  isAdmin,
}: SettlementManagerProps) {
  const {
    selectedClass,
    setSelectedClass,
    expandedPairs,
    selectedDetail,
    setSelectedDetail,
    showStudentList,
    studentClassFilter,
    setStudentClassFilter,
    studentSearchQuery,
    setStudentSearchQuery,
    isPricingModalOpen,
    setIsPricingModalOpen,
    settlementScope,
    setSettlementScope,
    studentListRef,
    effectiveIsAdmin,
    handleOpenStudentListForClass,
    handleToggleStudentList,
    handleCloseDetailModal,
    currentRoomRecords,
    filteredStudentRecords,
    modalClassCounts,
    getMonitorName,
    monitorClasses,
    availableClasses,
    isStudentExcluded,
    toggleStudentExclusion,
    clearSessionExclusions,
    totalClaimedRoomsAll,
    data,
    effectiveClassCountsForModal,
    excludedCountForModal,
    activeDetailCalc,
    toggleExpand,
  } = useSettlementState({
    records,
    sessions,
    loginUsers,
    onTogglePostpone,
    isAdmin,
  });

  if (records.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3 text-center">
          <DollarSign className="w-12 h-12 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu lịch thi để tính sổ quỹ bù trừ.</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Vui lòng chọn hoặc nhập dữ liệu lịch thi của đợt thi hiện tại.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <SettlementHeader
        effectiveIsAdmin={effectiveIsAdmin}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        selectedClass={selectedClass}
        onSelectClass={setSelectedClass}
        availableClasses={availableClasses}
        getMonitorName={getMonitorName}
        settlementScope={settlementScope}
        onSelectScope={setSettlementScope}
        totalClaimedRoomsAll={totalClaimedRoomsAll}
        totalSessionsCount={sessions.length}
      />

      <SettlementSummaryCards data={data} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 bg-slate-50/50">
          {data.receivables.length === 0 && data.payables.length === 0 && data.settled.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-lg">Lớp của bạn không phát sinh công nợ nào.</p>
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Phải Thu */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Lớp khác nợ bạn ({data.receivables.length})
                </h3>
                {data.receivables.length === 0 ? (
                  <p className="text-slate-400 italic text-sm py-4 text-center">Không có khoản nào cần thu.</p>
                ) : (
                  data.receivables.map((p) => (
                    <PartnerBalanceCard
                      key={p.partnerClass}
                      partner={p}
                      type="receive"
                      isExpanded={expandedPairs.has(p.partnerClass)}
                      onToggleExpand={toggleExpand}
                      onSelectDetail={setSelectedDetail}
                    />
                  ))
                )}
              </div>

              {/* Phải Trả */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Bạn nợ lớp khác ({data.payables.length})
                </h3>
                {data.payables.length === 0 ? (
                  <p className="text-slate-400 italic text-sm py-4 text-center">Không có khoản nào cần trả.</p>
                ) : (
                  data.payables.map((p) => (
                    <PartnerBalanceCard
                      key={p.partnerClass}
                      partner={p}
                      type="pay"
                      isExpanded={expandedPairs.has(p.partnerClass)}
                      onToggleExpand={toggleExpand}
                      onSelectDetail={setSelectedDetail}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {data.settled.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-bold text-slate-500 text-lg flex items-center gap-2 pb-4">
                <CheckCircle2 className="w-5 h-5" />
                Đã cấn trừ hết (Không nợ nhau) ({data.settled.length})
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {data.settled.map((p) => (
                  <PartnerBalanceCard
                    key={p.partnerClass}
                    partner={p}
                    type="settled"
                    isExpanded={expandedPairs.has(p.partnerClass)}
                    onToggleExpand={toggleExpand}
                    onSelectDetail={setSelectedDetail}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDetail && (
        <SettlementDetailModal
          selectedDetail={selectedDetail}
          onClose={handleCloseDetailModal}
          activeDetailCalc={activeDetailCalc}
          excludedCountForModal={excludedCountForModal}
          showStudentList={showStudentList}
          onToggleStudentList={handleToggleStudentList}
          onOpenStudentListForClass={handleOpenStudentListForClass}
          currentRoomRecords={currentRoomRecords}
          filteredStudentRecords={filteredStudentRecords}
          modalClassCounts={modalClassCounts}
          monitorClasses={monitorClasses}
          effectiveClassCountsForModal={effectiveClassCountsForModal}
          getMonitorName={getMonitorName}
          studentListRef={studentListRef}
          studentClassFilter={studentClassFilter}
          onSelectClassFilter={setStudentClassFilter}
          studentSearchQuery={studentSearchQuery}
          onSearchQueryChange={setStudentSearchQuery}
          isStudentExcluded={isStudentExcluded}
          onToggleStudentExclusion={toggleStudentExclusion}
          onClearSessionExclusions={clearSessionExclusions}
        />
      )}

      <PricingConfigModal
        isOpen={isPricingModalOpen && effectiveIsAdmin}
        onClose={() => setIsPricingModalOpen(false)}
        isAdmin={effectiveIsAdmin}
      />
    </div>
  );
}
