'use client';

import React from 'react';
import { Upload, Download, FileSpreadsheet, X } from 'lucide-react';
import { ExamBatchItem } from '../../types/exam.types';
import { ImportMode } from './types';

interface BatchImportModalProps {
  importingBatch: ExamBatchItem | null;
  selectedFile: File | null;
  importMode: ImportMode;
  isImporting: boolean;
  importProgressText: string;
  onSelectFile: (file: File) => void;
  onImportModeChange: (mode: ImportMode) => void;
  onDownloadSampleCsv: (batch: ExamBatchItem) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BatchImportModal({
  importingBatch,
  selectedFile,
  importMode,
  isImporting,
  importProgressText,
  onSelectFile,
  onImportModeChange,
  onDownloadSampleCsv,
  onClose,
  onSubmit,
}: BatchImportModalProps) {
  if (!importingBatch) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Upload className="w-5 h-5" /> Import Dữ Liệu CSV
            </h3>
            <p className="text-blue-100 text-xs mt-0.5">
              Nạp lịch thi cho đợt: <b className="text-white">{importingBatch.name}</b> ({importingBatch.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Import Form */}
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {/* File Selector */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn tệp CSV dữ liệu thi <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => onDownloadSampleCsv(importingBatch)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                title="Tải tệp CSV mẫu có sẵn dữ liệu ví dụ cho đợt thi này"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Tải file CSV mẫu
              </button>
            </div>
            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <FileSpreadsheet className="w-10 h-10 text-indigo-500 mb-2" />
              <span className="text-sm font-bold text-slate-700">
                {selectedFile ? selectedFile.name : 'Nhấp hoặc kéo thả tệp CSV vào đây'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Định dạng chuẩn PTIT với các cột MaSV, MAPTHI, MaMH, TenMH, NgayThi...'}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onSelectFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Import Mode Radio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chế độ nạp dữ liệu
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                  importMode === 'replace'
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => onImportModeChange('replace')}
                    className="text-blue-600"
                  />
                  <span className="text-xs font-black">Ghi Đè (Replace)</span>
                </div>
                <span className="text-[11px] text-slate-500 pl-5">
                  Xóa toàn bộ lịch thi cũ của đợt này trước khi nạp
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                  importMode === 'append'
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 ring-2 ring-blue-400/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => onImportModeChange('append')}
                    className="text-blue-600"
                  />
                  <span className="text-xs font-black">Bổ Sung (Append)</span>
                </div>
                <span className="text-[11px] text-slate-500 pl-5">
                  Giữ nguyên dữ liệu hiện có và thêm các bản ghi mới
                </span>
              </label>
            </div>
          </div>

          {/* Progress Text */}
          {isImporting && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs font-bold text-indigo-800 animate-pulse">
              <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin shrink-0" />
              <span>{importProgressText || 'Đang xử lý dữ liệu...'}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isImporting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isImporting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-200 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Đang Import...' : 'Bắt Đầu Import CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
