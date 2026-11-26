import React from 'react';
import {
  Activity,
  AlertCircle,
  BellRing,
  Bot,
  CheckCircle2,
  Database,
  Megaphone,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminSubTab } from './types';

interface AdminHeaderBannerProps {
  systemBot: any | null;
  systemBotConfig: any | null;
  subscribersCount: number;
  totalActive: number;
  totalSystemBotUsers: number;
  successMsg: string;
  errorMsg: string;
  activeSubTab: AdminSubTab;
  onChangeSubTab: (tab: AdminSubTab) => void;
  queueStats: any | null;
}

export default function AdminHeaderBanner({
  systemBot,
  systemBotConfig,
  subscribersCount,
  totalActive,
  totalSystemBotUsers,
  successMsg,
  errorMsg,
  activeSubTab,
  onChangeSubTab,
  queueStats,
}: AdminHeaderBannerProps) {
  return (
    <>
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-6 text-white/10">
          <Bot className="w-28 h-28 stroke-[1.2]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-sky-300 mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản Trị Hệ Thống Thông Báo Telegram (Admin)</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black mb-2 tracking-tight">
            Cấu Hình Bot Toàn Cục & Tự Động Nhắc Lịch Thi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thiết lập Bot Telegram đại diện toàn trường trong bảng cấu hình mở rộng{' '}
            <code className="text-sky-300 font-mono font-bold">GlobalConfig</code> (key:{' '}
            <code className="text-sky-200 font-mono">telegram_bot</code>), quản lý các kênh/nhóm
            đăng ký nhận tin của sinh viên và kích hoạt tự động nhắc lịch thi trước 1 ngày & lúc 7h
            sáng hôm thi.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Trạng thái Bot</div>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                {systemBot?.isConfigured && systemBotConfig?.isActive ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Hoạt động</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span>Chưa sẵn sàng</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Tổng Đăng Ký</div>
              <div className="text-base font-black text-sky-300 mt-0.5 font-mono">
                {subscribersCount} <span className="text-xs font-normal text-slate-300">kênh</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Đang Nhận Tin</div>
              <div className="text-base font-black text-emerald-300 mt-0.5 font-mono">
                {totalActive} <span className="text-xs font-normal text-slate-300">tài khoản</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-[11px] text-slate-400 font-medium">Dùng Bot Hệ Thống</div>
              <div className="text-base font-black text-amber-300 mt-0.5 font-mono">
                {totalSystemBotUsers}{' '}
                <span className="text-xs font-normal text-slate-300">
                  ({Math.round((totalSystemBotUsers / (subscribersCount || 1)) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => onChangeSubTab('CONFIG')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'CONFIG'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>1. Cấu Hình Bot Hệ Thống (Global)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('SUBSCRIBERS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'SUBSCRIBERS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Danh Sách Người Nhận ({subscribersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('REMINDERS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'REMINDERS'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>3. Tự Động Nhắc Lịch Thi (Cron)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('BROADCAST')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'BROADCAST'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>4. Phát Sóng Thông Báo (Broadcast)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('BACKUP_ALERTS')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'BACKUP_ALERTS'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>5. Cấu Hình Sao Lưu & Thông Báo Admin</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('QUEUE')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'QUEUE'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>6. Hàng Đợi Gửi Tin (Global Queue)</span>
          {queueStats && queueStats.pending > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse shadow-sm">
              {queueStats.pending}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
