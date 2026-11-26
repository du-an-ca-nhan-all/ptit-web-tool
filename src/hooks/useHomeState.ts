'use client';

import { useMemo, useEffect } from 'react';
import { ExamBatchItem } from '../types';
import { getInitialHomeState } from '../types/navigation';
import { fetchPricingFromBackend } from '../config/pricingConfig';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useExamBatches } from '../features/exam-schedule/hooks/useExamBatches';
import { useClassMonitor } from '../features/classes-monitor/hooks/useClassMonitor';
import { useExternalPortalData } from '../features/external-portal/hooks/useExternalPortalData';
import { useAnnouncements } from '../features/announcements/hooks/useAnnouncements';
import { useHomeNavigation } from './use-home-state/useHomeNavigation';
import { useHomeExamRecords } from './use-home-state/useHomeExamRecords';
import { useHomeAuthActions } from './use-home-state/useHomeAuthActions';

export function useHomeState() {
  const initialState = useMemo(getInitialHomeState, []);

  // 1. Domain sub-hooks
  const auth = useAuth();
  const batches = useExamBatches();
  const monitor = useClassMonitor(initialState.monitorClass);
  const externalPortal = useExternalPortalData();
  const { announcements } = useAnnouncements();

  const { currentUser, setCurrentUser } = auth;
  const { setExamBatches, activeBatch, setActiveBatch } = batches;
  const { monitorClass, setMonitorClass, fetchMonitorsData } = monitor;

  // Set default monitorClass from currentUser only if empty
  useEffect(() => {
    if (!monitorClass && currentUser?.lop) {
      setMonitorClass(currentUser.lop);
    }
  }, [currentUser?.lop, monitorClass, setMonitorClass]);

  // 2. Navigation, Filters, Sorting & Pagination
  const nav = useHomeNavigation({
    initialState,
    isAdmin: auth.isAdmin,
    canAccessMonitorTools: auth.canAccessMonitorTools,
    monitorClass,
    setMonitorClass,
    currentUser,
  });

  // 3. Exam Schedule & Records
  const examRecords = useHomeExamRecords({
    activeBatch,
    filters: nav.filters,
    sortConfig: nav.sortConfig,
    activeTab: nav.activeTab,
    effectiveUser: auth.effectiveUser,
    monitorClass,
    page: nav.page,
    pageSize: nav.pageSize,
  });

  // 4. Role Switching, Impersonation & Logout
  const authActions = useHomeAuthActions({
    currentUser,
    setCurrentUser,
    activeRole: auth.activeRole,
    setActiveRole: auth.setActiveRole,
    userRoles: auth.userRoles,
    activeTab: nav.activeTab,
    handleTabChange: nav.handleTabChange,
    setMonitorClass,
  });

  const { setIsMounted } = nav;
  const { setIsLoading } = examRecords;

  // Initial mount load
  useEffect(() => {
    setIsMounted(true);
    fetchPricingFromBackend().catch((err) => console.warn("[useHomeState] Non-fatal async error:", err));
    fetchMonitorsData().catch((err) => console.warn("[useHomeState] Non-fatal async error:", err));

    // Fetch batches
    fetch('/api/exam-batches')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.batches) {
          setExamBatches(d.batches);
          const active = d.batches.find((b: ExamBatchItem) => b.isActive);
          if (active) setActiveBatch(active);
        }
      })
      .catch((err) => console.warn("[useHomeState] Non-fatal async error:", err))
      .finally(() => setIsLoading(false));
  }, [fetchMonitorsData, setExamBatches, setActiveBatch, setIsMounted, setIsLoading]);

  const hasExamSchedule =
    batches.hasActiveBatch &&
    ((activeBatch?.totalRecords ?? 0) > 0 ||
      examRecords.totalRecords > 0 ||
      examRecords.records.length > 0);

  return {
    // Mounting & Loading
    isMounted: nav.isMounted,
    isLoading: examRecords.isLoading,
    setIsLoading: examRecords.setIsLoading,

    // Auth & Roles
    currentUser,
    setCurrentUser,
    effectiveUser: auth.effectiveUser,
    activeRole: auth.activeRole,
    setActiveRole: auth.setActiveRole,
    userRoles: auth.userRoles,
    isAdmin: auth.isAdmin,
    isMonitor: auth.isMonitor,
    canAccessMonitorTools: auth.canAccessMonitorTools,
    canImpersonate: auth.canImpersonate,
    authError: auth.authError,
    setAuthError: auth.setAuthError,
    isVerifyingAuth: auth.isVerifyingAuth,
    ...authActions,

    // Navigation & Tabs
    activeTab: nav.activeTab,
    setActiveTab: nav.setActiveTab,
    profileSubTab: nav.profileSubTab,
    setProfileSubTab: nav.setProfileSubTab,
    isMobileMenuOpen: nav.isMobileMenuOpen,
    setIsMobileMenuOpen: nav.setIsMobileMenuOpen,
    isProfileOpen: nav.isProfileOpen,
    setIsProfileOpen: nav.setIsProfileOpen,
    profileInitialTab: nav.profileInitialTab,
    setProfileInitialTab: nav.setProfileInitialTab,
    handleTabChange: nav.handleTabChange,

    // Batches
    examBatches: batches.examBatches,
    setExamBatches,
    activeBatch,
    setActiveBatch,
    hasActiveBatch: batches.hasActiveBatch,
    hasExamSchedule,

    // Schedule & Records
    records: examRecords.records,
    setRecords: examRecords.setRecords,
    baseRecords: examRecords.records,
    filteredRecords: examRecords.records,
    sessions: examRecords.sessions,
    setSessions: examRecords.setSessions,
    page: nav.page,
    setPage: nav.setPage,
    pageSize: nav.pageSize,
    setPageSize: nav.setPageSize,
    totalRecords: examRecords.totalRecords,
    totalPages: examRecords.totalPages,
    selectedExamRoom: nav.selectedExamRoom,
    setSelectedExamRoom: nav.setSelectedExamRoom,
    loadDataFromApi: examRecords.loadDataFromApi,
    handleToggleExamPostpone: examRecords.handleToggleExamPostpone,

    // Filters & Sorting
    filters: nav.filters,
    setFilters: nav.setFilters,
    searchInput: nav.searchInput,
    setSearchInput: nav.setSearchInput,
    sortConfig: nav.sortConfig,
    setSortConfig: nav.setSortConfig,
    classes: nav.filterMeta.classes,
    subjects: nav.filterMeta.subjects,
    dates: nav.filterMeta.dates,

    // Classes & Monitor
    monitorClass,
    setMonitorClass,
    loginUsers: monitor.loginUsers,
    setLoginUsers: monitor.setLoginUsers,
    confirmStudentId: monitor.confirmStudentId,
    setConfirmStudentId: monitor.setConfirmStudentId,
    confirmClassCode: monitor.confirmClassCode,
    setConfirmClassCode: monitor.setConfirmClassCode,
    isClassGroupOpen: monitor.isClassGroupOpen,
    setIsClassGroupOpen: monitor.setIsClassGroupOpen,
    isLoadingMonitors: monitor.isLoadingMonitors,
    fetchMonitorsData,

    // External Portal & Course Compare
    courseCompareData: externalPortal.courseCompareData,
    fetchCourseCompareData: externalPortal.fetchCourseCompareData,

    // Announcements
    announcements,
  };
}
