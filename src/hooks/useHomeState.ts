'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FilterState, SortKey, SortDirection } from '../features/exam-schedule';
import { ExamRecord, LoginUser, ExamSession, ExamBatchItem } from '../types';
import {
  NavigationTab,
  ProfileSubTab,
  TabChangeOptions,
  getInitialHomeState,
  getNavigationPath,
} from '../types/navigation';
import { buildSessions } from '../utils/dataModel';
import { fetchPricingFromBackend } from '../config/pricingConfig';
import { AnnouncementItem } from '../lib/announcements';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useExamBatches } from '../features/exam-schedule/hooks/useExamBatches';
import { useClassMonitor } from '../features/classes-monitor/hooks/useClassMonitor';
import { useExternalPortalData } from '../features/external-portal/hooks/useExternalPortalData';
import { useAnnouncements } from '../features/announcements/hooks/useAnnouncements';

export function useHomeState() {
  const initialState = useMemo(getInitialHomeState, []);

  // 1. Domain sub-hooks
  const {
    currentUser,
    setCurrentUser,
    activeRole,
    setActiveRole,
    userRoles,
    isAdmin,
    isMonitor,
    canAccessMonitorTools,
    canImpersonate,
    effectiveUser,
  } = useAuth();

  const {
    examBatches,
    setExamBatches,
    activeBatch,
    setActiveBatch,
    hasActiveBatch,
  } = useExamBatches();

  const {
    monitorClass,
    setMonitorClass,
    loginUsers,
    setLoginUsers,
    confirmStudentId,
    setConfirmStudentId,
    confirmClassCode,
    setConfirmClassCode,
    isClassGroupOpen,
    setIsClassGroupOpen,
    fetchMonitorsData,
  } = useClassMonitor(initialState.monitorClass);

  const {
    courseCompareData,
    fetchCourseCompareData,
  } = useExternalPortalData();

  const {
    announcements,
  } = useAnnouncements();

  // 2. Local Exam Schedule & Table States
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState<number>(initialState.page || 1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialState.tab);
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>(initialState.profileSubTab || 'OVERVIEW');
  const [isMounted, setIsMounted] = useState(false);

  // Filters & Sorting
  const [filters, setFilters] = useState<FilterState>({
    search: initialState.search,
    classCode: initialState.classCode,
    subjectCode: initialState.subjectCode,
    date: initialState.date,
  });
  const [searchInput, setSearchInput] = useState(initialState.search);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({
    key: initialState.sortKey,
    direction: initialState.sortDir,
  });
  const [selectedExamRoom, setSelectedExamRoom] = useState<ExamRecord | null>(null);

  const [filterMeta, setFilterMeta] = useState<{
    classes: string[];
    subjects: { code: string; name: string }[];
    dates: string[];
  }>({
    classes: [],
    subjects: [],
    dates: [],
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'PROFILE' | 'EXTERNAL_ACCOUNTS'>('PROFILE');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Impersonation state
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateTargetInput, setImpersonateTargetInput] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isRevertingImpersonate, setIsRevertingImpersonate] = useState(false);
  const [impersonateError, setImpersonateError] = useState('');

  // Reset page to 1 only when filter/sort criteria change after initial mount
  const isFirstFilterChange = useRef(true);
  useEffect(() => {
    if (isFirstFilterChange.current) {
      isFirstFilterChange.current = false;
      return;
    }
    setPage(1);
  }, [filters.search, filters.classCode, filters.subjectCode, filters.date, sortConfig]);

  const hasExamSchedule = hasActiveBatch && ((activeBatch?.totalRecords ?? 0) > 0 || totalRecords > 0 || records.length > 0);

  // Tab change handler
  const handleTabChange = useCallback(
    (
      tab: NavigationTab,
      subTab?: ProfileSubTab,
      options?: TabChangeOptions
    ) => {
      const adminOnlyTabs: NavigationTab[] = [
        'batches',
        'external_accounts_admin',
        'activity_logs',
        'telegram_admin',
        'user_registrations',
        'database_backup',
        'announcements_admin',
      ];
      if (adminOnlyTabs.includes(tab) && !isAdmin) {
        return;
      }
      const monitorOnlyTabs: NavigationTab[] = [
        'members',
        'monitor',
        'envelope',
        'envelope_all',
        'settlement',
      ];
      if (monitorOnlyTabs.includes(tab) && !canAccessMonitorTools) {
        return;
      }

      if (tab !== activeTab || options) {
        if (!options?.preserveFilters) {
          const newSearch = options?.search ?? '';
          const newClassCode = options?.classCode ?? '';
          const newSubjectCode = options?.subjectCode ?? '';
          const newDate = options?.date ?? '';
          const newPage = options?.page ?? 1;

          setSearchInput(newSearch);
          setFilters({
            search: newSearch,
            classCode: newClassCode,
            subjectCode: newSubjectCode,
            date: newDate,
          });
          setPage(newPage);
          setSelectedExamRoom(null);
          setSortConfig({ key: 'DateTime', direction: 'asc' });

          if (options?.monitorClass !== undefined) {
            setMonitorClass(options.monitorClass);
          } else if (tab === 'members' || tab === 'monitor') {
            if (!monitorClass && currentUser?.lop) {
              setMonitorClass(currentUser.lop);
            }
          }
        }
      }

      setActiveTab(tab);
      if (tab === 'profile') {
        if (subTab) {
          setProfileSubTab(subTab);
        }
      }
      setIsMobileMenuOpen(false);
    },
    [activeTab, isAdmin, canAccessMonitorTools, monitorClass, currentUser, setMonitorClass]
  );

  // Role select handler
  const handleSelectRole = useCallback((newRole: string) => {
    if (!userRoles.includes(newRole)) return;
    setActiveRole(newRole);
    if (currentUser) {
      localStorage.setItem('active_role_' + currentUser.username, newRole);
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'SWITCH_ROLE',
          targetType: 'ROLE',
          targetId: newRole,
          description: `Chuyển vai trò làm việc sang ${
            newRole === 'admin'
              ? '👑 Quản Trị Viên (Admin)'
              : newRole === 'lop_truong'
              ? '🛡️ Lớp Trưởng'
              : '🎓 Sinh Viên'
          }`,
          metadata: { previousRole: activeRole, newRole },
        }),
      }).catch(() => {});
    } catch {}

    if (newRole === 'sinh_vien') {
      const monitorAdminTabs: NavigationTab[] = [
        'batches',
        'external_accounts_admin',
        'activity_logs',
        'telegram_admin',
        'user_registrations',
        'database_backup',
        'members',
        'monitor',
        'envelope',
        'envelope_all',
        'settlement',
      ];
      if (monitorAdminTabs.includes(activeTab)) {
        handleTabChange('personal_schedule');
      }
    } else if (newRole === 'lop_truong') {
      const adminOnlyTabs: NavigationTab[] = [
        'batches',
        'external_accounts_admin',
        'activity_logs',
        'telegram_admin',
        'user_registrations',
        'database_backup',
      ];
      if (adminOnlyTabs.includes(activeTab)) {
        handleTabChange('members');
      }
    }
  }, [userRoles, setActiveRole, currentUser, activeRole, activeTab, handleTabChange]);

  // Load data from API for active batch
  const loadDataFromApi = useCallback(async (batchCodeArg?: string) => {
    setIsLoading(true);
    try {
      let currentBatchCode = batchCodeArg;
      if (!currentBatchCode && activeBatch) {
        currentBatchCode = activeBatch.code;
      }

      const params = new URLSearchParams();
      if (currentBatchCode && currentBatchCode !== 'ALL') {
        params.set('batchCode', currentBatchCode);
      }
      if (filters.search) params.set('search', filters.search);
      if (filters.classCode && filters.classCode !== 'ALL') params.set('classCode', filters.classCode);
      if (filters.subjectCode && filters.subjectCode !== 'ALL') params.set('subjectCode', filters.subjectCode);
      if (filters.date && filters.date !== 'ALL') params.set('date', filters.date);

      if (sortConfig?.key) {
        params.set('sortKey', sortConfig.key);
        params.set('sortDir', sortConfig.direction);
      }

      if (activeTab === 'personal_schedule' && effectiveUser?.username) {
        params.set('maSV', effectiveUser.username);
      }

      const isPagedTab = activeTab === 'schedule' || activeTab === 'personal_schedule';
      if (isPagedTab) {
        params.set('page', String(page));
        params.set('limit', String(pageSize));
      } else {
        params.set('all', 'true');
      }

      const res = await fetch(`/api/exam-records?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const rawRecords: ExamRecord[] = data.records || [];
        setRecords(rawRecords);
        setTotalRecords(data.total || rawRecords.length);
        setTotalPages(data.totalPages || 1);
        setSessions(buildSessions(rawRecords));
      }
    } catch (err) {
      console.error('Error loading exam records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeBatch, filters, sortConfig, activeTab, effectiveUser, page, pageSize]);

  // Toggle postponement
  const handleToggleExamPostpone = useCallback(
    async (record: ExamRecord, newStatus: boolean) => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const res = await fetch('/api/exam-records', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            id: record.id,
            maSV: record.MaSV,
            maMH: record.MaMH,
            mapThi: record.MAPTHI,
            ngayThi: record.NgayThi,
            gioThi: record.GioThi,
            isPostponed: newStatus,
          }),
        });

        if (res.ok) {
          setRecords((prev) =>
            prev.map((r) => {
              if (
                (record.id && r.id === record.id) ||
                (r.MaSV === record.MaSV &&
                  r.MaMH === record.MaMH &&
                  r.MAPTHI === record.MAPTHI &&
                  r.NgayThi === record.NgayThi &&
                  r.GioThi === record.GioThi)
              ) {
                return { ...r, isPostponed: newStatus };
              }
              return r;
            })
          );
        }
      } catch (err) {
        console.error('Error toggling postponement:', err);
      }
    },
    []
  );

  // Impersonate handlers
  const handleImpersonate = useCallback(async (targetUsername: string) => {
    setIsImpersonating(true);
    setImpersonateError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetUsername }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          if (data.user.lop) setMonitorClass(data.user.lop);
        }
        setShowImpersonateModal(false);
        setImpersonateTargetInput('');
        handleTabChange('schedule');
      } else {
        setImpersonateError(data.error || 'Giả lập tài khoản thất bại');
      }
    } catch (err: any) {
      setImpersonateError(err.message || 'Lỗi mạng khi giả lập tài khoản');
    } finally {
      setIsImpersonating(false);
    }
  }, [setCurrentUser, setMonitorClass, handleTabChange]);

  const handleRevertImpersonate = useCallback(async () => {
    setIsRevertingImpersonate(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/auth/revert-impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          if (data.user.lop) setMonitorClass(data.user.lop);
        }
        handleTabChange('schedule');
      }
    } catch (err) {
      console.error('Error reverting impersonation:', err);
    } finally {
      setIsRevertingImpersonate(false);
    }
  }, [setCurrentUser, setMonitorClass, handleTabChange]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    window.location.href = '/';
  }, [setCurrentUser]);

  // Initial mount load
  useEffect(() => {
    setIsMounted(true);
    fetchPricingFromBackend().catch(() => {});
    fetchMonitorsData().catch(() => {});

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
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [fetchMonitorsData, setExamBatches, setActiveBatch]);

  // Load records when active batch or filters change
  useEffect(() => {
    if (activeBatch) {
      loadDataFromApi();
    }
  }, [activeBatch, filters, sortConfig, page, pageSize, activeTab, loadDataFromApi]);

  // Sync browser URL
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    const url = getNavigationPath(activeTab, profileSubTab, {
      search: filters.search,
      classCode: filters.classCode,
      subjectCode: filters.subjectCode,
      date: filters.date,
      monitorClass,
      page,
    });
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [activeTab, profileSubTab, filters, monitorClass, page, isMounted]);

  return {
    // Mounting & Loading
    isMounted,
    isLoading,
    setIsLoading,

    // Auth & Roles
    currentUser,
    setCurrentUser,
    effectiveUser,
    activeRole,
    setActiveRole,
    userRoles,
    isAdmin,
    isMonitor,
    canAccessMonitorTools,
    canImpersonate,
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    handleSelectRole,
    handleLogout,

    // Impersonation
    showImpersonateModal,
    setShowImpersonateModal,
    impersonateTargetInput,
    setImpersonateTargetInput,
    isImpersonating,
    isRevertingImpersonate,
    impersonateError,
    setImpersonateError,
    handleImpersonate,
    handleRevertImpersonate,

    // Navigation & Tabs
    activeTab,
    setActiveTab,
    profileSubTab,
    setProfileSubTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isProfileOpen,
    setIsProfileOpen,
    profileInitialTab,
    setProfileInitialTab,
    handleTabChange,

    // Batches
    examBatches,
    setExamBatches,
    activeBatch,
    setActiveBatch,
    hasActiveBatch,
    hasExamSchedule,

    // Schedule & Records
    records,
    setRecords,
    baseRecords: records,
    filteredRecords: records,
    sessions,
    setSessions,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages,
    selectedExamRoom,
    setSelectedExamRoom,
    loadDataFromApi,
    handleToggleExamPostpone,

    // Filters & Sorting
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    sortConfig,
    setSortConfig,
    classes: filterMeta.classes,
    subjects: filterMeta.subjects,
    dates: filterMeta.dates,

    // Classes & Monitor
    monitorClass,
    setMonitorClass,
    loginUsers,
    setLoginUsers,
    confirmStudentId,
    setConfirmStudentId,
    confirmClassCode,
    setConfirmClassCode,
    isClassGroupOpen,
    setIsClassGroupOpen,
    fetchMonitorsData,

    // External Portal & Course Compare
    courseCompareData,
    fetchCourseCompareData,

    // Announcements
    announcements,
  };
}
