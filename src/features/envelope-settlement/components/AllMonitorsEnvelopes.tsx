import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../../../types';
import {
  Mail,
  Search,
  MapPin,
  DollarSign,
  Settings,
  CheckCircle2,
  Hand,
  RotateCcw,
  User,
  UserCheck,
  Users,
  Edit3,
  Tag,
  Sparkles,
  Filter,
  Calendar,
  GraduationCap,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import {
  calculateRoomPrice,
  getDefaultRoomPrice,
  formatCurrency,
  saveSessionPriceOverride,
  removeSessionPriceOverride,
  fetchPricingFromBackend,
} from '../../../config/pricingConfig';
import {
  getStoredEnvelopeAssignments,
  fetchEnvelopeAssignments,
  saveEnvelopeAssignment,
  removeEnvelopeAssignment,
  getEffectiveResponsibleClass,
  ENVELOPE_ASSIGNMENTS_CHANGED_EVENT,
  EnvelopeAssignmentsMap,
  EnvelopeAssignment,
  SaveEnvelopeOptions,
} from '../../../config/envelopeAssignmentConfig';
import PricingConfigModal from './PricingConfigModal';
import AssignEnvelopeModal from './AssignEnvelopeModal';
import QuickEditPriceModal from './QuickEditPriceModal';

interface AllMonitorsEnvelopesProps {
  sessions?: ExamSession[];
  records?: ExamRecord[];
  loginUsers?: LoginUser[];
  isAdmin?: boolean;
}

export default function AllMonitorsEnvelopes({
  sessions = [],
  records = [],
  loginUsers = [],
  isAdmin,
}: AllMonitorsEnvelopesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'UNCLAIMED' | 'CLAIMED' | 'MY_CLASS' | 'MY_CLASS_STRICT_LARGEST' | 'MY_CLASS_SUGGESTED' | 'MY_CLAIMED'
  >('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);
  const [envelopeAssignments, setEnvelopeAssignments] = useState<EnvelopeAssignmentsMap>(getStoredEnvelopeAssignments);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [assigningSession, setAssigningSession] = useState<any | null>(null);
  const [assigningInitialClass, setAssigningInitialClass] = useState<string>('');
  const [quickEditSession, setQuickEditSession] = useState<any | null>(null);

  // Load and listen for envelope assignments & pricing updates
  useEffect(() => {
    fetchEnvelopeAssignments().then((res) => {
      if (res) setEnvelopeAssignments(res);
    });
    fetchPricingFromBackend().catch(() => {});

    const handler = (e: any) => {
      if (e.detail) {
        setEnvelopeAssignments(e.detail);
      } else {
        setEnvelopeAssignments(getStoredEnvelopeAssignments());
      }
    };

    window.addEventListener(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, handler);
  }, []);

  const currentUser = useMemo(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const userClass = useMemo(() => {
    return currentUser?.lop?.trim() || '';
  }, [currentUser]);

  const effectiveIsAdmin = useMemo(() => {
    if (typeof isAdmin === 'boolean') return isAdmin;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      if (!saved) return false;
      const u = JSON.parse(saved);
      return Boolean(u?.isAdmin || u?.role === 'admin' || u?.activeRole === 'admin');
    } catch {
      return false;
    }
  }, [isAdmin]);

  useEffect(() => {
    const handler = () => setPricingVersion((v) => v + 1);
    window.addEventListener('pricing_config_changed', handler);
    return () => window.removeEventListener('pricing_config_changed', handler);
  }, []);

  const monitorClasses = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    loginUsers.forEach((u) => {
      if (isUserMonitor(u) && u.lop && u.lop.trim()) {
        set.add(u.lop.trim());
      }
    });
    return set;
  }, [loginUsers]);

  // Compute responsible classes for each session
  const enhancedSessions = useMemo(() => {
    return sessions.map((session) => {
      const monitoredClassesInRoom = session.classCounts.filter((c) => monitorClasses.has(c.className));
      const { responsibleClass, isClaimedManual, assignmentInfo } = getEffectiveResponsibleClass(
        session,
        monitoredClassesInRoom,
        envelopeAssignments
      );
      const responsibleClasses = responsibleClass ? [responsibleClass] : [];
      return { ...session, responsibleClasses, isClaimedManual, assignmentInfo };
    });
  }, [sessions, monitorClasses, envelopeAssignments]);

  const parseDate = (dStr: string) => {
    if (!dStr) return 0;
    const parts = dStr.split(/[\/\-]/);
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10) || 1;
      const m = parseInt(parts[1], 10) || 1;
      const y = parseInt(parts[2], 10) || 1970;
      return new Date(y, m - 1, d).getTime();
    }
    return 0;
  };

  const availableDates = useMemo(() => {
    const datesSet = new Set<string>();
    enhancedSessions.forEach((s) => {
      if (s.date && s.date.trim()) datesSet.add(s.date.trim());
    });
    return Array.from(datesSet).sort((a, b) => parseDate(a) - parseDate(b));
  }, [enhancedSessions]);

  const availableClasses = useMemo(() => {
    const classesSet = new Set<string>();
    enhancedSessions.forEach((s) => {
      s.classCounts?.forEach((c) => {
        if (c.className && c.className.trim()) classesSet.add(c.className.trim());
      });
      s.responsibleClasses?.forEach((rc) => {
        if (rc && rc.trim()) classesSet.add(rc.trim());
      });
    });
    monitorClasses.forEach((c) => classesSet.add(c));
    return Array.from(classesSet).sort((a, b) => a.localeCompare(b));
  }, [enhancedSessions, monitorClasses]);

  // Check if user's class has the absolute highest number of students in the room (including classes without a monitor)
  const isUserClassStrictLargestInSession = useCallback(
    (s: { classCounts: { className: string; count: number }[] }, uClass: string) => {
      if (!uClass) return false;
      const cleanUClass = uClass.trim().toUpperCase();
      const userCount = s.classCounts.find((c) => c.className.trim().toUpperCase() === cleanUClass)?.count || 0;
      if (userCount <= 0) return false;
      const maxCount = Math.max(...s.classCounts.map((c) => c.count));
      return userCount === maxCount;
    },
    []
  );

  // Check if user's class is suggested by the system (prioritizing classes with a monitor)
  const isUserClassSuggestedInSession = useCallback(
    (s: { responsibleClasses: string[] }, uClass: string) => {
      if (!uClass) return false;
      const cleanUClass = uClass.trim().toUpperCase();
      return s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass);
    },
    []
  );

  const counts = useMemo(() => {
    const total = enhancedSessions.filter((s) => s.responsibleClasses.length > 0).length;
    const unclaimed = enhancedSessions.filter((s) => s.responsibleClasses.length > 0 && !s.isClaimedManual).length;
    const claimed = enhancedSessions.filter((s) => s.responsibleClasses.length > 0 && s.isClaimedManual).length;
    const myClass = userClass
      ? enhancedSessions.filter(
          (s) =>
            s.responsibleClasses.length > 0 &&
            (s.classCounts.some((c) => c.className.trim().toUpperCase() === userClass.trim().toUpperCase()) ||
              s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === userClass.trim().toUpperCase()))
        ).length
      : 0;
    const myClassStrictLargest = userClass
      ? enhancedSessions.filter(
          (s) => s.responsibleClasses.length > 0 && isUserClassStrictLargestInSession(s, userClass)
        ).length
      : 0;
    const myClassSuggested = userClass
      ? enhancedSessions.filter(
          (s) => s.responsibleClasses.length > 0 && isUserClassSuggestedInSession(s, userClass)
        ).length
      : 0;
    const myClaimed = userClass
      ? enhancedSessions.filter(
          (s) =>
            s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === userClass.trim().toUpperCase()) &&
            s.isClaimedManual
        ).length
      : 0;

    return { total, unclaimed, claimed, myClass, myClassStrictLargest, myClassSuggested, myClaimed };
  }, [enhancedSessions, userClass, isUserClassStrictLargestInSession, isUserClassSuggestedInSession]);

  const handleOpenAssignModal = useCallback((session: any, initialClass?: string) => {
    setAssigningSession(session);
    setAssigningInitialClass(initialClass || session.responsibleClasses[0] || '');
  }, []);

  const handleConfirmAssign = useCallback(
    async (sessionId: string, targetClass: string, options: SaveEnvelopeOptions) => {
      setLoadingClaimId(sessionId);
      try {
        const res = await saveEnvelopeAssignment(sessionId, targetClass, options);
        if (res.success && res.assignments) {
          setEnvelopeAssignments(res.assignments);
        }
        setPricingVersion((v) => v + 1);
      } catch (e) {
        console.error('Error confirming envelope assignment:', e);
      } finally {
        setLoadingClaimId(null);
      }
    },
    []
  );

  const handleSaveQuickPrice = useCallback(
    async (sessionId: string, newPrice: number | null) => {
      setLoadingClaimId(sessionId);
      try {
        const existingAssign = envelopeAssignments[sessionId];
        if (existingAssign) {
          const res = await saveEnvelopeAssignment(sessionId, existingAssign.assignedClass, {
            assistantStudentId: existingAssign.assistantStudentId,
            assistantStudentName: existingAssign.assistantStudentName,
            customPrice: newPrice,
            note: existingAssign.note,
            room: existingAssign.room,
            date: existingAssign.date,
            time: existingAssign.time,
            subjectCode: existingAssign.subjectCode,
            subject: existingAssign.subject,
          });
          if (res.success && res.assignments) {
            setEnvelopeAssignments(res.assignments);
          }
        } else {
          if (newPrice !== null && newPrice > 0) {
            saveSessionPriceOverride(sessionId, newPrice);
          } else {
            removeSessionPriceOverride(sessionId);
          }
        }
        setPricingVersion((v) => v + 1);
        fetchEnvelopeAssignments().then((res) => res && setEnvelopeAssignments(res));
      } catch (e) {
        console.error('Error saving quick price:', e);
      } finally {
        setLoadingClaimId(null);
      }
    },
    [envelopeAssignments]
  );

  const handleCancelClaim = useCallback(async (sessionId: string) => {
    setLoadingClaimId(sessionId);
    try {
      const res = await removeEnvelopeAssignment(sessionId);
      if (res.success && res.assignments) {
        setEnvelopeAssignments(res.assignments);
      }
      setPricingVersion((v) => v + 1);
    } catch (e) {
      console.error('Error cancelling envelope claim:', e);
    } finally {
      setLoadingClaimId(null);
    }
  }, []);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus, filterDate, filterClass]);

  const displayedSessions = useMemo(() => {
    let filtered = enhancedSessions.filter((s) => s.responsibleClasses.length > 0);

    if (filterStatus === 'UNCLAIMED') {
      filtered = filtered.filter((s) => !s.isClaimedManual);
    } else if (filterStatus === 'CLAIMED') {
      filtered = filtered.filter((s) => s.isClaimedManual);
    } else if (filterStatus === 'MY_CLASS' && userClass) {
      const cleanUClass = userClass.trim().toUpperCase();
      filtered = filtered.filter(
        (s) =>
          s.classCounts.some((c) => c.className.trim().toUpperCase() === cleanUClass) ||
          s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass)
      );
    } else if (filterStatus === 'MY_CLASS_STRICT_LARGEST' && userClass) {
      filtered = filtered.filter((s) => isUserClassStrictLargestInSession(s, userClass));
    } else if (filterStatus === 'MY_CLASS_SUGGESTED' && userClass) {
      filtered = filtered.filter((s) => isUserClassSuggestedInSession(s, userClass));
    } else if (filterStatus === 'MY_CLAIMED' && userClass) {
      const cleanUClass = userClass.trim().toUpperCase();
      filtered = filtered.filter(
        (s) => s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass) && s.isClaimedManual
      );
    }

    if (filterDate && filterDate !== 'ALL') {
      filtered = filtered.filter((s) => s.date === filterDate);
    }

    if (filterClass && filterClass !== 'ALL') {
      filtered = filtered.filter(
        (s) => s.classCounts.some((c) => c.className === filterClass) || s.responsibleClasses.includes(filterClass)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const matchBasic =
          s.subject.toLowerCase().includes(term) ||
          s.subjectCode.toLowerCase().includes(term) ||
          s.room.toLowerCase().includes(term) ||
          (s.examFormat && s.examFormat.toLowerCase().includes(term)) ||
          s.responsibleClasses.some((c) => c.toLowerCase().includes(term)) ||
          s.classCounts.some((c) => c.className.toLowerCase().includes(term));

        if (matchBasic) return true;

        if (s.assignmentInfo) {
          const asstName = s.assignmentInfo.assistantStudentName?.toLowerCase() || '';
          const asstId = s.assignmentInfo.assistantStudentId?.toLowerCase() || '';
          const claimedBy = s.assignmentInfo.claimedByName?.toLowerCase() || '';
          const note = s.assignmentInfo.note?.toLowerCase() || '';
          if (asstName.includes(term) || asstId.includes(term) || claimedBy.includes(term) || note.includes(term)) {
            return true;
          }
        }
        return false;
      });
    }

    return filtered;
  }, [enhancedSessions, filterStatus, filterDate, filterClass, searchTerm, userClass]);

  const totalPages = Math.max(1, Math.ceil(displayedSessions.length / pageSize));

  const paginatedSessions = useMemo(() => {
    if (pageSize >= 9999) return displayedSessions;
    const start = (page - 1) * pageSize;
    return displayedSessions.slice(start, start + pageSize);
  }, [displayedSessions, page, pageSize]);

  const isFilterActive =
    filterStatus !== 'ALL' || filterDate !== 'ALL' || filterClass !== 'ALL' || searchTerm.trim() !== '';

  const handleResetFilters = () => {
    setFilterStatus('ALL');
    setFilterDate('ALL');
    setFilterClass('ALL');
    setSearchTerm('');
    setPage(1);
  };

  const totalExpectedMoney = useMemo(() => {
    return displayedSessions.reduce(
      (sum, s) => sum + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat, s.id),
      0
    );
  }, [displayedSessions, pricingVersion]);

  const claimedCountInDisplayed = useMemo(() => {
    return displayedSessions.filter((s) => s.isClaimedManual).length;
  }, [displayedSessions]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>Phân Công Phong Bì</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Danh sách tất cả phòng thi. Lớp đông SV nhất được gợi ý phụ trách, các lớp có thể chủ động nhận hoặc gán sinh viên hỗ trợ.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Tùy chỉnh định mức giá tiền phòng"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấu hình tiền phòng</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-3 shrink-0">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-center">
          {/* Search text input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm môn, phòng, lớp, LT, SV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Select */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
            >
              <option value="ALL">Tất cả trạng thái ({counts.total})</option>
              <option value="UNCLAIMED">Chưa nhận - Đang gợi ý ({counts.unclaimed})</option>
              <option value="CLAIMED">Đã có người nhận ({counts.claimed})</option>
              {userClass && (
                <>
                  <option value="MY_CLASS">Phòng có lớp tôi ({counts.myClass})</option>
                  <option value="MY_CLASS_STRICT_LARGEST">
                    Lớp tôi đông nhất (so sánh tất cả lớp kể cả không có LT) ({counts.myClassStrictLargest})
                  </option>
                  <option value="MY_CLASS_SUGGESTED">Gợi ý cho lớp tôi ({counts.myClassSuggested})</option>
                  <option value="MY_CLAIMED">Lớp tôi đã nhận ({counts.myClaimed})</option>
                </>
              )}
            </select>
          </div>

          {/* Date Select */}
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
            >
              <option value="ALL">Tất cả ngày thi ({availableDates.length} ngày)</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  Ngày: {d}
                </option>
              ))}
            </select>
          </div>

          {/* Class Select & Reset */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white cursor-pointer transition-colors"
              >
                <option value="ALL">Tất cả các lớp ({availableClasses.length} lớp)</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Lớp: {c} {userClass === c ? '(Lớp bạn)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Filter Chips / Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lọc nhanh:</span>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('UNCLAIMED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'UNCLAIMED'
                ? 'bg-amber-500 text-white shadow-2xs shadow-amber-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Chưa ai nhận ({counts.unclaimed})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CLAIMED')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'CLAIMED'
                ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã nhận ({counts.claimed})</span>
          </button>
          {userClass && (
            <>
              <button
                type="button"
                onClick={() => setFilterStatus('MY_CLASS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'MY_CLASS'
                    ? 'bg-blue-600 text-white shadow-2xs shadow-blue-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Lớp tôi ({userClass}: {counts.myClass})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('MY_CLASS_STRICT_LARGEST')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'MY_CLASS_STRICT_LARGEST'
                    ? 'bg-indigo-600 text-white shadow-2xs shadow-indigo-200'
                    : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                }`}
                title="Các phòng thi mà lớp bạn có đông sinh viên nhất so với toàn bộ các lớp trong phòng (bao gồm cả các lớp không có lớp trưởng)"
              >
                <Users className="w-3 h-3" />
                <span>Lớp tôi đông nhất (tất cả lớp: {counts.myClassStrictLargest})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('MY_CLASS_SUGGESTED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'MY_CLASS_SUGGESTED'
                    ? 'bg-amber-600 text-white shadow-2xs shadow-amber-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                }`}
                title="Các phòng thi mà hệ thống gợi ý lớp bạn phụ trách (dựa trên lớp có Lớp trưởng đông SV nhất)"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Gợi ý cho lớp tôi ({counts.myClassSuggested})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('MY_CLAIMED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'MY_CLAIMED'
                    ? 'bg-purple-600 text-white shadow-2xs shadow-purple-200'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Lớp tôi đã nhận ({counts.myClaimed})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
              {isFilterActive ? 'Phòng lọc được' : 'Tổng phòng thi'}
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-slate-800 mt-0.5 leading-none">
              {displayedSessions.length}{' '}
              <span className="text-xs sm:text-sm font-medium text-slate-400">/ {enhancedSessions.length}</span>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/70 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider truncate">
              Tổng quỹ bồi dưỡng
            </p>
            <p className="text-xs sm:text-xl font-extrabold text-amber-950 mt-0.5 leading-none truncate">
              {formatCurrency(totalExpectedMoney)}
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
              Tiến độ nhận phong bì
            </p>
            <p className="text-base sm:text-2xl font-extrabold text-emerald-700 mt-0.5 leading-none">
              {claimedCountInDisplayed}{' '}
              <span className="text-xs sm:text-sm font-medium text-slate-400">
                / {displayedSessions.length} ({displayedSessions.length > 0 ? Math.round((claimedCountInDisplayed / displayedSessions.length) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {displayedSessions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
            <Mail className="w-12 h-12 text-slate-300" />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-600">Không tìm thấy phòng thi nào phù hợp.</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử xóa hoặc thay đổi điều kiện bộ lọc.</p>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Cards (< 768px) */}
            <div className="block md:hidden p-3 space-y-3.5">
              {paginatedSessions.map((session, index) => {
                const itemIndex = (page - 1) * pageSize + index + 1;
                const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
                const defaultRoomPrice = getDefaultRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
                const isCustomPrice = roomPrice !== defaultRoomPrice;

                return (
                  <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col gap-3">
                    {/* Header: Room & Date/Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400">#{itemIndex}</span>
                        <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 rounded-lg text-sm truncate">
                          Phòng {session.room}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
                        <span>{session.date}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-blue-700 font-bold">{session.time}</span>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{session.subject}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Mã MH: <span className="font-semibold text-slate-700">{session.subjectCode}</span>
                        {session.examFormat && (
                          <span className="ml-2 font-sans font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                            {session.examFormat}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Class Student Counts */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Cơ cấu sinh viên ({session.classCounts.reduce((sum, c) => sum + c.count, 0)} SV)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.classCounts.map((c) => {
                          const isMonitorClass = monitorClasses.has(c.className);
                          const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                          return (
                            <span
                              key={c.className}
                              className={`text-xs px-2 py-0.5 rounded-md font-bold border flex gap-1 items-center ${
                                isMyClass
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : isMonitorClass
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              <span>{c.className}</span>
                              <span className={`w-px h-2.5 ${isMyClass ? 'bg-blue-400' : isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                              <span className="font-extrabold">{c.count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Bồi dưỡng</span>
                        <button
                          type="button"
                          onClick={() => setQuickEditSession(session)}
                          className="inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-lg text-xs border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                        >
                          <span>{formatCurrency(roomPrice)}</span>
                          <Edit3 className="w-3 h-3 text-amber-600" />
                        </button>
                      </div>
                      <div>
                        {session.isClaimedManual ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã nhận
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-1 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Gợi ý
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RESPONSIBILITY SECTION (Mobile) */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                      {session.responsibleClasses.map((cls) => {
                        const cleanCls = cls.trim().toUpperCase();
                        const monitorUser = loginUsers.find(
                          (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
                        );
                        const isMyClass = userClass && cleanCls === userClass.trim().toUpperCase();

                        if (session.isClaimedManual) {
                          return (
                            <div key={cls} className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-900">
                                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Lớp phụ trách: <strong className="text-sm">{cls}</strong></span>
                                  {isMyClass && (
                                    <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Lớp bạn</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(session, cls)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                  >
                                    Đổi người
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelClaim(session.id)}
                                    disabled={loadingClaimId === session.id}
                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                                    title="Hủy nhận, trả về gợi ý tự động"
                                  >
                                    {loadingClaimId === session.id ? '...' : 'Hủy nhận'}
                                  </button>
                                </div>
                              </div>

                              {session.assignmentInfo?.assistantStudentName ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>SV hỗ trợ: <strong>{session.assignmentInfo.assistantStudentName}</strong> ({session.assignmentInfo.assistantStudentId})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg">
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>LT: <strong>{session.assignmentInfo?.claimedByName || monitorUser?.fullName || monitorUser?.username || 'Lớp trưởng'}</strong></span>
                                </div>
                              )}

                              {session.assignmentInfo?.note && (
                                <p className="text-[10px] text-slate-500 italic bg-white/80 px-2 py-0.5 rounded border border-slate-200 truncate">
                                  Ghi chú: {session.assignmentInfo.note}
                                </p>
                              )}
                            </div>
                          );
                        }

                        const suggestedClassCount = session.classCounts.find((c) => c.className === cls)?.count || 0;
                        return (
                          <div key={cls} className="bg-amber-50/50 border border-dashed border-amber-300 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Gợi ý: <strong className="text-amber-900 text-sm">{cls}</strong> ({suggestedClassCount} SV)</span>
                                  {isMyClass && (
                                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold ml-1">Lớp bạn</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">Lớp có đông SV nhất phòng (chưa ai nhận)</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(session, cls)}
                                disabled={loadingClaimId === session.id}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 ${
                                  isMyClass
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {loadingClaimId === session.id ? 'Đang lưu...' : isMyClass ? 'Lớp tôi nhận' : 'Nhận phòng này'}
                              </button>
                            </div>

                            {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
                              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Lớp khác nhận:</span>
                                {session.classCounts
                                  .filter((c) => c.className !== cls)
                                  .map((c) => {
                                    const isOtherMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                                    return (
                                      <button
                                        key={c.className}
                                        type="button"
                                        onClick={() => handleOpenAssignModal(session, c.className)}
                                        disabled={loadingClaimId === session.id}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                          isOtherMyClass
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                        }`}
                                        title={`Chuyển nhận phòng cho lớp ${c.className}`}
                                      >
                                        <Hand className="w-3 h-3 inline mr-0.5" />
                                        <span>{isOtherMyClass ? `Lớp tôi (${c.className}) nhận` : `Lớp ${c.className} nhận`}</span>
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead className="bg-slate-50 border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center align-top">STT</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 align-top">Thời gian</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-60 align-top">Phòng & Môn</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px] align-top">Cơ cấu sinh viên</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 whitespace-nowrap align-top">
                      <div className="flex items-center gap-1">
                        <span>Bồi dưỡng</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(sửa)</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-[360px] min-w-[320px] align-top">Trách nhiệm phụ trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSessions.map((session, index) => {
                    const itemIndex = (page - 1) * pageSize + index + 1;
                    const roomPrice = calculateRoomPrice(
                      session.subject,
                      session.subjectCode,
                      session.room,
                      session.examFormat,
                      session.id
                    );
                    const defaultRoomPrice = getDefaultRoomPrice(
                      session.subject,
                      session.subjectCode,
                      session.room,
                      session.examFormat
                    );
                    const isCustomPrice = roomPrice !== defaultRoomPrice;

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 text-xs text-slate-400 font-semibold text-center align-top">{itemIndex}</td>

                        {/* Date & Time */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{session.date}</span>
                            <span className="text-blue-600 font-bold text-xs mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {session.time}
                            </span>
                          </div>
                        </td>

                        {/* Room & Subject */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-rose-600 text-sm">Phòng {session.room}</span>
                            <span
                              className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5 break-words whitespace-normal"
                              title={session.subject}
                            >
                              {session.subject}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-400 text-xs font-mono">{session.subjectCode}</span>
                              {session.examFormat && (
                                <span className="font-sans font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                                  {session.examFormat}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Student class counts */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {session.classCounts.map((c) => {
                              const isMonitorClass = monitorClasses.has(c.className);
                              const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                              return (
                                <span
                                  key={c.className}
                                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold border flex gap-1.5 items-center ${
                                    isMyClass
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                      : isMonitorClass
                                      ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                  title={isMyClass ? 'Lớp của bạn' : isMonitorClass ? 'Lớp có Lớp Trưởng' : 'Lớp chưa đăng ký LT'}
                                >
                                  <span>{c.className}</span>
                                  <span
                                    className={`w-px h-3 ${
                                      isMyClass ? 'bg-blue-400' : isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'
                                    }`}
                                  ></span>
                                  <span>{c.count}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Room Price */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <button
                              type="button"
                              onClick={() => setQuickEditSession(session)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-2xs group ${
                                isCustomPrice
                                  ? 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                              title="Bấm để chỉnh sửa mức giá tiền cho phòng này"
                            >
                              <span>{formatCurrency(roomPrice)}</span>
                              <Edit3 className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                            </button>
                            {isCustomPrice && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                                <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Tùy chỉnh (Chuẩn: {formatCurrency(defaultRoomPrice)})</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* RESPONSIBILITY (Desktop Table) */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-2">
                            {session.responsibleClasses.map((cls) => {
                              const cleanCls = cls.trim().toUpperCase();
                              const monitorUser = loginUsers.find(
                                (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
                              );
                              const isMyClass = userClass && cleanCls === userClass.trim().toUpperCase();

                              if (session.isClaimedManual) {
                                return (
                                  <div
                                    key={cls}
                                    className="flex flex-col gap-1.5 items-start bg-emerald-50/90 border border-emerald-300 p-2.5 rounded-xl shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between w-full gap-2">
                                      <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-xs">
                                        <span className="bg-emerald-600 text-white p-0.5 rounded">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        </span>
                                        <span className="text-sm font-bold text-emerald-950">Lớp {cls}</span>
                                        {isMyClass && (
                                          <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                            Lớp bạn
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-tight">
                                        Đã nhận
                                      </span>
                                    </div>

                                    <div className="flex flex-col w-full gap-1 pt-1.5 border-t border-emerald-200">
                                      {session.assignmentInfo?.assistantStudentName ? (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
                                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                          <span>
                                            SV hỗ trợ: <strong>{session.assignmentInfo.assistantStudentName}</strong> (
                                            {session.assignmentInfo.assistantStudentId})
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-lg">
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          <span>
                                            LT:{' '}
                                            <strong>
                                              {session.assignmentInfo?.claimedByName ||
                                                monitorUser?.fullName ||
                                                monitorUser?.username ||
                                                'Lớp trưởng'}
                                            </strong>
                                          </span>
                                        </div>
                                      )}

                                      {session.assignmentInfo?.note && (
                                        <p className="text-[10px] text-slate-500 italic bg-white/70 px-2 py-0.5 rounded border border-slate-200 truncate">
                                          Ghi chú: {session.assignmentInfo.note}
                                        </p>
                                      )}

                                      <div className="flex flex-col w-full gap-1.5 mt-1 pt-1.5 border-t border-emerald-200/70">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenAssignModal(session, cls)}
                                              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                            >
                                              Đổi người
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleCancelClaim(session.id)}
                                              disabled={loadingClaimId === session.id}
                                              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                              title="Hủy nhận, trở về gợi ý tự động"
                                            >
                                              {loadingClaimId === session.id ? 'Đang hủy...' : 'Hủy nhận'}
                                            </button>
                                          </div>
                                        </div>

                                        {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
                                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-100/70">
                                            <span className="text-[10px] text-slate-500 font-medium">Chuyển sang:</span>
                                            {session.classCounts
                                              .filter((c) => c.className !== cls)
                                              .map((c) => (
                                                <button
                                                  key={c.className}
                                                  type="button"
                                                  onClick={() => handleOpenAssignModal(session, c.className)}
                                                  disabled={loadingClaimId === session.id}
                                                  className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                                  title={`Chuyển trách nhiệm sang lớp ${c.className}`}
                                                >
                                                  {c.className}
                                                </button>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const suggestedClassCount =
                                session.classCounts.find((c) => c.className === cls)?.count || 0;
                              return (
                                <div
                                  key={cls}
                                  className="flex flex-col gap-2 items-start bg-amber-50/40 border border-dashed border-amber-300 p-2.5 rounded-xl shadow-2xs"
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                          <Sparkles className="w-3 h-3 text-amber-600" />
                                          Gợi ý
                                        </span>
                                        <span className="font-bold text-slate-800 text-sm truncate">Lớp {cls}</span>
                                        <span className="text-xs text-slate-500 font-semibold shrink-0">
                                          ({suggestedClassCount} SV)
                                        </span>
                                        {isMyClass && (
                                          <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                                            Lớp bạn
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                        Đông SV nhất phòng (chưa ai nhận)
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModal(session, cls)}
                                      disabled={loadingClaimId === session.id}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 ${
                                        isMyClass
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      }`}
                                      title="Xác nhận nhận phòng thi này hoặc gán sinh viên hỗ trợ"
                                    >
                                      {loadingClaimId === session.id
                                        ? 'Đang lưu...'
                                        : isMyClass
                                        ? 'Lớp tôi nhận'
                                        : 'Nhận phòng'}
                                    </button>
                                  </div>

                                  {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
                                    <div className="w-full pt-1.5 border-t border-amber-200/60 flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Lớp khác:</span>
                                      {session.classCounts
                                        .filter((c) => c.className !== cls)
                                        .map((c) => {
                                          const isOtherMyClass =
                                            userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                                          return (
                                            <button
                                              key={c.className}
                                              type="button"
                                              onClick={() => handleOpenAssignModal(session, c.className)}
                                              disabled={loadingClaimId === session.id}
                                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                                isOtherMyClass
                                                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                                                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                              }`}
                                              title={`Nhận phòng này cho lớp ${c.className}`}
                                            >
                                              <Hand className="w-3 h-3" />
                                              <span>{isOtherMyClass ? `Lớp tôi (${c.className})` : c.className}</span>
                                            </button>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {displayedSessions.length > 0 && (
              <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <span>
                    Hiển thị <strong>{(page - 1) * pageSize + 1}</strong> -{' '}
                    <strong>{Math.min(page * pageSize, displayedSessions.length)}</strong> trên tổng số{' '}
                    <strong>{displayedSessions.length}</strong> phòng
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-slate-400">Dòng/trang:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={9999}>Tất cả</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>

                    <div className="flex items-center gap-1 px-2 font-semibold text-slate-700">
                      <span>Trang</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={page}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val >= 1 && val <= totalPages) setPage(val);
                        }}
                        className="w-12 text-center py-0.5 border border-slate-200 rounded-md font-bold bg-white"
                      />
                      <span>/ {totalPages}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AssignEnvelopeModal
        isOpen={Boolean(assigningSession)}
        onClose={() => setAssigningSession(null)}
        session={assigningSession}
        initialClass={assigningInitialClass}
        records={records}
        loginUsers={loginUsers}
        currentAssignment={assigningSession ? envelopeAssignments[assigningSession.id] : undefined}
        onConfirm={handleConfirmAssign}
        isLoading={loadingClaimId === assigningSession?.id}
      />

      <QuickEditPriceModal
        isOpen={Boolean(quickEditSession)}
        onClose={() => setQuickEditSession(null)}
        session={quickEditSession}
        onSave={handleSaveQuickPrice}
        isLoading={loadingClaimId === quickEditSession?.id}
      />

      <PricingConfigModal
        isOpen={isPricingModalOpen && effectiveIsAdmin}
        onClose={() => setIsPricingModalOpen(false)}
        isAdmin={effectiveIsAdmin}
      />
    </div>
  );
}
