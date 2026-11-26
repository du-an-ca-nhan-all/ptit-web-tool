'use client';

import React from 'react';
import { XCircle } from 'lucide-react';
import { RegistrationItem } from './types';

interface RejectRegistrationModalProps {
  rejectingItem: RegistrationItem | null;
  rejectReason: string;
  isProcessing: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function RejectRegistrationModal({
  rejectingItem,
  rejectReason,
  isProcessing,
  onReasonChange,
  onClose,
  onConfirm,
}: RejectRegistrationModalProps) {
  if (!rejectingItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <h4 className="font-bold text-sm">Từ Chối Yêu Cầu Đăng Ký</h4>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div>
              Sinh viên: <b>{rejectingItem.fullName || rejectingItem.username}</b>
            </div>
            <div className="font-mono text-blue-600 mt-0.5">MSSV: {rejectingItem.username}</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lý do từ chối (tùy chọn):
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ví dụ: Sai thông tin MSSV, không thuộc danh sách lớp..."
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
