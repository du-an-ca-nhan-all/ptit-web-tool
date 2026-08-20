import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../types';
import { Mail, MapPin, Users, Info, X, DollarSign, Download, Settings, CheckCircle2, Hand, RotateCcw, User, UserCheck, Edit3, Tag } from 'lucide-react';
import {
  calculateRoomPrice,
  getDefaultRoomPrice,
  formatCurrency,
  saveSessionPriceOverride,
  removeSessionPriceOverride,
} from '../config/pricingConfig';
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
} from '../config/envelopeAssignmentConfig';
import PricingConfigModal from './PricingConfigModal';
import AssignEnvelopeModal from './AssignEnvelopeModal';
import QuickEditPriceModal from './QuickEditPriceModal';

interface SessionEnvelope {
  id: string;
  room: string;
  date: string;
  time: string;
  subject: string;
  subjectCode: string;
  examFormat?: string;
  classCounts: { className: string; count: number }[];
  isResponsible: boolean;
  responsibleClass: string;
  isClaimedManual: boolean;
  assignmentInfo?: EnvelopeAssignment;
}

interface RoomEnvelopeManagerProps {
  sessions?: ExamSession[];
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  loginUsers?: LoginUser[];
  hideClassSelector?: boolean;
  isAdmin?: boolean;
}

export default function RoomEnvelopeManager({
  sessions = [],
  records,
  selectedClass,
  onClassChange,
  loginUsers = [],
  hideClassSelector = false,
  isAdmin,
}: RoomEnvelopeManagerProps) {
  const [filterDate, setFilterDate] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || '';
  });
  const [filterResponsibleOnly, setFilterResponsibleOnly] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('responsible') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);
  const [envelopeAssignments, setEnvelopeAssignments] = useState<EnvelopeAssignmentsMap>(getStoredEnvelopeAssignments);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [assigningSession, setAssigningSession] = useState<any | null>(null);
  const [assigningInitialClass, setAssigningInitialClass] = useState<string>('');
  const [quickEditSession, setQuickEditSession] = useState<any | null>(null);

  // Load and listen for envelope assignments
  useEffect(() => {
    fetchEnvelopeAssignments().then((res) => {
      if (res) setEnvelopeAssignments(res);
    });

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

  // Sync filters to URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;

    if (filterDate) {
      if (url.searchParams.get('date') !== filterDate) {
        url.searchParams.set('date', filterDate);
        changed = true;
      }
    } else if (url.searchParams.has('date')) {
      url.searchParams.delete('date');
      changed = true;
    }

    if (filterResponsibleOnly) {
      if (url.searchParams.get('responsible') !== 'true') {
        url.searchParams.set('responsible', 'true');
        changed = true;
      }
    } else if (url.searchParams.has('responsible')) {
      url.searchParams.delete('responsible');
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [filterDate, filterResponsibleOnly]);

  const currentUser = useMemo(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const userIsMonitor = useMemo(() => {
    return isUserMonitor(currentUser);
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

  const monitorClasses = useMemo(() => {
    const set = new Set<string>();
    loginUsers.forEach((u) => {
      if (isUserMonitor(u) && u.lop && u.lop.trim()) {
        set.add(u.lop.trim());
      }
    });
    return set;
  }, [loginUsers]);

  const classes = useMemo(() => {
    const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [records]);

  useEffect(() => {
    if (!hideClassSelector && classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {
      onClassChange(classes[0]);
    }
  }, [classes, selectedClass, onClassChange, hideClassSelector]);

  const monitorEnvelopes = useMemo(() => {
    if (!selectedClass || sessions.length === 0) return [];

    const classRecords = records.filter(r => r.MaLop === selectedClass);
    const sessionKeys = new Set(classRecords.map(r => `${r.MAPTHI}|${r.NgayThi}|${r.GioThi}|${r.TenMH}`));

    const sessionMap = new Map<string, {
      room: string;
      date: string;
      time: string;
      subject: string;
      subjectCode: string;
      examFormat: string;
      counts: Map<string, number>;
    }>();

    records.forEach(r => {
      const key = `${r.MAPTHI}|${r.NgayThi}|${r.GioThi}|${r.TenMH}`;
      if (sessionKeys.has(key)) {
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            room: r.MAPTHI,
            date: r.NgayThi,
            time: r.GioThi,
            subject: r.TenMH,
            subjectCode: r.MaMH,
            examFormat: r.MaHTThi || '',
            counts: new Map<string, number>()
          });
        }
        const session = sessionMap.get(key)!;
        if (!r.isPostponed) {
          const className = r.MaLop || 'Khác';
          session.counts.set(className, (session.counts.get(className) || 0) + 1);
        }
      }
    });

    const result: SessionEnvelope[] = Array.from(sessionMap.entries()).map(([id, session]) => {
      const classCounts = Array.from(session.counts.entries()).map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count);
      const monitoredClassesInRoom = classCounts.filter(c => monitorClasses.has(c.className));

      const { responsibleClass, isClaimedManual, assignmentInfo } = getEffectiveResponsibleClass(
        { id, room: session.room, date: session.date, time: session.time, subject: session.subject, classCounts },
        monitoredClassesInRoom,
        envelopeAssignments
      );

      const isResponsible = selectedClass === responsibleClass;

      return {
        id,
        room: session.room,
        date: session.date,
        time: session.time,
        subject: session.subject,
        subjectCode: session.subjectCode,
        examFormat: session.examFormat,
        classCounts,
        isResponsible,
        responsibleClass,
        isClaimedManual,
        assignmentInfo,
      };
    });

    return result.sort((a, b) => {
      const parseDateTime = (dateStr: string, timeStr: string) => {
        if (!dateStr) return 0;
        const parts = dateStr.split(/[\/\-]/);
        let d = 1, m = 1, y = 1970;
        if (parts.length === 3) {
          const p0 = parseInt(parts[0], 10);
          const p1 = parseInt(parts[1], 10);
          const p2 = parseInt(parts[2], 10);
          y = p2;
          if (p1 > 12) {
            m = p0; d = p1;
          } else if (p0 > 12) {
            d = p0; m = p1;
          } else {
            m = p0; d = p1;
          }
        }
        let hour = 0, min = 0;
        if (timeStr) {
           const timeParts = timeStr.toLowerCase().replace('g', ':').replace('h', ':').split(':');
           hour = parseInt(timeParts[0], 10) || 0;
           min = parseInt(timeParts[1], 10) || 0;
        }
        return new Date(y, m - 1, d, hour, min).getTime();
      };
      
      const timeA = parseDateTime(a.date, a.time);
      const timeB = parseDateTime(b.date, b.time);
      if (timeA !== timeB) return timeA - timeB;
      return (a.room || '').localeCompare(b.room || '');
    });
  }, [records, selectedClass, sessions, monitorClasses, envelopeAssignments]);

  const availableDates = useMemo(() => {
    const dates = new Set(monitorEnvelopes.map(s => s.date));
    return Array.from(dates).sort();
  }, [monitorEnvelopes]);

  const filteredEnvelopes = useMemo(() => {
    return monitorEnvelopes.filter(s => {
      if (filterDate && s.date !== filterDate) return false;
      if (filterResponsibleOnly && !s.isResponsible) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchRoom = s.room.toLowerCase().includes(q);
        const matchSubj = s.subject.toLowerCase().includes(q);
        const matchCode = s.subjectCode.toLowerCase().includes(q);
        const matchClass = s.classCounts.some(c => c.className.toLowerCase().includes(q));
        if (!matchRoom && !matchSubj && !matchCode && !matchClass) return false;
      }
      return true;
    });
  }, [monitorEnvelopes, filterDate, filterResponsibleOnly, searchQuery]);

  const responsibleCount = filteredEnvelopes.filter(s => s.isResponsible).length;
  const totalExpectedMoney = useMemo(() => {
    return filteredEnvelopes
      .filter(s => s.isResponsible)
      .reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat, s.id), 0);
  }, [filteredEnvelopes, pricingVersion]);

  const handleOpenAssignModal = useCallback((session: any, initialClass?: string) => {
    setAssigningSession(session);
    setAssigningInitialClass(initialClass || selectedClass);
  }, [selectedClass]);

  const handleConfirmAssign = useCallback(async (sessionId: string, targetClass: string, options: SaveEnvelopeOptions) => {
    setLoadingClaimId(sessionId);
    try {
      const res = await saveEnvelopeAssignment(sessionId, targetClass, options);
      if (res.success && res.assignments) {
        setEnvelopeAssignments(res.assignments);
      }
      setPricingVersion(v => v + 1);
    } catch (e) {
      console.error('Error confirming envelope assignment:', e);
    } finally {
      setLoadingClaimId(null);
    }
  }, []);

  const handleSaveQuickPrice = useCallback(async (sessionId: string, newPrice: number | null) => {
    setLoadingClaimId(sessionId);
    try {
      const existingAssign = envelopeAssignments[sessionId];
      if (existingAssign) {
        // Save to confirmation record with customPrice
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
        // Not claimed yet, save direct room price override
        if (newPrice !== null && newPrice > 0) {
          saveSessionPriceOverride(sessionId, newPrice);
        } else {
          removeSessionPriceOverride(sessionId);
        }
      }
      setPricingVersion(v => v + 1);
      fetchEnvelopeAssignments().then(res => res && setEnvelopeAssignments(res));
    } catch (e) {
      console.error('Error saving quick price:', e);
    } finally {
      setLoadingClaimId(null);
    }
  }, [envelopeAssignments]);

  const handleCancelClaim = useCallback(async (sessionId: string) => {
    setLoadingClaimId(sessionId);
    try {
      const res = await removeEnvelopeAssignment(sessionId);
      if (res.success && res.assignments) {
        setEnvelopeAssignments(res.assignments);
      }
      setPricingVersion(v => v + 1);
    } catch (e) {
      console.error('Error cancelling envelope claim:', e);
    } finally {
      setLoadingClaimId(null);
    }
  }, []);

  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Ngày thi',
      'Giờ thi',
      'Phòng thi',
      'Môn thi',
      'Mã MH',
      'Cơ cấu sinh viên',
      'Bồi dưỡng dự kiến (VNĐ)',
      'Trách nhiệm lấy PB'
    ];
    
    const rows = filteredEnvelopes.map((session, index) => {
      const studentStructure = session.classCounts.map(c => `${c.className} (${c.count})`).join(', ');
      const money = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
      const isResponsibleStr = session.isResponsible ? 'Lớp mình' : `${session.classCounts[0]?.className || ''} (${session.classCounts[0]?.count || 0} SV)`;
      return [
        index + 1,
        session.date,
        session.time,
        session.room,
        `"${session.subject}"`,
        session.subjectCode,
        `"${studentStructure}"`,
        money,
        `"${isResponsibleStr}"`
      ].join(',');
    });
    
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phan_Cong_Phong_Bi_${selectedClass || 'Tat_Ca'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu trước.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-4 sm:gap-6 overflow-y-auto min-h-0 bg-[#F8FAFC]">
      {/* Header & Class Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>{hideClassSelector ? "Phân Công Phong Bì Lớp Mình" : "Phân Công Phong Bì"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý và theo dõi trách nhiệm phong bì phòng thi theo nguyên tắc: Lớp đông SV nhất sẽ phụ trách.
          </p>
        </div>
        {!hideClassSelector && (
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter shrink-0">Lớp:</span>
            <select
              className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full min-w-[120px] cursor-pointer"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs p-2.5 sm:p-4 flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 items-stretch lg:items-center justify-between shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-1 items-stretch sm:items-center flex-wrap">
          {/* Search box */}
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="text"
              placeholder="Tìm phòng, môn thi, mã môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            />
            <Info className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Selector */}
          <select 
            className="border border-slate-200 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">Tất cả các ngày ({availableDates.length})</option>
            {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Responsible Only Checkbox */}
          <label className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-medium text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-colors select-none">
            <input 
              type="checkbox" 
              checked={filterResponsibleOnly}
              onChange={(e) => setFilterResponsibleOnly(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <span>Chỉ hiện phòng lớp mình lấy PB</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {effectiveIsAdmin && (
            <button 
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Tùy chỉnh định mức tiền phòng"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấu hình tiền</span>
            </button>
          )}

          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards - Compact single row on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/70 rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 shadow-2xs text-center sm:text-left">
          <div className="w-6 h-6 sm:w-11 sm:h-11 bg-blue-500/10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs text-blue-600 font-bold uppercase tracking-tight sm:tracking-wider truncate">Tổng phòng</p>
            <p className="text-sm sm:text-2xl md:text-3xl font-extrabold text-blue-950 mt-0.5 leading-none">{filteredEnvelopes.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/70 rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 shadow-2xs text-center sm:text-left">
          <div className="w-6 h-6 sm:w-11 sm:h-11 bg-emerald-500/10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs text-emerald-600 font-bold uppercase tracking-tight sm:tracking-wider truncate">Lớp lấy PB</p>
            <p className="text-sm sm:text-2xl md:text-3xl font-extrabold text-emerald-950 mt-0.5 leading-none">{responsibleCount}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/70 rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 shadow-2xs text-center sm:text-left">
          <div className="w-6 h-6 sm:w-11 sm:h-11 bg-amber-500/10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs text-amber-700 font-bold uppercase tracking-tight sm:tracking-wider truncate">Bồi dưỡng</p>
            <p className="text-[11px] sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-amber-950 mt-0.5 leading-none truncate">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Responsive Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden min-h-0 flex-1">
        {filteredEnvelopes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
            <Mail className="w-10 h-10 text-slate-300" />
            <p className="text-sm">Không tìm thấy phòng thi nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Touch-optimized Card List (< 768px) */}
            <div className="block md:hidden overflow-y-auto p-3 space-y-3 divide-y-0">
              {filteredEnvelopes.map((session, index) => {
                const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col gap-3 transition-all ${
                      session.isResponsible 
                        ? 'bg-emerald-50/25 border-emerald-200/80 shadow-emerald-50/50' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Top Row: Room & Time Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400">#{index + 1}</span>
                        <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 rounded-lg text-sm truncate">
                          {session.room}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
                        <span>{session.date}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-blue-700 font-bold">{session.time}</span>
                      </div>
                    </div>

                    {/* Subject Info */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {session.subject}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Mã MH: <span className="font-semibold text-slate-700">{session.subjectCode}</span>
                        {session.examFormat && (
                          <span className="ml-2 font-sans font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                            {session.examFormat}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Class & Student Breakdown */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Cơ cấu sinh viên ({session.classCounts.reduce((sum, c) => sum + c.count, 0)} SV)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.classCounts.map(c => {
                          const isSelectedClass = c.className === selectedClass;
                          return (
                            <span 
                              key={c.className} 
                              className={`text-xs px-2 py-0.5 rounded-md font-bold border flex gap-1 items-center ${
                                isSelectedClass 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs' 
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              <span>{c.className}</span>
                              <span className={`w-px h-2.5 ${isSelectedClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                              <span className="font-extrabold">{c.count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Row: Price & Responsibility */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        {(() => {
                          const defaultPrice = getDefaultRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
                          const isCustomPrice = roomPrice !== defaultPrice;
                          return (
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400 block">ĐỊNH MỨC</span>
                                {isCustomPrice && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">Đã sửa</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setQuickEditSession(session)}
                                className={`inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer shadow-2xs group mt-0.5 ${
                                  isCustomPrice
                                    ? 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                }`}
                                title="Bấm để sửa mức giá tiền phòng này"
                              >
                                <span>{formatCurrency(roomPrice)}</span>
                                <Edit3 className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {session.isResponsible ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Lớp mình</span>
                            </div>

                            {session.isClaimedManual ? (
                              <div className="flex flex-col items-end gap-1">
                                {session.assignmentInfo?.assistantStudentName ? (
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                    <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span>SV: {session.assignmentInfo.assistantStudentName}</span>
                                    <span className="text-[10px] text-indigo-600 font-mono">({session.assignmentInfo.assistantStudentId})</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>LT: {session.assignmentInfo?.claimedByName || 'Lớp trưởng'}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignModal(session, selectedClass)}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                  >
                                    Đổi người
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelClaim(session.id)}
                                    disabled={loadingClaimId === session.id}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                                  >
                                    {loadingClaimId === session.id ? 'Đang hủy...' : 'Hủy nhận'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(session, selectedClass)}
                                disabled={loadingClaimId === session.id}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                title="Xác nhận nhận phòng thi này hoặc gán sinh viên hỗ trợ"
                              >
                                <Hand className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận đi PB / Gán SV'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block">PHỤ TRÁCH</span>
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 inline-block">
                                {session.responsibleClass || session.classCounts[0]?.className || 'Khác'}
                                {session.isClaimedManual ? ' (Đã nhận)' : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(session, selectedClass)}
                              disabled={loadingClaimId === session.id}
                              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-95"
                              title="Chủ động nhận đi phong bì phòng này cho lớp mình"
                            >
                              <Hand className="w-3 h-3 text-blue-600" />
                              <span>{loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận đi PB'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Full Table (>= 768px) */}
            <div className="hidden md:block flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">STT</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">Thời gian</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Phòng & Môn</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cơ cấu sinh viên</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-48">
                      <div className="flex items-center gap-1">
                        <span>Bồi dưỡng</span>
                        <span className="text-[10px] text-slate-400 font-normal lowercase">(bấm để sửa)</span>
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-64 text-right">Trách nhiệm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnvelopes.map((session, index) => {
                    const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
                    const defaultRoomPrice = getDefaultRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
                    const isCustomPrice = roomPrice !== defaultRoomPrice;

                    return (
                      <tr key={session.id} className={`hover:bg-slate-50/80 transition-colors ${session.isResponsible ? 'bg-emerald-50/15' : ''}`}>
                        <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-sm">{session.date}</span>
                            <span className="text-blue-600 font-bold text-xs mt-0.5">{session.time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-rose-600 text-sm">{session.room}</span>
                            <span className="text-slate-800 font-medium text-sm mt-0.5 break-words whitespace-normal" title={session.subject}>{session.subject}</span>
                            <span className="text-slate-400 text-xs font-mono">{session.subjectCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {session.classCounts.map(c => (
                              <span 
                                key={c.className} 
                                className={`text-xs px-2.5 py-0.5 rounded-md font-bold border flex gap-1.5 items-center ${
                                  c.className === selectedClass 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span>{c.className}</span>
                                <span className={`w-px h-3 ${c.className === selectedClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                                <span>{c.count}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 text-right">
                          {session.isResponsible ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="inline-flex items-center justify-center gap-1.5 text-emerald-800 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Lớp mình</span>
                              </div>

                              {session.isClaimedManual ? (
                                <div className="flex flex-col items-end gap-1 text-right">
                                  {session.assignmentInfo?.assistantStudentName ? (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                      <span>SV: {session.assignmentInfo.assistantStudentName}</span>
                                      <span className="text-[11px] text-indigo-600 font-mono">({session.assignmentInfo.assistantStudentId})</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>LT: {session.assignmentInfo?.claimedByName || 'Lớp trưởng'}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 mt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAssignModal(session, selectedClass)}
                                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                    >
                                      Đổi người
                                    </button>
                                    <span className="text-slate-300">•</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelClaim(session.id)}
                                      disabled={loadingClaimId === session.id}
                                      className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                                      title="Hủy nhận, trở về phân công tự động"
                                    >
                                      {loadingClaimId === session.id ? '...' : 'Hủy nhận'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(session, selectedClass)}
                                  disabled={loadingClaimId === session.id}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                  title="Xác nhận nhận phòng thi này hoặc gán sinh viên hỗ trợ"
                                >
                                  <Hand className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận đi PB / Gán SV'}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center justify-end gap-1 text-slate-500 text-xs">
                                <span className="font-semibold text-slate-700">{session.responsibleClass || session.classCounts[0]?.className}</span>
                                {session.isClaimedManual && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Chủ động nhận
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(session, selectedClass)}
                                disabled={loadingClaimId === session.id}
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs active:scale-95"
                                title="Chủ động nhận đi phong bì phòng này"
                              >
                                <Hand className="w-3.5 h-3.5 text-blue-600" />
                                <span>{loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận đi PB'}</span>
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
          </>
        )}
      </div>

      {/* Assign Envelope Modal */}
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

      {/* Quick Edit Price Modal */}
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
