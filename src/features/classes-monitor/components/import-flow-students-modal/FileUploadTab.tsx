'use client';

import React from 'react';
import { UploadCloud, CheckCircle2, Trash2 } from 'lucide-react';

interface FileUploadTabProps {
  isDragging: boolean;
  uploadedFile: File | null;
  parsedCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onProcessFile: (file: File) => void;
  onClearFile: () => void;
}

export function FileUploadTab({
  isDragging,
  uploadedFile,
  parsedCount,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onProcessFile,
  onClearFile,
}: FileUploadTabProps) {
  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : uploadedFile
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-slate-50/30'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadedFile ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-slate-800">{uploadedFile.name}</h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {(uploadedFile.size / 1024).toFixed(1)} KB • Đã phân tích được{' '}
              <strong className="text-indigo-700">{parsedCount}</strong> sinh viên
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearFile();
              }}
              className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Chọn file khác
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="font-black text-sm text-slate-800">
              Kéo thả file CSV / TXT vào đây hoặc nhấp để chọn file
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Hỗ trợ file .CSV, .TXT hoặc bảng copy từ Excel. Tự động nhận diện cột Mã SV và phân quyền.
            </p>
            <span className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" /> Chọn File Từ Máy Tính
            </span>
          </>
        )}

        <input
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files && onProcessFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
