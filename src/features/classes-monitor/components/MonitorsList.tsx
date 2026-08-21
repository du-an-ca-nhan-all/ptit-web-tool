import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Phone,
  GraduationCap,
  Crown,
  Search,
  Users,
  ArrowRightLeft,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { LoginUser } from '../types/class.types';

interface MonitorsListProps {
  users: LoginUser[];
  onClassClick?: (classCode: string) => void;
  currentUser?: LoginUser | null;
  onReload?: () => void;
  isLoading?: boolean;
}

export default function MonitorsList({
  users,
  onClassClick,
  currentUser,
  onReload,
  isLoading = false,
}: MonitorsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  const monitors = useMemo(() => {
    return users.filter(
      (user) =>
        user.role === 'lop_truong' ||
        (user.role && user.role.includes('lop_truong')) ||
        user.isMonitor
    );
  }, [users]);

  const filteredMonitors = useMemo(() => {
    if (!searchQuery.trim()) return monitors;
    const q = searchQuery.trim().toLowerCase();
    return monitors.filter((m) => {
      const name = (m.fullName || '').toLowerCase();
      const user = (m.username || '').toLowerCase();
      const lop = (m.lop || '').toLowerCase();
      const phone = (m.phoneNumber || '').toLowerCase();
      return name.includes(q) || user.includes(q) || lop.includes(q) || phone.includes(q);
    });
  }, [monitors, searchQuery]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Pagination math
  const totalItems = filteredMonitors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedMonitors = filteredMonitors.slice(startIndex, endIndex);

  // Page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validPage > 3) pages.push('...');
      const start = Math.max(2, validPage - 1);
      const end = Math.min(totalPages - 1, validPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (validPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, validPage]);

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
              <div
                key={monitor.username || index}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group hover:border-amber-200"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-amber-700 font-black text-sm shrink-0 shadow-xs">
                      {monitor.fullName ? monitor.fullName.charAt(0) : monitor.username.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-800 text-sm truncate">
                          {monitor.fullName || 'Chưa cập nhật tên'}
                        </h3>
                        <span className="p-0.5 text-amber-500">
                          <Crown className="w-3.5 h-3.5 fill-amber-400" />
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-1">
                        {monitor.username}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Lớp quản lý:
                      </span>
                      {monitor.lop ? (
                        onClassClick ? (
                          <button
                            onClick={() => onClassClick(monitor.lop!)}
                            className="font-bold text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded"
                          >
                            {monitor.lop}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-700">{monitor.lop}</span>
                        )
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa gán lớp</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại:
                      </span>
                      {monitor.phoneNumber ? (
                        <a
                          href={`tel:${monitor.phoneNumber}`}
                          className="font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                          {monitor.phoneNumber}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa có</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-slate-400" /> Vai trò:
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {monitor.role === 'admin'
                          ? '👑 Quản Trị Viên'
                          : '🛡️ Lớp Trưởng'}
                      </span>
                    </div>
                  </div>
                </div>

                {onClassClick && monitor.lop && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => onClassClick(monitor.lop!)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Xem chi tiết danh sách lớp</span>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredMonitors.length > 0 && totalPages > 1 && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-xs text-slate-500 font-medium">
              Trang <span className="font-bold text-slate-800">{validPage}</span> / <span className="font-bold text-slate-800">{totalPages}</span> (Tổng {totalItems} cán bộ lớp)
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {pageNumbers.map((p, idx) =>
                typeof p === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      p === validPage
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-xs text-slate-400 font-bold">
                    ...
                  </span>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
