'use client';

import React from 'react';
import {
  Sparkles,
  GraduationCap,
  Crown,
  ShieldCheck,
  RefreshCw,
  Send,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Smartphone,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { ExternalAccountStatus, TelegramSyncStatus } from '../types/dashboard.types';

interface StudentHeroBannerProps {
  user: LoginUser;
  externalAccountStatus: ExternalAccountStatus;
  lmsAccountStatus?: ExternalAccountStatus;
  slinkAccountStatus?: ExternalAccountStatus;
  telegramStatus: TelegramSyncStatus;
  activeBatchName?: string | null;
  onRefresh: () => void;
  isLoading: boolean;
  onNavigateTab: (tab: string, subTab?: string) => void;
}

export default function StudentHeroBanner({
  user,
  externalAccountStatus,
  lmsAccountStatus,
  slinkAccountStatus,
  telegramStatus,
  activeBatchName,
  onRefresh,
  isLoading,
  onNavigateTab,
}: StudentHeroBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const displayName = user.fullName || user.username;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800/80">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Avatar & Greeting */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/20 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            {user.isAdmin ? (
              <span className="absolute -bottom-1 -right-1 p-1 bg-rose-600 rounded-lg text-white shadow-md" title="Quản Trị Viên">
                <Crown className="w-3.5 h-3.5" />
              </span>
            ) : user.isMonitor ? (
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-lg text-white shadow-md" title="Lớp Trưởng">
                <Crown className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="absolute -bottom-1 -right-1 p-1 bg-blue-600 rounded-lg text-white shadow-md" title="Sinh Viên">
                <GraduationCap className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                {getGreeting()},
              </span>
              {activeBatchName && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[200px]">
                  📌 {activeBatchName}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white truncate">
              {displayName}
            </h1>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-300">
              <span className="font-mono font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/60">
                {user.username}
              </span>
              {user.lop && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="font-semibold text-indigo-300">Lớp: {user.lop}</span>
                </>
              )}
              {user.isAdmin && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Admin
                </span>
              )}
              {user.isMonitor && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lớp Trưởng
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Status Badges & Quick Sync */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* QLDTTX Status */}
            <button
              type="button"
              onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                externalAccountStatus.isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title={
                externalAccountStatus.isConnected
                  ? 'Đã kết nối Cổng QLDTTX'
                  : 'Chưa kết nối tài khoản QLDTTX (Bấm để liên kết)'
              }
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                QLDTTX:{' '}
                <strong>{externalAccountStatus.isConnected ? 'Đã kết nối' : 'Chưa liên kết'}</strong>
              </span>
              {externalAccountStatus.isConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* LMS Status */}
            {lmsAccountStatus && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile', 'LMS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  lmsAccountStatus.isConnected
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
                title={
                  lmsAccountStatus.isConnected
                    ? 'Đã kết nối Hệ thống LMS (Moodle PTTC1)'
                    : 'Chưa liên kết tài khoản LMS (Bấm để liên kết)'
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  LMS:{' '}
                  <strong>{lmsAccountStatus.isConnected ? 'Đã kết nối' : 'Chưa liên kết'}</strong>
                </span>
                {lmsAccountStatus.isConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            )}

            {/* S-Link Status */}
            {slinkAccountStatus && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  slinkAccountStatus.isConnected
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
                title={
                  slinkAccountStatus.isConnected
                    ? 'Đã kết nối Cổng Thông Tin PTIT S-Link'
                    : 'Chưa liên kết tài khoản PTIT S-Link (Bấm để liên kết)'
                }
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  S-Link:{' '}
                  <strong>{slinkAccountStatus.isConnected ? 'Đã kết nối' : 'Chưa liên kết'}</strong>
                </span>
                {slinkAccountStatus.isConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            )}

            {/* Telegram Status */}
            <button
              type="button"
              onClick={() => onNavigateTab('profile', 'TELEGRAM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                telegramStatus.isEnabled
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={
                telegramStatus.isEnabled
                  ? 'Thông báo Telegram đang hoạt động'
                  : 'Chưa kích hoạt Telegram (Bấm để kết nối)'
              }
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Telegram: <strong>{telegramStatus.isEnabled ? 'Đang bật' : 'Chưa bật'}</strong>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
