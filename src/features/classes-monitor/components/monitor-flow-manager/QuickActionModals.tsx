'use client';

import React from 'react';
import { BookOpen, Trash2, X, Zap } from 'lucide-react';
import { ExecuteFlowFn } from './types';

interface QuickActionModalsProps {
  monitorDisplayName: string;
  activeFollowersCount: number;
  isExecuting: boolean;
  showQuickRegisterModal: boolean;
  quickTargetIdToHoc: string;
  quickTargetGroupName: string;
  onQuickTargetIdChange: (value: string) => void;
  onQuickTargetGroupNameChange: (value: string) => void;
  onCloseQuickRegister: () => void;
  showQuickCancelModal: boolean;
  cancelTargetIdToHoc: string;
  onCancelTargetIdChange: (value: string) => void;
  onCloseQuickCancel: () => void;
  showSyncAllModal: boolean;
  onCloseSyncAll: () => void;
  onExecuteFlow: ExecuteFlowFn;
}

export function QuickActionModals({
  monitorDisplayName,
  activeFollowersCount,
  isExecuting,
  showQuickRegisterModal,
  quickTargetIdToHoc,
  quickTargetGroupName,
  onQuickTargetIdChange,
  onQuickTargetGroupNameChange,
  onCloseQuickRegister,
  showQuickCancelModal,
  cancelTargetIdToHoc,
  onCancelTargetIdChange,
  onCloseQuickCancel,
  showSyncAllModal,
  onCloseSyncAll,
  onExecuteFlow,
}: QuickActionModalsProps) {
  return (
    <>
      {/* MODAL 1: QUICK FLOW REGISTER SPECIFIC COURSE */}
      {showQuickRegisterModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseQuickRegister();
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="text-sm sm:text-base font-black">Flow Đăng Ký Môn Cho Cả Lớp</h3>
              </div>
              <button
                onClick={onCloseQuickRegister}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần ĐK (id_to_hoc):</label>
                <input
                  type="text"
                  value={quickTargetIdToHoc}
                  onChange={(e) => onQuickTargetIdChange(e.target.value.trim())}
                  placeholder="Ví dụ: 123456..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Môn / Nhóm Tổ (Tùy chọn):</label>
                <input
                  type="text"
                  value={quickTargetGroupName}
                  onChange={(e) => onQuickTargetGroupNameChange(e.target.value)}
                  placeholder="Ví dụ: Nhóm 01 - Tiếng Anh B1..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                🚀 Hệ thống sẽ gọi API đăng ký tổ học này cho <strong>{activeFollowersCount} thành viên</strong> có bật quyền "Flow Đăng Ký".
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseQuickRegister}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!quickTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = quickTargetIdToHoc;
                    const name = quickTargetGroupName;
                    onCloseQuickRegister();
                    await onExecuteFlow({
                      flowAction: 'REGISTER',
                      id_to_hoc: id,
                      nhom_to: name,
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắn Lệnh Đăng Ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK FLOW CANCEL SPECIFIC COURSE */}
      {showQuickCancelModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseQuickCancel();
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-black">Flow Hủy Môn Cho Cả Lớp</h3>
              </div>
              <button
                onClick={onCloseQuickCancel}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần Hủy (id_to_hoc):</label>
                <input
                  type="text"
                  value={cancelTargetIdToHoc}
                  onChange={(e) => onCancelTargetIdChange(e.target.value.trim())}
                  placeholder="Nhập ID tổ học cần hủy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Thao tác này sẽ hủy môn học cho tất cả thành viên đang bật Flow. Slot học sẽ được giải phóng ngay.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseQuickCancel}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!cancelTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = cancelTargetIdToHoc;
                    onCloseQuickCancel();
                    await onExecuteFlow({
                      flowAction: 'CANCEL',
                      id_to_hoc: id,
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Xác Nhận Hủy Môn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SYNC ALL COURSES OF MONITOR */}
      {showSyncAllModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseSyncAll();
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-black">Đồng Bộ 2 Chiều Tất Cả Môn</h3>
              </div>
              <button
                onClick={onCloseSyncAll}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                Hệ thống sẽ đối chiếu danh sách môn của <strong>Lớp trưởng ({monitorDisplayName})</strong> với <strong>{activeFollowersCount} thành viên</strong>:
              </p>

              <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                <li><strong>Đăng ký</strong> các môn Lớp trưởng có mà thành viên còn thiếu.</li>
                <li><strong>Hủy</strong> các môn thừa mà thành viên có nhưng Lớp trưởng không học (hoặc đã hủy).</li>
              </ul>

              <div className="p-3 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                ✨ Giúp toàn bộ các thành viên trong lớp học cùng 1 thời khóa biểu, cùng ca học và cùng phòng thi chuẩn 100%!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseSyncAll}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={async () => {
                    onCloseSyncAll();
                    await onExecuteFlow({
                      flowAction: 'SYNC_ALL_COURSES',
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắt Đầu Đồng Bộ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
