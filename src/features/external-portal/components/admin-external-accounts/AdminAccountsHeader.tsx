import React from 'react';
import { Globe, RefreshCw, Zap, Download, Plus } from 'lucide-react';

interface AdminAccountsHeaderProps {
  isLoading: boolean;
  isBatchTesting: boolean;
  accountsCount: number;
  onRefresh: () => void;
  onBatchGetTokens: () => void;
  onExportCSV: () => void;
  onOpenAddModal: () => void;
}

export function AdminAccountsHeader({
  isLoading,
  isBatchTesting,
  accountsCount,
  onRefresh,
  onBatchGetTokens,
  onExportCSV,
  onOpenAddModal,
}: AdminAccountsHeaderProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
      <div>
        <div className="flex items-center gap-3 mb-1.5 sm:mb-2 flex-wrap">
          <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl border border-indigo-100 shrink-0">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                Quản Lý Tài Khoản Cổng Đào Tạo & LMS
              </h1>
              <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Admin
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 leading-snug">
              Cổng liên kết: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> •{' '}
              <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong> •{' '}
              <strong className="text-purple-600 font-mono">slink.ptit.edu.vn</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Header Action Buttons (Responsive 2-col on mobile, flex on desktop) */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>

        <button
          type="button"
          onClick={onBatchGetTokens}
          disabled={isBatchTesting || accountsCount === 0}
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Lấy và xác thực Session/Token cho toàn bộ tài khoản"
        >
          {isBatchTesting ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Lấy Session/Token</span>
          <span className="sm:hidden">Lấy Token</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          disabled={accountsCount === 0}
          className="px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="col-span-2 sm:col-span-1 px-3.5 py-2.5 sm:px-4 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Tài Khoản Cho SV</span>
        </button>
      </div>
    </div>
  );
}
