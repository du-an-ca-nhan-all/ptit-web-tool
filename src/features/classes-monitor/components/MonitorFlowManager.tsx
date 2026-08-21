'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  GitFork,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Check,
  X,
  RefreshCw,
  Save,
  Play,
  Share2,
  Trash2,
  Filter,
  Globe,
  Lock,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  BookOpen,
  Send,
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  DollarSign,
  Plus,
  Flame,
  Sparkles,
  LayoutGrid,
  Table,
  UserCheck,
  HelpCircle,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { useMonitorFlow } from '../hooks/useMonitorFlow';
import { CourseItem, FollowerStudentItem } from '../server/monitorFlowServerService';
import { getFlowActionDefinition } from '../types/flow.types';
import FlowQueueMonitor from './FlowQueueMonitor';
import ImportFlowStudentsModal from './ImportFlowStudentsModal';

interface MonitorFlowManagerProps {
  currentUser: LoginUser;
  availableClasses?: string[];
  initialClassCode?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

type MainSubTab = 'FLOW_CONFIG' | 'MONITOR_COURSES' | 'ALL_COMPARE' | 'FLOW_QUEUE';
type CompareFilter = 'ALL' | 'ACTIVE_FLOW' | 'NEEDS_ATTENTION' | 'MATCHED_100' | 'NOT_LINKED';

export default function MonitorFlowManager({
  currentUser,
  availableClasses = [],
  initialClassCode,
  onNavigateTab,
}: MonitorFlowManagerProps) {
  const defaultClass = initialClassCode || currentUser.lop || availableClasses[0] || '';
  const {
    selectedClass,
    setSelectedClass,
    students,
    monitorData,
    isLoading,
    isSaving,
    isExecuting,
    isPullingCourses,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    hasUnsavedChanges,
    lastExecutionResult,
    setLastExecutionResult,
    fetchFlowData,
    updateFollowerConfig,
    setAllFollowersStatus,
    setAllPermissions,
    saveAllConfigs,
    executeFlow,
    pullAllCourses,
    importFlowConfigs,
  } = useMonitorFlow(currentUser, defaultClass);

  // Sync with initialClassCode from URL if changed
  useEffect(() => {
    if (initialClassCode && initialClassCode !== selectedClass) {
      setSelectedClass(initialClassCode);
    }
  }, [initialClassCode, setSelectedClass, selectedClass]);

  // Sub-tabs: Default to 'FLOW_CONFIG' (Tab 1)
  const [activeSubTab, setActiveSubTab] = useState<MainSubTab>('FLOW_CONFIG');

  // Matrix Filter
  const [compareFilter, setCompareFilter] = useState<CompareFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Trigger Modal States
  const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);
  const [quickTargetIdToHoc, setQuickTargetIdToHoc] = useState('');
  const [quickTargetGroupName, setQuickTargetGroupName] = useState('');

  const [showQuickCancelModal, setShowQuickCancelModal] = useState(false);
  const [cancelTargetIdToHoc, setCancelTargetIdToHoc] = useState('');

  const [showSyncAllModal, setShowSyncAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Selected student for single drawer inspection
  const [inspectingStudent, setInspectingStudent] = useState<FollowerStudentItem | null>(null);

  // Statistics
  const activeFollowersCount = useMemo(() => students.filter((s) => s.isEnabled).length, [students]);
  const linkedAccountsCount = useMemo(() => students.filter((s) => s.isExternalConfigured).length, [students]);

  // Monitor's courses
  const monitorCourses: CourseItem[] = useMemo(() => monitorData?.courses || [], [monitorData]);

  // Students who match 100%
  const matched100Count = useMemo(() => {
    if (monitorCourses.length === 0) return 0;
    return students.filter((s) => s.diffSummary?.matchPercent === 100).length;
  }, [students, monitorCourses]);

  // Students who need attention (have flow enabled or linked, but < 100% match)
  const needsAttentionCount = useMemo(() => {
    if (monitorCourses.length === 0) return 0;
    return students.filter((s) => (s.isEnabled || s.isExternalConfigured) && s.diffSummary?.matchPercent < 100).length;
  }, [students, monitorCourses]);

  // Filtered students for ALL Comparison Matrix
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((st) => {
      const matchQuery =
        !query ||
        st.maSV.toLowerCase().includes(query) ||
        st.hoTen.toLowerCase().includes(query) ||
        (st.soDienThoai && st.soDienThoai.includes(query));

      if (!matchQuery) return false;

      if (compareFilter === 'ACTIVE_FLOW') return st.isEnabled;
      if (compareFilter === 'NEEDS_ATTENTION') {
        return (st.isEnabled || st.isExternalConfigured) && st.diffSummary?.matchPercent < 100;
      }
      if (compareFilter === 'MATCHED_100') return st.diffSummary?.matchPercent === 100;
      if (compareFilter === 'NOT_LINKED') return !st.isExternalConfigured;

      return true;
    });
  }, [students, searchQuery, compareFilter]);

  return (
    <div className="p-3 sm:p-4 md:p-8 max-w-7xl 2xl:max-w-[1700px] mx-auto w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl sm:rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 flex-wrap">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-amber-200">
              <GitFork className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                  Cấu Hình Flow Lớp Trưởng
                </h1>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
                  Lớp {selectedClass || currentUser.lop || 'Của Bạn'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] sm:text-xs md:text-sm mt-0.5">
                Lớp trưởng: <strong className="text-amber-700 font-mono">{monitorData?.hoTen || currentUser.fullName || currentUser.username}</strong> ({currentUser.username})
                {monitorCourses.length > 0 && (
                  <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] sm:text-xs border border-indigo-100 inline-block">
                    Đã ĐK {monitorCourses.length} môn ({monitorData?.totalCredits || 0} TC)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions - Grid on mobile, flex on tablet/desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          {/* Pull live courses from QLDTTX for whole class */}
          <button
            onClick={pullAllCourses}
            disabled={isPullingCourses || isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Kéo và cập nhật dữ liệu môn học trực tiếp từ Cổng QLDTTX cho toàn bộ tài khoản trong lớp"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPullingCourses ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isPullingCourses ? 'Đang kéo...' : 'Kéo Môn (QLDTTX)'}</span>
          </button>

          {/* Import Followers from CSV / Text */}
          <button
            onClick={() => setShowImportModal(true)}
            disabled={isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Import danh sách sinh viên được Flow theo Lớp trưởng bằng file CSV hoặc nhập Text"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Import SV</span>
          </button>

          <button
            onClick={() => fetchFlowData(selectedClass)}
            disabled={isLoading}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          <button
            onClick={saveAllConfigs}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
              hasUnsavedChanges
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>

      {/* Main Sub-tabs Navigation - Smooth horizontal scroll on mobile */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 w-full overflow-x-auto scroll-smooth snap-x">
        <button
          onClick={() => setActiveSubTab('FLOW_CONFIG')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'FLOW_CONFIG'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          <span>1. Cấu Hình Flow</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black">
            {activeFollowersCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('MONITOR_COURSES')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'MONITOR_COURSES'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>2. Môn Lớp Trưởng ({monitorCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ALL_COMPARE')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ALL_COMPARE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
          <span>3. So Sánh Môn Cả Lớp</span>
          {monitorCourses.length > 0 && (
            <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black">
              {students.length} bạn
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('FLOW_QUEUE')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 snap-start cursor-pointer whitespace-nowrap ${
            activeSubTab === 'FLOW_QUEUE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
          <span>4. Hàng Đợi (Queue)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 3: ALL-IN-ONE COMPARISON MATRIX TABLE FOR ALL MEMBERS */}
      {/* ========================================================================= */}
      {activeSubTab === 'ALL_COMPARE' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Tổng Môn Chuẩn</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-0.5 sm:mt-1">
                {monitorCourses.length} <span className="text-xs font-normal text-slate-400">môn</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-indigo-600 font-bold mt-0.5">
                {monitorData?.totalCredits || 0} Tín chỉ chuẩn
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Đã Khớp 100%</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 sm:mt-1">
                {matched100Count} <span className="text-xs font-normal text-slate-400">/ {students.length} bạn</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5">
                🟢 Học chung toàn bộ
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Cần Đồng Bộ</div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">
                {needsAttentionCount} <span className="text-xs font-normal text-slate-400">bạn</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-amber-700 font-bold mt-0.5">
                🟡 / 🔴 Lệch hoặc thiếu
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Bật Flow Action</div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">
                {activeFollowersCount} <span className="text-xs font-normal text-slate-400">/ {students.length}</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-0.5">
                {linkedAccountsCount} bạn có TK
              </div>
            </div>
          </div>

          {/* Quick Action Bar: Đồng Bộ 2 Chiều Cả Lớp & Kéo QLDTTX */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base text-white">Đồng Bộ 2 Chiều Cho Cả Lớp</h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Tự động ĐK môn thiếu và Hủy môn thừa cho <strong className="text-amber-300">{activeFollowersCount} bạn</strong> đang bật Flow
              </p>
            </div>

            <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowSyncAllModal(true)}
                disabled={isExecuting || activeFollowersCount === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                <span>Đồng Bộ Khớp 100% Cả Lớp</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                disabled={isLoading}
                className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Import danh sách sinh viên được Flow theo Lớp trưởng bằng file CSV hoặc nhập Text"
              >
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>Import Flow SV</span>
              </button>

              <button
                onClick={pullAllCourses}
                disabled={isPullingCourses || isLoading}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPullingCourses ? 'animate-spin' : ''}`} />
                <span>{isPullingCourses ? 'Đang kéo...' : 'Pull QLDTTX'}</span>
              </button>
            </div>
          </div>

          {/* All-in-One Matrix Table Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Filter Toolbar */}
            <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
              {/* Search Box */}
              <div className="relative w-full lg:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sinh viên theo mã SV, họ tên..."
                  className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 scroll-smooth snap-x">
                <button
                  onClick={() => setCompareFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
                    compareFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất Cả ({students.length})
                </button>

                <button
                  onClick={() => setCompareFilter('NEEDS_ATTENTION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer flex items-center gap-1 ${
                    compareFilter === 'NEEDS_ATTENTION'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Cần Xử Lý ({needsAttentionCount})</span>
                </button>

                <button
                  onClick={() => setCompareFilter('ACTIVE_FLOW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
                    compareFilter === 'ACTIVE_FLOW'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Đang Bật Flow ({activeFollowersCount})
                </button>

                <button
                  onClick={() => setCompareFilter('MATCHED_100')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
                    compareFilter === 'MATCHED_100'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Đã Khớp 100% ({matched100Count})
                </button>

                {students.length - linkedAccountsCount > 0 && (
                  <button
                    onClick={() => setCompareFilter('NOT_LINKED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 snap-start cursor-pointer ${
                      compareFilter === 'NOT_LINKED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Chưa Có TK ({students.length - linkedAccountsCount})
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Scroll Helper Hint */}
            <div className="px-3.5 sm:px-5 py-2 bg-amber-50/60 border-b border-amber-200/50 flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                💡 <span className="font-semibold">Vuốt ngang bảng để xem tất cả các môn đối chiếu, hoặc bấm vào nút chi tiết để xem 1-1.</span>
              </span>
            </div>

            {/* Legend Guidance */}
            <div className="px-3.5 sm:px-5 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-bold text-slate-600 overflow-x-auto snap-x">
              <span className="text-slate-400 uppercase text-[9px] sm:text-[10px] shrink-0">Chú thích:</span>
              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                <Check className="w-3 h-3 text-emerald-600" /> Khớp 100%
              </span>
              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Lệch Nhóm
              </span>
              <span className="flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
                <X className="w-3 h-3 text-rose-600" /> Chưa ĐK
              </span>
              <span className="flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                🟣 Thừa Ngoài
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-bold">Đang tải và tính toán đối chiếu môn học cho cả lớp...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Users className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Không có thành viên nào khớp bộ lọc</p>
                  <p className="text-xs text-slate-400">Thử bấm "Tất Cả" hoặc tìm kiếm với từ khóa khác.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      {/* Fixed Left Columns */}
                      <th className="px-3.5 py-3 text-center w-10 bg-slate-50 border-r border-slate-200">STT</th>
                      <th className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 min-w-[200px]">
                        Thành Viên Trong Lớp
                      </th>
                      <th className="px-3 py-3 text-center bg-slate-50 border-r border-slate-200 min-w-[90px]">
                        Flow
                      </th>
                      <th className="px-3 py-3 text-center bg-slate-50 border-r border-slate-200 min-w-[110px]">
                        Tỷ Lệ Khớp
                      </th>

                      {/* Dynamic Columns: Each of Monitor's Courses */}
                      {monitorCourses.map((mCourse, mIdx) => (
                        <th
                          key={mCourse.id_to_hoc || mIdx}
                          className="px-3 py-3 text-center border-r border-slate-200 min-w-[145px] bg-slate-50"
                        >
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] block truncate">
                              {mCourse.ma_mon}
                            </span>
                            <span className="font-bold text-slate-800 text-[11px] block truncate" title={mCourse.ten_mon}>
                              {mCourse.ten_mon}
                            </span>
                            <div className="flex items-center justify-center gap-1 text-[10px]">
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-black rounded border border-amber-300">
                                Nhóm {mCourse.nhom_to || '—'}
                              </span>
                              <span className="text-slate-400 font-normal">({mCourse.so_tc} TC)</span>
                            </div>
                          </div>
                        </th>
                      ))}

                      {/* Right Columns: Môn Thừa & Thao Tác */}
                      <th className="px-3.5 py-3 text-center border-r border-slate-200 min-w-[130px] bg-slate-50">
                        Môn Thừa Ngoài
                      </th>
                      <th className="px-3.5 py-3 text-center bg-slate-50 min-w-[120px]">
                        Hành Động
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, idx) => {
                      const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
                      const is100 = diff.matchPercent === 100 && monitorCourses.length > 0;

                      // Extra courses outside monitor list
                      const extraCourses = student.courses.filter(
                        (c) =>
                          !monitorCourses.some(
                            (m) => String(m.ma_mon).toUpperCase() === String(c.ma_mon).toUpperCase()
                          )
                      );

                      return (
                        <tr
                          key={student.maSV}
                          className={`hover:bg-indigo-50/20 transition-colors ${
                            is100 ? 'bg-emerald-50/10' : student.isEnabled ? 'bg-white' : 'bg-slate-50/50 opacity-80'
                          }`}
                        >
                          {/* STT */}
                          <td className="px-3.5 py-3 text-center text-slate-400 font-mono border-r border-slate-100">
                            {idx + 1}
                          </td>

                          {/* Thành Viên */}
                          <td className="px-3.5 py-3 border-r border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px] border border-indigo-100">
                                    {student.maSV}
                                  </span>
                                  <strong className="text-slate-800 text-xs">{student.hoTen}</strong>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span>{student.courses.length} môn ({student.totalCredits} TC)</span>
                                  {!student.isExternalConfigured && (
                                    <span className="text-rose-600 font-bold">(Chưa có TK)</span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => setInspectingStudent(student)}
                                className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Xem đối chiếu chi tiết 1-1"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          {/* Switch Bật/Tắt Flow */}
                          <td className="px-3 py-3 text-center border-r border-slate-100">
                            <button
                              type="button"
                              onClick={() => updateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
                              }`}
                              title={student.isEnabled ? 'Đang BẬT Flow' : 'Đang TẮT Flow'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  student.isEnabled ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Tỷ Lệ Khớp Progress Badge */}
                          <td className="px-3 py-3 text-center border-r border-slate-100">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  is100
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : diff.matchPercent > 0
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {diff.matchPercent}% Khớp
                              </span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    is100 ? 'bg-emerald-500' : diff.matchPercent > 0 ? 'bg-amber-500' : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${diff.matchPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Course Cells for Each Monitor Course */}
                          {monitorCourses.map((mCourse, mIdx) => {
                            const monCode = String(mCourse.ma_mon || '').toUpperCase();
                            const folCourse = student.courses.find(
                              (c) => String(c.ma_mon || '').toUpperCase() === monCode
                            );

                            const isMatched = folCourse && String(folCourse.id_to_hoc).trim() === String(mCourse.id_to_hoc).trim();
                            const isDiffGroup = folCourse && !isMatched;
                            const isMissing = !folCourse;

                            return (
                              <td
                                key={mCourse.id_to_hoc || mIdx}
                                className={`px-2 py-2.5 text-center border-r border-slate-100 ${
                                  isMatched
                                    ? 'bg-emerald-50/30'
                                    : isDiffGroup
                                    ? 'bg-amber-50/40'
                                    : 'bg-rose-50/40'
                                }`}
                              >
                                {isMatched ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black shadow-2xs">
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Nhóm {folCourse.nhom_to}</span>
                                  </div>
                                ) : isDiffGroup ? (
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                      <span>Nhóm {folCourse.nhom_to}</span>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (folCourse?.id_to_hoc) {
                                          await executeFlow({
                                            flowAction: 'CANCEL',
                                            id_to_hoc: folCourse.id_to_hoc,
                                            targetFollowerUsernames: [student.maSV],
                                          });
                                        }
                                        await executeFlow({
                                          flowAction: 'REGISTER',
                                          id_to_hoc: mCourse.id_to_hoc,
                                          targetFollowerUsernames: [student.maSV],
                                        });
                                      }}
                                      disabled={isExecuting}
                                      className="block w-full text-[9px] font-bold px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                                      title={`Chuyển sang nhóm ${mCourse.nhom_to} của Lớp trưởng`}
                                    >
                                      🔄 Đổi sang {mCourse.nhom_to}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                                      Chưa ĐK
                                    </span>
                                    <button
                                      onClick={() =>
                                        executeFlow({
                                          flowAction: 'REGISTER',
                                          id_to_hoc: mCourse.id_to_hoc,
                                          targetFollowerUsernames: [student.maSV],
                                        })
                                      }
                                      disabled={isExecuting}
                                      className="block w-full text-[9px] font-black px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                                      title={`Flow đăng ký nhóm ${mCourse.nhom_to} cho bạn này`}
                                    >
                                      + Đăng Ký
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Môn Thừa Ngoài */}
                          <td className="px-3 py-3 text-center border-r border-slate-100">
                            {extraCourses.length > 0 ? (
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {extraCourses.map((ex) => (
                                  <span
                                    key={ex.id_to_hoc}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded text-[10px] font-bold"
                                    title={`${ex.ten_mon} (Nhóm ${ex.nhom_to})`}
                                  >
                                    <span>{ex.ma_mon}</span>
                                    <button
                                      onClick={() =>
                                        executeFlow({
                                          flowAction: 'CANCEL',
                                          id_to_hoc: ex.id_to_hoc,
                                          targetFollowerUsernames: [student.maSV],
                                        })
                                      }
                                      disabled={isExecuting}
                                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                      title="Hủy môn thừa này"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-[10px]">Không có</span>
                            )}
                          </td>

                          {/* Hành Động Đồng Bộ Riêng */}
                          <td className="px-3.5 py-3 text-center">
                            {is100 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã Khớp
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  executeFlow({
                                    flowAction: 'SYNC_ALL_COURSES',
                                    targetFollowerUsernames: [student.maSV],
                                  })
                                }
                                disabled={isExecuting || !student.isExternalConfigured}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all shadow-xs flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-40"
                                title="Đồng bộ 2 chiều đưa toàn bộ môn của bạn này khớp 100% với Lớp trưởng"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Đồng Bộ 100%</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Summary Footer Row */}
                  <tfoot className="bg-slate-100/90 text-slate-700 font-bold border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-black uppercase text-slate-600 border-r border-slate-200">
                        Tổng Số Thành Viên Đã Khớp Môn:
                      </td>
                      {monitorCourses.map((mCourse, mIdx) => {
                        const monCode = String(mCourse.ma_mon || '').toUpperCase();
                        const enrolledCount = students.filter((s) => {
                          const fol = s.courses.find((c) => String(c.ma_mon || '').toUpperCase() === monCode);
                          return fol && String(fol.id_to_hoc).trim() === String(mCourse.id_to_hoc).trim();
                        }).length;

                        const isAllEnrolled = enrolledCount === students.length && students.length > 0;

                        return (
                          <td key={mCourse.id_to_hoc || mIdx} className="px-2 py-3 text-center border-r border-slate-200">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                                isAllEnrolled
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : enrolledCount > 0
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-rose-200 text-rose-900'
                              }`}
                            >
                              {enrolledCount} / {students.length}
                            </span>
                          </td>
                        );
                      })}
                      <td colSpan={2} className="px-4 py-3 text-center text-slate-500 font-mono text-[10px]">
                        Lớp {selectedClass}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 1: FLOW CONFIGURATION & DETAILED SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'FLOW_CONFIG' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Quick Flow Actions Launcher Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 fill-current" />
                  <h3 className="font-black text-base sm:text-lg text-white">
                    Bắn Lệnh Flow Action Cho Cả Lớp
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thực thi đồng loạt cho <strong className="text-amber-300">{activeFollowersCount} thành viên</strong> đang bật Flow Action
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2 w-full lg:w-auto">
                <button
                  onClick={() => setShowSyncAllModal(true)}
                  disabled={isExecuting || activeFollowersCount === 0}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Đồng Bộ 2 Chiều Cả Lớp</span>
                </button>

                <button
                  onClick={() => setShowQuickRegisterModal(true)}
                  disabled={isExecuting || activeFollowersCount === 0}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl sm:rounded-2xl transition-all shadow-md shadow-orange-900/40 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Flow Đăng Ký...</span>
                </button>

                <button
                  onClick={() => setShowQuickCancelModal(true)}
                  disabled={isExecuting || activeFollowersCount === 0}
                  className="px-3.5 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Flow Hủy Môn...</span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl sm:rounded-2xl transition-all border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Import danh sách sinh viên Flow từ file hoặc text"
                >
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  <span>Import Flow SV...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Config Table & Mobile Cards Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã SV, họ tên, số điện thoại..."
                  className="w-full bg-white border border-slate-200 rounded-xl sm:rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full md:w-auto justify-end">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-xl transition-colors border border-amber-200 flex items-center justify-center gap-1 cursor-pointer"
                  title="Import danh sách sinh viên bật flow từ file hoặc text"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>Import SV</span>
                </button>
                <button
                  onClick={() => setAllFollowersStatus(false)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Tắt Tất Cả
                </button>
              </div>
            </div>

            {/* Mobile Cards View (Visible on Small Screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold">
                  Không tìm thấy sinh viên nào phù hợp
                </div>
              ) : (
                filteredStudents.map((student, idx) => {
                  const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
                  const is100Percent = diff.matchPercent === 100 && monitorCourses.length > 0;

                  return (
                    <div
                      key={student.maSV}
                      className={`p-3.5 space-y-3 transition-colors ${
                        student.isEnabled ? 'bg-amber-50/20' : 'bg-white opacity-80'
                      }`}
                    >
                      {/* Top Row: STT, Mã SV, Name, QLDTTX status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs border border-indigo-100">
                            {student.maSV}
                          </span>
                          <strong className="text-slate-800 text-xs sm:text-sm block">{student.hoTen}</strong>
                        </div>
                        <div>
                          {student.isExternalConfigured ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              <Check className="w-2.5 h-2.5" /> Đã kết nối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              Chưa TK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row 1: Flow Toggle Switch + Match Progress */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                student.isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-slate-700">
                            {student.isEnabled ? (
                              <span className="text-amber-700 font-black">⚡ Đang BẬT Flow</span>
                            ) : (
                              <span className="text-slate-400">Tắt Flow</span>
                            )}
                          </span>
                        </div>

                        <button
                          onClick={() => setInspectingStudent(student)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1 ${
                            is100Percent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : diff.matchPercent > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span>{diff.matchPercent}% Khớp</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Middle Row 2: Permission Checkboxes */}
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer select-none text-xs font-bold ${
                            student.allowRegisterCourse && student.isEnabled
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={student.allowRegisterCourse}
                            disabled={!student.isEnabled}
                            onChange={(e) =>
                              updateFollowerConfig(student.maSV, 'allowRegisterCourse', e.target.checked)
                            }
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                          />
                          <span>Flow ĐK Môn</span>
                        </label>

                        <label
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer select-none text-xs font-bold ${
                            student.allowCancelCourse && student.isEnabled
                              ? 'bg-rose-50 border-rose-200 text-rose-900'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={student.allowCancelCourse}
                            disabled={!student.isEnabled}
                            onChange={(e) =>
                              updateFollowerConfig(student.maSV, 'allowCancelCourse', e.target.checked)
                            }
                            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                          />
                          <span>Flow Hủy Môn</span>
                        </label>
                      </div>

                      {/* Footer Row: Last Action History */}
                      {student.lastActionAt && (
                        <div className="text-[11px] pt-1 border-t border-slate-100 flex items-center justify-between text-slate-500">
                          {(() => {
                            const actionDef = getFlowActionDefinition(student.lastActionType);
                            return (
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                    student.lastActionResult === 'SUCCESS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : student.lastActionResult === 'SKIPPED'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {student.lastActionResult || 'DONE'}
                                </span>
                                <span className="font-bold text-slate-700 truncate">{actionDef.name}</span>
                              </div>
                            );
                          })()}
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(student.lastActionAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (Hidden on Small Screens, Visible on Medium+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">STT</th>
                    <th className="px-4 py-3.5">Mã SV</th>
                    <th className="px-4 py-3.5">Họ và Tên</th>
                    <th className="px-4 py-3.5 text-center">Tài Khoản QLDTTX</th>
                    <th className="px-4 py-3.5 text-center">Bật / Tắt Flow</th>
                    <th className="px-4 py-3.5 text-center">Flow Đăng Ký Môn</th>
                    <th className="px-4 py-3.5 text-center">Flow Hủy Môn</th>
                    <th className="px-4 py-3.5 text-center">So Khớp Môn</th>
                    <th className="px-4 py-3.5">Lịch Sử Flow Gần Nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student, idx) => {
                    const diff = student.diffSummary || { matchPercent: 0, matchedCount: 0, missingCount: 0, diffGroupCount: 0, extraCount: 0 };
                    const is100Percent = diff.matchPercent === 100 && monitorCourses.length > 0;

                    return (
                      <tr
                        key={student.maSV}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          student.isEnabled ? 'bg-amber-50/20' : 'opacity-70 bg-slate-50/30'
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs border border-indigo-100">
                            {student.maSV}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 text-sm block">{student.hoTen}</span>
                          {student.soDienThoai && (
                            <span className="text-[11px] text-slate-400 font-mono">SĐT: {student.soDienThoai}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {student.isExternalConfigured ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3 h-3" /> Đã Liên Kết
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Chưa Liên Kết
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => updateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                student.isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={student.allowRegisterCourse}
                              disabled={!student.isEnabled}
                              onChange={(e) =>
                                updateFollowerConfig(student.maSV, 'allowRegisterCourse', e.target.checked)
                              }
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                            />
                            <span className="text-[11px] font-bold text-slate-700">Đăng ký</span>
                          </label>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={student.allowCancelCourse}
                              disabled={!student.isEnabled}
                              onChange={(e) =>
                                updateFollowerConfig(student.maSV, 'allowCancelCourse', e.target.checked)
                              }
                              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                            />
                            <span className="text-[11px] font-bold text-slate-700">Hủy môn</span>
                          </label>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => {
                              setInspectingStudent(student);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              is100Percent
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : diff.matchPercent > 0
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span>{diff.matchPercent}% Khớp</span>
                          </button>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          {student.lastActionAt ? (
                            <div className="space-y-0.5">
                              {(() => {
                                const actionDef = getFlowActionDefinition(student.lastActionType);
                                return (
                                  <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                                    <span
                                      className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                        student.lastActionResult === 'SUCCESS'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : student.lastActionResult === 'SKIPPED'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {student.lastActionResult || 'DONE'}
                                    </span>
                                    <span className="font-bold text-slate-700">{actionDef.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">({actionDef.categoryName})</span>
                                  </div>
                                );
                              })()}
                              {student.lastActionMessage && (
                                <p className="text-[11px] text-slate-500 truncate" title={student.lastActionMessage}>
                                  {student.lastActionMessage}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Chưa có hành động</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: MONITOR'S REGISTERED COURSES (DANH SÁCH MÔN CỦA LỚP TRƯỞNG) */}
      {/* ========================================================================= */}
      {activeSubTab === 'MONITOR_COURSES' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Tổng Số Môn</div>
                <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{monitorCourses.length} môn</div>
                <div className="text-[10px] sm:text-[11px] text-indigo-600 font-bold mt-0.5">Lớp trưởng {monitorData?.hoTen}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Tổng Tín Chỉ</div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{monitorData?.totalCredits || 0} TC</div>
                <div className="text-[10px] sm:text-[11px] text-amber-700 font-bold mt-0.5">Kỳ học hiện tại</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase">Học Phí Tạm Tính</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
                  {(monitorData?.tuitionFee || 0).toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5">Học phí theo nhóm tổ</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm">Môn Học Lớp Trưởng Đăng Ký</h3>
                  {monitorData?.lastPulledAt && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-lg font-mono">
                      Cập nhật: {new Date(monitorData.lastPulledAt).toLocaleTimeString('vi-VN')} {new Date(monitorData.lastPulledAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Các môn này làm chuẩn để Flow đồng bộ cho cả lớp</p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={pullAllCourses}
                  disabled={isPullingCourses || isLoading}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl sm:rounded-2xl border border-indigo-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  title="Kéo danh sách môn học mới nhất từ Cổng QLDTTX"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isPullingCourses ? 'animate-spin' : ''}`} />
                  <span>{isPullingCourses ? 'Đang kéo...' : 'Pull QLDTTX'}</span>
                </button>

                <button
                  onClick={() => setShowSyncAllModal(true)}
                  disabled={isExecuting || monitorCourses.length === 0}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold text-xs rounded-xl sm:rounded-2xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đồng Bộ Cả Lớp</span>
                </button>
              </div>
            </div>

            {/* Mobile Cards for Courses */}
            <div className="block md:hidden divide-y divide-slate-100">
              {monitorCourses.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu môn học</p>
                  <button
                    onClick={pullAllCourses}
                    disabled={isPullingCourses}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Kéo Dữ Liệu Từ QLDTTX
                  </button>
                </div>
              ) : (
                monitorCourses.map((course, idx) => (
                  <div key={course.id_to_hoc || idx} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                    {/* Course header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded text-xs">
                            {course.ma_mon}
                          </span>
                          <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {course.so_tc} TC
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs sm:text-sm mt-1">{course.ten_mon}</p>
                      </div>
                      <span className="font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 text-xs shrink-0">
                        {course.nhom_to || '—'}
                      </span>
                    </div>

                    {/* Course details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Lớp HP</span>
                        <span className="text-slate-700 font-mono">{course.lop || '—'}</span>
                      </div>
                      <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-100">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">Học Phí</span>
                        <span className="text-emerald-700 font-bold font-mono">{(course.phai_dong || 0).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    {/* TKB + Flow button */}
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {course.tkb ? (
                          <div
                            className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100"
                            dangerouslySetInnerHTML={{ __html: course.tkb }}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Chưa xếp TKB</span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          executeFlow({
                            flowAction: 'REGISTER',
                            id_to_hoc: course.id_to_hoc,
                            nhom_to: course.nhom_to,
                          })
                        }
                        disabled={isExecuting || activeFollowersCount === 0}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>Flow</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table for Courses */}
            <div className="hidden md:block overflow-x-auto">
              {monitorCourses.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Lớp trưởng chưa đăng ký môn học nào hoặc chưa kéo dữ liệu</p>
                  <button
                    onClick={pullAllCourses}
                    disabled={isPullingCourses}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Kéo Dữ Liệu Từ QLDTTX Ngay
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-12">STT</th>
                      <th className="px-4 py-3.5">Mã Môn</th>
                      <th className="px-4 py-3.5">Tên Môn Học</th>
                      <th className="px-4 py-3.5 text-center">Số TC</th>
                      <th className="px-4 py-3.5 text-center">Nhóm / Tổ</th>
                      <th className="px-4 py-3.5">Lớp Học Phần</th>
                      <th className="px-4 py-3.5">Thời Khóa Biểu (TKB)</th>
                      <th className="px-4 py-3.5 text-right">Học Phí</th>
                      <th className="px-4 py-3.5 text-center">Flow Cho Cả Lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monitorCourses.map((course, idx) => (
                      <tr key={course.id_to_hoc || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          {course.ma_mon}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 text-sm block">{course.ten_mon}</span>
                          {course.ngay_dang_ky && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Đăng ký: {new Date(course.ngay_dang_ky).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                            {course.so_tc} TC
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                            {course.nhom_to || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono">{course.lop || '—'}</td>
                        <td className="px-4 py-3.5 max-w-xs">
                          {course.tkb ? (
                            <div
                              className="text-[11px] text-slate-600 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: course.tkb }}
                            />
                          ) : (
                            <span className="text-slate-400 italic">Chưa xếp lịch</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                          {(course.phai_dong || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() =>
                              executeFlow({
                                flowAction: 'REGISTER',
                                id_to_hoc: course.id_to_hoc,
                                nhom_to: course.nhom_to,
                              })
                            }
                            disabled={isExecuting || activeFollowersCount === 0}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 mx-auto cursor-pointer disabled:opacity-50"
                            title="Flow đăng ký tổ này cho toàn bộ thành viên đang bật Flow"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Flow Cho Lớp</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: FLOW QUEUE & LIVE PROGRESS MONITOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'FLOW_QUEUE' && (
        <FlowQueueMonitor currentUser={currentUser} selectedClass={selectedClass} />
      )}

      {/* ============================================================= */}
      {/* DRAWER: SINGLE STUDENT DETAILED 1-1 INSPECTION */}
      {/* ============================================================= */}
      {inspectingStudent && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingStudent(null);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-black">
                  Đối Chiếu: LT vs {inspectingStudent.hoTen} ({inspectingStudent.maSV})
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Khớp: <strong className="text-amber-300 font-mono">{inspectingStudent.diffSummary?.matchPercent}%</strong> • {inspectingStudent.courses.length} môn đã ĐK
                </p>
              </div>
              <button
                onClick={() => setInspectingStudent(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3 sm:space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 gap-2 sm:gap-0">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 text-xs sm:text-sm">Hành Động Khắc Phục Nhanh</div>
                  <p className="text-slate-500 text-[10px] sm:text-[11px]">Đưa toàn bộ môn về khớp 100% với Lớp trưởng</p>
                </div>
                <button
                  onClick={async () => {
                    const sv = inspectingStudent.maSV;
                    setInspectingStudent(null);
                    await executeFlow({
                      flowAction: 'SYNC_ALL_COURSES',
                      targetFollowerUsernames: [sv],
                    });
                  }}
                  disabled={isExecuting}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đồng Bộ Khớp 100% Ngay</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Môn Học (LT)</th>
                      <th className="px-2.5 py-2.5 text-center">Nhóm LT</th>
                      <th className="px-2.5 py-2.5 text-center">Trạng Thái SV</th>
                      <th className="px-2.5 py-2.5 text-center">Nhóm SV</th>
                      <th className="px-3 py-2.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monitorCourses.map((m, i) => {
                      const fol = inspectingStudent.courses.find(
                        (c) => String(c.ma_mon).toUpperCase() === String(m.ma_mon).toUpperCase()
                      );
                      const isMatch = fol && String(fol.id_to_hoc).trim() === String(m.id_to_hoc).trim();
                      const isDiff = fol && !isMatch;

                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5">
                            <strong className="text-slate-800 text-xs block">{m.ten_mon}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">{m.ma_mon}</span>
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-black text-amber-900 bg-amber-50 text-xs">
                            {m.nhom_to}
                          </td>
                          <td className="px-2.5 py-2.5 text-center">
                            {isMatch ? (
                              <span className="text-emerald-700 font-black text-[10px] whitespace-nowrap">🟢 Trùng khớp</span>
                            ) : isDiff ? (
                              <span className="text-amber-700 font-black text-[10px] whitespace-nowrap">🟡 Lệch nhóm</span>
                            ) : (
                              <span className="text-rose-700 font-black text-[10px] whitespace-nowrap">🔴 Chưa ĐK</span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-bold text-slate-700 text-xs">
                            {fol ? fol.nhom_to : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {isMatch ? (
                              <span className="text-emerald-600 font-bold text-[10px]">Đã chuẩn</span>
                            ) : isDiff ? (
                              <button
                                onClick={async () => {
                                  if (fol?.id_to_hoc) {
                                    await executeFlow({
                                      flowAction: 'CANCEL',
                                      id_to_hoc: fol.id_to_hoc,
                                      targetFollowerUsernames: [inspectingStudent.maSV],
                                    });
                                  }
                                  await executeFlow({
                                    flowAction: 'REGISTER',
                                    id_to_hoc: m.id_to_hoc,
                                    targetFollowerUsernames: [inspectingStudent.maSV],
                                  });
                                }}
                                disabled={isExecuting}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                              >
                                Đổi nhóm {m.nhom_to}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  executeFlow({
                                    flowAction: 'REGISTER',
                                    id_to_hoc: m.id_to_hoc,
                                    targetFollowerUsernames: [inspectingStudent.maSV],
                                  })
                                }
                                disabled={isExecuting}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap"
                              >
                                Đăng ký
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setInspectingStudent(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: QUICK FLOW REGISTER SPECIFIC COURSE */}
      {/* ============================================================= */}
      {showQuickRegisterModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickRegisterModal(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="text-sm sm:text-base font-black">Flow Đăng Ký Môn Cho Cả Lớp</h3>
              </div>
              <button
                onClick={() => setShowQuickRegisterModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần ĐK (id_to_hoc):</label>
                <input
                  type="text"
                  value={quickTargetIdToHoc}
                  onChange={(e) => setQuickTargetIdToHoc(e.target.value.trim())}
                  placeholder="Ví dụ: 123456..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Môn / Nhóm Tổ (Tùy chọn):</label>
                <input
                  type="text"
                  value={quickTargetGroupName}
                  onChange={(e) => setQuickTargetGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm 01 - Tiếng Anh B1..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl sm:rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                🚀 Hệ thống sẽ gọi API đăng ký tổ học này cho <strong>{activeFollowersCount} thành viên</strong> có bật quyền "Flow Đăng Ký".
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!quickTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = quickTargetIdToHoc;
                    const name = quickTargetGroupName;
                    setShowQuickRegisterModal(false);
                    await executeFlow({
                      flowAction: 'REGISTER',
                      id_to_hoc: id,
                      nhom_to: name,
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắn Lệnh Đăng Ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: QUICK FLOW CANCEL SPECIFIC COURSE */}
      {/* ============================================================= */}
      {showQuickCancelModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickCancelModal(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-black">Flow Hủy Môn Cho Cả Lớp</h3>
              </div>
              <button
                onClick={() => setShowQuickCancelModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần Hủy (id_to_hoc):</label>
                <input
                  type="text"
                  value={cancelTargetIdToHoc}
                  onChange={(e) => setCancelTargetIdToHoc(e.target.value.trim())}
                  placeholder="Nhập ID tổ học cần hủy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Thao tác này sẽ hủy môn học cho tất cả thành viên đang bật Flow. Slot học sẽ được giải phóng ngay.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCancelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!cancelTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = cancelTargetIdToHoc;
                    setShowQuickCancelModal(false);
                    await executeFlow({
                      flowAction: 'CANCEL',
                      id_to_hoc: id,
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Xác Nhận Hủy Môn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: SYNC ALL COURSES OF MONITOR */}
      {/* ============================================================= */}
      {showSyncAllModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSyncAllModal(false);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-black">Đồng Bộ 2 Chiều Tất Cả Môn</h3>
              </div>
              <button
                onClick={() => setShowSyncAllModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                Hệ thống sẽ đối chiếu danh sách môn của <strong>Lớp trưởng ({monitorData?.hoTen || currentUser.fullName || currentUser.username})</strong> với <strong>{activeFollowersCount} thành viên</strong>:
              </p>

              <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                <li><strong>Đăng ký</strong> các môn Lớp trưởng có mà thành viên còn thiếu.</li>
                <li><strong>Hủy</strong> các môn thừa mà thành viên có nhưng Lớp trưởng không học (hoặc đã hủy).</li>
              </ul>

              <div className="p-3 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                ✨ Giúp toàn bộ các thành viên trong lớp học cùng 1 thời khóa biểu, cùng ca học và cùng phòng thi chuẩn 100%!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSyncAllModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={async () => {
                    setShowSyncAllModal(false);
                    await executeFlow({
                      flowAction: 'SYNC_ALL_COURSES',
                    });
                  }}
                  className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắt Đầu Đồng Bộ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: EXECUTION RESULTS SUMMARY DIALOG */}
      {/* ============================================================= */}
      {lastExecutionResult && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLastExecutionResult(null);
          }}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[88vh] sm:max-h-[85vh] flex flex-col">
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-black">Kết Quả Thực Thi Flow Action</h3>
              </div>
              <button
                onClick={() => setLastExecutionResult(null)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
              <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Thành Công</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">{lastExecutionResult.successCount}</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Thất Bại</span>
                <span className="text-base sm:text-lg font-black text-rose-600">{lastExecutionResult.failCount}</span>
              </div>
              <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[9px] sm:text-[10px] uppercase">Bỏ Qua</span>
                <span className="text-base sm:text-lg font-black text-amber-600">{lastExecutionResult.skippedCount}</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {lastExecutionResult.results.map((res, i) => (
                <div key={i} className="py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                        {res.username}
                      </span>
                      <span className="font-bold text-slate-800 text-xs truncate">{res.hoTen || res.username}</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{res.message}</p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${
                      res.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : res.status === 'SKIPPED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLastExecutionResult(null)}
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer text-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: IMPORT FLOW STUDENTS FROM CSV/TEXT */}
      {/* ============================================================= */}
      <ImportFlowStudentsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        selectedClass={selectedClass}
        monitorUsername={monitorData?.username || currentUser.username}
        monitorFullName={monitorData?.hoTen || currentUser.fullName}
        existingClassStudents={students}
        onConfirmImport={async (payload) => {
          await importFlowConfigs(payload);
        }}
        isSubmitting={isLoading || isSaving}
      />
    </div>
  );
}
