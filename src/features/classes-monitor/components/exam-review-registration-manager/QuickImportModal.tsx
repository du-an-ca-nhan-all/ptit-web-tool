'use client';

import React from 'react';
import { ClipboardList, X } from 'lucide-react';
import { QuickImportMode } from './types';

interface QuickImportModalProps {
  quickImportText: string;
  onQuickImportTextChange: (text: string) => void;
  quickImportMode: QuickImportMode;
  onQuickImportModeChange: (mode: QuickImportMode) => void;
  isBulkSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function QuickImportModal({
  quickImportText,
  onQuickImportTextChange,
  quickImportMode,
  onQuickImportModeChange,
  isBulkSaving,
  onClose,
  onSubmit,
}: QuickImportModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Nhập Nhanh DS Mã Sinh Viên
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">
              Dán danh sách Mã SV từ Zalo / Excel để đánh dấu đăng ký ôn tập hàng loạt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Danh sách Mã SV (mỗi dòng hoặc cách nhau bằng dấu phẩy / khoảng trắng)
            </label>
            <textarea
              rows={6}
              value={quickImportText}
              onChange={(e) => onQuickImportTextChange(e.target.value)}
              placeholder={'Ví dụ:\nB22DCCN001\nB22DCCN002\nB22DCCN003'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                quickImportMode === 'MERGE'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="quickImportMode"
                  checked={quickImportMode === 'MERGE'}
                  onChange={() => onQuickImportModeChange('MERGE')}
                />
                <span className="text-xs font-bold">Bổ sung thêm</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                Giữ nguyên người đã chọn và đánh dấu thêm
              </p>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                quickImportMode === 'REPLACE'
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="quickImportMode"
                  checked={quickImportMode === 'REPLACE'}
                  onChange={() => onQuickImportModeChange('REPLACE')}
                />
                <span className="text-xs font-bold">Ghi đè danh sách</span>
              </div>
              <p className="text-[11px] text-slate-500 pl-5 mt-0.5">
                Chỉ chọn đúng các mã SV vừa dán vào
              </p>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isBulkSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isBulkSaving ? 'Đang lưu...' : 'Áp Dụng Danh Sách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
