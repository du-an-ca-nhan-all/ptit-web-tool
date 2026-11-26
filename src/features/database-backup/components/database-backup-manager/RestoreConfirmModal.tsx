import React from 'react';
import {
  AlertTriangle,
  Database,
  FileCode,
  HardDrive,
  RefreshCw,
  RotateCcw,
  Shield,
  X,
} from 'lucide-react';
import { RestoreSourceType } from './types';

interface RestoreConfirmModalProps {
  restoreTargetFile: string;
  restoreSourceType: RestoreSourceType;
  confirmRestoreChecked: boolean;
  isRestoring: boolean;
  onConfirmCheckedChange: (checked: boolean) => void;
  onClose: () => void;
  onExecuteRestore: () => void;
}

export function RestoreConfirmModal({
  restoreTargetFile,
  restoreSourceType,
  confirmRestoreChecked,
  isRestoring,
  onConfirmCheckedChange,
  onClose,
  onExecuteRestore,
}: RestoreConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Xác Nhận Phục Hồi Cơ Sở Dữ Liệu</h3>
              <span className="text-xs text-amber-400 font-medium">Thao tác này sẽ thay thế dữ liệu hiện tại trong PostgreSQL</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300 mb-6">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-500 mb-1">Nguồn phục hồi:</div>
            <div className="font-mono font-bold text-white flex items-center gap-2">
              {restoreTargetFile.endsWith('.sql') ? (
                <Database className="w-4 h-4 text-sky-400" />
              ) : restoreTargetFile.endsWith('.json') ? (
                <FileCode className="w-4 h-4 text-emerald-400" />
              ) : (
                <HardDrive className="w-4 h-4 text-amber-400" />
              )}
              <span className="truncate">{restoreTargetFile}</span>
              {restoreSourceType === 'upload' && (
                <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] rounded">File Tải Lên</span>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200/90 leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
              <Shield className="w-4 h-4" /> Bảo Vệ Dữ Liệu Tự Động:
            </p>
            Hệ thống sẽ <b>tự động tạo 1 bản sao lưu an toàn (Pre-Restore Snapshot)</b> của cơ sở dữ liệu hiện tại ngay trước khi phục hồi. Bạn có thể khôi phục lại bất kỳ lúc nào nếu cần.
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-slate-950/60 border border-slate-800 rounded-xl hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={confirmRestoreChecked}
              onChange={(e) => onConfirmCheckedChange(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer shrink-0"
            />
            <span className="text-xs text-slate-200">
              Tôi đã hiểu và xác nhận muốn phục hồi cơ sở dữ liệu từ bản sao lưu này.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Huỷ bỏ
          </button>

          <button
            type="button"
            onClick={onExecuteRestore}
            disabled={!confirmRestoreChecked || isRestoring}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang phục hồi dữ liệu...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Bắt Đầu Phục Hồi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
