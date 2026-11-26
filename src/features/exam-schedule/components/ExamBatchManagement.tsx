'use client';

import React from 'react';
import { Layers, AlertCircle, Check, Search } from 'lucide-react';
import { ExamBatchManagementProps } from './exam-batch-management/types';
import { useExamBatchManagement } from './exam-batch-management/useExamBatchManagement';
import { BatchHeaderAndStats } from './exam-batch-management/BatchHeaderAndStats';
import { BatchCard } from './exam-batch-management/BatchCard';
import { BatchCreateEditModal } from './exam-batch-management/BatchCreateEditModal';
import { BatchImportModal } from './exam-batch-management/BatchImportModal';
import { BatchDeleteModal } from './exam-batch-management/BatchDeleteModal';

export default function ExamBatchManagement({
  currentUser: _currentUser,
  initialBatches,
  initialActiveBatch: _initialActiveBatch,
  onBatchChanged,
}: ExamBatchManagementProps) {
  const {
    batches,
    isLoading,
    toast,
    searchQuery,
    setSearchQuery,
    filteredBatches,
    activeBatch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingBatch,
    formData,
    setFormData,
    isSubmitting,
    importingBatch,
    setImportingBatch,
    selectedFile,
    setSelectedFile,
    importMode,
    setImportMode,
    isImporting,
    importProgressText,
    deletingBatch,
    setDeletingBatch,
    deleteRecordsOption,
    setDeleteRecordsOption,
    fetchBatches,
    handleSetActive,
    handleToggleBatch,
    handleSaveBatch,
    handleDeleteBatch,
    handleDownloadSampleCSV,
    handleImportCSV,
    openCreateModal,
    openEditModal,
    openImportModal,
    openDeleteModal,
  } = useExamBatchManagement({ initialBatches, onBatchChanged });

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
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      <BatchHeaderAndStats
        batchesCount={batches.length}
        activeBatch={activeBatch}
        isLoading={isLoading}
        onDownloadSampleCsv={() => handleDownloadSampleCSV(activeBatch)}
        onRefresh={fetchBatches}
        onCreateClick={openCreateModal}
      />

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên đợt thi, mã đợt, năm học..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <b>{filteredBatches.length}</b> / {batches.length} đợt thi
          </span>
        </div>

        {/* Batches Grid / Cards */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải danh sách đợt thi từ Database...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy đợt thi nào</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Hãy bấm "Tạo Đợt Thi Mới" để thiết lập đợt thi đầu tiên và tải lên danh sách lịch thi từ tệp CSV.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.code}
                  batch={batch}
                  onToggleBatch={handleToggleBatch}
                  onSetActive={handleSetActive}
                  onImportClick={openImportModal}
                  onEditClick={openEditModal}
                  onDeleteClick={openDeleteModal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT BATCH */}
      <BatchCreateEditModal
        isOpen={isCreateModalOpen}
        editingBatch={editingBatch}
        formData={formData}
        isSubmitting={isSubmitting}
        onFormChange={setFormData}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSaveBatch}
      />

      {/* MODAL 2: IMPORT CSV SPECIFIC TO BATCH */}
      <BatchImportModal
        importingBatch={importingBatch}
        selectedFile={selectedFile}
        importMode={importMode}
        isImporting={isImporting}
        importProgressText={importProgressText}
        onSelectFile={setSelectedFile}
        onImportModeChange={setImportMode}
        onDownloadSampleCsv={handleDownloadSampleCSV}
        onClose={() => setImportingBatch(null)}
        onSubmit={handleImportCSV}
      />

      {/* MODAL 3: DELETE BATCH CONFIRMATION */}
      <BatchDeleteModal
        deletingBatch={deletingBatch}
        deleteRecordsOption={deleteRecordsOption}
        isSubmitting={isSubmitting}
        onDeleteRecordsOptionChange={setDeleteRecordsOption}
        onClose={() => setDeletingBatch(null)}
        onConfirmDelete={handleDeleteBatch}
      />
    </div>
  );
}
