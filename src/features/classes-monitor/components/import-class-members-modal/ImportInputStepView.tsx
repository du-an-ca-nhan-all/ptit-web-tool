'use client';

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileText,
  Info,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  downloadClassMembersSampleCsv,
  type ImportClassMemberRow,
} from '../../utils/classMemberImportParser';
import ImportFileDropzone from './ImportFileDropzone';
import ParsedMembersPreviewTable from './ParsedMembersPreviewTable';
import type { ExistingActiveStudent, InputTab } from './types';

interface ImportInputStepViewProps {
  selectedClass: string;
  existingActiveStudents: ExistingActiveStudent[];
  inputTab: InputTab;
  onInputTabChange: (tab: InputTab) => void;
  uploadedFile: File | null;
  isDragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onProcessFile: (file: File) => void;
  onClearFile: () => void;
  rawText: string;
  onTextChange: (value: string) => void;
  parsedItems: ImportClassMemberRow[];
  duplicateCount: number;
  skippedCount: number;
  onRemoveItem: (maSV: string) => void;
  parseError: string | null;
  apiError: string | null;
  isLoadingPreview: boolean;
  onClose: () => void;
  onRequestPreview: () => void;
}

export default function ImportInputStepView({
  selectedClass,
  existingActiveStudents,
  inputTab,
  onInputTabChange,
  uploadedFile,
  isDragging,
  onDraggingChange,
  fileInputRef,
  onProcessFile,
  onClearFile,
  rawText,
  onTextChange,
  parsedItems,
  duplicateCount,
  skippedCount,
  onRemoveItem,
  parseError,
  apiError,
  isLoadingPreview,
  onClose,
  onRequestPreview,
}: ImportInputStepViewProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
        {/* Rules Notice */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold">Quy tắc đồng bộ danh sách lớp {selectedClass}:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-900/90">
              <li>
                Sinh viên đang học trong lớp nhưng <strong>không có trong danh sách import</strong> sẽ mặc định được chuyển sang{' '}
                <strong className="text-rose-700">Thôi học</strong>.
              </li>
              <li>
                Sinh viên đang thuộc <strong>lớp khác</strong> có trong danh sách import sẽ tự động được{' '}
                <strong className="text-amber-700">chuyển sang lớp {selectedClass}</strong>.
              </li>
              <li>
                Bạn sẽ xem đầy đủ chi tiết từng sinh viên bị ảnh hưởng ở bước xác nhận trước khi thực hiện.
              </li>
            </ul>
          </div>
        </div>

        {/* Input Mode Switcher + Sample CSV */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onInputTabChange('FILE')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                inputTab === 'FILE'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải File (CSV / TXT)</span>
            </button>

            <button
              type="button"
              onClick={() => onInputTabChange('TEXT')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                inputTab === 'TEXT'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Dán Từ Excel / Văn Bản</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => downloadClassMembersSampleCsv(selectedClass, existingActiveStudents)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tải File Mẫu (.CSV)</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {inputTab === 'FILE' && (
          <ImportFileDropzone
            uploadedFile={uploadedFile}
            isDragging={isDragging}
            parsedCount={parsedItems.length}
            fileInputRef={fileInputRef}
            onDraggingChange={onDraggingChange}
            onProcessFile={onProcessFile}
            onClearFile={onClearFile}
          />
        )}

        {/* Tab 2: Text Paste */}
        {inputTab === 'TEXT' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">
                Dán danh sách Mã SV hoặc copy các cột từ Excel (Mã SV, Họ tên, Giới tính, Ngày sinh, SĐT...):
              </span>
              {rawText && (
                <button
                  type="button"
                  onClick={() => onTextChange('')}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa nội dung
                </button>
              )}
            </div>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Ví dụ (mỗi dòng 1 sinh viên hoặc copy từ Excel):\nB21DCCN001\tNguyễn Văn An\tNam\t01/01/2003\nB21DCCN002\tTrần Thị Bình\tNữ\t15/05/2003\nhoặc chỉ danh sách Mã SV:\nB21DCCN001\nB21DCCN002`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
            />
          </div>
        )}

        {/* Parse / API Errors */}
        {(parseError || apiError) && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{apiError || parseError}</span>
          </div>
        )}

        {/* Parsed Preview List */}
        <ParsedMembersPreviewTable
          parsedItems={parsedItems}
          duplicateCount={duplicateCount}
          skippedCount={skippedCount}
          onRemoveItem={onRemoveItem}
        />
      </div>

      {/* Step 1 Footer */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoadingPreview}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          type="button"
          onClick={onRequestPreview}
          disabled={parsedItems.length === 0 || isLoadingPreview}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoadingPreview ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang Kiểm Tra Dữ Liệu...
            </>
          ) : (
            <>
              <span>Kiểm Tra & Xác Nhận ({parsedItems.length} SV)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
