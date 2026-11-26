'use client';

import React from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  LogOut,
  UserCheck,
  Bell,
  Download,
} from 'lucide-react';
import { AnnouncementDrawer } from '../../features/announcements';
import { usePWAContext } from '../pwa/PWAProvider';
import { HeaderProps } from './header/types';
import { getHeaderTitle } from './header/utils';
import { BatchSelector } from './header/BatchSelector';
import { RoleSwitcher } from './header/RoleSwitcher';

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
          {getHeaderTitle(activeTab)}
        </h2>

        {/* Active Exam Batch Selector in Header */}
        <BatchSelector
          hasActiveBatch={hasActiveBatch}
          activeBatch={activeBatch}
          examBatches={examBatches}
          onBatchChange={onBatchChange}
        />

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
          <RoleSwitcher
            userRoles={userRoles}
            activeRole={activeRole}
            isRoleDropdownOpen={isRoleDropdownOpen}
            setIsRoleDropdownOpen={setIsRoleDropdownOpen}
            onSelectRole={onSelectRole}
          />
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
