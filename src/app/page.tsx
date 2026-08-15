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
import UserProfileModal from '../components/UserProfileModal';
import ExamBatchManagement from '../components/ExamBatchManagement';
import AdminExternalAccounts from '../components/AdminExternalAccounts';
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
        | 'monitor'
        | 'members'
        | 'envelope'
        | 'envelope_all'
        | 'settlement'
        | 'settings'
        | 'monitors_list'
        | 'batches'
        | 'external_accounts_admin'
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
    | 'monitor'
    | 'members'
    | 'envelope'
    | 'envelope_all'
    | 'settlement'
    | 'settings'
    | 'monitors_list'
    | 'batches'
    | 'external_accounts_admin'
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

  const isAdmin = currentUser?.isAdmin || (currentUser?.role ? currentUser.role.includes('admin') : false);
  const isMonitor = currentUser?.isMonitor || (currentUser?.role ? currentUser.role.includes('lop_truong') : false);
  const canAccessMonitorTools = isMonitor || isAdmin;

  const [courseCompareData, setCourseCompareData] = useState<{
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null>(null);
  const [showCourseCompare, setShowCourseCompare] = useState(false);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
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
  useEffect(() => {
    let classCode = currentUser?.lop;

    if (!classCode && currentUser && records.length > 0) {
      const currentUsername = currentUser.username.toLowerCase();
      const studentRecord = records.find((r) => r.MaSV?.toLowerCase() === currentUsername);
      if (studentRecord && studentRecord.MaLop) {
        classCode = studentRecord.MaLop;
      }
    }

    if (classCode && currentUser) {
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
    } else {
      setShowCourseCompare(false);
      setCourseCompareData(null);
    }
  }, [currentUser, records]);

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
          <p className="text-xs font-mono text-slate-400">Đang khởi động S-Exam Portal...</p>
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
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">S-Exam Portal</h1>
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

          {/* 4. So sánh ĐKMH */}
          {currentUser && showCourseCompare && (
            <button
              onClick={() => handleTabChange('course_compare')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'course_compare'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
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
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {currentUser && (
          <div
            className="p-3 mx-3 mb-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
            onClick={() => {
              setProfileInitialTab('PROFILE');
              setIsProfileOpen(true);
            }}
            title="Xem hồ sơ & liên kết hệ thống"
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

        <div className="p-4 border-t border-slate-800 text-slate-500 text-xs text-center flex flex-col gap-1">
          <div className="text-[11px] uppercase tracking-widest font-bold text-slate-400">HK2 2025 - 2026</div>
          <div className="text-[10px] text-slate-600 font-mono">SQLite • Next.js Fullstack</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              className="flex items-center justify-center p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                S
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
            <button
              onClick={() => loadDataFromApi()}
              title="Đồng bộ lại từ Database"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 hover:scale-105 transition-all"
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
          ) : activeTab === 'external_accounts_admin' && isAdmin ? (
            <AdminExternalAccounts currentUser={currentUser!} />
          ) : activeTab === 'batches' ? (
            <ExamBatchManagement
              currentUser={currentUser!}
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
            <CourseCompare data={courseCompareData} />
          ) : activeTab === 'members' ? (
            <ClassMembers
              records={records}
              selectedClass={monitorClass}
              onClassChange={setMonitorClass}
              currentUser={currentUser}
              loginUsers={loginUsers}
              hasExamSchedule={hasExamSchedule}
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
              selectedClass={currentUser?.lop || monitorClass}
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
              currentUser={currentUser}
              loginUsers={loginUsers}
              onSelectStudentSchedule={(studentId) => {
                setSearchInput(studentId);
                setFilters((prev) => ({ ...prev, search: studentId }));
                setActiveTab('personal_schedule');
              }}
            />
          )}
        </section>
      </main>

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

      {/* User Profile Modal */}
      {isProfileOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
          hasExamSchedule={hasExamSchedule}
          initialTab={profileInitialTab}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }}
        />
      )}
    </div>
  );
}
