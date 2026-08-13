import React, { useMemo, useState, useEffect } from 'react';
import { ExamRecord, LoginUser, ExamSession } from '../types';
import { DollarSign, ChevronDown, ChevronUp, FileText, ArrowDownLeft, ArrowUpRight, CheckCircle2, User, X, Mail } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';

interface SettlementManagerProps {
  records: ExamRecord[];
  sessions: ExamSession[];
  loginUsers?: LoginUser[];
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

export default function SettlementManager({ records, sessions = [], loginUsers = [] }: SettlementManagerProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
  const [selectedDetail, setSelectedDetail] = useState<DebtDetail | null>(null);

  const getMonitorName = (cls: string) => {
    return loginUsers.find(u => u.lop === cls)?.fullName || 'Chưa cập nhật';
  };

  const monitorClasses = useMemo<Set<string>>(() => {
    return new Set(loginUsers.filter(u => u.role === 'lop_truong' && u.lop).map(u => u.lop as string));
  }, [loginUsers]);

  const monitorClassList = Array.from(monitorClasses).sort();

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
      // Find classes with monitors in this session
      const monitoredClassesInRoom = session.classCounts.filter(c => monitorClasses.has(c.className));
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

  }, [sessions, selectedClass, monitorClasses, loginUsers]);

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
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-hidden h-full bg-slate-50">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Chi Tiết Phân Bổ Chi Phí Phòng Thi
              </h3>
              <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
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
                </h4>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Tổng định mức phong bì phòng thi:</span>
                    <span className="font-bold text-base">{formatCurrency(selectedDetail.totalRoomPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Số SV tham gia chia tiền (thuộc các lớp có LT):</span>
                    <span className="font-bold text-base">{selectedDetail.totalRoomPrice / selectedDetail.pricePerStudent} SV</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="font-semibold">Đơn giá trên mỗi Sinh Viên:</span>
                    <span className="font-bold text-rose-600 text-base">{formatCurrency(selectedDetail.pricePerStudent)}/SV</span>
                  </div>
                </div>
              </div>

              {/* Class Distribution */}
              <div>
                <h4 className="font-bold text-slate-700 mb-3">Phân bổ sinh viên trong phòng</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Tên Lớp</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200 text-center">Số SV</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Trạng thái Lớp Trưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetail.session.classCounts.map((c: any, i: number) => {
                        const hasMonitor = monitorClassList.includes(c.className);
                        const isResponsible = c.className === selectedDetail.toClass;
                        const isPaying = c.className === selectedDetail.fromClass;
                        
                        return (
                          <tr key={i} className={isResponsible ? 'bg-emerald-50' : isPaying ? 'bg-rose-50' : 'bg-white'}>
                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                              {c.className}
                              {isResponsible && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">Đại diện lấy PB</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{c.count}</td>
                            <td className="px-4 py-3">
                              {hasMonitor ? (
                                <span className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Có tham gia chia
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Không có LT / Miễn chia</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <span className="font-bold">Kết luận cho cặp lớp này: </span>
                Lớp <span className="font-bold">{selectedDetail.fromClass}</span> có {selectedDetail.studentsCount} SV. 
                Cần gửi cho lớp đại diện <span className="font-bold">{selectedDetail.toClass}</span> số tiền là: 
                <span className="font-bold text-rose-600 ml-1">{selectedDetail.studentsCount} x {formatCurrency(selectedDetail.pricePerStudent)} = {formatCurrency(selectedDetail.amount)}</span>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
