'use client';

import React from 'react';
import { UploadCloud, FileText, AlertCircle, Download } from 'lucide-react';
import { ImportFlowStudentsModalProps } from './import-flow-students-modal/types';
import { useImportFlowStudentsModal } from './import-flow-students-modal/useImportFlowStudentsModal';
import { ModalHeader } from './import-flow-students-modal/ModalHeader';
import { FileUploadTab } from './import-flow-students-modal/FileUploadTab';
import { TextInputTab } from './import-flow-students-modal/TextInputTab';
import { ImportModeSection } from './import-flow-students-modal/ImportModeSection';
import { PreviewStudentsTable } from './import-flow-students-modal/PreviewStudentsTable';
import { ModalFooter } from './import-flow-students-modal/ModalFooter';

export type { ParsedFlowStudent } from './import-flow-students-modal/types';

export default function ImportFlowStudentsModal({
  isOpen,
  onClose,
  selectedClass,
  monitorUsername,
  monitorFullName,
  existingClassStudents = [],
  onConfirmImport,
  isSubmitting = false,
}: ImportFlowStudentsModalProps) {
  const {
    activeTab,
    setActiveTab,
    importMode,
    setImportMode,
    defaultAllowRegister,
    defaultAllowCancel,
    uploadedFile,
    isDragging,
    fileInputRef,
    rawText,
    parsedStudents,
    parseError,
    selectedExampleIndex,
    textExamples,
    inClassCount,
    linkedCount,
    handleProcessFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearFile,
    handleClearText,
    handleRawTextChange,
    handleRemoveStudent,
    handleToggleStudent,
    handleToggleRegister,
    handleToggleCancel,
    handleDefaultRegisterChange,
    handleDefaultCancelChange,
    handleDownloadSampleCSV,
    handleApplyExample,
    handleSubmit,
  } = useImportFlowStudentsModal({
    isOpen,
    onClose,
    selectedClass,
    monitorUsername,
    existingClassStudents,
    onConfirmImport,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <ModalHeader
          selectedClass={selectedClass}
          monitorUsername={monitorUsername}
          monitorFullName={monitorFullName}
          isSubmitting={isSubmitting}
          onClose={onClose}
        />

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Section 1: Input Mode Tab Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'FILE'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Tải File Lên (CSV / TXT)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TEXT')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'TEXT'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Nhập Văn Bản</span>
              </button>
            </div>

            {/* Download Sample CSV Action */}
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto ml-auto"
              title="Tải file mẫu định dạng .CSV tương thích Excel tiếng Việt"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span>Tải File Mẫu (.CSV)</span>
            </button>
          </div>

          {/* Tab 1: File Upload Box */}
          {activeTab === 'FILE' && (
            <FileUploadTab
              isDragging={isDragging}
              uploadedFile={uploadedFile}
              parsedCount={parsedStudents.length}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onProcessFile={handleProcessFile}
              onClearFile={handleClearFile}
            />
          )}

          {/* Tab 2: Text Input with Ready Presets */}
          {activeTab === 'TEXT' && (
            <TextInputTab
              rawText={rawText}
              selectedExampleIndex={selectedExampleIndex}
              textExamples={textExamples}
              onRawTextChange={handleRawTextChange}
              onClearText={handleClearText}
              onApplyExample={handleApplyExample}
            />
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5 font-bold animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Section 2: Import Mode Selector (Crucial Feature) */}
          <ImportModeSection
            importMode={importMode}
            defaultAllowRegister={defaultAllowRegister}
            defaultAllowCancel={defaultAllowCancel}
            onImportModeChange={setImportMode}
            onDefaultRegisterChange={handleDefaultRegisterChange}
            onDefaultCancelChange={handleDefaultCancelChange}
          />

          {/* Section 3: Live Preview Analysis & Table */}
          {parsedStudents.length > 0 && (
            <PreviewStudentsTable
              parsedStudents={parsedStudents}
              inClassCount={inClassCount}
              linkedCount={linkedCount}
              onToggleStudent={handleToggleStudent}
              onToggleRegister={handleToggleRegister}
              onToggleCancel={handleToggleCancel}
              onRemoveStudent={handleRemoveStudent}
            />
          )}
        </div>

        {/* Modal Footer Actions */}
        <ModalFooter
          parsedCount={parsedStudents.length}
          importMode={importMode}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
