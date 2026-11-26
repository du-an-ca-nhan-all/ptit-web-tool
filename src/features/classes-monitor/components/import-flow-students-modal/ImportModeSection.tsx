'use client';

import React from 'react';
import { Layers, Check, PlusCircle, RotateCcw } from 'lucide-react';
import { ImportMode } from './types';

interface ImportModeSectionProps {
  importMode: ImportMode;
  defaultAllowRegister: boolean;
  defaultAllowCancel: boolean;
  onImportModeChange: (mode: ImportMode) => void;
  onDefaultRegisterChange: (checked: boolean) => void;
  onDefaultCancelChange: (checked: boolean) => void;
}

export function ImportModeSection({
  importMode,
  defaultAllowRegister,
  defaultAllowCancel,
  onImportModeChange,
  onDefaultRegisterChange,
  onDefaultCancelChange,
}: ImportModeSectionProps) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-600" />
        <h3 className="font-black text-sm text-slate-800">
          Tùy Chọn Chế Độ Import (Import Mode)
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option A: MERGE */}
        <div
          onClick={() => onImportModeChange('MERGE')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
            importMode === 'MERGE'
              ? 'border-indigo-600 bg-white shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              importMode === 'MERGE' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
            }`}
          >
            {importMode === 'MERGE' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Thêm Mới / Bổ Sung (Add & Merge)
            </span>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Giữ nguyên trạng thái flow của các bạn cũ trong lớp, chỉ kích hoạt và cập nhật thêm cho danh sách sinh viên import này.
            </p>
          </div>
        </div>

        {/* Option B: REPLACE */}
        <div
          onClick={() => onImportModeChange('REPLACE')}
          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
            importMode === 'REPLACE'
              ? 'border-amber-600 bg-amber-50/30 shadow-md shadow-amber-100 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              importMode === 'REPLACE' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
            }`}
          >
            {importMode === 'REPLACE' && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <div>
            <span className="font-black text-xs text-amber-900 block flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Xóa Flow Cũ & Chỉ Theo Danh Sách Mới (Replace All)
            </span>
            <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
              Tắt flow của tất cả các sinh viên cũ trong lớp, <strong>CHỈ BẬT flow</strong> cho danh sách sinh viên có trong file/text này.
            </p>
          </div>
        </div>
      </div>

      {/* Default Permissions Toggle */}
      <div className="pt-3 border-t border-slate-200 flex items-center gap-4 flex-wrap text-xs text-slate-700">
        <span className="font-bold text-slate-500 text-[11px] uppercase">Quyền cấp mặc định:</span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold select-none">
          <input
            type="checkbox"
            checked={defaultAllowRegister}
            onChange={(e) => onDefaultRegisterChange(e.target.checked)}
            className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Flow Đăng Ký Môn</span>
        </label>

        <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold select-none">
          <input
            type="checkbox"
            checked={defaultAllowCancel}
            onChange={(e) => onDefaultCancelChange(e.target.checked)}
            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
          />
          <span>Flow Hủy Môn</span>
        </label>
      </div>
    </div>
  );
}
