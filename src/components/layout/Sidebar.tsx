'use client';

import React from 'react';
import {
  CalendarDays,
  Crown,
  Users,
  Mail,
  User,
  BookOpen,
  X,
  DollarSign,
  Database,
  Layers,
  Globe,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  History,
  Bot,
  Archive,
  Megaphone,
  Send,
  ShieldCheck,
  Phone,
  LayoutDashboard,
  Download,
  Zap,
  GitFork,
  Clock,
  Coffee,
  Bell,
} from 'lucide-react';
import { LoginUser } from '../../types';
import { NavigationTab } from '../../types/navigation';
import { usePWAContext } from '../pwa/PWAProvider';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  currentUser: LoginUser | null;
  hasExamSchedule: boolean;
  canAccessMonitorTools: boolean;
  isAdmin: boolean;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  isMobileMenuOpen,
  onCloseMobileMenu,
  currentUser,
  hasExamSchedule,
  canAccessMonitorTools,
  isAdmin,
}: SidebarProps) {
  const { isInstalled, openInstallModal } = usePWAContext();

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/30">
              P
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">PTIT EduSync</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <Database className="w-2.5 h-2.5" /> PostgreSQL Server-Side
              </div>
            </div>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={onCloseMobileMenu}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-5 scrollbar-hide">
          {/* SECTION 1: SINH VIÊN & TRA CỨU */}
          <div className="flex flex-col gap-1">
            <div className="px-3 py-1 text-[11px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>Sinh Viên & Tra Cứu</span>
            </div>

            {/* Tổng Quan / Dashboard */}
            {currentUser && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-sky-400" /> Tổng Quan
              </button>
            )}

            {/* Hồ sơ cá nhân */}
            {currentUser && (
              <button
                onClick={() => onTabChange('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <User className="w-4 h-4 text-blue-400" /> Hồ Sơ Cá Nhân
              </button>
            )}

            {/* Lịch thi cá nhân */}
            {currentUser && (
              <button
                onClick={() => onTabChange('personal_schedule')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'personal_schedule'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <User className="w-4 h-4 text-sky-400" /> Lịch Thi Cá Nhân
              </button>
            )}

            {/* Lịch thi tổng hợp */}
            {hasExamSchedule && (
              <button
                onClick={() => onTabChange('schedule')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-indigo-400" /> Lịch Thi Tổng Hợp
              </button>
            )}

            {/* Đăng ký môn học (QLHT / QLDTTX) */}
            {currentUser && (
              <button
                onClick={() => onTabChange('course_registration')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'course_registration'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400 fill-current" /> Đăng Ký Môn Học (QLHT)
              </button>
            )}

            {/* Môn học đã đăng ký */}
            {currentUser && (
              <button
                onClick={() => onTabChange('registered_courses')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'registered_courses' || activeTab === 'course_compare'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" /> Môn Học Đã Đăng Ký
              </button>
            )}

            {/* Lịch nhắc hẹn & Báo thức */}
            {currentUser && (
              <button
                onClick={() => onTabChange('reminders')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'reminders'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-400" /> Lịch Nhắc Hẹn
              </button>
            )}

            {/* Danh sách lớp trưởng */}
            <button
              onClick={() => onTabChange('monitors_list')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'monitors_list'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" /> Danh Sách Lớp Trưởng
            </button>

            {/* Toàn bộ sinh viên */}
            <button
              onClick={() => onTabChange('all_students')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                activeTab === 'all_students'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" /> Toàn Bộ Sinh Viên
            </button>
          </div>

          {/* SECTION 2: CÔNG CỤ LỚP TRƯỞNG */}
          {canAccessMonitorTools && (
            <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/80">
              <div className="px-3 py-1 text-[11px] font-extrabold text-amber-400 tracking-wider uppercase flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Công Cụ Lớp Trưởng</span>
                </div>
                <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-300 rounded text-[9px] font-mono border border-amber-400/20">
                  Lớp Trưởng
                </span>
              </div>

              {/* Danh sách & Thành viên lớp */}
              <button
                onClick={() => onTabChange('members')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" /> Danh Sách & Điểm Danh
              </button>

              {/* Cấu hình Flow Action */}
              <button
                onClick={() => onTabChange('monitor_flow')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'monitor_flow'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <GitFork className="w-4 h-4 text-amber-400" /> Cấu Hình Flow Lớp Trưởng
              </button>

              {/* Phân Công Nước Uống & Hỗ Trợ */}
              {hasExamSchedule && (
                <button
                  onClick={() => onTabChange('envelope_all')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'envelope_all' || activeTab === 'envelope'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Coffee className="w-4 h-4 text-amber-400" /> Phân Công Nước Uống
                </button>
              )}

              {/* Bù Trừ Qũy Nước & Chi Phí */}
              {hasExamSchedule && (
                <button
                  onClick={() => onTabChange('settlement')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'settlement'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Bù Trừ Qũy & Chi Phí
                </button>
              )}
            </div>
          )}

          {/* SECTION 3: QUẢN TRỊ VIÊN HỆ THỐNG */}
          {isAdmin && (
            <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/80">
              <div className="px-3 py-1 text-[11px] font-extrabold text-indigo-400 tracking-wider uppercase flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Quản Trị Viên</span>
                </div>
                <span className="px-1.5 py-0.5 bg-indigo-400/10 text-indigo-300 rounded text-[9px] font-mono border border-indigo-400/20">
                  Admin
                </span>
              </div>

              {/* Quản lý đợt thi */}
              <button
                onClick={() => onTabChange('batches')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'batches'
                    ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-400" /> Quản Lý Đợt Thi
              </button>

              {/* Tài khoản QLĐT từ xa */}
              <button
                onClick={() => onTabChange('external_accounts_admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'external_accounts_admin'
                    ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-400" /> Tài Khoản QLĐT Từ Xa
              </button>

              {/* Job Global & Tác Vụ Tự Động */}
              <button
                onClick={() => onTabChange('global_jobs')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'global_jobs'
                    ? 'bg-amber-600/25 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" /> Job Global / Tác Vụ Tự Động
              </button>

              {/* Bot Telegram Toàn Cục */}
              <button
                onClick={() => onTabChange('telegram_admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'telegram_admin'
                    ? 'bg-sky-600/25 text-sky-400 border border-sky-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Bot className="w-4 h-4 text-sky-400" /> Bot Telegram Toàn Cục
              </button>

              {/* Nhật ký hoạt động */}
              <button
                onClick={() => onTabChange('activity_logs')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'activity_logs'
                    ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <History className="w-4 h-4 text-indigo-400" /> Nhật Ký Hoạt Động
              </button>

              {/* Duyệt Đăng Ký Tài Khoản */}
              <button
                onClick={() => onTabChange('user_registrations')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'user_registrations'
                    ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400" /> Duyệt Đăng Ký
              </button>

              {/* Sao Lưu Dữ Liệu DB */}
              <button
                onClick={() => onTabChange('database_backup')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'database_backup'
                    ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Archive className="w-4 h-4 text-indigo-400" /> Sao Lưu Dữ Liệu DB
              </button>

              {/* Thông Báo Hệ Thống */}
              <button
                onClick={() => onTabChange('announcements_admin')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'announcements_admin'
                    ? 'bg-sky-600/25 text-sky-400 border border-sky-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Megaphone className="w-4 h-4 text-sky-400" /> Thông Báo Hệ Thống
              </button>
            </div>
          )}
        </nav>

        {/* PWA Install Button if not installed */}
        {!isInstalled && (
          <div className="px-3 pb-2">
            <button
              onClick={openInstallModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 transition-all cursor-pointer active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cài Đặt App (PWA)</span>
            </button>
          </div>
        )}

        {/* SECTION BOTTOM: ADMIN CONTACT & SUPPORT */}
        <div className="p-3 mx-3 mb-3 mt-auto rounded-2xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col gap-2 shadow-inner shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Hỗ Trợ & Admin</span>
            </div>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-snug">
            Cần cấp lại mật khẩu hoặc hỗ trợ kích hoạt tài khoản?
          </p>

          <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800 font-mono text-[10px]">
            <a
              href="https://t.me/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors py-0.5"
            >
              <Send className="w-2.5 h-2.5 text-sky-400 shrink-0" />
              <span className="truncate">Telegram: @lethanh9398</span>
            </a>
            <a
              href="tel:0966211618"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors py-0.5"
            >
              <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="truncate">SĐT: 0966.211.618</span>
            </a>
            <a
              href="https://www.facebook.com/lethanh9398"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors py-0.5"
            >
              <svg className="w-2.5 h-2.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="truncate">FB: lethanh9398</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
