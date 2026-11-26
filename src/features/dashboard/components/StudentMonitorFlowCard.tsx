'use client';

import React from 'react';
import {
  GitMerge,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { StudentMonitorFlowCardProps } from './student-monitor-flow-card/types';
import { FlowInfoGrid } from './student-monitor-flow-card/FlowInfoGrid';

export default function StudentMonitorFlowCard({
  flowSummary,
  onNavigateTab,
}: StudentMonitorFlowCardProps) {
  const { isEnabled, classCode, note } = flowSummary;

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 rounded-3xl p-6 sm:p-7 border border-indigo-200/90 shadow-sm relative overflow-hidden">
      {/* Decorative accent blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/80">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Tự Động Flow Đăng Ký Môn Theo Lớp Trưởng
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Lớp {classCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tài khoản của bạn đã được liên kết để tự động đồng bộ & đăng ký môn học theo Lớp trưởng
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex items-center gap-2">
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang Nhận Flow (Active)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Tạm Dừng Nhận Flow
              </span>
            )}
          </div>
        </div>

        {/* 4-Box Information Grid */}
        <FlowInfoGrid flowSummary={flowSummary} onNavigateTab={onNavigateTab} />

        {/* Note if any */}
        {note && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ghi chú từ Lớp trưởng:</span> {note}
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Môn học sẽ được đăng ký cùng nhóm tổ với Lớp trưởng để đảm bảo học chung lịch.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('course_registration')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer justify-center"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem Môn Đã Đăng Ký</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
