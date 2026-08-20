'use client';

import React from 'react';
import { CalendarDays, RefreshCw, Layers, Power } from 'lucide-react';
import UploadSection from '../UploadSection';
import FilterBar, { FilterState } from '../FilterBar';
import DataTable, { SortKey, SortDirection } from '../DataTable';
import ClassMonitorTools from '../ClassMonitorTools';
import ClassMembers from '../ClassMembers';
import AllMonitorsEnvelopes from '../AllMonitorsEnvelopes';
import ExamRoomMembers from '../ExamRoomMembers';
import MonitorsList from '../MonitorsList';
import CourseCompare from '../CourseCompare';
import SettlementManager from '../SettlementManager';
import UserProfileScreen from '../UserProfileScreen';
import StudentCourseRegistration from '../StudentCourseRegistration';
import ExamBatchManagement from '../ExamBatchManagement';
import AdminExternalAccounts from '../AdminExternalAccounts';
import ActivityLogsManager from '../ActivityLogsManager';
import AdminTelegramBotManager from '../AdminTelegramBotManager';
import AdminRegistrationManager from '../AdminRegistrationManager';
import DatabaseBackupManager from '../DatabaseBackupManager';
import AdminAnnouncementsManager from '../AdminAnnouncementsManager';
import AnnouncementBanner from '../announcements/AnnouncementBanner';
import AnnouncementModal from '../announcements/AnnouncementModal';
import AllStudentsList from '../AllStudentsList';
import StudentPersonalExamSchedule from '../StudentPersonalExamSchedule';
import AllExamsSchedule from '../AllExamsSchedule';
import { ExamRecord, LoginUser, ExamSession, ExamBatchItem } from '../../types';
import { NavigationTab, ProfileSubTab, TabChangeOptions } from '../../types/navigation';
import { buildSessions } from '../../utils/dataModel';
import { AnnouncementItem } from '../../lib/announcements';

interface HomeMainContentProps {
  isLoading: boolean;
  activeTab: NavigationTab;
  currentUser: LoginUser | null;
  effectiveUser: LoginUser | null;
  records: ExamRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ExamRecord[]>>;
  sessions: ExamSession[];
  setSessions: React.Dispatch<React.SetStateAction<ExamSession[]>>;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
  setActiveBatch: (batch: ExamBatchItem | null) => void;
  loginUsers: LoginUser[];
  monitorClass: string;
  setMonitorClass: (className: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: React.Dispatch<
    React.SetStateAction<{ key: SortKey; direction: SortDirection } | null>
  >;
  selectedExamRoom: ExamRecord | null;
  setSelectedExamRoom: (room: ExamRecord | null) => void;
  setConfirmStudentId: (id: string | null) => void;
  setConfirmClassCode: (code: string | null) => void;
  setSearchInput: (val: string) => void;
  setIsClassGroupOpen: (open: boolean) => void;
  userRoles: string[];
  activeRole: string;
  handleSelectRole: (role: string) => void;
  handleLogout: () => Promise<void>;
  handleTabChange: (tab: NavigationTab, subTab?: ProfileSubTab, options?: TabChangeOptions) => void;
  handleImpersonate: (username: string) => Promise<void>;
  handleToggleExamPostpone: (record: ExamRecord, newStatus: boolean) => Promise<void>;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
  fetchMonitorsData: () => Promise<void>;
  fetchCourseCompareData: () => void;
  courseCompareData: { main: any; subAccount: any; allSubAccounts?: any[] } | null;
  isAdmin: boolean;
  canAccessMonitorTools: boolean;
  canImpersonate: boolean;
  hasActiveBatch: boolean;
  hasExamSchedule: boolean;
  baseRecords?: ExamRecord[];
  filteredRecords?: ExamRecord[];
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  setCurrentUser: (user: LoginUser | null) => void;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalRecords: number;
  totalPages: number;
  profileSubTab?: ProfileSubTab;
  setProfileSubTab?: (subTab: ProfileSubTab) => void;
  announcements?: AnnouncementItem[];
}

export default function HomeMainContent({
  isLoading,
  activeTab,
  currentUser,
  effectiveUser,
  records,
  setRecords,
  sessions,
  setSessions,
  examBatches,
  activeBatch,
  setActiveBatch,
  loginUsers,
  monitorClass,
  setMonitorClass,
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  selectedExamRoom,
  setSelectedExamRoom,
  setConfirmStudentId,
  setConfirmClassCode,
  setSearchInput,
  setIsClassGroupOpen,
  userRoles,
  activeRole,
  handleSelectRole,
  handleLogout,
  handleTabChange,
  handleImpersonate,
  handleToggleExamPostpone,
  loadDataFromApi,
  fetchMonitorsData,
  fetchCourseCompareData,
  courseCompareData,
  isAdmin,
  canAccessMonitorTools,
  canImpersonate,
  hasActiveBatch,
  hasExamSchedule,
  classes,
  subjects,
  dates,
  setCurrentUser,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalRecords,
  totalPages,
  profileSubTab,
  setProfileSubTab,
  announcements = [],
}: HomeMainContentProps) {
  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-y-auto w-full p-3 sm:p-4 md:p-8 pb-32 sm:pb-24 pb-mobile-scroll max-w-7xl mx-auto">
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

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu từ máy chủ...</p>
        </div>
      ) : activeTab === 'profile' && currentUser ? (
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
      ) : activeTab === 'registered_courses' && effectiveUser ? (
        <StudentCourseRegistration
          currentUser={effectiveUser}
          onNavigateTab={(tab) => handleTabChange(tab as NavigationTab)}
        />
      ) : activeTab === 'external_accounts_admin' && isAdmin ? (
        <AdminExternalAccounts currentUser={effectiveUser!} />
      ) : activeTab === 'activity_logs' && isAdmin ? (
        <ActivityLogsManager currentUser={effectiveUser!} />
      ) : activeTab === 'telegram_admin' && isAdmin ? (
        <AdminTelegramBotManager currentUser={effectiveUser!} />
      ) : activeTab === 'user_registrations' && isAdmin ? (
        <AdminRegistrationManager currentUser={effectiveUser!} />
      ) : activeTab === 'database_backup' && isAdmin ? (
        <DatabaseBackupManager currentUser={effectiveUser!} />
      ) : activeTab === 'announcements_admin' && isAdmin ? (
        <AdminAnnouncementsManager currentUser={effectiveUser!} />
      ) : activeTab === 'batches' ? (
        <ExamBatchManagement
          currentUser={effectiveUser!}
          initialBatches={examBatches}
          initialActiveBatch={activeBatch}
          onBatchChanged={(batch) => {
            setActiveBatch(batch);
            loadDataFromApi(batch.code);
          }}
        />
      ) : activeTab === 'monitors_list' ? (
        <MonitorsList
          users={loginUsers}
          currentUser={effectiveUser}
          onReload={fetchMonitorsData}
          isLoading={isLoading}
          onClassClick={(classCode) => {
            handleTabChange('members', undefined, { monitorClass: classCode });
            setIsClassGroupOpen(true);
          }}
        />
      ) : activeTab === 'all_students' ? (
        <AllStudentsList
          currentUser={effectiveUser}
          onSelectStudentSchedule={(studentId) => {
            handleTabChange('schedule', undefined, { search: studentId });
          }}
          onImpersonate={canImpersonate ? handleImpersonate : undefined}
          onClassClick={(classCode) => {
            handleTabChange('members', undefined, { monitorClass: classCode });
            setIsClassGroupOpen(true);
          }}
        />
      ) : activeTab === 'course_compare' ? (
        <CourseCompare
          data={courseCompareData}
          currentUser={effectiveUser}
          onNavigateTab={(tab) => handleTabChange(tab as NavigationTab)}
          onReload={fetchCourseCompareData}
        />
      ) : activeTab === 'members' ? (
        <ClassMembers
          records={records}
          selectedClass={monitorClass}
          onClassChange={setMonitorClass}
          currentUser={effectiveUser}
          loginUsers={loginUsers}
          hasExamSchedule={hasExamSchedule}
          onImpersonate={canImpersonate ? handleImpersonate : undefined}
          onTogglePostpone={handleToggleExamPostpone}
          onReloadMonitors={fetchMonitorsData}
          onSelectStudentSchedule={(studentId) => {
            handleTabChange('schedule', undefined, { search: studentId });
          }}
        />
      ) : activeTab === 'monitor' ? (
        <ClassMonitorTools
          records={records}
          selectedClass={monitorClass}
          onClassChange={setMonitorClass}
        />
      ) : activeTab === 'envelope_all' || activeTab === 'envelope' ? (
        <AllMonitorsEnvelopes
          records={records}
          sessions={sessions}
          loginUsers={loginUsers}
          isAdmin={isAdmin}
        />
      ) : activeTab === 'settlement' ? (
        <SettlementManager
          records={records}
          sessions={sessions}
          loginUsers={loginUsers}
          onTogglePostpone={handleToggleExamPostpone}
          isAdmin={isAdmin}
        />
      ) : !hasActiveBatch && activeTab === 'schedule' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-center text-amber-600 mb-4 shadow-sm">
            <Power className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Hệ Thống Thi Đang Tạm Đóng</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Hiện tại tất cả các đợt thi đã được tạm khóa hoặc kết thúc. Màn hình tra cứu lịch thi sẽ tự động hiển thị trở lại khi Quản trị viên kích hoạt đợt thi mới.
          </p>
          {isAdmin && (
            <button
              onClick={() => handleTabChange('batches')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Đi đến Quản Lý Đợt Thi
            </button>
          )}
        </div>
      ) : activeTab === 'personal_schedule' && effectiveUser ? (
        <StudentPersonalExamSchedule
          currentUser={effectiveUser}
          onNavigateToExternalAccounts={() => handleTabChange('profile')}
          records={records}
          totalRecords={totalRecords}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalPages={totalPages}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          selectedExamRoom={selectedExamRoom}
          setSelectedExamRoom={setSelectedExamRoom}
          setConfirmStudentId={setConfirmStudentId}
          setConfirmClassCode={setConfirmClassCode}
          handleToggleExamPostpone={handleToggleExamPostpone}
          canAccessMonitorTools={canAccessMonitorTools}
          isLoadingBatchData={isLoading}
          activeBatch={activeBatch}
          loadDataFromApi={loadDataFromApi}
        />
      ) : activeTab === 'schedule' ? (
        <AllExamsSchedule
          records={records}
          totalRecords={totalRecords}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalPages={totalPages}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          selectedExamRoom={selectedExamRoom}
          setSelectedExamRoom={setSelectedExamRoom}
          setConfirmStudentId={setConfirmStudentId}
          setConfirmClassCode={setConfirmClassCode}
          handleToggleExamPostpone={handleToggleExamPostpone}
          canAccessMonitorTools={canAccessMonitorTools}
          isLoading={isLoading}
          activeBatch={activeBatch}
          loadDataFromApi={loadDataFromApi}
        />
      ) : records.length === 0 && totalRecords === 0 ? (
        isAdmin ? (
          <UploadSection
            onDataLoaded={(loadedData) => {
              setRecords(loadedData);
              setSessions(buildSessions(loadedData));
            }}
            onRefreshFromDb={() => loadDataFromApi()}
          />
        ) : (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa Có Dữ Liệu Lịch Thi</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Hiện tại chưa có dữ liệu lịch thi cho đợt thi này. Vui lòng thử tải lại dữ liệu hoặc quay lại sau.
            </p>
            <button
              onClick={() => loadDataFromApi(activeBatch?.code)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Đang tải lại...' : 'Tải lại dữ liệu'}
            </button>
          </div>
        )
      ) : (
        <AllExamsSchedule
          records={records}
          totalRecords={totalRecords}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalPages={totalPages}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          filters={filters}
          setFilters={setFilters}
          classes={classes}
          subjects={subjects}
          dates={dates}
          selectedExamRoom={selectedExamRoom}
          setSelectedExamRoom={setSelectedExamRoom}
          setConfirmStudentId={setConfirmStudentId}
          setConfirmClassCode={setConfirmClassCode}
          handleToggleExamPostpone={handleToggleExamPostpone}
          canAccessMonitorTools={canAccessMonitorTools}
          isLoading={isLoading}
          activeBatch={activeBatch}
          loadDataFromApi={loadDataFromApi}
        />
      )}
    </section>
  );
}
