import React from 'react';
import { FileUp, RotateCcw, ShieldAlert, UploadCloud } from 'lucide-react';
import { DatabaseStats } from './types';

interface RestoreSectionProps {
  stats: DatabaseStats | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function RestoreSection({
  stats,
  fileInputRef,
  onFileSelect,
}: RestoreSectionProps) {
  return (
    <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-rose-950/30 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Phục Hồi Cơ Sở Dữ Liệu (Database Restore)</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Tự động sao lưu an toàn trước khi phục hồi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Khôi phục toàn bộ {stats?.tableBreakdown?.length ? `${stats.tableBreakdown.length} bảng` : 'các bảng'} dữ liệu hệ thống PostgreSQL từ file sao lưu <b>.sql</b>, <b>.json</b> hoặc file cũ <b>.sqlite / .db</b>
            </p>
          </div>
        </div>
      </div>

      {/* Upload File to Restore Card */}
      <div className="mt-5 bg-slate-950/60 border border-slate-800 rounded-xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-sky-400 rounded-xl">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Tải Lên File Sao Lưu Từ Máy Tính Để Phục Hồi</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chấp nhận file <code className="text-sky-400 font-mono">.sql</code> (PostgreSQL), <code className="text-emerald-400 font-mono">.json</code> hoặc <code className="text-amber-400 font-mono">.sqlite / .db</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept=".sql,.json,.sqlite,.db"
            className="hidden"
            id="upload-backup-restore-input"
          />
          <label
            htmlFor="upload-backup-restore-input"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer shadow-sm active:scale-98"
          >
            <FileUp className="w-4 h-4 text-sky-400" />
            Chọn File Từ Máy Tính
          </label>
        </div>
      </div>
    </div>
  );
}
