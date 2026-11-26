import React from 'react';
import { Crown, Search, RefreshCw } from 'lucide-react';
import { MonitorsListProps } from './monitors-list/types';
import { useMonitorsList } from './monitors-list/useMonitorsList';
import { MonitorCard } from './monitors-list/MonitorCard';
import { MonitorsPagination } from './monitors-list/MonitorsPagination';

export default function MonitorsList({
  users,
  onClassClick,
  currentUser,
  onReload,
  isLoading = false,
}: MonitorsListProps) {
  const {
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    pageSize,
    setPageSize,
    monitors,
    filteredMonitors,
    totalItems,
    totalPages,
    validPage,
    startIndex,
    endIndex,
    pagedMonitors,
    pageNumbers,
  } = useMonitorsList(users, currentUser);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
            <Crown className="w-7 h-7 fill-amber-400/30" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Danh Sách Lớp Trưởng
              </h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-full">
                {monitors.length} Lớp Trưởng
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Thông tin liên lạc và danh sách quản lý cán bộ lớp các khóa ngành
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Số Lớp Trưởng</div>
            <div className="text-lg font-black text-amber-300">{monitors.length}</div>
          </div>

          {onReload && (
            <button
              type="button"
              onClick={onReload}
              disabled={isLoading}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold disabled:opacity-50 shadow-xs"
              title="Tải lại danh sách lớp trưởng"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Search & Counts */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Tên, Mã SV, Mã Lớp, Số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium w-full sm:w-auto justify-between sm:justify-end">
          <div>
            Hiển thị <span className="text-slate-800 font-bold">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> / <span className="text-slate-800 font-bold">{totalItems}</span> cán bộ lớp
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Trang:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value={12}>12 / trang</option>
              <option value={24}>24 / trang</option>
              <option value={48}>48 / trang</option>
              <option value={9999}>Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Monitors */}
      <div className="w-full">
        {isLoading && monitors.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Đang tải danh sách cán bộ lớp...</p>
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3 text-center">
            <Crown className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy thông tin Lớp trưởng phù hợp.</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại danh sách phân công lớp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedMonitors.map((monitor, index) => (
              <MonitorCard
                key={monitor.username || index}
                monitor={monitor}
                onClassClick={onClassClick}
              />
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredMonitors.length > 0 && totalPages > 1 && (
          <MonitorsPagination
            validPage={validPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageNumbers={pageNumbers}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
