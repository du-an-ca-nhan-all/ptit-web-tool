import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { DeleteLogsMode } from './types';
import { DeleteActivityLogsModePanel } from './DeleteActivityLogsModePanel';

interface DeleteActivityLogsModalProps {
  totalLogs: number;
  deleteMode: DeleteLogsMode;
  onChangeDeleteMode: (mode: DeleteLogsMode) => void;
  deleteCount: number;
  onChangeDeleteCount: (count: number) => void;
  customCountInput: string;
  onChangeCustomCountInput: (val: string) => void;
  deleteDays: number;
  onChangeDeleteDays: (days: number) => void;
  cleanReminderLogs: boolean;
  onChangeCleanReminderLogs: (checked: boolean) => void;
  isDeleting: boolean;
  deleteSuccessMsg: string;
  deleteErrorMsg: string;
  onClearErrorMsg: () => void;
  confirmAllText: string;
  onChangeConfirmAllText: (text: string) => void;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function DeleteActivityLogsModal({
  totalLogs,
  deleteMode,
  onChangeDeleteMode,
  deleteCount,
  onChangeDeleteCount,
  customCountInput,
  onChangeCustomCountInput,
  deleteDays,
  onChangeDeleteDays,
  cleanReminderLogs,
  onChangeCleanReminderLogs,
  isDeleting,
  deleteSuccessMsg,
  deleteErrorMsg,
  onClearErrorMsg,
  confirmAllText,
  onChangeConfirmAllText,
  onClose,
  onConfirmDelete,
}: DeleteActivityLogsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/30 text-rose-300 rounded-xl border border-rose-400/30 shrink-0">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">Dọn Dẹp & Xoá Nhật Ký Hoạt Động</h4>
              <p className="text-[10px] sm:text-[11px] text-rose-200/80">
                Giải phóng dung lượng cơ sở dữ liệu và tối ưu hiệu năng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !isDeleting && onClose()}
            disabled={isDeleting}
            className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto">
          {/* Alert Feedback */}
          {deleteSuccessMsg && (
            <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span>{deleteSuccessMsg}</span>
            </div>
          )}

          {deleteErrorMsg && (
            <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
              <span>{deleteErrorMsg}</span>
            </div>
          )}

          {/* Mode Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Chọn Phương Thức Dọn Dẹp:
            </label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { id: 'COUNT', label: 'Xoá N Bản Ghi', desc: 'Cũ nhất' },
                { id: 'DAYS', label: 'Theo Ngày', desc: 'Cũ hơn X ngày' },
                { id: 'ALL', label: 'Xoá Tất Cả', desc: 'Toàn bộ log' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onChangeDeleteMode(tab.id as DeleteLogsMode);
                    onClearErrorMsg();
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                    deleteMode === tab.id
                      ? tab.id === 'ALL'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-2xs'
                        : 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  <span className="text-[11px] sm:text-xs">{tab.label}</span>
                  <span className="text-[9px] sm:text-[10px] opacity-75">{tab.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <DeleteActivityLogsModePanel
            deleteMode={deleteMode}
            totalLogs={totalLogs}
            deleteCount={deleteCount}
            onChangeDeleteCount={onChangeDeleteCount}
            customCountInput={customCountInput}
            onChangeCustomCountInput={onChangeCustomCountInput}
            deleteDays={deleteDays}
            onChangeDeleteDays={onChangeDeleteDays}
            confirmAllText={confirmAllText}
            onChangeConfirmAllText={onChangeConfirmAllText}
          />

          {/* OPTIONAL: CLEAN TELEGRAM REMINDER LOGS */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={cleanReminderLogs}
              onChange={(e) => onChangeCleanReminderLogs(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded mt-0.5 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-amber-900">
                Dọn dẹp cả nhật ký thông báo Telegram (Khuyên dùng)
              </span>
              <p className="text-[10px] sm:text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                Bao gồm các bản ghi theo dõi nhắc lịch thi, nhắc lịch học và thông báo QLDTTX để giải phóng tối đa dung lượng DB.
              </p>
            </div>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={
              isDeleting ||
              (deleteMode === 'ALL' &&
                confirmAllText.trim().toUpperCase() !== 'XÓA TẤT CẢ' &&
                confirmAllText.trim().toUpperCase() !== 'XOA TAT CA')
            }
            className={`px-4 sm:px-6 py-2 sm:py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 ${
              deleteMode === 'ALL'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20'
            }`}
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang dọn...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span className="truncate">
                  {deleteMode === 'ALL'
                    ? 'Xác Nhận Xoá Tất Cả'
                    : deleteMode === 'COUNT'
                    ? `Xoá ${customCountInput ? parseInt(customCountInput, 10) || 0 : deleteCount} Log Cũ`
                    : `Xoá Log Cũ Hơn ${deleteDays} Ngày`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
