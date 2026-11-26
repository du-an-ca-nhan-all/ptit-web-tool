'use client';

import React from 'react';
import { usePWAContext } from '../pwa/PWAProvider';
import { SidebarProps } from './sidebar/types';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { StudentNavSection } from './sidebar/StudentNavSection';
import { MonitorNavSection } from './sidebar/MonitorNavSection';
import { AdminNavSection } from './sidebar/AdminNavSection';
import { SidebarFooter } from './sidebar/SidebarFooter';

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
        <SidebarHeader onCloseMobileMenu={onCloseMobileMenu} />

        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-5 scrollbar-hide">
          <StudentNavSection
            activeTab={activeTab}
            onTabChange={onTabChange}
            currentUser={currentUser}
            hasExamSchedule={hasExamSchedule}
          />

          {canAccessMonitorTools && (
            <MonitorNavSection
              activeTab={activeTab}
              onTabChange={onTabChange}
              hasExamSchedule={hasExamSchedule}
            />
          )}

          {isAdmin && (
            <AdminNavSection
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}
        </nav>

        <SidebarFooter
          isInstalled={isInstalled}
          openInstallModal={openInstallModal}
        />
      </aside>
    </>
  );
}
