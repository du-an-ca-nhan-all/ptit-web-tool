'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { GlobalSyncJobItem } from '../../hooks/useGlobalSyncQueue';
import { GLOBAL_JOB_DEFINITIONS } from '../../types/globalSyncQueue.types';

interface QueueItemsListProps {
  filteredQueueItems: GlobalSyncJobItem[];
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

function QueueStatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const sizeClass = compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';
  const iconSizeClass = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';

  if (status === 'SUCCESS') {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200`}>
        <CheckCircle2 className={`${iconSizeClass} text-emerald-600`} />
        Thành công
      </span>
    );
  }
  if (status === 'RUNNING') {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse`}>
        <RefreshCw className={`${iconSizeClass} text-blue-600 animate-spin`} />
        Đang xử lý
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200`}>
        <AlertCircle className={`${iconSizeClass} text-rose-600`} />
        Thất bại
      </span>
    );
  }
  if (status === 'SKIPPED') {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200`}>
        Bỏ qua
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200`}>
      <Clock className={`${iconSizeClass} text-amber-600`} />
      Đang chờ
    </span>
  );
}

export function QueueItemsList({
  filteredQueueItems,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: QueueItemsListProps) {
  return (
    <>
      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã SV, họ tên hoặc kết quả..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="QUEUED">Đang chờ (QUEUED)</option>
            <option value="RUNNING">Đang chạy (RUNNING)</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="CANCELLED">Bỏ qua / Hủy</option>
          </select>
        </div>
      </div>

      {/* 1. MOBILE CARD VIEW (Active on screens < 768px: block md:hidden) */}
      <div className="block md:hidden divide-y divide-slate-100 space-y-2.5">
        {filteredQueueItems.length > 0 ? (
          filteredQueueItems.map((item) => {
            const jobDef = GLOBAL_JOB_DEFINITIONS[item.jobType] || {
              shortName: item.jobType,
            };

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-2 hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {item.username}
                      </span>
                      <span className="font-bold text-slate-800 text-xs truncate">
                        {item.studentName || item.username}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <QueueStatusBadge status={item.status} compact />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                    {jobDef.shortName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {item.finishedAt
                      ? `Xong: ${new Date(item.finishedAt).toLocaleTimeString('vi-VN')}`
                      : item.startedAt
                      ? `Chạy: ${new Date(item.startedAt).toLocaleTimeString('vi-VN')}`
                      : `Tạo: ${new Date(item.createdAt).toLocaleTimeString('vi-VN')}`}
                  </span>
                </div>

                {item.resultMessage && (
                  <div
                    className={`p-2 rounded-xl text-[11px] leading-tight break-words ${
                      item.status === 'FAILED'
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : item.status === 'SUCCESS'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-slate-50 border border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold block mb-0.5">Kết quả:</span>
                    <span>{item.resultMessage}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Không tìm thấy tác vụ nào trong danh sách.
          </div>
        )}
      </div>

      {/* 2. DESKTOP TABLE VIEW (Active on screens >= 768px: hidden md:block) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Mã Sinh Viên</th>
              <th className="py-3 px-4">Họ và Tên</th>
              <th className="py-3 px-4">Loại Tác Vụ</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4">Kết Quả / Chi Tiết</th>
              <th className="py-3 px-4 text-right">Thời Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredQueueItems.length > 0 ? (
              filteredQueueItems.map((item) => {
                const jobDef = GLOBAL_JOB_DEFINITIONS[item.jobType] || {
                  shortName: item.jobType,
                };

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.username}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {item.studentName || item.username}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {jobDef.shortName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <QueueStatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.resultMessage || ''}>
                      {item.resultMessage || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {item.finishedAt
                        ? new Date(item.finishedAt).toLocaleTimeString('vi-VN')
                        : item.startedAt
                        ? new Date(item.startedAt).toLocaleTimeString('vi-VN')
                        : new Date(item.createdAt).toLocaleTimeString('vi-VN')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Không tìm thấy tác vụ nào trong danh sách.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
