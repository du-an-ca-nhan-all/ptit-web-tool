'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
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
  Calendar,
  GraduationCap,
  Settings,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Globe,
  Sliders,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import {
  useGlobalSyncQueue,
  GlobalSyncBatchItem,
  GlobalSyncJobItem,
} from '../hooks/useGlobalSyncQueue';
import { GLOBAL_JOB_DEFINITIONS } from '../types/globalSyncQueue.types';

interface GlobalSyncQueueManagerProps {
  currentUser: LoginUser;
}

export default function GlobalSyncQueueManager({ currentUser }: GlobalSyncQueueManagerProps) {
  const {
    batches,
    queueItems,
    stats,
    config,
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
    enqueueJob,
    triggerNightlyScheduler,
    cancelPendingQueue,
    retryFailedQueue,
    clearCompletedBatches,
    updateConfig,
    resumeWorker,
  } = useGlobalSyncQueue();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState({
    isEnabled: config?.isEnabled !== false,
    timetableJob: {
      isEnabled: config?.timetableJob?.isEnabled !== false,
      scheduleTime: config?.timetableJob?.scheduleTime || '22:00',
    },
    gradesJob: {
      isEnabled: config?.gradesJob?.isEnabled !== false,
      scheduleTime: config?.gradesJob?.scheduleTime || '22:00',
    },
    lmsJob: {
      isEnabled: config?.lmsJob?.isEnabled !== false,
      scheduleTime: config?.lmsJob?.scheduleTime || '22:00',
    },
    examsJob: {
      isEnabled: config?.examsJob?.isEnabled !== false,
      scheduleTime: config?.examsJob?.scheduleTime || '07:00',
    },
  });

  const openConfigModal = () => {
    setConfigForm({
      isEnabled: config?.isEnabled !== false,
      timetableJob: {
        isEnabled: config?.timetableJob?.isEnabled !== false,
        scheduleTime: config?.timetableJob?.scheduleTime || '22:00',
      },
      gradesJob: {
        isEnabled: config?.gradesJob?.isEnabled !== false,
        scheduleTime: config?.gradesJob?.scheduleTime || '22:00',
      },
      lmsJob: {
        isEnabled: config?.lmsJob?.isEnabled !== false,
        scheduleTime: config?.lmsJob?.scheduleTime || '22:00',
      },
      examsJob: {
        isEnabled: config?.examsJob?.isEnabled !== false,
        scheduleTime: config?.examsJob?.scheduleTime || '07:00',
      },
    });
    setIsConfigOpen(true);
  };

  // Filtered queue items
  const filteredQueueItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return queueItems.filter((item) => {
      const matchQuery =
        !query ||
        item.username.toLowerCase().includes(query) ||
        (item.studentName && item.studentName.toLowerCase().includes(query)) ||
        (item.resultMessage && item.resultMessage.toLowerCase().includes(query));

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
      activeBatch.successCount +
      activeBatch.failedCount +
      activeBatch.cancelledCount +
      activeBatch.skippedCount;
    return Math.round((finished / activeBatch.totalItems) * 100);
  }, [activeBatch]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig(configForm);
      setIsConfigOpen(false);
    } catch {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Messages */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-rose-600" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5" />
                Global Scheduled Sync Jobs
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                Lịch riêng từng Job (Tự động 22h / Tùy chỉnh)
              </span>
              {hasActiveJobs ? (
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Worker Đang Xử Lý
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  Hàng Đợi Sẵn Sàng
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Quản Lý Hàng Đợi & Tác Vụ Tự Động Toàn Hệ Thống
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
              Hệ thống tự động chạy ngầm theo giờ hẹn riêng cho từng Job để đồng bộ dữ liệu sinh viên: 
              <strong className="text-indigo-600 font-semibold"> 1. Lịch học & TKB ({config?.timetableJob?.scheduleTime || '22:00'})</strong>, 
              <strong className="text-emerald-600 font-semibold"> 2. Bảng điểm & GPA ({config?.gradesJob?.scheduleTime || '22:00'})</strong>, 
              <strong className="text-purple-600 font-semibold"> 3. Khóa học LMS ({config?.lmsJob?.scheduleTime || '22:00'})</strong>, và 
              <strong className="text-amber-600 font-semibold"> 4. Lịch thi & Ca thi hôm nay ({config?.examsJob?.scheduleTime || '07:00'})</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openConfigModal}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              Cài Đặt Lịch Từng Job
            </button>
            <button
              onClick={() => triggerNightlyScheduler()}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Chạy Thử Quét Giờ Hẹn
            </button>
            <button
              onClick={() => fetchQueueData()}
              disabled={isLoading}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title="Làm mới hàng đợi"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5 QUICK ACTION TRIGGER CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* JOB 1: LỊCH HỌC */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  1
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                    QLHT
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {config?.timetableJob?.scheduleTime || '22:00'}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Job 1: Lịch Học & TKB
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Kéo TKB học kỳ cho các sinh viên <strong>đã liên kết Cổng QLDTTX (QLHT)</strong>.
              </p>
            </div>
            <button
              onClick={() => enqueueJob({ jobType: 'SYNC_TIMETABLE' })}
              disabled={isSubmitting}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> Đồng Bộ Lịch Học
            </button>
          </div>

          {/* JOB 2: ĐIỂM SỐ */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  2
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                    QLHT
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {config?.gradesJob?.scheduleTime || '22:00'}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                Job 2: Bảng Điểm & GPA
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Kéo bảng điểm & GPA cho các sinh viên <strong>đã liên kết Cổng QLDTTX (QLHT)</strong>.
              </p>
            </div>
            <button
              onClick={() => enqueueJob({ jobType: 'SYNC_GRADES' })}
              disabled={isSubmitting}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> Đồng Bộ Điểm Số
            </button>
          </div>

          {/* JOB 3: LMS */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50/50 border border-purple-100 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  3
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                    LMS
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {config?.lmsJob?.scheduleTime || '22:00'}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Job 3: Khóa Học LMS
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Kéo tiến độ % môn học cho các sinh viên <strong>đã liên kết LMS PTTC1</strong>.
              </p>
            </div>
            <button
              onClick={() => enqueueJob({ jobType: 'SYNC_LMS' })}
              disabled={isSubmitting}
              className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> Đồng Bộ LMS
            </button>
          </div>

          {/* JOB 4: LỊCH THI CÁ NHÂN */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  4
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                    QLHT
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {config?.examsJob?.scheduleTime || '07:00'}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                Job 4: Lịch Thi QLDTTX
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Đồng bộ lịch thi, phòng thi & báo biến động. Quét 20-30p nếu có ca thi hôm nay.
              </p>
            </div>
            <button
              onClick={() => enqueueJob({ jobType: 'SYNC_EXAMS' })}
              disabled={isSubmitting}
              className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" /> Đồng Bộ Lịch Thi
            </button>
          </div>

          {/* ALL 4 JOBS */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  ★
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md">
                  Tất Cả 4 Job
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Đồng Bộ Toàn Diện
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Tự động đồng bộ Lịch học, Điểm, Khóa học LMS và Lịch thi cho SV tương ứng.
              </p>
            </div>
            <button
              onClick={() => enqueueJob({ jobType: 'SYNC_ALL' })}
              disabled={isSubmitting}
              className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" /> Kích Hoạt Cả 4 Job
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tổng Tác Vụ</div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {stats.QUEUED + stats.RUNNING + stats.SUCCESS + stats.FAILED + stats.CANCELLED + stats.SKIPPED}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tất cả trạng thái</div>
        </div>

        <div
          onClick={() => setStatusFilter('QUEUED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'QUEUED'
              ? 'border-amber-500 ring-2 ring-amber-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Đang Chờ (Queued)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.QUEUED}</div>
          <div className="text-[10px] text-amber-700/70 mt-0.5">Trong hàng đợi</div>
        </div>

        <div
          onClick={() => setStatusFilter('RUNNING')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RUNNING'
              ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">Đang Chạy (Running)</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.RUNNING}</div>
          <div className="text-[10px] text-blue-700/70 mt-0.5">Đang gọi cổng trường</div>
        </div>

        <div
          onClick={() => setStatusFilter('SUCCESS')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SUCCESS'
              ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">Thành Công</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.SUCCESS}</div>
          <div className="text-[10px] text-emerald-700/70 mt-0.5">Đồng bộ hoàn tất</div>
        </div>

        <div
          onClick={() => setStatusFilter('FAILED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'FAILED'
              ? 'border-rose-500 ring-2 ring-rose-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">Thất Bại / Lỗi</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.FAILED}</div>
          <div className="text-[10px] text-rose-700/70 mt-0.5">Cần thử lại</div>
        </div>

        <div
          onClick={() => setStatusFilter('CANCELLED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'CANCELLED'
              ? 'border-slate-500 ring-2 ring-slate-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Bỏ Qua / Hủy</div>
          <div className="text-2xl font-black text-slate-600 mt-1">{stats.CANCELLED + stats.SKIPPED}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Chưa có tài khoản/Hủy</div>
        </div>
      </div>

      {/* BATCH SELECTOR & QUEUE CONTROLS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Các Đợt Đồng Bộ Gần Nhất
            </h3>
            <p className="text-xs text-slate-500">
              Chọn đợt chạy để theo dõi tiến độ chi tiết từng sinh viên
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {stats.FAILED > 0 && (
              <button
                onClick={() => retryFailedQueue()}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                Thử Lại ({stats.FAILED} lỗi)
              </button>
            )}

            {stats.QUEUED > 0 && (
              <button
                onClick={() => cancelPendingQueue()}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
                Hủy Hàng Đợi ({stats.QUEUED})
              </button>
            )}

            <button
              onClick={() => clearCompletedBatches()}
              disabled={isSubmitting}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              Dọn Dẹp Xong
            </button>
          </div>
        </div>

        {/* BATCH TABS */}
        {batches.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch.id;
              const isDone = batch.status === 'COMPLETED';
              const isProcessing = batch.status === 'PROCESSING';

              return (
                <button
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`px-4 py-3 rounded-2xl text-left shrink-0 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold truncate max-w-[200px]">
                      {batch.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isDone
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isProcessing
                          ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{batch.successCount}/{batch.totalItems} thành công</span>
                    <span>•</span>
                    <span>{new Date(batch.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có đợt chạy đồng bộ nào trong hệ thống. Bạn có thể nhấn nút đồng bộ ở trên để kích hoạt.
          </div>
        )}

        {/* ACTIVE BATCH PROGRESS BAR */}
        {activeBatch && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Tiến độ: {activeBatch.title} ({batchProgress}%)
              </span>
              <span className="font-mono text-slate-500">
                Thành công: <strong className="text-emerald-600">{activeBatch.successCount}</strong> / 
                Lỗi: <strong className="text-rose-600">{activeBatch.failedCount}</strong> / 
                Bỏ qua: <strong className="text-slate-500">{activeBatch.skippedCount}</strong> / 
                Tổng: <strong className="text-slate-800">{activeBatch.totalItems}</strong>
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${activeBatch.totalItems > 0 ? (activeBatch.successCount / activeBatch.totalItems) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{
                  width: `${activeBatch.totalItems > 0 ? (activeBatch.failedCount / activeBatch.totalItems) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-slate-400 h-full transition-all duration-300"
                style={{
                  width: `${activeBatch.totalItems > 0 ? (activeBatch.skippedCount / activeBatch.totalItems) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-300 animate-pulse"
                style={{
                  width: `${activeBatch.totalItems > 0 ? (activeBatch.processingCount / activeBatch.totalItems) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, họ tên hoặc kết quả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
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

        {/* QUEUE ITEMS TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
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
                        {item.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Thành công
                          </span>
                        ) : item.status === 'RUNNING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                            Đang xử lý
                          </span>
                        ) : item.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Thất bại
                          </span>
                        ) : item.status === 'SKIPPED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Bỏ qua
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Đang chờ
                          </span>
                        )}
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
      </div>

      {/* CONFIGURATION MODAL (CÀI ĐẶT LỊCH RIÊNG TỪNG JOB) */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Cài Đặt Lịch Chạy Tự Động Từng Job</h3>
                  <p className="text-xs text-slate-500">Tùy chỉnh giờ hẹn và bật/tắt độc lập cho từng tác vụ</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-5">
              {/* BẬT TẮT CHUNG TOÀN HỆ THỐNG */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Bật Hệ Thống Tự Động Toàn Cục</div>
                  <div className="text-[11px] text-slate-500">Công tắc tổng kích hoạt các Job theo giờ hẹn</div>
                </div>
                <input
                  type="checkbox"
                  checked={configForm.isEnabled}
                  onChange={(e) => setConfigForm({ ...configForm, isEnabled: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* CẤU HÌNH TỪNG JOB ĐỘC LẬP */}
              <div className="space-y-4">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Cấu Hình Giờ Chạy Riêng Biệt
                </div>

                {/* 1. JOB LỊCH HỌC */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Job 1: Đồng Bộ Lịch Học & Thời Khóa Biểu</div>
                        <div className="text-[10px] text-slate-500">Chỉ quét SV đã liên kết Cổng QLHT</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.timetableJob.isEnabled}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            timetableJob: { ...configForm.timetableJob, isEnabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span>Bật</span>
                    </label>
                  </div>

                  {configForm.timetableJob.isEnabled && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-600 shrink-0">Giờ chạy:</label>
                      <input
                        type="text"
                        placeholder="22:00"
                        value={configForm.timetableJob.scheduleTime}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            timetableJob: { ...configForm.timetableJob, scheduleTime: e.target.value },
                          })
                        }
                        className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      />
                      <span className="text-[11px] text-slate-400">(Giờ Việt Nam HH:mm)</span>
                    </div>
                  )}
                </div>

                {/* 2. JOB ĐIỂM SỐ */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Job 2: Đồng Bộ Điểm & GPA Tích Lũy</div>
                        <div className="text-[10px] text-slate-500">Chỉ quét SV đã liên kết Cổng QLHT</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.gradesJob.isEnabled}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            gradesJob: { ...configForm.gradesJob, isEnabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span>Bật</span>
                    </label>
                  </div>

                  {configForm.gradesJob.isEnabled && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-600 shrink-0">Giờ chạy:</label>
                      <input
                        type="text"
                        placeholder="22:00"
                        value={configForm.gradesJob.scheduleTime}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            gradesJob: { ...configForm.gradesJob, scheduleTime: e.target.value },
                          })
                        }
                        className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                      />
                      <span className="text-[11px] text-slate-400">(Giờ Việt Nam HH:mm)</span>
                    </div>
                  )}
                </div>

                {/* 3. JOB LMS */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Job 3: Đồng Bộ Khóa Học & Tiến Độ LMS</div>
                        <div className="text-[10px] text-slate-500">Chỉ quét SV đã liên kết LMS PTTC1</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.lmsJob.isEnabled}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            lmsJob: { ...configForm.lmsJob, isEnabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                      />
                      <span>Bật</span>
                    </label>
                  </div>

                  {configForm.lmsJob.isEnabled && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-600 shrink-0">Giờ chạy:</label>
                      <input
                        type="text"
                        placeholder="22:00"
                        value={configForm.lmsJob.scheduleTime}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            lmsJob: { ...configForm.lmsJob, scheduleTime: e.target.value },
                          })
                        }
                        className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                      />
                      <span className="text-[11px] text-slate-400">(Giờ Việt Nam HH:mm)</span>
                    </div>
                  )}
                </div>

                {/* 4. JOB LỊCH THI CÁ NHÂN */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Job 4: Đồng Bộ Lịch Thi Cá Nhân & Biến Động (QLDTTX)</div>
                        <div className="text-[10px] text-slate-500">Quét định kỳ 7h sáng & quét 20-30p nếu có ca thi hôm nay</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.examsJob.isEnabled}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            examsJob: { ...configForm.examsJob, isEnabled: e.target.checked },
                          })
                        }
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>Bật</span>
                    </label>
                  </div>

                  {configForm.examsJob.isEnabled && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-600 shrink-0">Giờ chạy hàng ngày:</label>
                      <input
                        type="text"
                        placeholder="07:00"
                        value={configForm.examsJob.scheduleTime}
                        onChange={(e) =>
                          setConfigForm({
                            ...configForm,
                            examsJob: { ...configForm.examsJob, scheduleTime: e.target.value },
                          })
                        }
                        className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                      />
                      <span className="text-[11px] text-slate-400">(Giờ Việt Nam HH:mm - Mặc định: 07:00)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  Lưu Cài Đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
