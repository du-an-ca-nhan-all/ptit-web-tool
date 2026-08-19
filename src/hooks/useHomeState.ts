'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FilterState } from '../components/FilterBar';
import { SortKey, SortDirection } from '../components/DataTable';
import { ExamRecord, LoginUser, ExamSession, ExamBatchItem } from '../types';
import { NavigationTab, getInitialHomeState } from '../types/navigation';
import { buildSessions } from '../utils/dataModel';
import { fetchPricingFromBackend } from '../config/pricingConfig';

export function useHomeState() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [examBatches, setExamBatches] = useState<ExamBatchItem[]>([]);
  const [activeBatch, setActiveBatch] = useState<ExamBatchItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states for server-side paginated tables (Schedule & Personal Schedule)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const initialState = useMemo(getInitialHomeState, []);
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialState.tab);

  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [monitorClass, setMonitorClass] = useState<string>(() => {
    if (initialState.monitorClass) return initialState.monitorClass;
    if (typeof window === 'undefined') return '';
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const u = JSON.parse(saved);
        return u.lop || '';
      }
    } catch {}
    return '';
  });
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
  const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null);
  const [confirmClassCode, setConfirmClassCode] = useState<string | null>(null);
  const [selectedExamRoom, setSelectedExamRoom] = useState<ExamRecord | null>(null);
  const [isClassGroupOpen, setIsClassGroupOpen] = useState(
    initialState.tab === 'members' || initialState.tab === 'monitor' || initialState.tab === 'envelope'
  );

  const [loginUsers, setLoginUsers] = useState<LoginUser[]>([]);
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

  // Reset page to 1 when filter/sort criteria change
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.classCode, filters.subjectCode, filters.date, sortConfig]);

  // User Available Roles
  const userRoles = useMemo(() => {
    if (!currentUser) return [];
    const set = new Set<string>();
    const rawRole = currentUser.role || '';
    if (rawRole.includes('admin') || currentUser.isAdmin) set.add('admin');
    if (rawRole.includes('lop_truong') || currentUser.isMonitor) set.add('lop_truong');
    set.add('sinh_vien');
    return Array.from(set);
  }, [currentUser]);

  const [activeRole, setActiveRole] = useState<string>(() => {
    if (typeof window === 'undefined') return 'sinh_vien';
    try {
      const savedUserStr = localStorage.getItem('currentUser');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u?.username) {
          const savedRole = localStorage.getItem('active_role_' + u.username);
          if (savedRole) return savedRole;
          const rawRole = u.role || '';
          if (rawRole.includes('admin') || u.isAdmin) return 'admin';
          if (rawRole.includes('lop_truong') || u.isMonitor) return 'lop_truong';
        }
      }
    } catch {}
    return 'sinh_vien';
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Sync activeRole with user selection / localStorage
  useEffect(() => {
    if (currentUser && userRoles.length > 0) {
      const savedRole = localStorage.getItem('active_role_' + currentUser.username);
      if (savedRole && userRoles.includes(savedRole)) {
        if (activeRole !== savedRole) {
          setActiveRole(savedRole);
        }
      } else if (!userRoles.includes(activeRole)) {
        const defaultRole = userRoles.includes('admin')
          ? 'admin'
          : userRoles.includes('lop_truong')
          ? 'lop_truong'
          : 'sinh_vien';
        setActiveRole(defaultRole);
      }
    }
  }, [currentUser, userRoles, activeRole]);

  const hasActiveBatch = useMemo(() => examBatches.some((b) => b.isActive), [examBatches]);
  const hasExamSchedule = hasActiveBatch && ((activeBatch?.totalRecords ?? 0) > 0 || totalRecords > 0 || records.length > 0);

  const handleSelectRole = (newRole: string) => {
    if (!userRoles.includes(newRole)) return;
    setActiveRole(newRole);
    if (currentUser) {
      localStorage.setItem('active_role_' + currentUser.username, newRole);
    }

    // Log client-side role switch action
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

    // Auto redirect tab if current tab is not accessible in the new role
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
        setActiveTab('personal_schedule');
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
        setActiveTab('members');
      }
    }
  };

  const isAdmin = activeRole === 'admin';
  const isMonitor = activeRole === 'lop_truong' || activeRole === 'admin';
  const canAccessMonitorTools = isMonitor || isAdmin;
  const canImpersonate = isAdmin || Boolean(currentUser?.impersonatedBy);

  const effectiveUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      role: activeRole,
      activeRole: activeRole,
      isAdmin: activeRole === 'admin',
      isMonitor: activeRole === 'lop_truong' || activeRole === 'admin',
    };
  }, [currentUser, activeRole]);

  const [courseCompareData, setCourseCompareData] = useState<{
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null>(null);
  const [showCourseCompare, setShowCourseCompare] = useState(false);

  // Impersonation (Admin login as another user) state
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonateTargetInput, setImpersonateTargetInput] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isRevertingImpersonate, setIsRevertingImpersonate] = useState(false);
  const [impersonateError, setImpersonateError] = useState('');

  const handleTabChange = (tab: NavigationTab) => {
    const adminOnlyTabs: NavigationTab[] = [
      'batches',
      'external_accounts_admin',
      'activity_logs',
      'telegram_admin',
      'user_registrations',
      'database_backup',
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
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const fetchMonitorsData = async () => {
    try {
      const monitorsRes = await fetch('/api/monitors');
      if (monitorsRes.ok) {
        const monData = await monitorsRes.json();
        if (monData.users) {
          setLoginUsers(monData.users);
        }
      }
    } catch (err) {
      console.error('Failed to load monitors:', err);
    }
  };

  // 1. Fetch initial light metadata (Auth, Batches, Monitors) in PARALLEL
  const loadInitialData = useCallback(async () => {
    setIsMounted(true);
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        if (u.lop) setMonitorClass(u.lop);
      } catch (e) {}
    }

    setIsLoading(true);
    try {
      const [authRes, batchesRes, monitorsRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/exam-batches').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/monitors').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetchPricingFromBackend().catch(() => null),
      ]);

      let user = currentUser;
      if (authRes?.user) {
        user = authRes.user;
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.lop) setMonitorClass(user.lop);
      }

      let active: any = null;
      if (batchesRes?.batches) {
        setExamBatches(batchesRes.batches);
        active = batchesRes.batches.find((b: any) => b.isActive) || null;
        setActiveBatch(active);
      }

      if (monitorsRes?.users) {
        setLoginUsers(monitorsRes.users);
      }

      const initialUrlState = getInitialHomeState();
      const currentTab = initialUrlState.tab;
      const initialMonitorClass = initialUrlState.monitorClass || initialUrlState.classCode || user?.lop || '';
      const batchCode = active?.code;

      // Fast fetch filter metadata if active batch exists
      if (batchCode) {
        fetch(`/api/exam-records?distinct=true&batchCode=${encodeURIComponent(batchCode)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d) {
              setFilterMeta({
                classes: d.classes || [],
                subjects: (d.subjects || []).map((s: string) => {
                  const [code, ...nameParts] = s.split(' - ');
                  return { code: code.trim(), name: nameParts.join(' - ').trim() || code.trim() };
                }),
                dates: d.dates || [],
              });
            }
          })
          .catch(() => {});
      }

      // Targeted Paged Fetching on Initial Load
      if (currentTab === 'personal_schedule' && user?.username && batchCode) {
        const params = new URLSearchParams({
          page: '1',
          limit: String(pageSize),
          batchCode,
          maSV: user.username,
        });
        if (initialUrlState.search) params.set('search', initialUrlState.search);
        if (initialUrlState.subjectCode) params.set('subjectCode', initialUrlState.subjectCode);
        if (initialUrlState.date) params.set('date', initialUrlState.date);

        const recordsRes = await fetch(`/api/exam-records?${params.toString()}`);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || 0);
          setTotalPages(recData.totalPages || 1);
          setSessions(buildSessions(rawRecords));
        }
      } else if (currentTab === 'schedule' && batchCode) {
        const params = new URLSearchParams({
          page: '1',
          limit: String(pageSize),
          batchCode,
        });
        if (initialUrlState.classCode) params.set('classCode', initialUrlState.classCode);
        if (initialUrlState.subjectCode) params.set('subjectCode', initialUrlState.subjectCode);
        if (initialUrlState.date) params.set('date', initialUrlState.date);
        if (initialUrlState.search) params.set('search', initialUrlState.search);

        const recordsRes = await fetch(`/api/exam-records?${params.toString()}`);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || 0);
          setTotalPages(recData.totalPages || 1);
          setSessions(buildSessions(rawRecords));
        }
      } else if (['envelope', 'monitor', 'members'].includes(currentTab)) {
        if (initialMonitorClass && batchCode) {
          const recordsRes = await fetch(
            `/api/exam-records?all=true&classCode=${encodeURIComponent(initialMonitorClass)}&batchCode=${encodeURIComponent(batchCode)}`
          );
          if (recordsRes.ok) {
            const recData = await recordsRes.json();
            const rawRecords: ExamRecord[] = recData.records || [];
            setRecords(rawRecords);
            setTotalRecords(recData.total || rawRecords.length);
            setTotalPages(1);
            setSessions(buildSessions(rawRecords));
          }
        }
      } else if (['envelope_all', 'settlement'].includes(currentTab) && batchCode) {
        const recordsRes = await fetch(`/api/exam-records?all=true&batchCode=${encodeURIComponent(batchCode)}`);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || rawRecords.length);
          setTotalPages(1);
          setSessions(buildSessions(rawRecords));
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // 2. Fetch Data from PostgreSQL Backend API (used on batch switch or full reload)
  const loadDataFromApi = useCallback(async (selectedBatchCode?: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch batches
      const batchesRes = await fetch('/api/exam-batches');
      let currentBatchCode = selectedBatchCode;
      if (batchesRes.ok) {
        const batchData = await batchesRes.json();
        if (batchData.batches) {
          setExamBatches(batchData.batches);
          const active = batchData.batches.find((b: any) => b.isActive) || null;
          setActiveBatch(active);
          if (currentBatchCode === undefined && active) {
            currentBatchCode = active.code;
          }
        }
      }

      // 2. Fetch users / monitors
      fetchMonitorsData();

      // 3. Fetch filter metadata
      if (currentBatchCode && currentBatchCode !== 'ALL') {
        fetch(`/api/exam-records?distinct=true&batchCode=${encodeURIComponent(currentBatchCode)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d) {
              setFilterMeta({
                classes: d.classes || [],
                subjects: (d.subjects || []).map((s: string) => {
                  const [code, ...nameParts] = s.split(' - ');
                  return { code: code.trim(), name: nameParts.join(' - ').trim() || code.trim() };
                }),
                dates: d.dates || [],
              });
            }
          })
          .catch(() => {});
      }

      // 4. Fetch exam records from DB
      const isPersonal = activeTab === 'personal_schedule' && Boolean(currentUser?.username);
      const isSchedule = activeTab === 'schedule';
      const isClassSpecific = ['envelope', 'monitor', 'members'].includes(activeTab);
      const targetClass = monitorClass || filters.classCode || currentUser?.lop || '';

      if (isPersonal && currentUser?.username) {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          maSV: currentUser.username,
        });
        if (currentBatchCode && currentBatchCode !== 'ALL') params.set('batchCode', currentBatchCode);
        if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
        if (filters.date) params.set('date', filters.date);
        if (filters.search) params.set('search', filters.search);
        if (sortConfig?.key) {
          params.set('sortKey', sortConfig.key);
          params.set('sortDir', sortConfig.direction);
        }

        const recordsRes = await fetch(`/api/exam-records?${params.toString()}`);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || 0);
          setTotalPages(recData.totalPages || 1);
          setSessions(buildSessions(rawRecords));
        }
      } else if (isSchedule) {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (currentBatchCode && currentBatchCode !== 'ALL') params.set('batchCode', currentBatchCode);
        if (filters.classCode) params.set('classCode', filters.classCode);
        if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
        if (filters.date) params.set('date', filters.date);
        if (filters.search) params.set('search', filters.search);
        if (sortConfig?.key) {
          params.set('sortKey', sortConfig.key);
          params.set('sortDir', sortConfig.direction);
        }

        const recordsRes = await fetch(`/api/exam-records?${params.toString()}`);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || 0);
          setTotalPages(recData.totalPages || 1);
          setSessions(buildSessions(rawRecords));
        }
      } else if (isClassSpecific && targetClass) {
        const url = currentBatchCode && currentBatchCode !== 'ALL'
          ? `/api/exam-records?all=true&classCode=${encodeURIComponent(targetClass)}&batchCode=${encodeURIComponent(currentBatchCode)}`
          : `/api/exam-records?all=true&classCode=${encodeURIComponent(targetClass)}`;
        const recordsRes = await fetch(url);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || rawRecords.length);
          setTotalPages(1);
          setSessions(buildSessions(rawRecords));
        }
      } else if (['envelope_all', 'settlement'].includes(activeTab)) {
        const url = currentBatchCode && currentBatchCode !== 'ALL'
          ? `/api/exam-records?all=true&batchCode=${encodeURIComponent(currentBatchCode)}`
          : '/api/exam-records?all=true';
        const recordsRes = await fetch(url);
        if (recordsRes.ok) {
          const recData = await recordsRes.json();
          const rawRecords: ExamRecord[] = recData.records || [];
          setRecords(rawRecords);
          setTotalRecords(recData.total || rawRecords.length);
          setTotalPages(1);
          setSessions(buildSessions(rawRecords));
        }
      }
    } catch (err) {
      console.error('Failed to load data from PostgreSQL API:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentUser, monitorClass, filters, sortConfig, page, pageSize]);

  const handleImpersonate = async (targetUsername: string) => {
    if (!targetUsername) return;
    setIsImpersonating(true);
    setImpersonateError('');
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: targetUsername.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user.lop) {
          setMonitorClass(data.user.lop);
        }
        setShowImpersonateModal(false);
        setImpersonateTargetInput('');
        await loadDataFromApi();
      } else {
        setImpersonateError(data.error || 'Đăng nhập giả lập thất bại');
      }
    } catch (err: any) {
      setImpersonateError('Lỗi kết nối máy chủ khi chuyển phiên đăng nhập');
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleRevertImpersonate = async () => {
    setIsRevertingImpersonate(true);
    try {
      const res = await fetch('/api/auth/revert-impersonate', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user.lop) {
          setMonitorClass(data.user.lop);
        }
        await loadDataFromApi();
      } else {
        alert(data.error || 'Không thể quay lại tài khoản Admin');
      }
    } catch (err) {
      alert('Lỗi kết nối khi thoát phiên giả lập');
    } finally {
      setIsRevertingImpersonate(false);
    }
  };

  const handleToggleExamPostpone = useCallback(
    async (record: ExamRecord, newStatus: boolean) => {
      // 1. Optimistic state update in memory
      setRecords((prev) => {
        const next = prev.map((r) => {
          const isMatch =
            (record.id !== undefined && r.id !== undefined && r.id === record.id) ||
            (String(r.MaSV || '').trim().toUpperCase() === String(record.MaSV || '').trim().toUpperCase() &&
              String(r.MaMH || '').trim() === String(record.MaMH || '').trim() &&
              String(r.MAPTHI || '').trim() === String(record.MAPTHI || '').trim() &&
              String(r.NgayThi || '').trim() === String(record.NgayThi || '').trim() &&
              String(r.GioThi || '').trim() === String(record.GioThi || '').trim());
          if (isMatch) {
            return { ...r, isPostponed: newStatus };
          }
          return r;
        });
        setSessions(buildSessions(next));
        return next;
      });

      // 2. Persist to API
      try {
        const res = await fetch('/api/exam-records', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn('API sync warning:', err);
        }
      } catch (e: any) {
        console.error('Failed to sync exam postpone to server:', e);
      }
    },
    []
  );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Lazy load exam records with Server-Side Pagination when navigating tabs or changing filters
  useEffect(() => {
    const batchCode = activeBatch?.code;
    if (!batchCode) return;

    const isPaginatedView = activeTab === 'schedule' || activeTab === 'personal_schedule';
    const isClassSpecific = ['envelope', 'monitor', 'members'].includes(activeTab);
    const targetClass = monitorClass || filters.classCode || currentUser?.lop || '';

    if (isPaginatedView) {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (batchCode !== 'ALL') params.set('batchCode', batchCode);
      if (activeTab === 'personal_schedule' && currentUser?.username) {
        params.set('maSV', currentUser.username);
      }
      if (filters.classCode) params.set('classCode', filters.classCode);
      if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
      if (filters.date) params.set('date', filters.date);
      if (filters.search) params.set('search', filters.search);
      if (sortConfig?.key) {
        params.set('sortKey', sortConfig.key);
        params.set('sortDir', sortConfig.direction);
      }

      fetch(`/api/exam-records?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((recData) => {
          if (recData) {
            const rawRecords: ExamRecord[] = recData.records || [];
            setRecords(rawRecords);
            setTotalRecords(recData.total || 0);
            setTotalPages(recData.totalPages || 1);
            setSessions(buildSessions(rawRecords));
          }
        })
        .catch((err) => console.error('Fetch paginated exam records error:', err))
        .finally(() => setIsLoading(false));
    } else if (isClassSpecific && targetClass) {
      setIsLoading(true);
      fetch(
        `/api/exam-records?all=true&classCode=${encodeURIComponent(targetClass)}&batchCode=${encodeURIComponent(batchCode)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((recData) => {
          if (recData?.records) {
            const rawRecords: ExamRecord[] = recData.records || [];
            setRecords(rawRecords);
            setTotalRecords(recData.total || rawRecords.length);
            setTotalPages(1);
            setSessions(buildSessions(rawRecords));
          }
        })
        .catch((err) => console.error('Lazy load class exam records error:', err))
        .finally(() => setIsLoading(false));
    } else if (['envelope_all', 'settlement'].includes(activeTab)) {
      setIsLoading(true);
      fetch(`/api/exam-records?all=true&batchCode=${encodeURIComponent(batchCode)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((recData) => {
          if (recData?.records) {
            const rawRecords: ExamRecord[] = recData.records || [];
            setRecords(rawRecords);
            setTotalRecords(recData.total || rawRecords.length);
            setTotalPages(1);
            setSessions(buildSessions(rawRecords));
          }
        })
        .catch((err) => console.error('Lazy load full exam records error:', err))
        .finally(() => setIsLoading(false));
    }
  }, [
    activeTab,
    activeBatch?.code,
    currentUser?.username,
    monitorClass,
    filters.classCode,
    filters.subjectCode,
    filters.date,
    filters.search,
    sortConfig?.key,
    sortConfig?.direction,
    page,
    pageSize,
  ]);

  // Role-based tab protection: ensure users only stay on tabs they have permission to access
  useEffect(() => {
    if (!isMounted || !currentUser) return;
    const adminOnlyTabs: NavigationTab[] = [
      'batches',
      'external_accounts_admin',
      'activity_logs',
      'telegram_admin',
      'user_registrations',
      'database_backup',
    ];
    const monitorOnlyTabs: NavigationTab[] = [
      'members',
      'monitor',
      'envelope',
      'envelope_all',
      'settlement',
    ];

    if (!isAdmin && adminOnlyTabs.includes(activeTab)) {
      setActiveTab(canAccessMonitorTools ? 'members' : 'personal_schedule');
    } else if (!canAccessMonitorTools && monitorOnlyTabs.includes(activeTab)) {
      setActiveTab('personal_schedule');
    }
  }, [isMounted, currentUser, isAdmin, canAccessMonitorTools, activeTab]);

  useEffect(() => {
    setSelectedExamRoom(null);
  }, [activeTab]);

  // Load Course Compare Data from DB API only when course_compare tab is active
  const fetchCourseCompareData = useCallback(() => {
    const classCode = currentUser?.lop || monitorClass || 'D25TXCN11-K';

    if (currentUser && activeTab === 'course_compare') {
      fetch(`/api/course-compare?classCode=${encodeURIComponent(classCode)}&username=${encodeURIComponent(currentUser.username)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.hasData) {
            setCourseCompareData({
              main: data.main,
              subAccount: data.subAccount,
              allSubAccounts: data.allSubAccounts,
            });
            setShowCourseCompare(true);
          } else {
            setShowCourseCompare(false);
            setCourseCompareData(null);
          }
        })
        .catch(() => {
          setShowCourseCompare(false);
          setCourseCompareData(null);
        });
    }
  }, [currentUser, monitorClass, activeTab]);

  useEffect(() => {
    if (activeTab === 'course_compare') {
      fetchCourseCompareData();
    }
  }, [fetchCourseCompareData, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Sync state to URL search parameters (e.g. /?tab=personal_schedule) without #
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (filters.search) params.set('search', filters.search);
    if (filters.classCode) params.set('classCode', filters.classCode);
    if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
    if (filters.date) params.set('date', filters.date);
    if (monitorClass) params.set('monitorClass', monitorClass);
    if (sortConfig && sortConfig.key && (sortConfig.key !== 'DateTime' || sortConfig.direction !== 'asc')) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }
    if (page > 1) params.set('page', String(page));

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    const currentQuery = window.location.search.replace(/^\?/, '');

    if (currentQuery !== queryString || window.location.hash !== '') {
      window.history.replaceState(null, '', newUrl);
    }
  }, [isMounted, activeTab, filters, monitorClass, sortConfig, page]);

  // Sync state from URL search params on browser navigation (back/forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleLocationChange = () => {
      const state = getInitialHomeState();
      setActiveTab(state.tab);
      setFilters((prev) => ({
        ...prev,
        search: state.search,
        classCode: state.classCode,
        subjectCode: state.subjectCode,
        date: state.date,
      }));
      setSearchInput(state.search);
      setMonitorClass(state.monitorClass);
      setSortConfig({ key: state.sortKey, direction: state.sortDir });
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Filter dropdown options
  const classes = useMemo(() => {
    if (filterMeta.classes && filterMeta.classes.length > 0) {
      return filterMeta.classes;
    }
    if (records.length > 0) {
      const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
      return Array.from(cls).sort();
    }
    return [];
  }, [records, filterMeta.classes]);

  const subjects = useMemo(() => {
    if (filterMeta.subjects && filterMeta.subjects.length > 0) {
      return filterMeta.subjects;
    }
    if (records.length > 0) {
      const subs = new Map<string, string>();
      records.forEach((r) => {
        if (r.MaMH && r.TenMH) {
          subs.set(r.MaMH, r.TenMH);
        }
      });
      return Array.from(subs.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }
    return [];
  }, [records, filterMeta.subjects]);

  const dates = useMemo(() => {
    if (filterMeta.dates && filterMeta.dates.length > 0) {
      return filterMeta.dates;
    }
    if (records.length > 0) {
      const dts = new Set<string>(records.map((r) => r.NgayThi).filter(Boolean));
      return Array.from(dts).sort((a, b) => {
        const [d1, m1, y1] = a.split('/').map(Number);
        const [d2, m2, y2] = b.split('/').map(Number);
        if (y1 !== y2) return (y1 || 0) - (y2 || 0);
        if (m1 !== m2) return (m1 || 0) - (m2 || 0);
        return (d1 || 0) - (d2 || 0);
      });
    }
    return [];
  }, [records, filterMeta.dates]);

  const baseRecords = useMemo(() => {
    if (activeTab === 'personal_schedule' && currentUser) {
      return records.filter((r) => r.MaSV?.toUpperCase() === currentUser.username?.toUpperCase());
    }
    return records;
  }, [records, activeTab, currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
  };

  return {
    records,
    setRecords,
    sessions,
    setSessions,
    examBatches,
    setExamBatches,
    activeBatch,
    setActiveBatch,
    isLoading,
    setIsLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages,
    activeTab,
    setActiveTab,
    isMounted,
    currentUser,
    setCurrentUser,
    monitorClass,
    setMonitorClass,
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    sortConfig,
    setSortConfig,
    confirmStudentId,
    setConfirmStudentId,
    confirmClassCode,
    setConfirmClassCode,
    selectedExamRoom,
    setSelectedExamRoom,
    isClassGroupOpen,
    setIsClassGroupOpen,
    loginUsers,
    setLoginUsers,
    filterMeta,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isProfileOpen,
    setIsProfileOpen,
    profileInitialTab,
    setProfileInitialTab,
    userRoles,
    activeRole,
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    courseCompareData,
    showCourseCompare,
    showImpersonateModal,
    setShowImpersonateModal,
    impersonateTargetInput,
    setImpersonateTargetInput,
    isImpersonating,
    isRevertingImpersonate,
    impersonateError,
    setImpersonateError,
    isAdmin,
    isMonitor,
    canAccessMonitorTools,
    canImpersonate,
    effectiveUser,
    hasActiveBatch,
    hasExamSchedule,
    baseRecords,
    filteredRecords: records,
    classes,
    subjects,
    dates,
    handleSelectRole,
    handleTabChange,
    handleImpersonate,
    handleRevertImpersonate,
    fetchMonitorsData,
    loadInitialData,
    loadDataFromApi,
    handleToggleExamPostpone,
    fetchCourseCompareData,
    handleLogout,
  };
}
