'use client';

import React from 'react';
import {
  Crown,
  Users,
  UserCheck,
  Mail,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ClassMonitorSummary } from '../types/dashboard.types';

interface ClassMonitorDashboardCardProps {
  summary: ClassMonitorSummary;
  onNavigateTab: (tab: string, subTab?: string, options?: any) => void;
}

export default function ClassMonitorDashboardCard({
  summary,
  onNavigateTab,
}: ClassMonitorDashboardCardProps) {
  const {
    classCode,
    totalClassStudents,
    activeAccountsCount,
    studentsWithExamsCount,
    envelopesAssignedCount,
  } = summary;

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-3xl p-6 sm:p-7 border border-amber-200/90 shadow-sm relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    Quản Lý Lớp: <span className="text-amber-700">{classCode}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Lớp Trưởng
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Công cụ hỗ trợ phân công phong bì, điểm danh & quản lý danh sách
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-white/90 border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Sĩ số lớp</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {totalClassStudents} <span className="text-xs font-normal text-slate-400">SV</span>
              </div>
            </div>

            <div className="p-3 bg-white/90 border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã kích hoạt</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {activeAccountsCount} <span className="text-xs font-normal text-slate-400">acc</span>
              </div>
            </div>

            <div className="p-3 bg-white/90 border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Dự thi đợt này</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                {studentsWithExamsCount} <span className="text-xs font-normal text-slate-400">SV</span>
              </div>
            </div>

            <div className="p-3 bg-white/90 border border-amber-100 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Đã nhận phong bì</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
                {envelopesAssignedCount} <span className="text-xs font-normal text-slate-400">phòng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="pt-3 border-t border-amber-200/70 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-amber-900">Thao tác nhanh cho Lớp Trưởng:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateTab('members', undefined, { monitorClass: classCode })}
              className="px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Danh Sách Lớp</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('envelope_all')}
              className="px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>Phân Công Phong Bì</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('settlement')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-200 flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Bù Trừ Thanh Toán</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
