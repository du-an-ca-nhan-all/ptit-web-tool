import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../types';
import { DollarSign, ChevronDown, ChevronUp, FileText, ArrowDownLeft, ArrowUpRight, CheckCircle2, User, X, Mail, Users, Search, Settings, Hand } from 'lucide-react';
import { calculateRoomPrice, formatCurrency, fetchPricingFromBackend } from '../config/pricingConfig';
import {
  getStoredEnvelopeAssignments,
  fetchEnvelopeAssignments,
  getEffectiveResponsibleClass,
  ENVELOPE_ASSIGNMENTS_CHANGED_EVENT,
  EnvelopeAssignmentsMap,
} from '../config/envelopeAssignmentConfig';
import PricingConfigModal from './PricingConfigModal';

interface SettlementManagerProps {
  records: ExamRecord[];
  sessions?: ExamSession[];
  loginUsers?: LoginUser[];
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  isAdmin?: boolean;
}

interface DebtDetail {
  session: any;
  fromClass: string;
  toClass: string;
  amount: number;
  studentsCount: number;
  pricePerStudent: number;
  totalRoomPrice: number;
}

interface PartnerBalance {
  partnerClass: string;
  partnerMonitor: string;
  netBalance: number;
  detailsOweUs: DebtDetail[];
  detailsWeOwe: DebtDetail[];
}

const getExclusionKey = (sessionId: string, maSV: string) => `${sessionId}||${maSV}`;

export default function SettlementManager({ records, sessions = [], loginUsers = [], onTogglePostpone, isAdmin }: SettlementManagerProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
  const [selectedDetail, setSelectedDetail] = useState<DebtDetail | null>(null);
  const [showStudentList, setShowStudentList] = useState<boolean>(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [excludedOverrides, setExcludedOverrides] = useState<Map<string, boolean>>(new Map());
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);
  const [envelopeAssignments, setEnvelopeAssignments] = useState<EnvelopeAssignmentsMap>(getStoredEnvelopeAssignments);
  const [settlementScope, setSettlementScope] = useState<'CLAIMED_ONLY' | 'ALL'>('CLAIMED_ONLY');
  const studentListRef = React.useRef<HTMLDivElement>(null);

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
    fetchPricingFromBackend().catch(() => {});
    const handler = () => setPricingVersion((v) => v + 1);
    window.addEventListener('pricing_config_changed', handler);
    return () => window.removeEventListener('pricing_config_changed', handler);
  }, []);

  const handleOpenStudentListForClass = (clsName: string) => {
    setStudentClassFilter(clsName);
    setShowStudentList(true);
    setTimeout(() => {
      studentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleToggleStudentList = () => {
    const nextState = !showStudentList;
    setShowStudentList(nextState);
    if (nextState) {
      setStudentClassFilter('ALL');
      setTimeout(() => {
        studentListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const currentRoomRecords = useMemo(() => {
    if (!selectedDetail) return [];
    const sess = selectedDetail.session;
    const room = sess.room || sess.MAPTHI;
    const date = sess.date || sess.NgayThi;
    const time = sess.time || sess.GioThi;
    const subject = sess.subject || sess.TenMH;
    return records.filter(
      r =>
        r.MAPTHI === room &&
        r.NgayThi === date &&
        r.GioThi === time &&
        r.TenMH === subject
    );
  }, [selectedDetail, records]);

  const filteredStudentRecords = useMemo(() => {
    return currentRoomRecords.filter(r => {
      if (studentClassFilter !== 'ALL' && r.MaLop !== studentClassFilter) {
        return false;
      }
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase().trim();
        const fullName = `${r.HoLotSV || ''} ${r.TenSV || ''}`.toLowerCase();
        const mssv = (r.MaSV || '').toLowerCase();
        return fullName.includes(q) || mssv.includes(q);
      }
      return true;
    });
  }, [currentRoomRecords, studentClassFilter, studentSearchQuery]);

  const modalClassCounts = useMemo(() => {
    if (!selectedDetail) return [];
    const countsMap = new Map<string, number>();
    currentRoomRecords.forEach(r => {
      const cls = r.MaLop || 'Khác';
      countsMap.set(cls, (countsMap.get(cls) || 0) + 1);
    });
    if (selectedDetail.toClass && !countsMap.has(selectedDetail.toClass)) {
      countsMap.set(selectedDetail.toClass, 0);
    }
    if (selectedDetail.fromClass && !countsMap.has(selectedDetail.fromClass)) {
      countsMap.set(selectedDetail.fromClass, 0);
    }
    return Array.from(countsMap.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [selectedDetail, currentRoomRecords]);

  const getMonitorUser = useCallback((cls: string): LoginUser | null => {
    if (!cls) return null;
    const cleanCls = cls.trim().toUpperCase();
    return (
      loginUsers.find(
        (u) =>
          isUserMonitor(u) &&
          u.lop &&
          u.lop.trim().toUpperCase() === cleanCls
      ) || null
    );
  }, [loginUsers]);

  const getMonitorName = useCallback((cls: string): string => {
    const mon = getMonitorUser(cls);
    if (mon) {
      return mon.fullName || mon.username;
    }
    return 'Chưa cập nhật';
  }, [getMonitorUser]);

  const monitorClasses = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    loginUsers.forEach((u) => {
      if (isUserMonitor(u) && u.lop && u.lop.trim()) {
        set.add(u.lop.trim());
      }
    });
    return set;
  }, [loginUsers]);

  const monitorClassList: string[] = useMemo(() => {
    return Array.from(monitorClasses).sort((a, b) => a.localeCompare(b));
  }, [monitorClasses]);

  const availableClasses = useMemo(() => {
    const monClasses = Array.from(monitorClasses).sort((a, b) => a.localeCompare(b));
    const recordClassesSet = new Set<string>();
    records.forEach((r) => {
      if (r.MaLop && r.MaLop.trim()) {
        const cls = r.MaLop.trim();
        if (!monitorClasses.has(cls)) {
          recordClassesSet.add(cls);
        }
      }
    });
    const otherClasses = Array.from(recordClassesSet).sort((a, b) => a.localeCompare(b));
    return {
      monClasses,
      otherClasses,
      allClasses: [...monClasses, ...otherClasses],
    };
  }, [monitorClasses, records]);

  // Helpers for exclusion
  const isStudentExcluded = useCallback((sessionId: string, r: ExamRecord) => {
    const key = getExclusionKey(sessionId, r.MaSV || '');
    if (excludedOverrides.has(key)) {
      return Boolean(excludedOverrides.get(key));
    }
    return Boolean(r.isPostponed);
  }, [excludedOverrides]);

  const toggleStudentExclusion = async (session: any, r: ExamRecord) => {
    const isExcluded = isStudentExcluded(session.id, r);
    const newExcluded = !isExcluded;
    const key = getExclusionKey(session.id, r.MaSV || '');

    setExcludedOverrides(prev => {
      const next = new Map(prev);
      next.set(key, newExcluded);
      return next;
    });

    if (onTogglePostpone) {
      await onTogglePostpone(r, newExcluded);
    }
  };

  const clearSessionExclusions = (session: any) => {
    setExcludedOverrides(prev => {
      const next = new Map(prev);
      for (const key of Array.from(next.keys())) {
        if (key.startsWith(`${session.id}||`)) next.delete(key);
      }
      return next;
    });
    if (onTogglePostpone && session.records) {
      session.records.forEach((r: ExamRecord) => {
        if (r.isPostponed) {
          onTogglePostpone(r, false);
        }
      });
    }
  };

  useEffect(() => {
    if (!selectedClass) {
      try {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
          const user = JSON.parse(saved);
          if (user?.lop) {
            const userLop = user.lop.trim();
            if (availableClasses.allClasses.includes(userLop)) {
              setSelectedClass(userLop);
              return;
            }
          }
        }
      } catch (e) {}

      if (availableClasses.monClasses.length > 0) {
        setSelectedClass(availableClasses.monClasses[0]);
      } else if (availableClasses.otherClasses.length > 0) {
        setSelectedClass(availableClasses.otherClasses[0]);
      }
    }
  }, [availableClasses, selectedClass]);

  const totalClaimedRoomsAll = useMemo(() => {
    return sessions.filter((s) => {
      const monitoredClassesInRoom = s.classCounts.filter((c) => monitorClasses.has(c.className));
      const { isClaimedManual } = getEffectiveResponsibleClass(s, monitoredClassesInRoom, envelopeAssignments);
      return isClaimedManual;
    }).length;
  }, [sessions, monitorClasses, envelopeAssignments]);

  const data = useMemo(() => {
    if (!selectedClass || sessions.length === 0) {
      return {
        receivables: [],
        payables: [],
        settled: [],
        totalReceive: 0,
        totalPay: 0,
        netTotal: 0,
        involvedRoomsCount: 0,
        claimedRoomsInvolvedCount: 0,
      };
    }

    const allDebts: DebtDetail[] = [];
    const involvedRoomIds = new Set<string>();
    let claimedRoomsInvolvedCount = 0;

    sessions.forEach((session) => {
      // Recalculate effective class counts (excluding students marked as hoãn thi / excluded)
      const effectiveCounts = new Map<string, number>();
      session.records.forEach((r) => {
        const isExcluded = isStudentExcluded(session.id, r);
        if (!isExcluded) {
          const cls = r.MaLop || 'Khác';
          effectiveCounts.set(cls, (effectiveCounts.get(cls) || 0) + 1);
        }
      });

      // Find classes with monitors in this session (using effective counts)
      const monitoredClassesInRoom = Array.from(effectiveCounts.entries())
        .filter(([cls]) => monitorClasses.has(cls))
        .map(([cls, count]) => ({ className: cls, count }))
        .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.className.localeCompare(b.className)));

      // The monitor who claimed or has the most students is responsible for the envelope
      const { responsibleClass, isClaimedManual, assignmentInfo } = getEffectiveResponsibleClass(
        session,
        monitoredClassesInRoom,
        envelopeAssignments
      );
      if (!responsibleClass) return;

      // Scope Filter: When CLAIMED_ONLY, only calculate for sessions that have been claimed
      if (settlementScope === 'CLAIMED_ONLY' && !isClaimedManual) {
        return;
      }

      const allClassesInRoom = Array.from(effectiveCounts.entries())
        .map(([className, count]) => ({ className, count }))
        .filter((c) => c.count > 0);

      if (allClassesInRoom.length === 0) return;

      // If only 1 class in room and it's the responsible class (and not manually claimed from another class), no debts
      if (allClassesInRoom.length === 1 && allClassesInRoom[0].className === responsibleClass && !isClaimedManual) {
        return;
      }

      const totalStudents = allClassesInRoom.reduce((acc, c) => acc + c.count, 0);
      const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
      const pricePerStudent = totalStudents > 0 ? roomPrice / totalStudents : 0;

      let isSessionInvolved = false;

      allClassesInRoom.forEach((c) => {
        if (c.className !== responsibleClass) {
          allDebts.push({
            session: { ...session, isClaimedManual, assignmentInfo, room: session.room, subject: session.subject },
            fromClass: c.className, // Class C owes
            toClass: responsibleClass, // Class responsible (the one who receives the envelope)
            amount: c.count * pricePerStudent,
            studentsCount: c.count,
            pricePerStudent,
            totalRoomPrice: roomPrice,
          });

          if (c.className === selectedClass || responsibleClass === selectedClass) {
            isSessionInvolved = true;
          }
        }
      });

      if (isSessionInvolved) {
        involvedRoomIds.add(session.id);
        if (isClaimedManual) {
          claimedRoomsInvolvedCount++;
        }
      }
    });

    const pMap = new Map<string, PartnerBalance>();
    // Pre-populate with all known classes so they are available
    availableClasses.allClasses.forEach((c) => {
      if (c !== selectedClass) {
        pMap.set(c, {
          partnerClass: c,
          partnerMonitor: getMonitorName(c),
          netBalance: 0,
          detailsOweUs: [],
          detailsWeOwe: [],
        });
      }
    });

    allDebts.forEach((debt) => {
      if (debt.fromClass === selectedClass) {
        // We owe them
        let p = pMap.get(debt.toClass);
        if (!p) {
          p = {
            partnerClass: debt.toClass,
            partnerMonitor: getMonitorName(debt.toClass),
            netBalance: 0,
            detailsOweUs: [],
            detailsWeOwe: [],
          };
          pMap.set(debt.toClass, p);
        }
        p.netBalance -= debt.amount;
        p.detailsWeOwe.push(debt);
      } else if (debt.toClass === selectedClass) {
        // They owe us
        let p = pMap.get(debt.fromClass);
        if (!p) {
          p = {
            partnerClass: debt.fromClass,
            partnerMonitor: getMonitorName(debt.fromClass),
            netBalance: 0,
            detailsOweUs: [],
            detailsWeOwe: [],
          };
          pMap.set(debt.fromClass, p);
        }
        p.netBalance += debt.amount;
        p.detailsOweUs.push(debt);
      }
    });

    const activePartners = Array.from(pMap.values()).filter(
      (p) => Math.abs(p.netBalance) > 0.01 || p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0
    );

    let totalReceive = 0;
    let totalPay = 0;

    activePartners.forEach((p) => {
      if (p.netBalance > 0.01) totalReceive += p.netBalance;
      if (p.netBalance < -0.01) totalPay += Math.abs(p.netBalance);
    });

    const receivables = activePartners
      .filter((p) => p.netBalance > 0.01)
      .sort((a, b) => b.netBalance - a.netBalance);
    const payables = activePartners
      .filter((p) => p.netBalance < -0.01)
      .sort((a, b) => a.netBalance - b.netBalance);
    const settled = activePartners.filter(
      (p) => Math.abs(p.netBalance) <= 0.01 && (p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0)
    );

    return {
      receivables,
      payables,
      settled,
      totalReceive,
      totalPay,
      netTotal: totalReceive - totalPay,
      involvedRoomsCount: involvedRoomIds.size,
      claimedRoomsInvolvedCount,
    };
  }, [
    sessions,
    selectedClass,
    monitorClasses,
    availableClasses,
    getMonitorName,
    isStudentExcluded,
    pricingVersion,
    envelopeAssignments,
    settlementScope,
  ]);

  // Compute effective class counts for the detail modal (accounting for exclusions)
  const effectiveClassCountsForModal = useMemo(() => {
    if (!selectedDetail) return new Map<string, number>();
    const map = new Map<string, number>();
    currentRoomRecords.forEach((r: ExamRecord) => {
      const isExcluded = isStudentExcluded(selectedDetail.session.id, r);
      if (!isExcluded) {
        const cls = r.MaLop || 'Khác';
        map.set(cls, (map.get(cls) || 0) + 1);
      }
    });
    return map;
  }, [selectedDetail, currentRoomRecords, isStudentExcluded]);

  // Count excluded students for the current session in modal
  const excludedCountForModal = useMemo(() => {
    if (!selectedDetail) return 0;
    return currentRoomRecords.filter((r: ExamRecord) =>
      isStudentExcluded(selectedDetail.session.id, r)
    ).length;
  }, [selectedDetail, currentRoomRecords, isStudentExcluded]);

  // Dynamic live calculation for the modal when students are toggled
  const activeDetailCalc = useMemo(() => {
    if (!selectedDetail) return null;
    const sess = selectedDetail.session;
    const responsibleClass = selectedDetail.toClass;
    const totalStudents = Array.from(effectiveClassCountsForModal.values()).reduce((sum, cnt) => sum + cnt, 0);
    const roomPrice = calculateRoomPrice(sess.subject, sess.subjectCode, sess.room, sess.examFormat, sess.id);
    const pricePerStudent = totalStudents > 0 ? roomPrice / totalStudents : 0;
    const fromClassCount = effectiveClassCountsForModal.get(selectedDetail.fromClass) || 0;
    const amount = fromClassCount * pricePerStudent;

    return {
      responsibleClass,
      totalMonitoredStudents: totalStudents,
      pricePerStudent,
      totalRoomPrice: roomPrice,
      fromClassCount,
      amount,
    };
  }, [selectedDetail, effectiveClassCountsForModal, pricingVersion, envelopeAssignments]);



  const toggleExpand = (partnerClass: string) => {
    setExpandedPairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partnerClass)) {
        newSet.delete(partnerClass);
      } else {
        newSet.add(partnerClass);
      }
      return newSet;
    });
  };

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu trước.</p>
      </div>
    );
  }

  const renderPartnerCard = (p: PartnerBalance, type: 'receive' | 'pay' | 'settled') => {
    const isExpanded = expandedPairs.has(p.partnerClass);
    const displayAmount = Math.abs(p.netBalance);
    
    return (
      <div key={p.partnerClass} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div 
          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => toggleExpand(p.partnerClass)}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 \${
              type === 'receive' ? 'bg-emerald-100 text-emerald-600' : 
              type === 'pay' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-lg">{p.partnerClass}</span>
              <span className="text-sm text-slate-500 font-medium">LT: {p.partnerMonitor}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {type === 'receive' ? 'Họ nợ mình' : type === 'pay' ? 'Mình nợ họ' : 'Đã cấn trừ hết'}
              </span>
              <span className={`text-lg font-bold px-3 py-1 rounded-lg border \${
                type === 'receive' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                type === 'pay' ? 'text-rose-700 bg-rose-50 border-rose-200' : 
                'text-slate-700 bg-slate-50 border-slate-200'
              }`}>
                {formatCurrency(displayAmount)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col gap-6">
            {p.detailsOweUs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2 bg-emerald-100/50 px-3 py-2 rounded-lg border border-emerald-100 inline-flex">
                  <ArrowDownLeft className="w-4 h-4" />
                  Các phòng họ nợ mình ({p.detailsOweUs.length} phòng)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
                    <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Phòng & Môn</th>
                        <th className="px-4 py-2 font-semibold text-center">Tiền Phòng</th>
                        <th className="px-4 py-2 font-semibold text-center">Số SV họ có</th>
                        <th className="px-4 py-2 font-semibold text-center">Số tiền/SV</th>
                        <th className="px-4 py-2 font-semibold text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.detailsOweUs.map((d, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setSelectedDetail(d)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">{d.session.room}</span>
                              {d.session.isClaimedManual ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Đã nhận
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Gợi ý
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs">{d.session.subject}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-medium">{formatCurrency(d.totalRoomPrice)}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.studentsCount}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{formatCurrency(d.pricePerStudent)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {p.detailsWeOwe.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2 bg-rose-100/50 px-3 py-2 rounded-lg border border-rose-100 inline-flex">
                  <ArrowUpRight className="w-4 h-4" />
                  Các phòng mình nợ họ ({p.detailsWeOwe.length} phòng)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
                    <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Phòng & Môn</th>
                        <th className="px-4 py-2 font-semibold text-center">Tiền Phòng</th>
                        <th className="px-4 py-2 font-semibold text-center">Số SV mình có</th>
                        <th className="px-4 py-2 font-semibold text-center">Số tiền/SV</th>
                        <th className="px-4 py-2 font-semibold text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {p.detailsWeOwe.map((d, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setSelectedDetail(d)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">{d.session.room}</span>
                              {d.session.isClaimedManual ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Đã nhận
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Gợi ý
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-xs">{d.session.subject}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-medium">{formatCurrency(d.totalRoomPrice)}</td>
                          <td className="px-4 py-3 text-center font-bold text-rose-600">{d.studentsCount}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{formatCurrency(d.pricePerStudent)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Sổ Quỹ Bù Trừ Cá Nhân
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Xem chi tiết công nợ phong bì của lớp bạn với các lớp khác.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Tùy chỉnh định mức giá tiền phòng"
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Cấu hình tiền phòng</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <span className="text-sm font-semibold text-slate-600 pl-2">Lớp của bạn:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
            >
            {availableClasses.monClasses.length > 0 && (
              <optgroup label="Lớp có Lớp Trưởng">
                {availableClasses.monClasses.map((c) => (
                  <option key={c} value={c}>
                    {c} (LT: {getMonitorName(c)})
                  </option>
                ))}
              </optgroup>
            )}
            {availableClasses.otherClasses.length > 0 && (
              <optgroup label="Lớp chưa có Lớp Trưởng">
                {availableClasses.otherClasses.map((c) => (
                  <option key={c} value={c}>
                    {c} (Chưa có LT)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>
    </div>

      {/* Scope Filter Bar & Explanation */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ sở tính toán:</span>
          <button
            type="button"
            onClick={() => setSettlementScope('CLAIMED_ONLY')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              settlementScope === 'CLAIMED_ONLY'
                ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chỉ tính phòng đã có lớp nhận ({totalClaimedRoomsAll} phòng)</span>
          </button>
          <button
            type="button"
            onClick={() => setSettlementScope('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              settlementScope === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tính tất cả (bao gồm gợi ý: {sessions.length} phòng)</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 font-medium flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          {settlementScope === 'CLAIMED_ONLY' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Chính thức: Chỉ tính tiền khi phòng thi đã có Lớp trưởng nhận.</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>Tạm tính: Tự động phân bổ theo gợi ý phân công cả các phòng chưa ai nhận.</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng phải thu</p>
            <p className="text-base sm:text-lg md:text-xl font-extrabold text-emerald-700 mt-0.5 whitespace-nowrap">{formatCurrency(data.totalReceive)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng phải trả</p>
            <p className="text-base sm:text-lg md:text-xl font-extrabold text-rose-700 mt-0.5 whitespace-nowrap">{formatCurrency(data.totalPay)}</p>
          </div>
        </div>
        <div className={`border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs ${data.netTotal >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${data.netTotal >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <DollarSign className={`w-5 h-5 ${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {data.netTotal >= 0 ? 'Thực nhận sau cùng' : 'Thực chi sau cùng'}
            </p>
            <p className={`text-base sm:text-lg md:text-xl font-extrabold mt-0.5 whitespace-nowrap ${data.netTotal >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {formatCurrency(Math.abs(data.netTotal))}
            </p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Số phòng liên quan</p>
            <p className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 mt-0.5 whitespace-nowrap">
              {data.involvedRoomsCount} <span className="text-xs font-medium text-slate-400">phòng</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/50">
          {data.receivables.length === 0 && data.payables.length === 0 && data.settled.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-lg">Lớp của bạn không phát sinh công nợ nào.</p>
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Phải Thu */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Lớp khác nợ bạn ({data.receivables.length})
                </h3>
                {data.receivables.length === 0 ? (
                  <p className="text-slate-400 italic text-sm py-4 text-center">Không có khoản nào cần thu.</p>
                ) : (
                  data.receivables.map(p => renderPartnerCard(p, 'receive'))
                )}
              </div>
              
              {/* Phải Trả */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  Bạn nợ lớp khác ({data.payables.length})
                </h3>
                {data.payables.length === 0 ? (
                  <p className="text-slate-400 italic text-sm py-4 text-center">Không có khoản nào cần trả.</p>
                ) : (
                  data.payables.map(p => renderPartnerCard(p, 'pay'))
                )}
              </div>
            </div>
          )}
          
          {data.settled.length > 0 && (
             <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="font-bold text-slate-500 text-lg flex items-center gap-2 pb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  Đã cấn trừ hết (Không nợ nhau) ({data.settled.length})
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {data.settled.map(p => renderPartnerCard(p, 'settled'))}
                </div>
             </div>
          )}
        </div>
      </div>

      {selectedDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDetail(null);
              setShowStudentList(false);
              setStudentClassFilter('ALL');
              setStudentSearchQuery('');
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Chi Tiết Phân Bổ Chi Phí Phòng Thi
              </h3>
              <button 
                onClick={() => {
                  setSelectedDetail(null);
                  setShowStudentList(false);
                  setStudentClassFilter('ALL');
                  setStudentSearchQuery('');
                }} 
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6 min-h-0">
              {/* General Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Môn & Phòng</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.room}</p>
                  <p className="text-sm font-medium text-slate-600">{selectedDetail.session.subject} ({selectedDetail.session.subjectCode})</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Thời gian thi</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.time}</p>
                  <p className="text-sm font-medium text-slate-600">{selectedDetail.session.date}</p>
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <DollarSign className="w-5 h-5" />
                  Bài toán chia tiền
                  {excludedCountForModal > 0 && (
                    <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">
                      {excludedCountForModal} SV bị loại khỏi chia tiền
                    </span>
                  )}
                </h4>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Tổng định mức phong bì phòng thi:</span>
                    <span className="font-bold text-base">{formatCurrency(activeDetailCalc?.totalRoomPrice ?? selectedDetail.totalRoomPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Số SV tham gia chia tiền (thuộc các lớp có LT):</span>
                    <span className="font-bold text-base">{activeDetailCalc?.totalMonitoredStudents ?? (selectedDetail.totalRoomPrice / (selectedDetail.pricePerStudent || 1))} SV</span>
                  </div>
                  {excludedCountForModal > 0 && (
                    <div className="flex justify-between items-center text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <span className="font-semibold">SV bị loại (hoãn thi / không tính):</span>
                      <span className="font-bold">- {excludedCountForModal} SV</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="font-semibold">Đơn giá trên mỗi Sinh Viên:</span>
                    <span className="font-bold text-rose-600 text-base">{formatCurrency(activeDetailCalc?.pricePerStudent ?? selectedDetail.pricePerStudent)}/SV</span>
                  </div>
                </div>
              </div>

              {/* Class Distribution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-700">Phân bổ sinh viên trong phòng</h4>
                  <button
                    onClick={handleToggleStudentList}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {showStudentList ? 'Ẩn danh sách SV' : `Xem tất cả SV (${currentRoomRecords.length})`}
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Tên Lớp</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200 text-center">Số SV chia tiền</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Trạng thái Lớp Trưởng</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200 text-right">Danh sách SV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalClassCounts.map((c: any, i: number) => {
                        const hasMonitor = monitorClasses.has(c.className);
                        const isResponsible = c.className === selectedDetail.toClass;
                        const isPaying = c.className === selectedDetail.fromClass;
                        const effectiveCount = effectiveClassCountsForModal.get(c.className) ?? 0;
                        const excludedInClass = c.count - effectiveCount;
                        const monName = getMonitorName(c.className);

                        return (
                          <tr key={i} className={isResponsible ? 'bg-emerald-50/70' : isPaying ? 'bg-rose-50/70' : 'bg-white'}>
                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                              {c.className}
                              {isResponsible && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">
                                  {selectedDetail.session?.isClaimedManual ? 'Chủ động nhận đi PB' : 'Đại diện lấy PB'}
                                </span>
                              )}
                              {isPaying && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold border border-rose-200 uppercase">
                                  Đang thanh toán
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-bold text-slate-700">{effectiveCount}</span>
                                {excludedInClass > 0 && (
                                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 rounded">
                                    -{excludedInClass} bỏ ra
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {hasMonitor ? (
                                <div className="flex flex-col">
                                  <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lớp có Lớp Trưởng
                                  </span>
                                  {isResponsible && selectedDetail.session?.assignmentInfo?.assistantStudentName ? (
                                    <span className="text-indigo-700 text-[11px] font-semibold">
                                      SV hỗ trợ đi PB: <strong>{selectedDetail.session.assignmentInfo.assistantStudentName}</strong> ({selectedDetail.session.assignmentInfo.assistantStudentId})
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[11px] font-medium">
                                      LT: <strong className="text-slate-700 font-bold">{monName}</strong>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-slate-500 text-xs">
                                    {isResponsible && selectedDetail.session?.assignmentInfo?.assistantStudentName ? (
                                      <span className="text-indigo-700 text-[11px] font-semibold">
                                        SV hỗ trợ đi PB: <strong>{selectedDetail.session.assignmentInfo.assistantStudentName}</strong> ({selectedDetail.session.assignmentInfo.assistantStudentId})
                                      </span>
                                    ) : (
                                      'Chưa có LT đăng ký'
                                    )}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {c.count > 0 ? (
                                <button
                                  onClick={() => handleOpenStudentListForClass(c.className)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                >
                                  <Users className="w-3 h-3" /> Xem {c.count} SV
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">0 SV</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Collapsible / Expandable Student List Section */}
              {showStudentList && (
                <div ref={studentListRef} className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Users className="w-5 h-5 text-blue-600 shrink-0" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        Danh Sách Sinh Viên Dự Thi
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({filteredStudentRecords.length} / {currentRoomRecords.length} SV)
                        </span>
                      </h4>
                      {excludedCountForModal > 0 && (
                        <>
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">
                            {excludedCountForModal} bị loại khỏi chia tiền
                          </span>
                          <button
                            onClick={() => clearSessionExclusions(selectedDetail.session)}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer"
                          >
                            Đặt lại tất cả
                          </button>
                        </>
                      )}
                    </div>

                    {/* Search box */}
                    <div className="relative min-w-[220px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên hoặc MSSV..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                      />
                      {studentSearchQuery && (
                        <button
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Class Filter Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Lớp:</span>
                    <button
                      onClick={() => setStudentClassFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${
                        studentClassFilter === 'ALL'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      Tất cả ({currentRoomRecords.length})
                    </button>
                    {selectedDetail.session.classCounts.map((c: any) => (
                      <button
                        key={c.className}
                        onClick={() => setStudentClassFilter(c.className)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${
                          studentClassFilter === c.className
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {c.className} ({c.count})
                      </button>
                    ))}
                  </div>

                  {/* Students Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto bg-white shadow-inner">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                        <tr>
                          <th className="px-3 py-2 font-semibold w-10">STT</th>
                          <th className="px-3 py-2 font-semibold">Mã SV</th>
                          <th className="px-3 py-2 font-semibold">Họ và Tên</th>
                          <th className="px-3 py-2 font-semibold">Phái</th>
                          <th className="px-3 py-2 font-semibold">Lớp</th>
                          <th className="px-3 py-2 font-semibold">Tổ/Nhóm thi</th>
                          <th className="px-3 py-2 font-semibold text-center">Phân bổ chia tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudentRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">
                              Không tìm thấy sinh viên phù hợp.
                            </td>
                          </tr>
                        ) : (
                          filteredStudentRecords.map((r, idx) => {
                            const excluded = isStudentExcluded(selectedDetail.session.id, r);
                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${excluded ? 'bg-amber-50/60 opacity-60' : 'hover:bg-blue-50/50'}`}
                              >
                                <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-3 py-2 font-mono font-bold text-slate-700">
                                  {r.MaSV}
                                  {excluded && <span className="ml-1 text-[9px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded font-bold uppercase">Hoãn thi</span>}
                                </td>
                                <td className={`px-3 py-2 font-semibold ${excluded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {r.HoLotSV} {r.TenSV}
                                </td>
                                <td className="px-3 py-2 text-slate-500">{r.PHAI || '—'}</td>
                                <td className="px-3 py-2 font-bold text-blue-700">{r.MaLop}</td>
                                <td className="px-3 py-2 text-slate-500">{r['To thi'] || r.NhomThi || '—'}</td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => toggleStudentExclusion(selectedDetail.session, r)}
                                    title={excluded ? 'Thêm lại vào chia tiền (Dự thi)' : 'Loại khỏi chia tiền (hoãn thi, không thi...)'}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                      excluded
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 shadow-xs'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                                    }`}
                                  >
                                    {excluded ? '↩ Thêm lại' : '✕ Hoãn / Bỏ ra'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Final Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <span className="font-bold">Kết luận cho cặp lớp này: </span>
                Lớp <span className="font-bold">{selectedDetail.fromClass}</span> có {activeDetailCalc?.fromClassCount ?? selectedDetail.studentsCount} SV dự thi. 
                Cần gửi cho lớp đại diện <span className="font-bold">{activeDetailCalc?.responsibleClass ?? selectedDetail.toClass}</span> số tiền là: 
                <span className="font-bold text-rose-600 ml-1">
                  {activeDetailCalc?.fromClassCount ?? selectedDetail.studentsCount} x {formatCurrency(activeDetailCalc?.pricePerStudent ?? selectedDetail.pricePerStudent)} = {formatCurrency(activeDetailCalc?.amount ?? selectedDetail.amount)}
                </span>.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setSelectedDetail(null);
                  setShowStudentList(false);
                  setStudentClassFilter('ALL');
                  setStudentSearchQuery('');
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <PricingConfigModal
        isOpen={isPricingModalOpen && effectiveIsAdmin}
        onClose={() => setIsPricingModalOpen(false)}
        isAdmin={effectiveIsAdmin}
      />
    </div>
  );
}
