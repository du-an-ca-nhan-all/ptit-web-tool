'use client';

import React from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Check,
  KeyRound,
} from 'lucide-react';
import { RegistrationCounts, RegistrationStatusFilter } from './types';

interface RegistrationHeaderAndMetricsProps {
  counts: RegistrationCounts;
  isLoading: boolean;
  isProcessing: boolean;
  searchQuery: string;
  statusFilter: RegistrationStatusFilter;
  selectedIds: number[];
  successMsg: string;
  errorMsg: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: RegistrationStatusFilter) => void;
  onRefresh: () => void;
  onOpenResetModal: () => void;
  onBulkApprove: () => void;
}

export function RegistrationHeaderAndMetrics({
  counts,
  isLoading,
  isProcessing,
  searchQuery,
  statusFilter,
  selectedIds,
  successMsg,
  errorMsg,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
  onOpenResetModal,
  onBulkApprove,
}: RegistrationHeaderAndMetricsProps) {
  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Duyệt Đăng Ký Tài Khoản
              </h2>
              {counts.pending > 0 && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-full animate-pulse">
                  {counts.pending} Chờ Duyệt
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Xét duyệt và kích hoạt mật khẩu cho sinh viên đăng ký tài khoản mới trên cổng thông tin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onOpenResetModal}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            title="Chủ động đặt lại mật khẩu cho bất kỳ người dùng nào"
          >
            <KeyRound className="w-4 h-4" />
            <span>Reset Mật Khẩu User</span>
          </button>

          <button
            onClick={onRefresh}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        <div
          onClick={() => onStatusFilterChange('PENDING')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <div>
            <div
              className={`text-[11px] font-bold uppercase tracking-wider ${
                statusFilter === 'PENDING' ? 'text-amber-100' : 'text-slate-400'
              }`}
            >
              Chờ Duyệt
            </div>
            <div
              className={`text-2xl font-black ${
                statusFilter === 'PENDING' ? 'text-white' : 'text-amber-600'
              }`}
            >
              {counts.pending}
            </div>
          </div>
          <Clock className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => onStatusFilterChange('APPROVED')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
              : 'bg-white border-slate-200 hover:bg-emerald-50/50'
          }`}
        >
          <div>
            <div
              className={`text-[11px] font-bold uppercase tracking-wider ${
                statusFilter === 'APPROVED' ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              Đã Duyệt
            </div>
            <div
              className={`text-2xl font-black ${
                statusFilter === 'APPROVED' ? 'text-white' : 'text-emerald-600'
              }`}
            >
              {counts.approved}
            </div>
          </div>
          <CheckCircle2 className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => onStatusFilterChange('REJECTED')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
              : 'bg-white border-slate-200 hover:bg-rose-50/50'
          }`}
        >
          <div>
            <div
              className={`text-[11px] font-bold uppercase tracking-wider ${
                statusFilter === 'REJECTED' ? 'text-rose-100' : 'text-slate-400'
              }`}
            >
              Đã Từ Chối
            </div>
            <div
              className={`text-2xl font-black ${
                statusFilter === 'REJECTED' ? 'text-white' : 'text-rose-600'
              }`}
            >
              {counts.rejected}
            </div>
          </div>
          <XCircle className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => onStatusFilterChange('ALL')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-950 shadow-md'
              : 'bg-white border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div>
            <div
              className={`text-[11px] font-bold uppercase tracking-wider ${
                statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              Tổng Yêu Cầu
            </div>
            <div
              className={`text-2xl font-black ${
                statusFilter === 'ALL' ? 'text-white' : 'text-slate-800'
              }`}
            >
              {counts.total}
            </div>
          </div>
          <User className={`w-8 h-8 opacity-40`} />
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Toolbar & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, Lớp, SĐT, Ghi chú..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStatusFilterChange(st)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'PENDING'
                  ? `Chờ duyệt (${counts.pending})`
                  : st === 'APPROVED'
                  ? `Đã duyệt`
                  : st === 'REJECTED'
                  ? `Từ chối`
                  : `Tất cả`}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end animate-in fade-in">
            <span className="text-xs font-bold text-slate-600">
              Đã chọn: <b className="text-blue-600">{selectedIds.length}</b> mục
            </span>
            <button
              onClick={onBulkApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Duyệt ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
