import React, { useMemo, useState, useEffect } from 'react';
import { ExamRecord, LoginUser, ExamSession } from '../types';
import { DollarSign, ChevronDown, ChevronUp, FileText, ArrowDownLeft, ArrowUpRight, CheckCircle2, User, X, Mail, Users, Search } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';

interface SettlementManagerProps {
  records: ExamRecord[];
  sessions: ExamSession[];
  loginUsers?: LoginUser[];
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
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

export default function SettlementManager({ records, sessions = [], loginUsers = [], onTogglePostpone }: SettlementManagerProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
  const [selectedDetail, setSelectedDetail] = useState<DebtDetail | null>(null);
  const [showStudentList, setShowStudentList] = useState<boolean>(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [excludedStudents, setExcludedStudents] = useState<Set<string>>(new Set());
  const studentListRef = React.useRef<HTMLDivElement>(null);

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

  const getMonitorName = (cls: string) => {
    return loginUsers.find(u => u.lop === cls)?.fullName || 'Chưa cập nhật';
  };

  const monitorClasses = useMemo<Set<string>>(() => {
    return new Set(loginUsers.filter(u => u.role === 'lop_truong' && u.lop).map(u => u.lop as string));
  }, [loginUsers]);

  const monitorClassList: string[] = (Array.from(monitorClasses) as string[]).sort();

  // Helpers for exclusion
  const isStudentExcluded = (sessionId: string, r: ExamRecord) => {
    const key = getExclusionKey(sessionId, r.MaSV || '');
    if (excludedStudents.has(key)) return true;
    return Boolean(r.isPostponed);
  };

  const toggleStudentExclusion = async (session: any, r: ExamRecord) => {
    const isExcluded = isStudentExcluded(session.id, r);
    const newExcluded = !isExcluded;
    const key = getExclusionKey(session.id, r.MaSV || '');

    setExcludedStudents(prev => {
      const next = new Set(prev);
      if (newExcluded) next.add(key);
      else next.delete(key);
      return next;
    });

    if (onTogglePostpone) {
      await onTogglePostpone(r, newExcluded);
    }
  };

  const clearSessionExclusions = (session: any) => {
    setExcludedStudents(prev => {
      const next = new Set(prev);
      for (const key of Array.from(next)) {
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
    if (monitorClassList.length > 0 && !selectedClass) {
      try {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
          const user = JSON.parse(saved);
          if (user?.lop && monitorClasses.has(user.lop)) {
            setSelectedClass(user.lop);
            return;
          }
        }
      } catch (e) {}
      setSelectedClass(monitorClassList[0]);
    }
  }, [monitorClassList, selectedClass, monitorClasses]);

  const data = useMemo(() => {
    if (!selectedClass || sessions.length === 0) {
      return { receivables: [], payables: [], settled: [], totalReceive: 0, totalPay: 0, netTotal: 0 };
    }

    const allDebts: DebtDetail[] = [];

    sessions.forEach(session => {
      // Recalculate effective class counts (excluding students marked as hoãn thi / excluded)
      const effectiveCounts = new Map<string, number>();
      session.records.forEach(r => {
        const isExcluded = r.isPostponed || excludedStudents.has(getExclusionKey(session.id, r.MaSV || ''));
        if (!isExcluded) {
          const cls = r.MaLop || 'Khác';
          effectiveCounts.set(cls, (effectiveCounts.get(cls) || 0) + 1);
        }
      });

      // Find classes with monitors in this session (using effective counts)
      const monitoredClassesInRoom = Array.from(effectiveCounts.entries())
        .filter(([cls]) => monitorClasses.has(cls))
        .map(([cls, count]) => ({ className: cls, count }))
        .sort((a, b) => b.count !== a.count ? b.count - a.count : a.className.localeCompare(b.className));

      if (monitoredClassesInRoom.length <= 1) return; // Only 1 monitor or none, no cross-settlement needed

      // The monitor with the most students is responsible for the envelope
      const responsibleClass = monitoredClassesInRoom[0].className;
      const totalMonitoredStudents = monitoredClassesInRoom.reduce((acc, c) => acc + c.count, 0);
      const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
      const pricePerStudent = roomPrice / totalMonitoredStudents;

      monitoredClassesInRoom.forEach(c => {
        if (c.className !== responsibleClass) {
          allDebts.push({
            session,
            fromClass: c.className, // Class C owes
            toClass: responsibleClass, // Class A (the one who receives the envelope)
            amount: c.count * pricePerStudent,
            studentsCount: c.count,
            pricePerStudent,
            totalRoomPrice: roomPrice
          });
        }
      });
    });

    const pMap = new Map<string, PartnerBalance>();
    monitorClasses.forEach(c => {
      if (c !== selectedClass) {
        pMap.set(c, {
          partnerClass: c,
          partnerMonitor: getMonitorName(c),
          netBalance: 0,
          detailsOweUs: [],
          detailsWeOwe: []
        });
      }
    });

    allDebts.forEach(debt => {
      if (debt.fromClass === selectedClass) {
        // We owe them
        const p = pMap.get(debt.toClass);
        if (p) {
          p.netBalance -= debt.amount;
          p.detailsWeOwe.push(debt);
        }
      } else if (debt.toClass === selectedClass) {
        // They owe us
        const p = pMap.get(debt.fromClass);
        if (p) {
          p.netBalance += debt.amount;
          p.detailsOweUs.push(debt);
        }
      }
    });

    const activePartners = Array.from(pMap.values()).filter(p => Math.abs(p.netBalance) > 0.01 || p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0);

    let totalReceive = 0;
    let totalPay = 0;

    activePartners.forEach(p => {
      if (p.netBalance > 0.01) totalReceive += p.netBalance;
      if (p.netBalance < -0.01) totalPay += Math.abs(p.netBalance);
    });

    const receivables = activePartners.filter(p => p.netBalance > 0.01).sort((a, b) => b.netBalance - a.netBalance);
    const payables = activePartners.filter(p => p.netBalance < -0.01).sort((a, b) => a.netBalance - b.netBalance);
    const settled = activePartners.filter(p => Math.abs(p.netBalance) <= 0.01);

    return { receivables, payables, settled, totalReceive, totalPay, netTotal: totalReceive - totalPay };

  }, [sessions, selectedClass, monitorClasses, loginUsers, excludedStudents]);

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
  }, [selectedDetail, currentRoomRecords, excludedStudents]);

  // Count excluded students for the current session in modal
  const excludedCountForModal = useMemo(() => {
    if (!selectedDetail) return 0;
    return currentRoomRecords.filter((r: ExamRecord) =>
      isStudentExcluded(selectedDetail.session.id, r)
    ).length;
  }, [selectedDetail, currentRoomRecords, excludedStudents]);

  // Dynamic live calculation for the modal when students are toggled
  const activeDetailCalc = useMemo(() => {
    if (!selectedDetail) return null;
    const sess = selectedDetail.session;
    const monitoredCounts = Array.from(effectiveClassCountsForModal.entries())
      .filter(([cls]) => monitorClasses.has(cls))
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.className.localeCompare(b.className)));

    const responsibleClass = monitoredCounts[0]?.className || selectedDetail.toClass;
    const totalMonitoredStudents = monitoredCounts.reduce((acc, c) => acc + c.count, 0);
    const roomPrice = calculateRoomPrice(sess.subject, sess.subjectCode, sess.room, sess.examFormat);
    const pricePerStudent = totalMonitoredStudents > 0 ? roomPrice / totalMonitoredStudents : 0;
    const fromClassCount = effectiveClassCountsForModal.get(selectedDetail.fromClass) || 0;
    const amount = fromClassCount * pricePerStudent;

    return {
      responsibleClass,
      totalMonitoredStudents,
      pricePerStudent,
      totalRoomPrice: roomPrice,
      fromClassCount,
      amount,
    };
  }, [selectedDetail, effectiveClassCountsForModal, monitorClasses]);



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
              <span className="text-sm text-slate-500 font-medium">{p.partnerMonitor}</span>
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
                            <div className="font-bold text-slate-700">{d.session.room}</div>
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
                            <div className="font-bold text-slate-700">{d.session.room}</div>
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
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto min-h-0 bg-slate-50">
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
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <span className="text-sm font-semibold text-slate-600 pl-2">Lớp của bạn:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          >
            {monitorClassList.map(c => (
              <option key={c} value={c}>{c} ({getMonitorName(c)})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tổng phải thu</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data.totalReceive)}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tổng phải trả</p>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(data.totalPay)}</p>
          </div>
        </div>
        <div className={`border rounded-2xl p-5 flex items-center gap-4 shadow-sm \${data.netTotal >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 \${data.netTotal >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <DollarSign className={`w-6 h-6 \${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wider \${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {data.netTotal >= 0 ? 'Thực nhận sau cùng' : 'Thực chi sau cùng'}
            </p>
            <p className={`text-2xl font-bold \${data.netTotal >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              {formatCurrency(Math.abs(data.netTotal))}
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
                      {selectedDetail.session.classCounts.map((c: any, i: number) => {
                        const hasMonitor = monitorClassList.includes(c.className);
                        const isResponsible = c.className === selectedDetail.toClass;
                        const isPaying = c.className === selectedDetail.fromClass;
                        const effectiveCount = effectiveClassCountsForModal.get(c.className) ?? 0;
                        const excludedInClass = c.count - effectiveCount;

                        return (
                          <tr key={i} className={isResponsible ? 'bg-emerald-50/70' : isPaying ? 'bg-rose-50/70' : 'bg-white'}>
                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                              {c.className}
                              {isResponsible && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">Đại diện lấy PB</span>}
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
                                <span className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Có tham gia chia
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Không có LT / Miễn chia</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleOpenStudentListForClass(c.className)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <Users className="w-3 h-3" /> Xem {c.count} SV
                              </button>
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
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
