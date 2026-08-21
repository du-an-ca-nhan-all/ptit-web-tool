'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  Check,
  X,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
  Flame,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { useFlowQueue, FlowBatchItem, FlowQueueJobItem } from '../hooks/useFlowQueue';
import { getFlowActionDefinition } from '../types/flow.types';

interface FlowQueueMonitorProps {
  currentUser: LoginUser;
  selectedClass: string;
}

export default function FlowQueueMonitor({
  currentUser,
  selectedClass,
}: FlowQueueMonitorProps) {
  const {
    batches,
    queueItems,
    stats,
    hasActiveJobs,
    isWorkerRunning,
    isLoading,
    isSubmitting,
    selectedBatchId,
    setSelectedBatchId,
    message,
    setMessage,
    errorMessage,
    setErrorMessage,
    fetchQueueData,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    resumeWorker,
  } = useFlowQueue(currentUser, selectedClass);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered queue items
  const filteredQueueItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return queueItems.filter((item) => {
      const matchQuery =
        !query ||
        item.followerUsername.toLowerCase().includes(query) ||
        (item.followerName && item.followerName.toLowerCase().includes(query)) ||
        (item.ten_mon && item.ten_mon.toLowerCase().includes(query)) ||
        (item.ma_mon && item.ma_mon.toLowerCase().includes(query));

      if (!matchQuery) return false;

      if (statusFilter === 'QUEUED') return item.status === 'QUEUED';
      if (statusFilter === 'RUNNING') return item.status === 'RUNNING';
      if (statusFilter === 'SUCCESS') return item.status === 'SUCCESS';
      if (statusFilter === 'FAILED') return item.status === 'FAILED';
      if (statusFilter === 'CANCELLED') return item.status === 'CANCELLED' || item.status === 'SKIPPED';

      return true;
    });
  }, [queueItems, searchQuery, statusFilter]);

  // Selected batch object
  const activeBatch = useMemo(() => {
    if (!selectedBatchId) return batches[0] || null;
    return batches.find((b) => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  // Progress percentage of active batch
  const batchProgress = useMemo(() => {
    if (!activeBatch || activeBatch.totalItems === 0) return 0;
    const finished =
      activeBatch.successCount + activeBatch.failedCount + activeBatch.cancelledCount;
    return Math.round((finished / activeBatch.totalItems) * 100);
  }, [activeBatch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Queued */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase">Đang Chờ (Queued)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.totalQueued}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-0.5">Sẵn sàng chạy lần lượt</div>
        </div>

        {/* Running */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase">Đang Xử Lý (Running)</span>
            <RefreshCw className={`w-4 h-4 text-indigo-600 ${isWorkerRunning ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{stats.totalRunning}</div>
          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
            {isWorkerRunning ? '🚀 Worker đang chạy...' : 'Đang nghỉ'}
          </div>
        </div>

        {/* Success */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase">Thành Công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.totalSuccess}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Đã đăng ký/hủy thành công</div>
        </div>

        {/* Failed */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase">Thất Bại / Lỗi</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.totalFailed}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">
            {stats.totalFailed > 0 ? 'Cần bấm Thử Lại' : '0 lỗi'}
          </div>
        </div>

        {/* Cancelled / Skipped */}
        <div className="bg-white p-4.5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px] font-bold uppercase">Đã Hủy / Bỏ Qua</span>
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats.totalCancelled}</div>
          <div className="text-[10px] text-purple-600 font-bold mt-0.5">Hủy khi có lệnh mới/thiếu TK</div>
        </div>
      </div>

      {/* Active Batch Progress Card & Controls */}
      {activeBatch && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeBatch.status === 'PROCESSING'
                      ? 'bg-amber-400 text-slate-900 animate-pulse'
                      : activeBatch.status === 'COMPLETED'
                      ? 'bg-emerald-400 text-slate-900'
                      : activeBatch.status === 'FAILED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {activeBatch.status === 'PROCESSING'
                    ? 'ĐANG XỬ LÝ'
                    : activeBatch.status === 'COMPLETED'
                    ? 'HOÀN THÀNH'
                    : activeBatch.status === 'FAILED'
                    ? 'THẤT BẠI'
                    : 'ĐANG CHỜ'}
                </span>
                <h3 className="font-black text-base text-white">{activeBatch.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batch ID: <span className="font-mono text-slate-300">{activeBatch.id}</span> • Tạo lúc:{' '}
                {new Date(activeBatch.createdAt).toLocaleTimeString('vi-VN')}{' '}
                {new Date(activeBatch.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>

            {/* Queue Control Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Resume / Run Worker */}
              {!isWorkerRunning && stats.totalQueued > 0 && (
                <button
                  onClick={resumeWorker}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Chạy Tiếp Queue</span>
                </button>
              )}

              {/* Cancel Pending */}
              {stats.totalQueued > 0 && (
                <button
                  onClick={() => cancelPendingQueue(selectedBatchId || undefined)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-colors border border-rose-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Hủy các tác vụ đang chờ trong Queue"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hủy Tác Vụ Chờ</span>
                </button>
              )}

              {/* Retry Failed */}
              {stats.totalFailed > 0 && (
                <button
                  onClick={() => retryFailedQueue(selectedBatchId || undefined)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Chạy lại tất cả các tác vụ bị lỗi"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Thử Lại ({stats.totalFailed} lỗi)</span>
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={() => fetchQueueData(selectedBatchId || undefined)}
                disabled={isLoading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm Mới</span>
              </button>

              {/* Clear Completed */}
              <button
                onClick={clearCompletedBatches}
                disabled={isSubmitting || batches.length === 0}
                className="p-2 text-slate-400 hover:text-rose-400 cursor-pointer rounded-xl hover:bg-white/5"
                title="Dọn dẹp các đợt đã hoàn thành"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>
                Tiến độ xử lý đợt:{' '}
                <strong className="text-amber-300 font-mono">
                  {activeBatch.successCount + activeBatch.failedCount + activeBatch.cancelledCount} /{' '}
                  {activeBatch.totalItems}
                </strong>{' '}
                thành viên
              </span>
              <span className="font-mono text-amber-300">{batchProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  activeBatch.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : activeBatch.status === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                }`}
                style={{ width: `${batchProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Batches Selector Strip */}
      {batches.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Các đợt chạy gần đây:</span>
          <button
            onClick={() => setSelectedBatchId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              !selectedBatchId
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất Cả Các Đợt ({batches.length})
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBatchId(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBatchId === b.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  b.status === 'PROCESSING'
                    ? 'bg-amber-400 animate-ping'
                    : b.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : b.status === 'FAILED'
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="truncate max-w-[180px]">{b.title}</span>
              <span className="text-[10px] opacity-70 font-mono">({b.totalItems})</span>
            </button>
          ))}
        </div>
      )}

      {/* Live Queue Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã SV, họ tên, môn học..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất Cả ({queueItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('QUEUED')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'QUEUED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Đang Chờ ({stats.totalQueued})
            </button>
            <button
              onClick={() => setStatusFilter('RUNNING')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'RUNNING'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Đang Chạy ({stats.totalRunning})
            </button>
            <button
              onClick={() => setStatusFilter('SUCCESS')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Thành Công ({stats.totalSuccess})
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Lỗi ({stats.totalFailed})
            </button>
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'CANCELLED'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Đã Hủy / Bỏ Qua ({stats.totalCancelled})
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[60vh]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải danh sách tác vụ trong hàng đợi...</p>
            </div>
          ) : filteredQueueItems.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <Layers className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Hàng đợi hiện đang trống</p>
              <p className="text-xs text-slate-400">Khi Lớp trưởng thực thi Flow, các tác vụ sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3 text-center w-12">STT</th>
                  <th className="px-3.5 py-3">Thành Viên Nhận Flow</th>
                  <th className="px-3.5 py-3 text-center">Hành Động</th>
                  <th className="px-3.5 py-3">Môn Học / Nhóm Tổ</th>
                  <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                  <th className="px-3.5 py-3">Chi Tiết Phản Hồi / Lỗi</th>
                  <th className="px-3.5 py-3 text-right">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueueItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>

                    {/* Follower */}
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px]">
                          {item.followerUsername}
                        </span>
                        <strong className="text-slate-800">{item.followerName || item.followerUsername}</strong>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-3 text-center">
                      {(() => {
                        const actionDef = getFlowActionDefinition(item.flowAction);
                        return (
                          <div className="space-y-0.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${actionDef.badgeStyle.bg} ${actionDef.badgeStyle.text} border ${actionDef.badgeStyle.border}`}
                              title={actionDef.description}
                            >
                              {actionDef.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block">
                              {actionDef.categoryName}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Course */}
                    <td className="px-3.5 py-3">
                      {item.flowAction.includes('SYNC') ? (
                        <span className="text-emerald-700 font-bold text-[11px]">Tất cả môn của Lớp trưởng</span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">{item.ten_mon || item.ma_mon || item.id_to_hoc}</span>
                          {item.nhom_to && (
                            <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-1 rounded">
                              Nhóm {item.nhom_to}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3.5 py-3 text-center">
                      {item.status === 'RUNNING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Đang chạy
                        </span>
                      ) : item.status === 'QUEUED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3" /> Đang chờ
                        </span>
                      ) : item.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" /> Thành công
                        </span>
                      ) : item.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          <X className="w-3 h-3" /> Thất bại
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          Đã hủy
                        </span>
                      )}
                    </td>

                    {/* Message */}
                    <td className="px-3.5 py-3 max-w-xs">
                      {item.resultMessage ? (
                        <p className="text-[11px] text-slate-600 truncate" title={item.resultMessage}>
                          {item.resultMessage}
                        </p>
                      ) : item.status === 'RUNNING' ? (
                        <span className="text-indigo-600 text-[11px] italic">Đang kết nối cổng trường...</span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Đang chờ lượt xử lý</span>
                      )}
                    </td>

                    {/* Timing */}
                    <td className="px-3.5 py-3 text-right font-mono text-[10px] text-slate-400">
                      {item.finishedAt
                        ? new Date(item.finishedAt).toLocaleTimeString('vi-VN')
                        : new Date(item.createdAt).toLocaleTimeString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
