'use client';

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { ExamReviewRegistrationManagerProps } from './exam-review-registration-manager/types';
import { useExamReviewRegistration } from './exam-review-registration-manager/useExamReviewRegistration';
import { ReviewHeaderAndControls } from './exam-review-registration-manager/ReviewHeaderAndControls';
import { ReviewSummaryCards } from './exam-review-registration-manager/ReviewSummaryCards';
import { ReviewStudentTable } from './exam-review-registration-manager/ReviewStudentTable';
import { QuickImportModal } from './exam-review-registration-manager/QuickImportModal';

export default function ExamReviewRegistrationManager(
  props: ExamReviewRegistrationManagerProps
) {
  const {
    selectedBatchCode,
    setSelectedBatchCode,
    selectedClass,
    students,
    isLoading,
    isBulkSaving,
    savingStudentId,
    errorMsg,
    toast,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
    copiedList,
    noteDrafts,
    setNoteDrafts,
    isQuickImportOpen,
    setIsQuickImportOpen,
    quickImportText,
    setQuickImportText,
    quickImportMode,
    setQuickImportMode,
    summary,
    filteredStudents,
    fetchReviewList,
    handleToggleStudent,
    handleSaveNote,
    runBulkUpdate,
    handleQuickImportSubmit,
    handleExportCSV,
    handleCopyRegisteredList,
  } = useExamReviewRegistration(props);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200/50'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-200/50'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <ReviewHeaderAndControls
        examBatches={props.examBatches}
        selectedBatchCode={selectedBatchCode}
        onSelectBatchCode={setSelectedBatchCode}
        students={students}
        summary={summary}
        copiedList={copiedList}
        isLoading={isLoading}
        isBulkSaving={isBulkSaving}
        onCopyRegisteredList={handleCopyRegisteredList}
        onExportCSV={handleExportCSV}
        onRefresh={fetchReviewList}
        onOpenQuickImport={() => setIsQuickImportOpen(true)}
        onBulkUpdate={runBulkUpdate}
      />

      <ReviewSummaryCards summary={summary} />

      <ReviewStudentTable
        selectedClass={selectedClass}
        summary={summary}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        errorMsg={errorMsg}
        isLoading={isLoading}
        isBulkSaving={isBulkSaving}
        savingStudentId={savingStudentId}
        filteredStudents={filteredStudents}
        noteDrafts={noteDrafts}
        onNoteDraftChange={(maSV, value) =>
          setNoteDrafts((prev) => ({ ...prev, [maSV]: value }))
        }
        onToggleStudent={handleToggleStudent}
        onSaveNote={handleSaveNote}
      />

      {isQuickImportOpen && (
        <QuickImportModal
          quickImportText={quickImportText}
          onQuickImportTextChange={setQuickImportText}
          quickImportMode={quickImportMode}
          onQuickImportModeChange={setQuickImportMode}
          isBulkSaving={isBulkSaving}
          onClose={() => setIsQuickImportOpen(false)}
          onSubmit={handleQuickImportSubmit}
        />
      )}
    </div>
  );
}
