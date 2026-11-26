'use client';

import React from 'react';
import { CheckCircle2, Trash2, UploadCloud } from 'lucide-react';

interface ImportFileDropzoneProps {
  uploadedFile: File | null;
  isDragging: boolean;
  parsedCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDraggingChange: (dragging: boolean) => void;
  onProcessFile: (file: File) => void;
  onClearFile: () => void;
}

export default function ImportFileDropzone({
  uploadedFile,
  isDragging,
  parsedCount,
  fileInputRef,
  onDraggingChange,
  onProcessFile,
  onClearFile,
}: ImportFileDropzoneProps) {
  return (
    <div
      className={`border-2 border-dashed rounded-3xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
        isDragging
          ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
          : uploadedFile
          ? 'border-emerald-300 bg-emerald-50/20'
          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-slate-50/30'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDraggingChange(true);
      }}
      onDragLeave={() => onDraggingChange(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDraggingChange(false);
        if (e.dataTransfer.files?.[0]) {
          onProcessFile(e.dataTransfer.files[0]);
        }
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      {uploadedFile ? (
        <>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-black text-sm text-slate-800">{uploadedFile.name}</h3>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {(uploadedFile.size / 1024).toFixed(1)} KB • Đọc được{' '}
            <strong className="text-blue-700">{parsedCount}</strong> sinh viên hợp lệ
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
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="font-black text-sm text-slate-800">
            Kéo thả file CSV / TXT vào đây hoặc nhấp để chọn file
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Tương thích trực tiếp với file xuất từ nút <strong>Xuất CSV</strong> hoặc bảng danh sách có cột Mã SV, Họ tên, Giới tính, Ngày sinh, SĐT.
          </p>
          <span className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4" /> Chọn File Từ Máy Tính
          </span>
        </>
      )}

      <input
        type="file"
        accept=".csv,.txt,.tsv"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onProcessFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
