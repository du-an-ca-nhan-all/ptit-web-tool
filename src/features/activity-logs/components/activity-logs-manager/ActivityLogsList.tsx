import React from 'react';
import { Info } from 'lucide-react';
import { ActivityLogItem, ActivityLogsPagination } from './types';
import { ActivityLogsMobileList } from './ActivityLogsMobileList';
import { ActivityLogsDesktopTable } from './ActivityLogsDesktopTable';

interface ActivityLogsListProps {
  logs: ActivityLogItem[];
  displayedLogs: ActivityLogItem[];
  isLoading: boolean;
  pagination: ActivityLogsPagination;
  onSelectLog: (log: ActivityLogItem) => void;
  onFetchPage: (page: number) => void;
}

export function ActivityLogsList({
  logs,
  displayedLogs,
  isLoading,
  pagination,
  onSelectLog,
  onFetchPage,
}: ActivityLogsListProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {isLoading ? (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Đang tải nhật ký hoạt động...</p>
        </div>
      ) : displayedLogs.length === 0 ? (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center p-4 gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">Chưa có nhật ký hoạt động phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Không tìm thấy bản ghi hoạt động nào theo tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <>
          <ActivityLogsMobileList logs={displayedLogs} onSelectLog={onSelectLog} />
          <ActivityLogsDesktopTable logs={displayedLogs} onSelectLog={onSelectLog} />
        </>
      )}

      {/* Footer Pagination */}
      {logs.length > 0 && (
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600 font-bold">
          <div>
            Hiển thị {logs.length} / {pagination.total.toLocaleString('vi-VN')} bản ghi hoạt động
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onFetchPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Trang Trước
            </button>
            <span>
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => onFetchPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              Trang Kế
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
