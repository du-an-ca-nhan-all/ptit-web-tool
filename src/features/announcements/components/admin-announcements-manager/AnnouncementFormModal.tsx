import React from 'react';
import { Megaphone, RefreshCw, Check, X } from 'lucide-react';
import { AnnouncementFormData, AnnouncementItem, PreviewTab } from './types';
import { AnnouncementFormFields } from './AnnouncementFormFields';
import { AnnouncementLivePreview } from './AnnouncementLivePreview';

interface AnnouncementFormModalProps {
  editingItem: AnnouncementItem | null;
  formData: AnnouncementFormData;
  previewTab: PreviewTab;
  isSaving: boolean;
  onChangeFormData: (next: AnnouncementFormData) => void;
  onChangePreviewTab: (tab: PreviewTab) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AnnouncementFormModal({
  editingItem,
  formData,
  previewTab,
  isSaving,
  onChangeFormData,
  onChangePreviewTab,
  onSave,
  onClose,
}: AnnouncementFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-sky-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {editingItem ? 'Chỉnh Sửa Thông Báo' : 'Tạo Thông Báo Mới'}
              </h3>
              <p className="text-xs text-slate-300">
                Soạn thảo thông báo và xem trước giao diện trực tiếp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: 2-Column Grid (Form on Left, Live Preview on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AnnouncementFormFields
            formData={formData}
            onChangeFormData={onChangeFormData}
            onChangePreviewTab={onChangePreviewTab}
            onSubmit={onSave}
          />
          <AnnouncementLivePreview
            formData={formData}
            previewTab={previewTab}
            onChangePreviewTab={onChangePreviewTab}
          />
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{editingItem ? 'Lưu Thay Đổi' : 'Đăng Thông Báo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
