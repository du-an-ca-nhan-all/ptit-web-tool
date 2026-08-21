'use client';

import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { LoginUser } from '../../../types';
import { useDashboardData } from '../hooks/useDashboardData';
import StudentHeroBanner from './StudentHeroBanner';
import NextExamCountdownCard from './NextExamCountdownCard';
import PersonalTimetableCard from './PersonalTimetableCard';
import AcademicSnapshotCards from './AcademicSnapshotCards';
import UpcomingScheduleList from './UpcomingScheduleList';
import ClassMonitorDashboardCard from './ClassMonitorDashboardCard';
import AdminSystemHealthCard from './AdminSystemHealthCard';
import RecentAnnouncementsWidget from './RecentAnnouncementsWidget';
import QuickActionGrid from './QuickActionGrid';

interface DashboardOverviewProps {
  currentUser: LoginUser;
  onNavigateTab: (tab: string, subTab?: string, options?: any) => void;
}

export default function DashboardOverview({
  currentUser,
  onNavigateTab,
}: DashboardOverviewProps) {
  const { data, isLoading, error, refresh } = useDashboardData(currentUser.username);

  if (isLoading && !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-44 bg-slate-200 rounded-3xl w-full" />

        {/* 3-column grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 rounded-3xl" />
          <div className="h-72 bg-slate-200 rounded-3xl" />
          <div className="h-72 bg-slate-200 rounded-3xl" />
        </div>

        {/* Action grid skeleton */}
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-lg mx-auto my-auto text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Không thể tải dữ liệu Tổng Quan</h3>
        <p className="text-xs text-slate-500 mb-6">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Identity Banner */}
      <StudentHeroBanner
        user={data.user}
        externalAccountStatus={data.externalAccountStatus}
        telegramStatus={data.telegramStatus}
        activeBatchName={data.activeBatch?.name}
        onRefresh={refresh}
        isLoading={isLoading}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Admin System Health (if Admin) */}
      {data.adminSystemHealth && (
        <AdminSystemHealthCard
          health={data.adminSystemHealth}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 3. Class Monitor Tools (if Monitor / Class Assigned) */}
      {data.classMonitorSummary && (
        <ClassMonitorDashboardCard
          summary={data.classMonitorSummary}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 4. Main Stats Grid (Exam Countdown, Timetable & Today's Classes, Academic Snapshot) */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          data.nextExam.hasExam ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        }`}
      >
        {data.nextExam.hasExam && (
          <NextExamCountdownCard
            countdown={data.nextExam}
            onNavigateToSchedule={() => onNavigateTab('personal_schedule')}
          />
        )}

        <PersonalTimetableCard
          timetable={data.timetableSummary}
          onNavigateToSchedule={() => onNavigateTab('profile', 'SCHEDULE')}
          onNavigateToExternalAccounts={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
        />

        <AcademicSnapshotCards
          academic={data.academicSummary}
          onNavigateToGrades={() => onNavigateTab('profile', 'GRADES')}
          onNavigateToExternalAccounts={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
        />
      </div>

      {/* 5. Upcoming Schedule List */}
      {data.upcomingExams.length > 0 && (
        <UpcomingScheduleList
          exams={data.upcomingExams}
          onNavigateToSchedule={() => onNavigateTab('personal_schedule')}
        />
      )}

      {/* 6. Recent Important Announcements */}
      {data.activeAnnouncements.length > 0 && (
        <RecentAnnouncementsWidget
          announcements={data.activeAnnouncements}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 7. Quick Shortcuts Action Grid */}
      <QuickActionGrid onNavigateTab={onNavigateTab} />
    </div>
  );
}
