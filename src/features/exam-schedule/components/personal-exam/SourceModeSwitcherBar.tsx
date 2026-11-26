import React from 'react';
import { CalendarDays, FileSpreadsheet, Globe } from 'lucide-react';
import type { ViewSourceMode } from '../../types/studentPersonalExam.types';

interface SourceModeSwitcherBarProps {
  viewSourceMode: ViewSourceMode;
  onChangeMode: (mode: ViewSourceMode) => void;
  qldtTotalExams?: number;
  totalFileRecords: number;
}

export default function SourceModeSwitcherBar({
  viewSourceMode,
  onChangeMode,
  qldtTotalExams,
  totalFileRecords,
}: SourceModeSwitcherBarProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-2.5">
        <div className="p-2 sm:p-2.5 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-sm shrink-0">
          <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-black text-slate-800">Lịch Thi Cá Nhân</h2>
          <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
            Tra cứu lịch thi trực tuyến từ Cổng QLDTTX hoặc File Tổng Hợp
          </p>
        </div>
      </div>

      <div className="bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-1.5 border border-slate-200">
        <button
          onClick={() => onChangeMode('QLDTTX')}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewSourceMode === 'QLDTTX'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Cổng QLDTTX</span>
          {qldtTotalExams !== undefined && qldtTotalExams > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                viewSourceMode === 'QLDTTX'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {qldtTotalExams}
            </span>
          )}
        </button>

        <button
          onClick={() => onChangeMode('FILE_TONG')}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            viewSourceMode === 'FILE_TONG'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>File Tổng Hợp</span>
          {totalFileRecords > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                viewSourceMode === 'FILE_TONG'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {totalFileRecords}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
