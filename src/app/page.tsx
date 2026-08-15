'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Crown,
  ArrowLeftRight,
  LogOut,
  Users,
  Search,
  Download,
  ChevronDown,
  Mail,
  User,
  BookOpen,
  Menu,
  X,
  DollarSign,
  Database,
  RefreshCw,
  Layers,
  Power,
  Globe,
  UserCheck,
  ArrowRightLeft,
  ShieldAlert,
  GraduationCap,
  Check,
  History,
} from 'lucide-react';
import UploadSection from '../components/UploadSection';
import FilterBar, { FilterState } from '../components/FilterBar';
import DataTable, { SortKey, SortDirection } from '../components/DataTable';
import ClassMonitorTools from '../components/ClassMonitorTools';
import ClassMembers from '../components/ClassMembers';
import RoomEnvelopeManager from '../components/RoomEnvelopeManager';
import AllMonitorsEnvelopes from '../components/AllMonitorsEnvelopes';
import LoginScreen from '../components/LoginScreen';
import ExamRoomMembers from '../components/ExamRoomMembers';
import MonitorsList from '../components/MonitorsList';
import CourseCompare from '../components/CourseCompare';
import SettlementManager from '../components/SettlementManager';
import UserProfileScreen from '../components/UserProfileScreen';
import StudentCourseRegistration from '../components/StudentCourseRegistration';
import ExamBatchManagement from '../components/ExamBatchManagement';
import AdminExternalAccounts from '../components/AdminExternalAccounts';
import ActivityLogsManager from '../components/ActivityLogsManager';
import { ExamRecord, LoginUser, ExamSession, ExamBatchItem } from '../types';
import { buildSessions } from '../utils/dataModel';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      tab: 'personal_schedule' as const,
      search: '',
      classCode: '',
      subjectCode: '',
      date: '',
      monitorClass: '',
      sortKey: 'DateTime' as SortKey,
      sortDir: 'asc' as SortDirection,
    };
  }
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  return {
    tab:
      (params.get('tab') as
        | 'schedule'
        | 'personal_schedule'
        | 'profile'
        | 'registered_courses'
        | 'monitor'
        | 'members'
        | 'envelope'
        | 'envelope_all'
        | 'settlement'
        | 'settings'
        | 'monitors_list'
        | 'batches'
        | 'external_accounts_admin'
        | 'activity_logs'
        | 'course_compare') || 'personal_schedule',
    search: params.get('search') || '',
    classCode: params.get('classCode') || '',
    subjectCode: params.get('subjectCode') || '',
    date: params.get('date') || '',
    monitorClass: params.get('monitorClass') || '',
    sortKey: (params.get('sortKey') as SortKey) || 'DateTime',
    sortDir: (params.get('sortDir') as SortDirection) || 'asc',
  };
};

export default function Home() {
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [examBatches, setExamBatches] = useState<ExamBatchItem[]>([]);
  const [activeBatch, setActiveBatch] = useState<ExamBatchItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initialState = useMemo(getInitialState, []);
  const [activeTab, setActiveTab] = useState<
    | 'schedule'
    | 'personal_schedule'
    | 'profile'
    | 'registered_courses'
    | 'monitor'
    | 'members'
    | 'envelope'
    | 'envelope_all'
    | 'settlement'
    | 'settings'
    | 'monitors_list'
    | 'batches'
    | 'external_accounts_admin'
    | 'activity_logs'
    | 'course_compare'
  >(initialState.tab as any);

  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);

  const [monitorClass, setMonitorClass] = useState<string>(
    initialState.monitorClass || ''
  );
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'PROFILE' | 'EXTERNAL_ACCOUNTS'>('PROFILE');

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

  const [activeRole, setActiveRole] = useState<string>('admin');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Sync activeRole with user selection / localStorage
  useEffect(() => {
    if (currentUser && userRoles.length > 0) {
      const savedRole = localStorage.getItem('active_role_' + currentUser.username);
      if (savedRole && userRoles.includes(savedRole)) {
        setActiveRole(savedRole);
      } else {
        const defaultRole = userRoles.includes('admin')
          ? 'admin'
          : userRoles.includes('lop_truong')
          ? 'lop_truong'
          : 'sinh_vien';
        setActiveRole(defaultRole);
      }
    }
  }, [currentUser, userRoles]);

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
      const monitorAdminTabs = ['batches', 'external_accounts_admin', 'activity_logs', 'members', 'monitor', 'envelope', 'envelope_all', 'settlement', 'monitors_list'];
      if (monitorAdminTabs.includes(activeTab)) {
        setActiveTab(hasExamSchedule ? 'personal_schedule' : 'registered_courses');
      }
    } else if (newRole === 'lop_truong') {
      const adminOnlyTabs = ['batches', 'external_accounts_admin', 'activity_logs'];
      if (adminOnlyTabs.includes(activeTab)) {
        setActiveTab('members');
      }
    }
  };

  const isAdmin = activeRole === 'admin';
  const isMonitor = activeRole === 'lop_truong' || activeRole === 'admin';
  const canAccessMonitorTools = isMonitor || isAdmin;

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

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

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

  // 1. Fetch Auth Session & mount from Server
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        if (u.lop) setMonitorClass(u.lop);
      } catch (e) {}
    }

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          if (data.user.lop) {
            setMonitorClass(data.user.lop);
          }
        }
      })
      .catch((err) => console.warn('Auth check error:', err));
  }, []);

  // 2. Fetch Data from SQLite Backend API
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
      const monitorsRes = await fetch('/api/monitors');
      if (monitorsRes.ok) {
        const monData = await monitorsRes.json();
        if (monData.users) {
          setLoginUsers(monData.users);
        }
      }

      // 3. Fetch exam records from DB (filtered by batchCode if available)
      const url = currentBatchCode && currentBatchCode !== 'ALL'
        ? `/api/exam-records?all=true&batchCode=${encodeURIComponent(currentBatchCode)}`
        : '/api/exam-records?all=true';
      const recordsRes = await fetch(url);
      if (recordsRes.ok) {
        const recData = await recordsRes.json();
        const rawRecords: ExamRecord[] = recData.records || [];
        setRecords(rawRecords);
        setSessions(buildSessions(rawRecords));
      }
    } catch (err) {
      console.error('Failed to load data from SQLite API:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasActiveBatch = useMemo(() => examBatches.some((b) => b.isActive), [examBatches]);
  const hasExamSchedule = hasActiveBatch && records.length > 0;

  useEffect(() => {
    loadDataFromApi();
  }, [loadDataFromApi]);

  useEffect(() => {
    if (!isMounted || !currentUser) return;
    if (!isAdmin && activeTab === 'batches') {
      setActiveTab('members');
    }
    if (!canAccessMonitorTools && ['monitor', 'envelope', 'envelope_all', 'settlement', 'settings'].includes(activeTab)) {
      setActiveTab('members');
    }
    if (!hasExamSchedule && ['schedule', 'personal_schedule', 'envelope', 'envelope_all', 'settlement'].includes(activeTab)) {
      setActiveTab(isAdmin ? 'batches' : 'members');
    }
  }, [isMounted, currentUser, isAdmin, canAccessMonitorTools, hasExamSchedule, activeTab]);

  useEffect(() => {
    setSelectedExamRoom(null);
  }, [activeTab]);

  // Load Course Compare Data from DB API
  const fetchCourseCompareData = useCallback(() => {
    const classCode = currentUser?.lop || monitorClass || 'D25TXCN11-K';

    if (currentUser) {
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
  }, [currentUser, monitorClass]);

  useEffect(() => {
    fetchCourseCompareData();
  }, [fetchCourseCompareData, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Sync state to URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (activeTab !== 'schedule') params.set('tab', activeTab);
    if (filters.search) params.set('search', filters.search);
    if (filters.classCode) params.set('classCode', filters.classCode);
    if (filters.subjectCode) params.set('subjectCode', filters.subjectCode);
    if (filters.date) params.set('date', filters.date);
    if (monitorClass) params.set('monitorClass', monitorClass);
    if (sortConfig && sortConfig.key) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDir', sortConfig.direction);
    }

    const newHash = params.toString();
    const newUrl = newHash ? `#${newHash}` : window.location.pathname;

    if (window.location.hash !== `#${newHash}` && newHash !== '') {
      window.history.replaceState(null, '', newUrl);
    } else if (newHash === '' && window.location.hash !== '') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeTab, filters, monitorClass, sortConfig]);

  // Sync state from URL hash on browser navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const state = getInitialState();
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
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Extract unique values for filters
  const baseRecords = useMemo(() => {
    if (activeTab === 'personal_schedule' && currentUser) {
      return records.filter((r) => r.MaSV?.toUpperCase() === currentUser.username?.toUpperCase());
    }
    return records;
  }, [records, activeTab, currentUser]);

  const classes = useMemo(() => {
    const cls = new Set(baseRecords.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [baseRecords]);

  const subjects = useMemo(() => {
    const subs = new Map<string, string>();
    baseRecords.forEach((r) => {
      if (r.MaMH && r.TenMH) {
        subs.set(r.MaMH, r.TenMH);
      }
    });
    return Array.from(subs.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [baseRecords]);

  const dates = useMemo(() => {
    const dts = new Set<string>(baseRecords.map((r) => r.NgayThi).filter(Boolean));
    return Array.from(dts).sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      if (y1 !== y2) return (y1 || 0) - (y2 || 0);
      if (m1 !== m2) return (m1 || 0) - (m2 || 0);
      return (d1 || 0) - (d2 || 0);
    });
  }, [baseRecords]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    const normalizeString = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
    };

    return baseRecords.filter((record) => {
      const searchStr = normalizeString(filters.search);
      const studentId = normalizeString(record.MaSV || '');
      const studentName = normalizeString(`${record.HoLotSV || ''} ${record.TenSV || ''}`.replace(/\s+/g, ' '));
      const subjectName = normalizeString(record.TenMH || '');

      const matchSearch =
        !searchStr ||
        studentId.includes(searchStr) ||
        studentName.includes(searchStr) ||
        subjectName.includes(searchStr);

      const matchClass = !filters.classCode || record.MaLop === filters.classCode;
      const matchSubject = !filters.subjectCode || record.MaMH === filters.subjectCode;
      const matchDate = !filters.date || record.NgayThi === filters.date;

      return matchSearch && matchClass && matchSubject && matchDate;
    });
  }, [baseRecords, filters]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
  };

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full bg-[#0F172A] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Đang khởi động PTIT EduSync...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        users={loginUsers}
        records={records}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          if (user.lop) setMonitorClass(user.lop);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden relative">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-[#0F172A] flex flex-col shrink-0 transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/30">
              P
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight">PTIT EduSync</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <Database className="w-2.5 h-2.5" /> SQLite Server-Side
              </div>
            </div>
          </div>

          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 scrollbar-hide">
          {/* 0. Hồ sơ cá nhân */}
          {currentUser && (
            <button
              onClick={() => handleTabChange('profile')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <User className="w-4 h-4" /> Hồ Sơ Cá Nhân
            </button>
          )}

          {/* 1. Lịch thi tổng hợp (Chỉ hiển thị khi có lịch thi) */}
          {hasExamSchedule && (
            <button
              onClick={() => handleTabChange('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Lịch Thi Tổng Hợp
            </button>
          )}

          {/* 2. Lịch thi cá nhân (Chỉ hiển thị khi có lịch thi) */}
          {currentUser && hasExamSchedule && (
            <button
              onClick={() => handleTabChange('personal_schedule')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'personal_schedule'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <User className="w-4 h-4" /> Lịch Thi Cá Nhân
            </button>
          )}

          {/* 3. Thành viên lớp mình */}
          {currentUser && !isMonitor && (
            <button
              onClick={() => {
                if (currentUser.lop) setMonitorClass(currentUser.lop);
                handleTabChange('members');
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'members'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4" /> Thành Viên Lớp Mình
            </button>
          )}

          {/* 4. Môn học đã đăng ký */}
          {currentUser && (
            <button
              onClick={() => handleTabChange('registered_courses')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'registered_courses'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" /> Môn Học Đã Đăng Ký
            </button>
          )}

          {/* 5. So sánh ĐKMH */}
          {currentUser && (
            <button
              onClick={() => handleTabChange('course_compare')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'course_compare'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" /> So Sánh ĐKMH
            </button>
          )}

          {/* 5. Danh sách lớp trưởng */}
          <button
            onClick={() => handleTabChange('monitors_list')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors mt-2 ${
              activeTab === 'monitors_list'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Crown className="w-4 h-4" /> Danh Sách Lớp Trưởng
          </button>

          {/* 6. Công cụ Admin & Lớp Trưởng */}
          {canAccessMonitorTools && (
            <div className="mt-4 flex flex-col gap-1">
              <div
                className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between cursor-pointer hover:text-slate-300"
                onClick={() => setIsClassGroupOpen(!isClassGroupOpen)}
              >
                {isAdmin ? (isMonitor ? 'Công Cụ Admin & Lớp Trưởng' : 'Công Cụ Quản Trị Viên') : 'Công cụ lớp trưởng'}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isClassGroupOpen ? 'rotate-180' : ''}`}
                />
              </div>
              {isClassGroupOpen && (
                <div className="pl-2 flex flex-col gap-1 mt-1 border-l-2 border-slate-800 ml-5">
                  <button
                    onClick={() => handleTabChange('members')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      activeTab === 'members'
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Danh Sách Lớp
                  </button>

                  {/* PB Lớp Mình (Chỉ hiển thị khi có lịch thi) */}
                  {hasExamSchedule && (
                    <button
                      onClick={() => handleTabChange('envelope')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        activeTab === 'envelope'
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <Mail className="w-4 h-4" /> PB Lớp Mình
                    </button>
                  )}

                  {/* PB Lớp Khác (Chỉ hiển thị khi có lịch thi) */}
                  {hasExamSchedule && (
                    <button
                      onClick={() => handleTabChange('envelope_all')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        activeTab === 'envelope_all'
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" /> PB Lớp Khác
                    </button>
                  )}

                  {/* Bù Trừ Thanh Toán (Chỉ hiển thị khi có lịch thi) */}
                  {hasExamSchedule && (
                    <button
                      onClick={() => handleTabChange('settlement')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                        activeTab === 'settlement'
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" /> Bù Trừ Thanh Toán
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleTabChange('batches')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                          activeTab === 'batches'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-indigo-400" /> Quản Lý Đợt Thi
                      </button>

                      <button
                        onClick={() => handleTabChange('external_accounts_admin')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                          activeTab === 'external_accounts_admin'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <Globe className="w-4 h-4 text-indigo-400" /> Tài Khoản QLĐT Từ Xa
                      </button>

                      <button
                        onClick={() => handleTabChange('activity_logs')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                          activeTab === 'activity_logs'
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <History className="w-4 h-4 text-indigo-400" /> Nhật Ký Hoạt Động
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {currentUser && (
          <div
            className={`p-3 mx-3 mb-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60'
            }`}
            onClick={() => handleTabChange('profile')}
            title="Xem hồ sơ cá nhân"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-1 ring-white/20 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
                  alt={currentUser.fullName || currentUser.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{currentUser.fullName || currentUser.username}</div>
                <div className="text-[10px] font-mono text-slate-400">{currentUser.username}</div>
              </div>
            </div>
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        )}

        {/* Multi-Role Switcher in Sidebar */}
        {currentUser && userRoles.length > 1 && (
          <div className="mx-3 mb-3 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">
              <span>Chế độ vai trò:</span>
              <span className="text-indigo-400 font-mono text-[9px] bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800">
                {userRoles.length} vai trò
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {userRoles.map((r) => {
                const isActive = activeRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleSelectRole(r)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r === 'admin' ? (
                        <Crown className="w-3.5 h-3.5 text-rose-400" />
                      ) : r === 'lop_truong' ? (
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>
                        {r === 'admin' ? 'Quản Trị Viên' : r === 'lop_truong' ? 'Lớp Trưởng' : 'Sinh Viên'}
                      </span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs text-center flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">HK2 2025 - 2026</div>
          <div className="text-[10px] text-slate-600 font-mono">SQLite • Next.js Fullstack</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Sticky Impersonation Banner */}
        {currentUser?.impersonatedBy && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white px-4 md:px-8 py-2.5 flex items-center justify-between shadow-lg z-30 shrink-0 border-b border-purple-500/30 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3 text-xs md:text-sm font-semibold flex-wrap">
              <div className="flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold text-xs uppercase tracking-wider border border-amber-400/40">
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                Chế Độ Giả Lập
              </div>
              <span>
                Đang đăng nhập với tư cách: <strong className="text-yellow-200 font-bold">{currentUser.fullName || currentUser.username}</strong> ({currentUser.username})
              </span>
              <span className="text-purple-300 hidden sm:inline">•</span>
              <span className="text-purple-300 text-xs hidden sm:inline">
                Admin gốc: <strong className="text-white font-mono">{currentUser.impersonatedBy}</strong>
              </span>
            </div>

            <button
              onClick={handleRevertImpersonate}
              disabled={isRevertingImpersonate}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              title="Quay lại tài khoản quản trị viên ban đầu"
            >
              {isRevertingImpersonate ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRightLeft className="w-3.5 h-3.5" />
              )}
              <span>Trở Về Tài Khoản Admin</span>
            </button>
          </div>
        )}

        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              className="flex items-center justify-center p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                P
              </div>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 hidden sm:block">
              {activeTab === 'schedule'
                ? 'Lịch Thi Tổng'
                : activeTab === 'personal_schedule'
                ? 'Lịch Thi Cá Nhân'
                : activeTab === 'monitors_list'
                ? 'Danh Sách Lớp Trưởng'
                : activeTab === 'course_compare'
                ? 'So Sánh ĐKMH'
                : activeTab === 'members'
                ? 'Danh Sách Lớp'
                : activeTab === 'batches'
                ? 'Quản Lý Đợt Thi'
                : activeTab === 'envelope'
                ? 'Phân Công Phong Bì Lớp Mình'
                : activeTab === 'envelope_all'
                ? 'Phân Công Phong Bì Lớp Trưởng'
                : activeTab === 'settlement'
                ? 'Bù Trừ Thanh Toán'
                : 'Công Cụ Lớp Trưởng'}
            </h2>

            {/* Active Exam Batch Selector in Header */}
            {hasActiveBatch ? (
              <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-xs">
                <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <select
                  value={activeBatch?.code || 'ALL'}
                  onChange={(e) => {
                    const code = e.target.value;
                    if (code === 'ALL') {
                      setActiveBatch(null);
                      loadDataFromApi('ALL');
                    } else {
                      const selected = examBatches.find((b) => b.code === code);
                      if (selected) {
                        setActiveBatch(selected);
                        loadDataFromApi(selected.code);
                      }
                    }
                  }}
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

            {records.length > 0 && (activeTab === 'schedule' || activeTab === 'personal_schedule') && (
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
                  onChange={(e) => setSearchInput(e.target.value)}
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
                            handleSelectRole(r);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            isActive ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700 hover:bg-slate-50'
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
                              {r === 'admin' ? 'Quản Trị Viên' : r === 'lop_truong' ? 'Lớp Trưởng' : 'Sinh Viên'}
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

            {/* Impersonate Button (Strictly Admin only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  setImpersonateError('');
                  setShowImpersonateModal(true);
                }}
                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Đăng nhập với tư cách sinh viên bất kỳ (Ví dụ: K25DTCN340)"
              >
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Đăng Nhập Như...</span>
              </button>
            )}

            <button
              onClick={() => loadDataFromApi()}
              title="Đồng bộ lại từ Database"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleTabChange('profile')}
              className={`w-10 h-10 rounded-full border-2 shadow-sm flex items-center justify-center text-slate-500 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all ${
                activeTab === 'profile' ? 'ring-2 ring-blue-500 border-blue-500' : 'bg-slate-200 border-white'
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
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-rose-100 text-rose-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <section className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu từ máy chủ...</p>
            </div>
          ) : activeTab === 'profile' && currentUser ? (
            <UserProfileScreen
              currentUser={currentUser}
              onLogout={handleLogout}
              hasExamSchedule={hasExamSchedule}
              onNavigateTab={(tab) => handleTabChange(tab)}
              userRoles={userRoles}
              activeRole={activeRole}
              onSelectRole={handleSelectRole}
              onProfileUpdated={(updatedUser) => {
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              }}
            />
          ) : activeTab === 'registered_courses' && effectiveUser ? (
            <StudentCourseRegistration
              currentUser={effectiveUser}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          ) : activeTab === 'external_accounts_admin' && isAdmin ? (
            <AdminExternalAccounts currentUser={effectiveUser!} />
          ) : activeTab === 'activity_logs' && isAdmin ? (
            <ActivityLogsManager currentUser={effectiveUser!} />
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
              onClassClick={(classCode) => {
                setMonitorClass(classCode);
                setActiveTab('members');
                setIsClassGroupOpen(true);
              }}
            />
          ) : activeTab === 'course_compare' ? (
            <CourseCompare
              data={courseCompareData}
              currentUser={effectiveUser}
              onNavigateTab={(tab) => handleTabChange(tab)}
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
              onImpersonate={isAdmin ? handleImpersonate : undefined}
              onSelectStudentSchedule={(studentId) => {
                setSearchInput(studentId);
                setFilters((prev) => ({ ...prev, search: studentId }));
                setActiveTab('personal_schedule');
              }}
            />
          ) : activeTab === 'monitor' ? (
            <ClassMonitorTools
              records={records}
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
            />
          ) : activeTab === 'envelope' ? (
            <RoomEnvelopeManager
              sessions={sessions}
              records={records}
              selectedClass={effectiveUser?.lop || monitorClass}
              onClassChange={setMonitorClass}
              loginUsers={loginUsers}
              hideClassSelector={true}
            />
          ) : activeTab === 'envelope_all' ? (
            <AllMonitorsEnvelopes records={records} sessions={sessions} loginUsers={loginUsers} />
          ) : activeTab === 'settlement' ? (
            <SettlementManager records={records} sessions={sessions} loginUsers={loginUsers} />
          ) : !hasActiveBatch && (activeTab === 'schedule' || activeTab === 'personal_schedule') ? (
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
          ) : records.length === 0 ? (
            <UploadSection
              onDataLoaded={(loadedData) => {
                setRecords(loadedData);
                setSessions(buildSessions(loadedData));
              }}
              onRefreshFromDb={() => loadDataFromApi()}
            />
          ) : activeTab === 'schedule' || activeTab === 'personal_schedule' ? (
            selectedExamRoom ? (
              <ExamRoomMembers
                roomRecord={selectedExamRoom}
                allRecords={records}
                onBack={() => setSelectedExamRoom(null)}
                onStudentClick={setConfirmStudentId}
                onClassClick={setConfirmClassCode}
              />
            ) : (
              <>
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  classes={classes}
                  subjects={subjects}
                  dates={dates}
                  totalRecords={baseRecords.length}
                  filteredCount={filteredRecords.length}
                  hideClassFilter={activeTab === 'personal_schedule'}
                />
                <DataTable
                  records={filteredRecords}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
                  onStudentClick={setConfirmStudentId}
                  onClassClick={setConfirmClassCode}
                  onRowClick={setSelectedExamRoom}
                />
              </>
            )
          ) : (
            <ClassMembers
              records={records}
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
              currentUser={effectiveUser}
              loginUsers={loginUsers}
              hasExamSchedule={hasExamSchedule}
              onImpersonate={isAdmin ? handleImpersonate : undefined}
              onSelectStudentSchedule={(studentId) => {
                setSearchInput(studentId);
                setFilters((prev) => ({ ...prev, search: studentId }));
                setActiveTab('personal_schedule');
              }}
            />
          )}
        </section>
      </main>

      {/* Impersonate Switch User Modal (Admin only) */}
      {isAdmin && showImpersonateModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowImpersonateModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Đăng Nhập Như Người Dùng Khác</h3>
                  <p className="text-xs text-purple-200">Tính năng quản trị: Giả lập tài khoản sinh viên</p>
                </div>
              </div>
              <button
                onClick={() => setShowImpersonateModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              {impersonateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{impersonateError}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (impersonateTargetInput.trim()) {
                    handleImpersonate(impersonateTargetInput.trim());
                  }
                }}
                className="flex flex-col gap-3"
              >
                <label className="text-xs font-bold text-slate-700">
                  Nhập Mã sinh viên cần đăng nhập (Ví dụ: <code className="text-purple-600 font-mono">K25DTCN340</code>):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={impersonateTargetInput}
                      onChange={(e) => setImpersonateTargetInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã sinh viên (MaSV)..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isImpersonating || !impersonateTargetInput.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImpersonating ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    <span>Đăng Nhập</span>
                  </button>
                </div>
              </form>

              {/* Quick suggestions from records */}
              {records.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Gợi ý nhanh sinh viên trong hệ thống:
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {Array.from(
                      new Map(
                        records
                          .filter((r) => r.MaSV && r.MaSV.toUpperCase() !== currentUser?.username?.toUpperCase())
                          .map((r) => [r.MaSV, r])
                      ).values()
                    )
                      .filter((r: any) =>
                        !impersonateTargetInput ||
                        r.MaSV?.toUpperCase().includes(impersonateTargetInput) ||
                        `${r.HoLotSV} ${r.TenSV}`.toUpperCase().includes(impersonateTargetInput) ||
                        r.MaLop?.toUpperCase().includes(impersonateTargetInput)
                      )
                      .slice(0, 8)
                      .map((r: any) => (
                        <div
                          key={r.MaSV}
                          className="p-2.5 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-700 text-xs bg-purple-100 px-2 py-0.5 rounded-lg">
                              {r.MaSV}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              {r.HoLotSV} {r.TenSV}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">({r.MaLop})</span>
                          </div>
                          <button
                            onClick={() => handleImpersonate(r.MaSV)}
                            disabled={isImpersonating}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Đăng nhập
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Student */}
      {confirmStudentId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Lọc theo sinh viên</h3>
            <p className="text-slate-600 mb-6">
              Bạn có muốn xem toàn bộ lịch thi của sinh viên có mã <strong>{confirmStudentId}</strong>{' '}
              không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmStudentId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setSearchInput(confirmStudentId);
                  setFilters((prev) => ({ ...prev, search: confirmStudentId }));
                  setConfirmStudentId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClassCode && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xem thông tin lớp</h3>
            <p className="text-slate-600 mb-6">
              Bạn có muốn xem danh sách thành viên của lớp <strong>{confirmClassCode}</strong> không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmClassCode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setActiveTab('members');
                  setMonitorClass(confirmClassCode);
                  setConfirmClassCode(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End of modals */}
    </div>
  );
}
