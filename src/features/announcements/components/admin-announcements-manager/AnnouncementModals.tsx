import React from 'react';
import { Megaphone, Trash2, ExternalLink, X } from 'lucide-react';
import { AnnouncementItem } from './types';
import { AnnouncementTypeBadge } from './AnnouncementTypeBadge';

interface AnnouncementModalsProps {
  previewItem: AnnouncementItem | null;
  deletingId: number | null;
  onClosePreview: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: number) => void;
}

export function AnnouncementModals({
  previewItem,
  deletingId,
  onClosePreview,
  onCancelDelete,
  onConfirmDelete,
}: AnnouncementModalsProps) {
  return (
    <>
      {/* STANDALONE PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Xem Trước Thông Báo #{previewItem.id}</h3>
              </div>
              <button
                type="button"
                onClick={onClosePreview}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {previewItem.isPinned && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                    Ghim
                  </span>
                )}
                <AnnouncementTypeBadge type={previewItem.type} />
                <h4 className="text-sm font-bold text-slate-900">{previewItem.title}</h4>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {previewItem.content}
              </div>
              {previewItem.linkUrl && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={previewItem.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{previewItem.linkText || 'Xem Chi Tiết'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 flex flex-col gap-4 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Xác Nhận Xóa Thông Báo</h3>
                <p className="text-xs text-slate-500">Thao tác này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thông báo ID <strong>#{deletingId}</strong> không? Sau khi xóa, thông báo sẽ ngừng hiển thị ngay lập tức.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onCancelDelete}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => onConfirmDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
