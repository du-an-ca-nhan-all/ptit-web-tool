'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  RefreshCw,
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  GraduationCap,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  X,
  Play,
  Pause,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Terminal,
  ShieldCheck,
  Info,
  HelpCircle,
  Flame,
  ArrowRight,
  FileText,
  User,
  Users,
  GitFork,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { useCourseRegistration, SniperTarget } from '../hooks/useCourseRegistration';

interface CourseRegistrationPortalProps {
  currentUser: LoginUser;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function CourseRegistrationPortal({
  currentUser,
  onNavigateTab,
}: CourseRegistrationPortalProps) {
  const {
    openCourses,
    registeredCourses,
    externalAccount,
    isLoading,
    isRefreshing,
    registeringIds,
    cancellingIds,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    fetchPortalData,
    handleRegister,
    handleCancel,
    isSniperActive,
    sniperInterval,
    setSniperInterval,
    soundEnabled,
    setSoundEnabled,
    sniperTargets,
    sniperLogs,
    sniperStats,
    startSniper,
    stopSniper,
    addSniperTarget,
    removeSniperTarget,
    clearSniperTargets,
    clearSniperLogs,
  } = useCourseRegistration(currentUser);

  // Sub-tabs within Course Registration
  const [activeSubTab, setActiveSubTab] = useState<'OPEN_COURSES' | 'REGISTERED_COURSES' | 'SNIPER_BOT' | 'GUIDE'>(
    'OPEN_COURSES'
  );

  // Filter & View States for Open Courses
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL' | 'REGISTERED'>('ALL');
  const [viewMode, setViewMode] = useState<'ACCORDION' | 'FLAT'>('ACCORDION');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Modals
  const [confirmCancelGroup, setConfirmCancelGroup] = useState<any | null>(null);
  const [showAddSniperModal, setShowAddSniperModal] = useState(false);
  const [manualSniperSubjectCode, setManualSniperSubjectCode] = useState('');
  const [manualSniperGroupId, setManualSniperGroupId] = useState('');
  const [manualSniperAnyGroup, setManualSniperAnyGroup] = useState(true);

  // Map of registered subject codes
  const registeredSubjectCodeMap = useMemo(() => {
    const map = new Map<string, string>(); // maMon -> nhomTo
    (registeredCourses.ds_kqdkmh || []).forEach((item: any) => {
      if (item.to_hoc?.ma_mon) {
        map.set(item.to_hoc.ma_mon.toUpperCase(), item.to_hoc.nhom_to || 'Đã ĐK');
      }
    });
    return map;
  }, [registeredCourses.ds_kqdkmh]);

  // Group open course groups by Subject
  const groupedOpenCourses = useMemo(() => {
    const groups = openCourses.ds_nhom_to || [];
    const query = searchQuery.trim().toLowerCase();

    // Map: ma_mon -> { ma_mon, ten_mon, so_tc, groups: [] }
    const map: Record<string, { ma_mon: string; ten_mon: string; so_tc: number; groups: any[] }> = {};

    groups.forEach((g) => {
      const maMon = (g.ma_mon || 'OTHER').toUpperCase();
      if (!map[maMon]) {
        map[maMon] = {
          ma_mon: maMon,
          ten_mon: g.ten_mon || maMon,
          so_tc: g.so_tc || g.so_tc_hp || 0,
          groups: [],
        };
      }
      map[maMon].groups.push(g);
    });

    // Filter by query and statusFilter
    const result = Object.values(map).filter((subj) => {
      const isSubjMatch =
        !query ||
        subj.ma_mon.toLowerCase().includes(query) ||
        subj.ten_mon.toLowerCase().includes(query) ||
        subj.groups.some(
          (g) =>
            (g.nhom_to && g.nhom_to.toLowerCase().includes(query)) ||
            (g.lop && g.lop.toLowerCase().includes(query)) ||
            (g.tkb && g.tkb.toLowerCase().includes(query)) ||
            (g.id_to_hoc && String(g.id_to_hoc).includes(query))
        );

      if (!isSubjMatch) return false;

      // Status filter
      if (statusFilter === 'AVAILABLE') {
        return subj.groups.some((g) => g.enable && g.sl_cl > 0);
      }
      if (statusFilter === 'FULL') {
        return subj.groups.every((g) => g.sl_cl <= 0 || !g.enable);
      }
      if (statusFilter === 'REGISTERED') {
        return registeredSubjectCodeMap.has(subj.ma_mon);
      }

      return true;
    });

    return result;
  }, [openCourses.ds_nhom_to, searchQuery, statusFilter, registeredSubjectCodeMap]);

  // Flat list for Flat View
  const flatFilteredGroups = useMemo(() => {
    const groups = openCourses.ds_nhom_to || [];
    const query = searchQuery.trim().toLowerCase();

    return groups.filter((g) => {
      const matchesQuery =
        !query ||
        (g.ma_mon && g.ma_mon.toLowerCase().includes(query)) ||
        (g.ten_mon && g.ten_mon.toLowerCase().includes(query)) ||
        (g.nhom_to && g.nhom_to.toLowerCase().includes(query)) ||
        (g.lop && g.lop.toLowerCase().includes(query)) ||
        (g.tkb && g.tkb.toLowerCase().includes(query)) ||
        (g.id_to_hoc && String(g.id_to_hoc).includes(query));

      if (!matchesQuery) return false;

      if (statusFilter === 'AVAILABLE') return g.enable && g.sl_cl > 0;
      if (statusFilter === 'FULL') return g.sl_cl <= 0 || !g.enable;
      if (statusFilter === 'REGISTERED') return registeredSubjectCodeMap.has(g.ma_mon?.toUpperCase());

      return true;
    });
  }, [openCourses.ds_nhom_to, searchQuery, statusFilter, registeredSubjectCodeMap]);

  const toggleExpandSubject = (maMon: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [maMon]: !prev[maMon],
    }));
  };

  const expandAllSubjects = () => {
    const allExpanded: Record<string, boolean> = {};
    groupedOpenCourses.forEach((s) => {
      allExpanded[s.ma_mon] = true;
    });
    setExpandedSubjects(allExpanded);
  };

  const collapseAllSubjects = () => {
    setExpandedSubjects({});
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Screen Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Cổng Đăng Ký Môn Học (QLHT)
                </h1>
                {openCourses.hoc_ky_dang_ky && (
                  <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    {openCourses.hoc_ky_dang_ky}
                  </span>
                )}
                {openCourses.trong_thoi_gian_dang_ky ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang Mở Đăng Ký
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Ngoài Thời Gian ĐK
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Sinh viên:{' '}
                <strong className="text-indigo-600 font-mono">
                  {currentUser.fullName || currentUser.username}
                </strong>{' '}
                ({currentUser.username}) • Lớp: <strong className="text-blue-600">{currentUser.lop || 'Chưa phân lớp'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => fetchPortalData(false)}
            disabled={isLoading || isRefreshing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu mới nhất từ Cổng trường"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          {!externalAccount.isConfigured && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Liên Kết Tài Khoản QLDTTX</span>
            </button>
          )}

          {(currentUser.isMonitor || currentUser.isAdmin) && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('monitor_flow')}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-2xl transition-colors border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Quản lý cấu hình Flow Action ĐKMH theo Lớp trưởng"
            >
              <GitFork className="w-3.5 h-3.5 text-amber-600" />
              <span>Flow Action Lớp</span>
            </button>
          )}

          {externalAccount.isConfigured && (
            <button
              onClick={() => setActiveSubTab('SNIPER_BOT')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-orange-200 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Auto Canh Slot (Sniper)</span>
            </button>
          )}
        </div>
      </div>

      {/* External Account Not Linked Alert */}
      {!externalAccount.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                Chưa Cấu Hình Tài Khoản Cổng QLĐT Từ Xa (QLDTTX)
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                Hệ thống cần tài khoản và mật khẩu Cổng QLĐT Từ Xa (
                <a
                  href="https://qldttx.pttc1.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold hover:text-amber-950"
                >
                  https://qldttx.pttc1.edu.vn
                </a>
                ) của bạn để thực hiện tra cứu danh sách môn mở, kiểm tra slot trống và gửi lệnh đăng ký môn học trực tiếp.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Cấu Hình Ngay →
            </button>
          )}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Groups */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Môn Đang Mở ĐK</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {openCourses.ds_mon_hoc?.length || groupedOpenCourses.length || 0}{' '}
              <span className="text-xs font-normal text-slate-400">
                môn ({openCourses.ds_nhom_to?.length || 0} nhóm tổ)
              </span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Kỳ ĐKMH hiện tại</div>
          </div>
        </div>

        {/* Card 2: Registered Courses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Môn Đã Đăng Ký</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}{' '}
              <span className="text-xs font-normal text-slate-400">môn học</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Đã ghi nhận trong TKB</div>
          </div>
        </div>

        {/* Card 3: Total Credits */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Tín Chỉ (TC)</div>
            <div className="text-2xl font-black text-blue-600 mt-0.5">
              {registeredCourses.totalCredits}{' '}
              <span className="text-xs font-normal text-slate-400">tín chỉ</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">Khối lượng học tập</div>
          </div>
        </div>

        {/* Card 4: Tuition Fee */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Học Phí Tạm Tính</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {Number(registeredCourses.tuitionFee || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-bold text-slate-400">đ</span>
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-0.5">Theo biểu giá PTTC1</div>
          </div>
        </div>
      </div>

      {/* Subtabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSubTab('OPEN_COURSES')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'OPEN_COURSES'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh Sách Môn Học Mở</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubTab === 'OPEN_COURSES' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {openCourses.ds_nhom_to?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('REGISTERED_COURSES')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'REGISTERED_COURSES'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Môn Đã Đăng Ký</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubTab === 'REGISTERED_COURSES' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('SNIPER_BOT')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'SNIPER_BOT'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 fill-current text-amber-200" />
          <span>Auto Canh Slot (Sniper)</span>
          {sniperTargets.length > 0 && (
            <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[11px] font-black animate-pulse">
              {sniperTargets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('GUIDE')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'GUIDE'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Hướng Dẫn & Mẹo</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* SUBTAB 1: OPEN COURSES REGISTRATION */}
      {/* ============================================================= */}
      {activeSubTab === 'OPEN_COURSES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã môn, tên môn, nhóm tổ, phòng học, TKB..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
              {/* Status Filter Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Tất Cả ({openCourses.ds_nhom_to?.length || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('AVAILABLE')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Còn Slot
                </button>
                <button
                  onClick={() => setStatusFilter('FULL')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'FULL' ? 'bg-rose-600 text-white shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Hết Slot
                </button>
                <button
                  onClick={() => setStatusFilter('REGISTERED')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    statusFilter === 'REGISTERED' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Đã ĐK ({registeredCourses.totalCourses || 0})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setViewMode('ACCORDION')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'ACCORDION' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                  title="Gom nhóm theo môn học"
                >
                  Gom Môn
                </button>
                <button
                  onClick={() => setViewMode('FLAT')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'FLAT' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                  }`}
                  title="Dạng bảng chi tiết tất cả nhóm tổ"
                >
                  Bảng Phẳng
                </button>
              </div>

              {viewMode === 'ACCORDION' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAllSubjects}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mở tất cả
                  </button>
                  <button
                    onClick={collapseAllSubjects}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Thu gọn
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading or Empty State */}
          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải danh sách môn học mở từ Cổng QLDTTX...</p>
            </div>
          ) : openCourses.ds_nhom_to?.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có môn học nào đang mở</p>
              <p className="text-xs text-slate-400 max-w-md">
                Hiện tại trường chưa mở đợt đăng ký môn học hoặc tài khoản chưa liên kết.
              </p>
            </div>
          ) : viewMode === 'ACCORDION' ? (
            /* ACCORDION VIEW */
            <div className="space-y-3">
              {groupedOpenCourses.map((subject) => {
                const isExpanded = expandedSubjects[subject.ma_mon] ?? true;
                const isRegistered = registeredSubjectCodeMap.has(subject.ma_mon);
                const registeredGroup = registeredSubjectCodeMap.get(subject.ma_mon);

                const totalAvailableSlots = subject.groups.reduce((acc, g) => acc + (g.sl_cl > 0 ? g.sl_cl : 0), 0);

                return (
                  <div
                    key={subject.ma_mon}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Subject Header */}
                    <div
                      onClick={() => toggleExpandSubject(subject.ma_mon)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                          {subject.groups.length}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs border border-indigo-100">
                              {subject.ma_mon}
                            </span>
                            <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">
                              {subject.ten_mon}
                            </h3>
                            <span className="text-slate-400 text-xs font-bold">
                              • {subject.so_tc} Tín Chỉ
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isRegistered && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã ĐK: Nhóm {registeredGroup}
                          </span>
                        )}

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                            totalAvailableSlots > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {totalAvailableSlots > 0 ? `Còn ${totalAvailableSlots} slot` : 'Hết slot'}
                        </span>

                        <div className="p-1 text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Subject Groups Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-center w-12">Nhóm</th>
                              <th className="px-4 py-3">Lớp Học Phần</th>
                              <th className="px-4 py-3 text-center">Sĩ Số / Slot</th>
                              <th className="px-4 py-3">Thời Khóa Biểu (TKB)</th>
                              <th className="px-4 py-3 text-right">Học Phí</th>
                              <th className="px-4 py-3 text-center">Trạng Thái</th>
                              <th className="px-4 py-3 text-center">Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {subject.groups.map((group) => {
                              const isThisGroupRegistered =
                                isRegistered && group.nhom_to === registeredGroup;
                              const isRegistering = registeringIds[group.id_to_hoc];
                              const isAvailable = group.enable && group.sl_cl > 0;
                              const percentFull =
                                group.sl_cp > 0 ? Math.min(100, Math.round((group.sl_dk / group.sl_cp) * 100)) : 0;

                              return (
                                <tr
                                  key={group.id_to_hoc}
                                  className={`hover:bg-indigo-50/30 transition-colors ${
                                    isThisGroupRegistered ? 'bg-emerald-50/50' : ''
                                  }`}
                                >
                                  {/* Nhóm tổ */}
                                  <td className="px-4 py-3.5 text-center">
                                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
                                      {group.nhom_to}
                                    </span>
                                  </td>

                                  {/* Lớp */}
                                  <td className="px-4 py-3.5 font-mono text-slate-600 text-xs">
                                    {group.lop || '—'}
                                  </td>

                                  {/* Sĩ số & slot */}
                                  <td className="px-4 py-3.5 text-center min-w-[120px]">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center gap-1 text-[11px] font-bold">
                                        <span className={group.sl_cl > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                          Còn {group.sl_cl}
                                        </span>
                                        <span className="text-slate-400">/ {group.sl_cp}</span>
                                        <span className="text-slate-500 text-[10px]">({group.sl_dk} đã ĐK)</span>
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${
                                            percentFull >= 100
                                              ? 'bg-rose-500'
                                              : percentFull > 80
                                              ? 'bg-amber-500'
                                              : 'bg-emerald-500'
                                          }`}
                                          style={{ width: `${percentFull}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* TKB */}
                                  <td className="px-4 py-3.5 max-w-xs">
                                    {group.tkb ? (
                                      <div
                                        className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: group.tkb }}
                                      />
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">Chưa xếp lịch</span>
                                    )}
                                  </td>

                                  {/* Học phí */}
                                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                                    {Number(group.phai_dong || group.hoc_phi_tam_tinh || 0).toLocaleString('vi-VN')} đ
                                  </td>

                                  {/* Trạng thái */}
                                  <td className="px-4 py-3.5 text-center">
                                    {isThisGroupRegistered ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <Check className="w-3 h-3" /> Đã Đăng Ký
                                      </span>
                                    ) : group.enable ? (
                                      group.sl_cl > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Có thể ĐK
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          Hết chỗ
                                        </span>
                                      )
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
                                        title={group.gc_enable}
                                      >
                                        {group.gc_enable || 'Khóa'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Thao tác */}
                                  <td className="px-4 py-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {isThisGroupRegistered ? (
                                        <button
                                          onClick={() => setConfirmCancelGroup(group)}
                                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
                                        >
                                          Hủy Môn
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleRegister(group.id_to_hoc)}
                                            disabled={!isAvailable || isRegistering}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                              isAvailable
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                            }`}
                                          >
                                            {isRegistering ? (
                                              <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            ) : (
                                              <Plus className="w-3 h-3" />
                                            )}
                                            <span>Đăng Ký</span>
                                          </button>

                                          {/* Nút thêm vào Auto Sniper */}
                                          <button
                                            onClick={() => {
                                              addSniperTarget({
                                                maMon: group.ma_mon,
                                                tenMon: group.ten_mon,
                                                idToHoc: group.id_to_hoc,
                                                nhomTo: group.nhom_to,
                                                autoAnyGroup: false,
                                              });
                                              setActiveSubTab('SNIPER_BOT');
                                            }}
                                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 cursor-pointer"
                                            title="Thêm tổ này vào Auto Canh Slot (Sniper)"
                                          >
                                            <Flame className="w-3.5 h-3.5 fill-current" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-12">STT</th>
                      <th className="px-4 py-3.5">Mã Môn</th>
                      <th className="px-4 py-3.5">Tên Môn Học</th>
                      <th className="px-4 py-3.5 text-center">TC</th>
                      <th className="px-4 py-3.5 text-center">Nhóm</th>
                      <th className="px-4 py-3.5">Lớp HP</th>
                      <th className="px-4 py-3.5 text-center">Sĩ Số / Slot</th>
                      <th className="px-4 py-3.5">Thời Khóa Biểu</th>
                      <th className="px-4 py-3.5 text-right">Học Phí</th>
                      <th className="px-4 py-3.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flatFilteredGroups.map((group, idx) => {
                      const isRegistered = registeredSubjectCodeMap.has(group.ma_mon?.toUpperCase());
                      const registeredGroup = registeredSubjectCodeMap.get(group.ma_mon?.toUpperCase());
                      const isThisGroupRegistered = isRegistered && group.nhom_to === registeredGroup;
                      const isRegistering = registeringIds[group.id_to_hoc];
                      const isAvailable = group.enable && group.sl_cl > 0;

                      return (
                        <tr
                          key={group.id_to_hoc}
                          className={`hover:bg-indigo-50/40 transition-colors ${
                            isThisGroupRegistered ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{group.ma_mon}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{group.ten_mon}</td>
                          <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                            {group.so_tc || group.so_tc_hp}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                              {group.nhom_to}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600">{group.lop || '—'}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={group.sl_cl > 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              {group.sl_cl}/{group.sl_cp}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            {group.tkb ? (
                              <div
                                className="text-[11px] text-slate-600 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: group.tkb }}
                              />
                            ) : (
                              <span className="text-slate-400 italic">Chưa có TKB</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                            {Number(group.phai_dong || group.hoc_phi_tam_tinh || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {isThisGroupRegistered ? (
                              <button
                                onClick={() => setConfirmCancelGroup(group)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
                              >
                                Hủy Môn
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleRegister(group.id_to_hoc)}
                                  disabled={!isAvailable || isRegistering}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isAvailable
                                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  {isRegistering ? 'Đang ĐK...' : 'Đăng Ký'}
                                </button>
                                <button
                                  onClick={() => {
                                    addSniperTarget({
                                      maMon: group.ma_mon,
                                      tenMon: group.ten_mon,
                                      idToHoc: group.id_to_hoc,
                                      nhomTo: group.nhom_to,
                                      autoAnyGroup: false,
                                    });
                                    setActiveSubTab('SNIPER_BOT');
                                  }}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 cursor-pointer"
                                  title="Thêm vào Auto Canh Slot"
                                >
                                  <Flame className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 2: REGISTERED COURSES */}
      {/* ============================================================= */}
      {activeSubTab === 'REGISTERED_COURSES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-sm sm:text-base">
                  Danh Sách Môn Học Đã Đăng Ký Thành Công
                </h3>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                Tổng cộng:{' '}
                <strong className="text-emerald-600">
                  {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}
                </strong>{' '}
                môn ({registeredCourses.totalCredits} tín chỉ)
              </div>
            </div>

            <div className="overflow-x-auto">
              {(registeredCourses.ds_kqdkmh || []).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Bạn chưa đăng ký môn học nào trong kỳ này</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Chuyển sang tab "Danh Sách Môn Học Mở" để chọn môn và bấm Đăng Ký.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('OPEN_COURSES')}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Xem Danh Sách Môn Mở</span>
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
                      <th className="px-4 py-3.5 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(registeredCourses.ds_kqdkmh || []).map((item: any, index: number) => {
                      const toHoc = item.to_hoc || {};
                      const soTC = toHoc.so_tc || toHoc.so_tc_hp || 0;
                      const fee = toHoc.phai_dong || item.hoc_phi_tam_tinh || 0;
                      const formattedFee = Number(fee).toLocaleString('vi-VN');
                      const isCancelling = cancellingIds[toHoc.id_to_hoc];

                      return (
                        <tr key={item.id_kqdk || index} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{index + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                            {toHoc.ma_mon}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800 text-sm block">{toHoc.ten_mon}</span>
                            {item.ngay_dang_ky && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> Đăng ký lúc:{' '}
                                {new Date(item.ngay_dang_ky).toLocaleString('vi-VN')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                              {soTC} TC
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                              {toHoc.nhom_to || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-mono">{toHoc.lop || '—'}</td>
                          <td className="px-4 py-3.5 max-w-xs">
                            {toHoc.tkb ? (
                              <div
                                className="text-[11px] text-slate-600 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: toHoc.tkb }}
                              />
                            ) : (
                              <span className="text-slate-400 italic">Chưa xếp lịch</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                            {formattedFee} đ
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => setConfirmCancelGroup(toHoc)}
                              disabled={isCancelling}
                              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors border border-rose-200 cursor-pointer disabled:opacity-50"
                            >
                              {isCancelling ? 'Đang hủy...' : 'Hủy Môn'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 3: AUTO CANH SLOT (SNIPER BOT) */}
      {/* ============================================================= */}
      {activeSubTab === 'SNIPER_BOT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sniper Control Center Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                    <Flame className="w-5 h-5 fill-current" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    Auto Canh Slot Môn Học (Sniper Bot)
                  </h2>
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tốc độ cao
                  </span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Tự động quét liên tục danh sách môn học theo chu kỳ. Ngay khi có sinh viên nhả môn hoặc Khoa mở thêm slot, bot sẽ lập tức bắn lệnh đăng ký với độ trễ tính bằng mili-giây.
                </p>
              </div>

              {/* Bot Start / Stop Button */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {isSniperActive ? (
                  <button
                    onClick={stopSniper}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>DỪNG AUTO CANH SLOT</span>
                  </button>
                ) : (
                  <button
                    onClick={startSniper}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer active:scale-98 animate-bounce"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>BẮT ĐẦU CANH SLOT</span>
                  </button>
                )}
              </div>
            </div>

            {/* Config & Stats Toolbar */}
            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Tần suất quét:</span>
                  <select
                    value={sniperInterval}
                    onChange={(e) => setSniperInterval(Number(e.target.value))}
                    disabled={isSniperActive}
                    className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1000}>1.0 giây (Siêu Tốc)</option>
                    <option value={1500}>1.5 giây (Khuyên Dùng)</option>
                    <option value={2000}>2.0 giây (An Toàn)</option>
                    <option value={3000}>3.0 giây (Tiết Kiệm)</option>
                    <option value={5000}>5.0 giây (Bình Thường)</option>
                  </select>
                </div>

                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    soundEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Bật/Tắt chuông báo khi có slot và khi đăng ký thành công"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}</span>
                </button>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Số lần quét: </span>
                  <strong className="text-sky-400 text-sm">{sniperStats.attempts}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Slot bắt được: </span>
                  <strong className="text-amber-400 text-sm">{sniperStats.slotsFound}</strong>
                </div>
                <div>
                  <span className="text-slate-400">ĐK thành công: </span>
                  <strong className="text-emerald-400 text-sm">{sniperStats.successCount}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sniper Targets Grid + Terminal Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col (5 cols): Target Queue */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 fill-current" />
                    <h3 className="font-black text-slate-800 text-sm">
                      Danh Sách Môn Cần Canh ({sniperTargets.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAddSniperModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Môn</span>
                    </button>
                    {sniperTargets.length > 0 && (
                      <button
                        onClick={clearSniperTargets}
                        disabled={isSniperActive}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Xóa tất cả mục tiêu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Cards */}
                {sniperTargets.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Flame className="w-8 h-8 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">Chưa có môn nào trong hàng đợi</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Bấm nút "Thêm Môn" hoặc bấm biểu tượng 🔥 ở danh sách môn mở để đưa môn vào danh sách canh slot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {sniperTargets.map((target) => (
                      <div
                        key={target.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          target.status === 'SUCCESS'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded text-xs">
                              {target.maMon}
                            </span>
                            <span className="font-bold text-xs truncate">{target.tenMon || target.maMon}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>
                              Nhóm:{' '}
                              <strong className="text-slate-700 font-mono">
                                {target.idToHoc && target.idToHoc !== 'ANY'
                                  ? target.nhomTo || target.idToHoc
                                  : 'Bất kỳ nhóm nào có chỗ'}
                              </strong>
                            </span>
                            {target.lastCheckedSlot && (
                              <span className="text-indigo-600 font-bold">• {target.lastCheckedSlot}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeSniperTarget(target.id)}
                          disabled={isSniperActive}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col (7 cols): Terminal Live Log */}
            <div className="lg:col-span-7">
              <div className="bg-[#0B132B] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full min-h-[400px]">
                {/* Terminal Window Header */}
                <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 ml-2">
                      <Terminal className="w-3.5 h-3.5 text-sky-400" /> bot-dkmh-console.log
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSniperActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> LIVE
                      </span>
                    )}
                    <button
                      onClick={clearSniperLogs}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-5 font-mono text-xs overflow-y-auto flex-1 flex flex-col-reverse gap-1.5 max-h-[420px] scrollbar-thin">
                  {sniperLogs.length === 0 ? (
                    <div className="text-slate-500 py-16 text-center italic">
                      Console log trống. Bấm "BẮT ĐẦU CANH SLOT" để xem luồng quét thời gian thực...
                    </div>
                  ) : (
                    sniperLogs.map((log) => {
                      let colorClass = 'text-slate-300';
                      if (log.type === 'slot') colorClass = 'text-amber-300 font-bold bg-amber-950/40 p-1 rounded';
                      else if (log.type === 'success')
                        colorClass = 'text-emerald-400 font-bold bg-emerald-950/40 p-1 rounded';
                      else if (log.type === 'error') colorClass = 'text-rose-400';
                      else if (log.type === 'warning') colorClass = 'text-amber-400';

                      return (
                        <div key={log.id} className="leading-relaxed flex items-start gap-2">
                          <span className="text-slate-500 select-none shrink-0">[{log.timestamp}]</span>
                          <span className={`${colorClass} break-words`}>{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 4: GUIDE & TIPS */}
      {/* ============================================================= */}
      {activeSubTab === 'GUIDE' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                Hướng Dẫn & Mẹo Đăng Ký Môn Học QLHT / QLDTTX
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Kinh nghiệm canh slot và đăng ký môn học hiệu quả cho sinh viên PTIT
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" /> 1. Cơ Chế Auto Canh Slot (Sniper)
              </h4>
              <p>
                Hệ thống sử dụng thuật toán mã hóa ngược chữ ký <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">ua</code> của cổng đào tạo Netweb / AQTech, cho phép gửi gói tin trực tiếp lên máy chủ mà không cần tải lại toàn bộ trang web.
              </p>
              <p>
                Khi ai đó vừa hủy môn hoặc khoa nâng sĩ số lớp, bot sẽ phát hiện trong 1.5 giây và gửi request đăng ký ngay.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
              <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Kiểm Tra Trùng Lịch Học
              </h4>
              <p>
                Trước khi đăng ký, hãy chú ý cột <strong>Thời Khóa Biểu (TKB)</strong> để tránh đăng ký 2 môn học cùng buổi (Thứ, Tiết) hoặc cùng tuần thi.
              </p>
              <p>
                Sau khi đăng ký thành công, bạn có thể chuyển sang tab <strong>Môn Học Đã Đăng Ký</strong> để xem tổng số tín chỉ và học phí tạm tính.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <h4 className="font-black text-amber-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" /> 3. Thời Gian Canh Slot Hiệu Quả
              </h4>
              <p>
                Sinh viên thường nhả môn vào các khung giờ: <strong>23h00 - 01h00 đêm</strong>, <strong>06h00 - 08h00 sáng</strong>, hoặc <strong>1 - 2 ngày cuối cùng</strong> của đợt điều chỉnh ĐKMH.
              </p>
              <p>
                Bạn có thể bật âm thanh thông báo và để máy tính chạy tab Auto Canh Slot.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" /> 4. An Toàn & Bảo Mật
              </h4>
              <p>
                Mật khẩu và phiên đăng nhập được lưu trữ an toàn trong cơ sở dữ liệu và chỉ dùng để giao tiếp với cổng trường <code className="font-mono bg-white px-1.5 py-0.5 rounded border">qldttx.pttc1.edu.vn</code>.
              </p>
              <p>
                Bạn có thể thay đổi hoặc hủy liên kết tài khoản bất kỳ lúc nào trong phần Hồ sơ cá nhân.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD CUSTOM SNIPER TARGET */}
      {/* ============================================================= */}
      {showAddSniperModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddSniperModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 fill-current" />
                <h3 className="text-base font-black">Thêm Môn Vào Auto Canh Slot</h3>
              </div>
              <button
                onClick={() => setShowAddSniperModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã môn học hoặc chọn từ danh sách mở:</label>
                <input
                  type="text"
                  value={manualSniperSubjectCode}
                  onChange={(e) => setManualSniperSubjectCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: TAB1, TT03, BAS1201..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Select from Open Courses */}
              <div>
                <label className="font-bold text-slate-500 block mb-1 text-[11px]">Hoặc chọn nhanh môn đang mở:</label>
                <select
                  onChange={(e) => {
                    const code = e.target.value;
                    if (code) {
                      setManualSniperSubjectCode(code);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">-- Chọn môn học từ danh sách mở --</option>
                  {openCourses.ds_mon_hoc?.map((m) => (
                    <option key={m.ma} value={m.ma}>
                      {m.ma} - {m.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                💡 Bot sẽ ưu tiên đăng ký bất kỳ nhóm tổ nào còn slot trống thuộc mã môn này ngay khi phát hiện.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSniperModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!manualSniperSubjectCode.trim()) {
                      alert('Vui lòng nhập mã môn học');
                      return;
                    }
                    const matchedSubj = openCourses.ds_mon_hoc?.find(
                      (m) => m.ma.toUpperCase() === manualSniperSubjectCode.trim().toUpperCase()
                    );
                    addSniperTarget({
                      maMon: manualSniperSubjectCode.trim().toUpperCase(),
                      tenMon: matchedSubj?.ten || manualSniperSubjectCode.trim().toUpperCase(),
                      idToHoc: manualSniperGroupId || undefined,
                      autoAnyGroup: manualSniperAnyGroup,
                    });
                    setManualSniperSubjectCode('');
                    setManualSniperGroupId('');
                    setShowAddSniperModal(false);
                  }}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Hàng Đợi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CONFIRM CANCEL COURSE REGISTRATION */}
      {/* ============================================================= */}
      {confirmCancelGroup && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmCancelGroup(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black">Xác Nhận Hủy Môn Học</h3>
              </div>
              <button
                onClick={() => setConfirmCancelGroup(null)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-slate-800 text-sm">
                Bạn có chắc chắn muốn hủy đăng ký môn học:{' '}
                <strong className="text-rose-600">
                  {confirmCancelGroup.ten_mon || confirmCancelGroup.ma_mon} (Nhóm {confirmCancelGroup.nhom_to})
                </strong>
                ?
              </p>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Lưu ý: Sau khi hủy môn, slot của bạn sẽ được giải phóng ngay lập tức cho sinh viên khác. Bạn có thể không thể đăng ký lại nếu lớp đã kín chỗ.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmCancelGroup(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Không, Quay Lại
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = confirmCancelGroup.id_to_hoc;
                    setConfirmCancelGroup(null);
                    await handleCancel(id);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Xác Nhận Hủy Môn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
