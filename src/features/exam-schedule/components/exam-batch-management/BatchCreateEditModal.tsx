'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ExamBatchItem } from '../../types/exam.types';
import { BatchFormData } from './types';

interface BatchCreateEditModalProps {
  isOpen: boolean;
  editingBatch: ExamBatchItem | null;
  formData: BatchFormData;
  isSubmitting: boolean;
  onFormChange: (next: BatchFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BatchCreateEditModal({
  isOpen,
  editingBatch,
  formData,
  isSubmitting,
  onFormChange,
  onClose,
  onSubmit,
}: BatchCreateEditModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight">
              {editingBatch ? 'Chỉnh Sửa Đợt Thi' : 'Tạo Đợt Thi Mới'}
            </h3>
            <p className="text-indigo-100 text-xs mt-0.5">Cấu hình thông tin niên khóa và đợt thi của trường</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên đợt thi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: ĐHTX HK2 2025-2026, Đợt Thi Chính Thức Kỳ 2"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => onFormChange({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => onFormChange({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả / Ghi chú
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Ghi chú thêm về đợt thi này..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveBatch"
              checked={formData.isActive}
              onChange={(e) => onFormChange({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
            <label htmlFor="isActiveBatch" className="text-xs font-bold text-slate-700 cursor-pointer">
              Đặt làm đợt thi mặc định đang diễn ra
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : editingBatch ? 'Lưu Thay Đổi' : 'Tạo Đợt Thi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
