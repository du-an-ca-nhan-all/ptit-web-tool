import React from 'react';
import { Edit3, X } from 'lucide-react';
import { StudentContactFormData } from './types';

interface EditStudentContactModalProps {
  editingStudent: any | null;
  formData: StudentContactFormData;
  onFormDataChange: (data: StudentContactFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditStudentContactModal({
  editingStudent,
  formData,
  onFormDataChange,
  onClose,
  onSubmit,
}: EditStudentContactModalProps) {
  if (!editingStudent) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            Chỉnh Sửa Thông Tin
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Sinh viên:</span>
              <span className="font-bold text-slate-800 text-sm">
                {editingStudent.HoLotSV} {editingStudent.TenSV}
              </span>
            </div>
            <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
              {editingStudent.MaSV}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Số điện thoại liên hệ
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 0912345678"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              value={formData.phone}
              onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ghi chú</label>
            <textarea
              rows={3}
              placeholder="Ghi chú về sinh viên..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              value={formData.note}
              onChange={(e) => onFormDataChange({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 cursor-pointer"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
