import React from 'react';
import { History, RefreshCw, Trash2 } from 'lucide-react';
import { ActivityLogsPagination } from './types';

interface ActivityLogsHeaderProps {
  pagination: ActivityLogsPagination;
  isAdmin: boolean;
  isLoading: boolean;
  onOpenDeleteModal: () => void;
  onRefresh: () => void;
}

export function ActivityLogsHeader({
  pagination,
  isAdmin,
  isLoading,
  onOpenDeleteModal,
  onRefresh,
}: ActivityLogsHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
          <History className="w-5 h-5 sm:w-7 sm:h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              Nhật Ký Hoạt Động Hệ Thống
            </h2>
            <span className="px-2 py-0.5 sm:px-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] sm:text-xs font-bold rounded-full">
              Audit Logs
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 leading-snug">
            Lưu vết toàn bộ thao tác: đăng nhập, đổi vai trò, giả lập, đồng bộ và chỉnh sửa dữ liệu
          </p>
        </div>
      </div>

      {/* Action Buttons / Total Count (2-col on mobile, flex on desktop) */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 relative z-10 shrink-0 w-full md:w-auto">
        <div className="bg-white/5 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-white/10 text-center flex flex-col justify-center">
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Bản Ghi</div>
          <div className="text-base sm:text-lg font-black text-white">{pagination.total.toLocaleString('vi-VN')}</div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500/40"
            title="Dọn dẹp và xoá bớt nhật ký hoạt động"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Dọn Dẹp Log</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
          title="Làm mới danh sách nhật ký"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>
    </div>
  );
}
