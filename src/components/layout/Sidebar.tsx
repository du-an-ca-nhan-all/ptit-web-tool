'use client';

import React from 'react';
import {
  CalendarDays,
  Crown,
  ArrowLeftRight,
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
} from 'lucide-react';
import { LoginUser } from '../../types';
import { NavigationTab } from '../../types/navigation';

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
  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${
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

            {/* Môn học đã đăng ký */}
            {currentUser && (
              <button
                onClick={() => onTabChange('registered_courses')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'registered_courses'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" /> Môn Học Đã Đăng Ký
              </button>
            )}

            {/* So sánh ĐKMH */}
            {currentUser && (
              <button
                onClick={() => onTabChange('course_compare')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                  activeTab === 'course_compare'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" /> So Sánh ĐKMH
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

              {/* PB Lớp Mình */}
              {hasExamSchedule && (
                <button
                  onClick={() => onTabChange('envelope')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'envelope'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Mail className="w-4 h-4 text-amber-400" /> Phân Công Phong Bì Lớp Mình
                </button>
              )}

              {/* PB Lớp Khác */}
              {hasExamSchedule && (
                <button
                  onClick={() => onTabChange('envelope_all')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'envelope_all'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-400" /> Phân Công Phong Bì Toàn Trường
                </button>
              )}

              {/* Bù Trừ Thanh Toán */}
              {hasExamSchedule && (
                <button
                  onClick={() => onTabChange('settlement')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    activeTab === 'settlement'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Bù Trừ Thanh Toán
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
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
