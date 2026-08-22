'use client';

import React from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  LogOut,
  Crown,
  GraduationCap,
  ChevronDown,
  Check,
  UserCheck,
  Layers,
  Power,
  Bell,
  Download,
} from 'lucide-react';
import { LoginUser, ExamBatchItem } from '../../types';
import { NavigationTab } from '../../types/navigation';
import { AnnouncementDrawer, AnnouncementItem } from '../../features/announcements';
import { usePWAContext } from '../pwa/PWAProvider';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenMobileMenu: () => void;
  hasActiveBatch: boolean;
  activeBatch: ExamBatchItem | null;
  examBatches: ExamBatchItem[];
  onBatchChange: (batchCode: string) => void;
  recordsCount: number;
  baseRecordsCount: number;
  searchInput: string;
  onSearchChange: (value: string) => void;
  currentUser: LoginUser | null;
  userRoles: string[];
  activeRole: string;
  isRoleDropdownOpen: boolean;
  setIsRoleDropdownOpen: (open: boolean) => void;
  onSelectRole: (role: string) => void;
  canImpersonate: boolean;
  onOpenImpersonateModal: () => void;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  announcements?: AnnouncementItem[];
}

export default function Header({
  activeTab,
  onTabChange,
  onOpenMobileMenu,
  hasActiveBatch,
  activeBatch,
  examBatches,
  onBatchChange,
  recordsCount,
  baseRecordsCount,
  searchInput,
  onSearchChange,
  currentUser,
  userRoles,
  activeRole,
  isRoleDropdownOpen,
  setIsRoleDropdownOpen,
  onSelectRole,
  canImpersonate,
  onOpenImpersonateModal,
  isLoading,
  onRefresh,
  onLogout,
  announcements = [],
}: HeaderProps) {
  const [isAnnouncementDrawerOpen, setIsAnnouncementDrawerOpen] = React.useState(false);
  const { isInstalled, openInstallModal } = usePWAContext();

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Tổng Quan';
      case 'schedule':
        return 'Lịch Thi Tổng';
      case 'personal_schedule':
        return 'Lịch Thi Cá Nhân';
      case 'monitors_list':
        return 'Danh Sách Lớp Trưởng';
      case 'course_registration':
        return 'Đăng Ký Môn Học (QLHT)';
      case 'registered_courses':
        return 'Môn Học Đã Đăng Ký';
      case 'course_compare':
        return 'So Sánh ĐKMH';
      case 'members':
        return 'Danh Sách sinh viên trong Lớp';
      case 'monitor_flow':
        return 'Cấu Hình Flow Lớp Trưởng';
      case 'batches':
        return 'Quản Lý Đợt Thi';
      case 'telegram_admin':
        return 'Quản Trị Bot Telegram Toàn Cục';
      case 'database_backup':
        return 'Sao Lưu & Xuất Dữ Liệu DB';
      case 'announcements_admin':
        return 'Quản Lý Thông Báo Hệ Thống';
      case 'activity_logs':
        return 'Nhật Ký Hoạt Động';
      case 'user_registrations':
        return 'Duyệt Đăng Ký Tài Khoản';
      case 'external_accounts_admin':
        return 'Tài Khoản QLĐT Từ Xa';
      case 'global_jobs':
        return 'Job Global / Tác Vụ Tự Động';
      case 'envelope':
      case 'envelope_all':
        return 'Phân Công Phong Bì';
      case 'settlement':
        return 'Bù Trừ Thanh Toán';
      case 'profile':
        return 'Hồ Sơ Cá Nhân';
      case 'all_students':
        return 'Toàn Bộ Sinh Viên';
      default:
        return 'WIP';
    }
  };

  return (
    <header className="min-h-16 md:min-h-20 h-[calc(4.5rem+env(safe-area-inset-top,0px))] md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex items-center gap-4 md:gap-6">
        <button
          className="flex items-center justify-center p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
          onClick={onOpenMobileMenu}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            P
          </div>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 hidden sm:block">
          {getHeaderTitle()}
        </h2>

        {/* Active Exam Batch Selector in Header */}
        {hasActiveBatch ? (
          <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={activeBatch?.code || 'ALL'}
              onChange={(e) => onBatchChange(e.target.value)}
              className="bg-transparent font-bold text-indigo-950 focus:outline-none cursor-pointer py-0.5 pr-1 max-w-[220px] truncate"
            >
              <option value="ALL">🌐 Tất cả đợt thi</option>
              {examBatches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.isActive ? '🟢' : '⚪'} {b.name} {b.isActive ? '(Đang mở)' : '(Đã tắt)'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold text-amber-800 shadow-xs">
            <Power className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Đợt Thi Tạm Đóng</span>
          </div>
        )}

        {((activeTab === 'schedule' && ((recordsCount ?? 0) > 0 || hasActiveBatch)) ||
          (activeTab === 'personal_schedule' && ((baseRecordsCount ?? 0) > 0 || hasActiveBatch))) && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={
                activeTab === 'personal_schedule'
                  ? 'Tìm môn thi...'
                  : 'Tìm theo mã SV, tên, môn...'
              }
              className="bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm w-48 md:w-80 focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Multi-Role Quick Switcher in Header */}
        {currentUser && userRoles.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Nhấp để chuyển đổi vai trò sử dụng"
            >
              {activeRole === 'admin' ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Quản Trị Viên</span>
                </>
              ) : activeRole === 'lop_truong' ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Lớp Trưởng</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Sinh Viên</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isRoleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-40 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsRoleDropdownOpen(false)}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-slate-100">
                  Chọn vai trò sử dụng:
                </div>
                {userRoles.map((r) => {
                  const isActive = activeRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onSelectRole(r);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-black'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r === 'admin' ? (
                          <Crown className="w-3.5 h-3.5 text-rose-600" />
                        ) : r === 'lop_truong' ? (
                          <Crown className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>
                          {r === 'admin'
                            ? 'Quản Trị Viên'
                            : r === 'lop_truong'
                            ? 'Lớp Trưởng'
                            : 'Sinh Viên'}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Impersonate Button (Admin or Impersonating Admin) */}
        {canImpersonate && (
          <button
            onClick={onOpenImpersonateModal}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Đăng nhập với tư cách sinh viên bất kỳ (Ví dụ: K25DTCN340)"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Đăng Nhập Như...</span>
          </button>
        )}

        {/* PWA Install Button */}
        {!isInstalled && (
          <button
            onClick={openInstallModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            title="Cài đặt ứng dụng PTIT EduSync về máy"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cài App</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={() => setIsAnnouncementDrawerOpen(true)}
          title="Xem thông báo hệ thống"
          className="relative p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {announcements.length > 0 && (
            <span className="absolute 1 top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={onRefresh}
          title="Đồng bộ lại từ Database"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center text-slate-500 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all ${
            activeTab === 'profile'
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'bg-slate-200 border-white'
          }`}
          title={`Hồ sơ: ${currentUser?.fullName || currentUser?.username} (Bấm để xem)`}
        >
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
              currentUser?.username || 'User'
            }`}
            alt={currentUser?.fullName || currentUser?.username || 'User'}
            className="w-full h-full object-cover"
          />
        </button>

        {currentUser && (
          <button
            onClick={onLogout}
            className="px-3 md:px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-rose-100 text-rose-600 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnnouncementDrawer
        isOpen={isAnnouncementDrawerOpen}
        onClose={() => setIsAnnouncementDrawerOpen(false)}
        announcements={announcements}
        onNavigateTab={onTabChange}
      />
    </header>
  );
}
