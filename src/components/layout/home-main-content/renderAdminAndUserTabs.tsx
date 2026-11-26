'use client';

import React from 'react';
import {
  UserProfileScreen,
  AdminRegistrationManager,
} from '../../../features/auth';
import {
  StudentCourseRegistration,
  CourseRegistrationPortal,
  AdminExternalAccounts,
  GlobalSyncQueueManager,
} from '../../../features/external-portal';
import { AdminTelegramBotManager } from '../../../features/telegram';
import { AdminAnnouncementsManager } from '../../../features/announcements';
import { ActivityLogsManager } from '../../../features/activity-logs';
import { DatabaseBackupManager } from '../../../features/database-backup';
import { RemindersManager } from '../../../features/reminders';
import type { NavigationTab, ProfileSubTab } from '../../../types/navigation';
import type { HomeMainContentProps } from './types';

export function renderAdminAndUserTabs(
  props: HomeMainContentProps,
): React.ReactNode {
  const {
    activeTab,
    currentUser,
    effectiveUser,
    userRoles,
    activeRole,
    handleSelectRole,
    handleLogout,
    handleTabChange,
    fetchCourseCompareData,
    courseCompareData,
    isAdmin,
    hasExamSchedule,
    setCurrentUser,
    profileSubTab,
    setProfileSubTab,
  } = props;

  if (activeTab === 'profile' && currentUser) {
    return (
      <UserProfileScreen
        currentUser={currentUser}
        onLogout={handleLogout}
        hasExamSchedule={hasExamSchedule}
        onNavigateTab={(tab) => handleTabChange(tab as NavigationTab)}
        userRoles={userRoles}
        activeRole={activeRole}
        onSelectRole={handleSelectRole}
        activeSubTab={profileSubTab}
        onSubTabChange={setProfileSubTab}
        onProfileUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }}
      />
    );
  }

  if (activeTab === 'course_registration' && effectiveUser) {
    return (
      <CourseRegistrationPortal
        currentUser={effectiveUser}
        onNavigateTab={(tab, subTab) =>
          handleTabChange(tab as NavigationTab, subTab as ProfileSubTab)
        }
      />
    );
  }

  if (activeTab === 'registered_courses' && effectiveUser) {
    return (
      <StudentCourseRegistration
        currentUser={effectiveUser}
        initialSubTab="COURSES"
        onNavigateTab={(tab, subTab) =>
          handleTabChange(tab as NavigationTab, subTab as ProfileSubTab)
        }
        courseCompareData={courseCompareData}
        onReloadCourseCompare={fetchCourseCompareData}
      />
    );
  }

  if (activeTab === 'course_compare' && effectiveUser) {
    return (
      <StudentCourseRegistration
        currentUser={effectiveUser}
        initialSubTab="COMPARE"
        onNavigateTab={(tab, subTab) =>
          handleTabChange(tab as NavigationTab, subTab as ProfileSubTab)
        }
        courseCompareData={courseCompareData}
        onReloadCourseCompare={fetchCourseCompareData}
      />
    );
  }

  if (activeTab === 'reminders' && effectiveUser) {
    return (
      <RemindersManager
        currentUser={effectiveUser}
        onNavigateToTelegramConfig={() =>
          handleTabChange('profile', 'TELEGRAM')
        }
        onNavigateToCalendar={() => handleTabChange('profile', 'SCHEDULE')}
      />
    );
  }

  if (activeTab === 'external_accounts_admin' && isAdmin) {
    return <AdminExternalAccounts currentUser={effectiveUser!} />;
  }

  if (activeTab === 'global_jobs' && isAdmin) {
    return <GlobalSyncQueueManager currentUser={effectiveUser!} />;
  }

  if (activeTab === 'activity_logs' && isAdmin) {
    return <ActivityLogsManager currentUser={effectiveUser!} />;
  }

  if (activeTab === 'telegram_admin' && isAdmin) {
    return <AdminTelegramBotManager currentUser={effectiveUser!} />;
  }

  if (activeTab === 'user_registrations' && isAdmin) {
    return <AdminRegistrationManager currentUser={effectiveUser!} />;
  }

  if (activeTab === 'database_backup' && isAdmin) {
    return <DatabaseBackupManager currentUser={effectiveUser!} />;
  }

  if (activeTab === 'announcements_admin' && isAdmin) {
    return <AdminAnnouncementsManager currentUser={effectiveUser!} />;
  }

  return null;
}
