'use client';

import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';

interface ModalHeaderProps {
  selectedClass: string;
  monitorUsername: string;
  monitorFullName?: string;
  isSubmitting: boolean;
  onClose: () => void;
}

export function ModalHeader({
  selectedClass,
  monitorUsername,
  monitorFullName,
  isSubmitting,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-400 rounded-2xl shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              Import Danh Sách Sinh Viên Flow Theo Lớp Trưởng
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold">
              Lớp {selectedClass}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Lớp trưởng phụ trách:{' '}
            <strong className="text-white font-mono">
              {monitorFullName || monitorUsername}
            </strong>{' '}
            ({monitorUsername})
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        disabled={isSubmitting}
        className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
