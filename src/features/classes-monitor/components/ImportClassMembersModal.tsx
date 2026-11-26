'use client';

import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import ImportClassMembersConfirmView from './ImportClassMembersConfirmView';
import ImportInputStepView from './import-class-members-modal/ImportInputStepView';
import { useImportClassMembers } from './import-class-members-modal/useImportClassMembers';
import type { ImportClassMembersModalProps } from './import-class-members-modal/types';

export default function ImportClassMembersModal({
  isOpen,
  onClose,
  selectedClass,
  existingActiveStudents,
  onImportSuccess,
}: ImportClassMembersModalProps) {
  const {
    step,
    inputTab,
    setInputTab,
    uploadedFile,
    isDragging,
    setIsDragging,
    fileInputRef,
    rawText,
    parsedItems,
    duplicateCount,
    skippedCount,
    parseError,
    previewData,
    isLoadingPreview,
    isExecuting,
    apiError,
    isBusy,
    handleProcessFile,
    handleClearFile,
    handleTextChange,
    handleRemoveItem,
    handleRequestPreview,
    handleConfirmExecute,
    handleBackToInput,
  } = useImportClassMembers({
    isOpen,
    selectedClass,
    onImportSuccess,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-2xl shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {step === 'INPUT'
                    ? 'Import Danh Sách Thành Viên Trong Lớp'
                    : 'Xác Nhận Import Danh Sách Thành Viên'}
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold font-mono">
                  Lớp {selectedClass}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {step === 'INPUT'
                  ? 'Bước 1/2: Tải lên file CSV hoặc dán danh sách từ Excel để kiểm tra thay đổi'
                  : 'Bước 2/2: Xem trước đầy đủ biến động sĩ số trước khi áp dụng'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 2: Confirmation Popup View */}
        {step === 'CONFIRM' && previewData ? (
          <ImportClassMembersConfirmView
            preview={previewData}
            isExecuting={isExecuting}
            error={apiError}
            onBack={handleBackToInput}
            onConfirm={handleConfirmExecute}
          />
        ) : (
          /* Step 1: Upload / Paste Input View */
          <ImportInputStepView
            selectedClass={selectedClass}
            existingActiveStudents={existingActiveStudents}
            inputTab={inputTab}
            onInputTabChange={setInputTab}
            uploadedFile={uploadedFile}
            isDragging={isDragging}
            onDraggingChange={setIsDragging}
            fileInputRef={fileInputRef}
            onProcessFile={handleProcessFile}
            onClearFile={handleClearFile}
            rawText={rawText}
            onTextChange={handleTextChange}
            parsedItems={parsedItems}
            duplicateCount={duplicateCount}
            skippedCount={skippedCount}
            onRemoveItem={handleRemoveItem}
            parseError={parseError}
            apiError={apiError}
            isLoadingPreview={isLoadingPreview}
            onClose={onClose}
            onRequestPreview={handleRequestPreview}
          />
        )}
      </div>
    </div>
  );
}
