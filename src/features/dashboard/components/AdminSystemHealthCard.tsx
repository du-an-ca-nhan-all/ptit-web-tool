'use client';

import React from 'react';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Layers,
  Bot,
  Archive,
  History,
  AlertCircle,
  ArrowRight,
  Globe,
  Activity,
} from 'lucide-react';
import { AdminSystemHealth } from '../types/dashboard.types';

interface AdminSystemHealthCardProps {
  health: AdminSystemHealth;
  onNavigateTab: (tab: string, subTab?: string) => void;
}

export default function AdminSystemHealthCard({
  health,
  onNavigateTab,
}: AdminSystemHealthCardProps) {
  const {
    totalStudents,
    totalUsers,
    totalActiveBatches,
    pendingRegistrationsCount,
    isTelegramBotConfigured,
    telegramBotUsername,
    recentActivityLogsCount,
    activeBatchName,
  } = health;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-xl relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                    Trung Tâm Quản Trị Hệ Thống
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Admin Center
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Tổng quan sức khỏe hệ thống, đợt thi và phê duyệt tài khoản sinh viên
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Total Students */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Tổng sinh viên</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {totalStudents.toLocaleString()} <span className="text-xs text-slate-400 font-normal">SV</span>
              </div>
            </div>

            {/* Total Accounts */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tài khoản đã tạo</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
                {totalUsers.toLocaleString()} <span className="text-xs text-slate-400 font-normal">user</span>
              </div>
            </div>

            {/* Pending Requests */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                pendingRegistrationsCount > 0
                  ? 'bg-rose-500/15 border-rose-500/40 shadow-sm shadow-rose-900/40 cursor-pointer hover:bg-rose-500/25'
                  : 'bg-white/5 border-white/10'
              }`}
              onClick={() => onNavigateTab('user_registrations')}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Chờ duyệt</span>
                </span>
                {pendingRegistrationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {pendingRegistrationsCount} <span className="text-xs text-slate-400 font-normal">đơn</span>
              </div>
            </div>

            {/* Telegram Bot */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bot Telegram</span>
              </div>
              <div className="text-xs font-bold font-mono truncate mt-1">
                {isTelegramBotConfigured ? (
                  <span className="text-emerald-400">
                    @{telegramBotUsername || 'SystemBot'}
                  </span>
                ) : (
                  <span className="text-amber-400">Chưa cấu hình</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>24h qua: <strong>{recentActivityLogsCount}</strong> thao tác</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateTab('user_registrations')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                pendingRegistrationsCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Duyệt Đăng Ký ({pendingRegistrationsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('batches')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Đợt Thi</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('database_backup')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5 text-sky-400" />
              <span>Sao Lưu DB</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('activity_logs')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhật Ký</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
