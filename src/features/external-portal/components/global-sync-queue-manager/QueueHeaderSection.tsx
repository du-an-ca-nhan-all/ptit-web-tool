'use client';

import React from 'react';
import {
  Clock,
  Play,
  RefreshCw,
  Check,
  Settings,
  Globe,
} from 'lucide-react';
import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { GlobalJobType } from '../../types/globalSyncQueue.types';
import { QuickActionTriggerCards } from './QuickActionTriggerCards';

interface QueueHeaderSectionProps {
  config: GlobalNightlySyncConfigValue;
  hasActiveJobs: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  onOpenConfigModal: () => void;
  onTriggerNightlyScheduler: () => void;
  onRefreshQueueData: () => void;
  onEnqueueJob: (options: { jobType: GlobalJobType }) => void;
}

export function QueueHeaderSection({
  config,
  hasActiveJobs,
  isLoading,
  isSubmitting,
  onOpenConfigModal,
  onTriggerNightlyScheduler,
  onRefreshQueueData,
  onEnqueueJob,
}: QueueHeaderSectionProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Global Scheduled Sync
            </span>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-1.5 shadow-xs">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Lịch riêng từng Job
            </span>
            {hasActiveJobs ? (
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center gap-1.5 animate-pulse shadow-xs shadow-emerald-500/20">
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                Worker Đang Chạy
              </span>
            ) : (
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] sm:text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                Hàng Đợi Sẵn Sàng
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
            Quản Lý Hàng Đợi &amp; Tác Vụ Tự Động Toàn Hệ Thống
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Hệ thống tự động chạy ngầm theo giờ hẹn riêng cho từng Job để đồng bộ dữ liệu sinh viên:
            <strong className="text-indigo-600 font-semibold"> 1. Lịch học ({config?.timetableJob?.scheduleTime || '22:00'})</strong>,
            <strong className="text-emerald-600 font-semibold"> 2. Điểm &amp; GPA ({config?.gradesJob?.scheduleTime || '22:00'})</strong>,
            <strong className="text-purple-600 font-semibold"> 3. LMS ({config?.lmsJob?.scheduleTime || '22:00'})</strong>,
            <strong className="text-amber-600 font-semibold"> 4. Lịch thi ({config?.examsJob?.scheduleTime || '07:00'})</strong>,
            <strong className="text-violet-600 font-semibold"> 5. S-Link ({config?.slinkGradesJob?.scheduleTime || '23:00'})</strong>, và
            <strong className="text-sky-600 font-semibold"> 6. Hồ sơ SV ({config?.profileJob?.scheduleTime || '22:30'})</strong>.
          </p>
        </div>

        {/* Action buttons (Responsive grid on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenConfigModal}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Cài Đặt Lịch</span>
          </button>
          <button
            type="button"
            onClick={onTriggerNightlyScheduler}
            disabled={isSubmitting}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Chạy Thử Quét</span>
          </button>
          <button
            type="button"
            onClick={onRefreshQueueData}
            disabled={isLoading}
            className="col-span-2 sm:col-span-1 p-2 sm:p-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1 text-xs font-bold"
            title="Làm mới hàng đợi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sm:hidden">Làm Mới Dữ Liệu</span>
          </button>
        </div>
      </div>

      {/* 7 QUICK ACTION TRIGGER CARDS (1 col on mobile, 2 on sm, 3 on lg, 4 on xl) */}
      <QuickActionTriggerCards
        config={config}
        isSubmitting={isSubmitting}
        onEnqueueJob={onEnqueueJob}
      />
    </div>
  );
}
