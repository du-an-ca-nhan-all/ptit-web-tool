'use client';

import React from 'react';
import {
  AnnouncementBanner,
  AnnouncementModal,
} from '../../features/announcements';
import { DashboardOverview } from '../../features/dashboard';
import Footer from './Footer';
import type { NavigationTab, ProfileSubTab } from '../../types/navigation';
import type { HomeMainContentProps } from './home-main-content/types';
import { renderAdminAndUserTabs } from './home-main-content/renderAdminAndUserTabs';
import { renderClassAndMonitorTabs } from './home-main-content/renderClassAndMonitorTabs';
import { ExamScheduleFallbackView } from './home-main-content/ExamScheduleFallbackView';

export default function HomeMainContent(props: HomeMainContentProps) {
  const {
    isLoading,
    activeTab,
    effectiveUser,
    handleTabChange,
    announcements = [],
  } = props;

  const renderBody = () => {
    if (activeTab === 'dashboard' && effectiveUser) {
      return (
        <DashboardOverview
          currentUser={effectiveUser}
          onNavigateTab={(tab, subTab, options) =>
            handleTabChange(
              tab as NavigationTab,
              subTab as ProfileSubTab,
              options,
            )
          }
        />
      );
    }

    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">
            Đang tải dữ liệu từ máy chủ...
          </p>
        </div>
      );
    }

    return (
      renderAdminAndUserTabs(props) ??
      renderClassAndMonitorTabs(props) ?? (
        <ExamScheduleFallbackView {...props} />
      )
    );
  };

  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Global Active Announcement Banner */}
      <AnnouncementBanner
        announcements={announcements}
        onNavigateTab={(tab) => handleTabChange(tab as NavigationTab)}
      />

      {/* Global Active Announcement Modal Popup */}
      <AnnouncementModal
        announcements={announcements}
        onNavigateTab={(tab) => handleTabChange(tab as NavigationTab)}
      />

      {renderBody()}

      {/* Spacing & Admin Contact Footer */}
      {!isLoading && <Footer />}
    </section>
  );
}
