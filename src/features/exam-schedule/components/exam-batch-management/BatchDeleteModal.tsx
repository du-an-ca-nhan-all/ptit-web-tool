'use client';

import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { ExamBatchItem } from '../../types/exam.types';

interface BatchDeleteModalProps {
  deletingBatch: ExamBatchItem | null;
  deleteRecordsOption: boolean;
  isSubmitting: boolean;
  onDeleteRecordsOptionChange: (checked: boolean) => void;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function BatchDeleteModal({
  deletingBatch,
  deleteRecordsOption,
  isSubmitting,
  onDeleteRecordsOptionChange,
  onClose,
  onConfirmDelete,
}: BatchDeleteModalProps) {
  if (!deletingBatch) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 flex flex-col gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
          <Trash2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-800">Xác Nhận Xóa Đợt Thi?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Bạn sắp xóa đợt thi <b className="text-slate-800">{deletingBatch.name}</b> ({deletingBatch.code}). Toàn bộ{' '}
            <b>{deletingBatch.totalRecords || 0}</b> bản ghi lịch thi thuộc đợt này sẽ bị xóa khỏi cơ sở dữ liệu.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteRecordsOption}
              onChange={(e) => onDeleteRecordsOptionChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800">
                Xóa kèm toàn bộ {deletingBatch.totalRecords || 0} lượt thi thuộc đợt này
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Nếu không tích chọn, dữ liệu lịch thi vẫn được bảo lưu an toàn trong hệ thống.
              </p>
            </div>
          </label>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-left font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Hành động xóa này không thể hoàn tác.</span>
        </div>

        <div className="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmDelete}
            className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-200 w-full disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xóa...' : 'Xác Nhận Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
