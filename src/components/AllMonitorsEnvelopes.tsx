import React, { useMemo, useState, useEffect } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../types';
import { Mail, Search, MapPin, DollarSign, Settings } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';
import PricingConfigModal from './PricingConfigModal';

interface AllMonitorsEnvelopesProps {
  sessions?: ExamSession[];
  records?: ExamRecord[];
  loginUsers?: LoginUser[];
  isAdmin?: boolean;
}

export default function AllMonitorsEnvelopes({ sessions = [], loginUsers = [], isAdmin }: AllMonitorsEnvelopesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingVersion, setPricingVersion] = useState(0);

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
    return sessions.map(session => {
      const monitoredClassesInRoom = session.classCounts.filter(c => monitorClasses.has(c.className));
      const responsibleClasses = monitoredClassesInRoom.length > 0 ? [monitoredClassesInRoom[0].className] : [];
      return { ...session, responsibleClasses };
    });
  }, [sessions, monitorClasses]);

  const displayedSessions = useMemo(() => {
    let filtered = enhancedSessions.filter(s => s.responsibleClasses.length > 0);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.subject.toLowerCase().includes(term) ||
        s.room.toLowerCase().includes(term) ||
        s.responsibleClasses.some(c => c.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [enhancedSessions, searchTerm]);

  const totalExpectedMoney = useMemo(() => {
    return displayedSessions.reduce(
      (sum, s) => sum + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat, s.id),
      0
    );
  }, [displayedSessions, pricingVersion]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-4 sm:gap-6 overflow-y-auto min-h-0 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>Phân Công Phong Bì Lớp Trưởng</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Danh sách tất cả các phòng thi có sinh viên thuộc lớp do Lớp Trưởng quản lý.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Tùy chỉnh định mức giá tiền phòng"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấu hình tiền</span>
            </button>
          )}

          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm môn, phòng, lớp, LT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 shadow-2xs text-center sm:text-left">
          <div className="w-6 h-6 sm:w-11 sm:h-11 bg-blue-500/10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-tight sm:tracking-wider truncate">Tổng phòng</p>
            <p className="text-sm sm:text-2xl md:text-3xl font-extrabold text-slate-800 mt-0.5 leading-none">{displayedSessions.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/70 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 flex flex-col sm:flex-row items-center gap-1 sm:gap-3.5 shadow-2xs text-center sm:text-left">
          <div className="w-6 h-6 sm:w-11 sm:h-11 bg-amber-500/10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-xs text-amber-700 font-bold uppercase tracking-tight sm:tracking-wider truncate">Tổng quỹ (Tất cả LT)</p>
            <p className="text-[11px] sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-amber-950 mt-0.5 leading-none truncate">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden min-h-0 flex-1">
        {displayedSessions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
            <Mail className="w-10 h-10 text-slate-300" />
            <p className="text-sm">Không tìm thấy phòng thi nào phù hợp.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: Cards (< 768px) */}
            <div className="block md:hidden overflow-y-auto p-3 space-y-3">
              {displayedSessions.map((session, index) => {
                const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
                return (
                  <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col gap-3">
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

                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Cơ cấu sinh viên ({session.classCounts.reduce((sum, c) => sum + c.count, 0)} SV)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {session.classCounts.map(c => {
                          const isMonitorClass = monitorClasses.has(c.className);
                          return (
                            <span 
                              key={c.className} 
                              className={`text-xs px-2 py-0.5 rounded-md font-bold border flex gap-1 items-center ${
                                isMonitorClass 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs' 
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              <span>{c.className}</span>
                              <span className={`w-px h-2.5 ${isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                              <span className="font-extrabold">{c.count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">ĐỊNH MỨC</span>
                        <span className="inline-block bg-amber-50 text-amber-800 font-extrabold px-2.5 py-1 rounded-lg text-xs border border-amber-200">
                          {formatCurrency(roomPrice)}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block">TRÁCH NHIỆM</span>
                        {session.responsibleClasses.map(cls => {
                          const isMonitorClass = monitorClasses.has(cls);
                          const cleanCls = cls.trim().toUpperCase();
                          const monitorUser = loginUsers.find(
                            (u) =>
                              isUserMonitor(u) &&
                              u.lop &&
                              u.lop.trim().toUpperCase() === cleanCls
                          );
                          
                          if (isMonitorClass) {
                            return (
                              <div key={cls} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800">
                                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{cls}</span>
                                {monitorUser && (
                                  <span className="text-[10px] text-emerald-600 font-normal">
                                    ({monitorUser.fullName || monitorUser.username})
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return (
                            <span key={cls} className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {cls}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Table (>= 768px) */}
            <div className="hidden md:block flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">STT</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">Thời gian</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Phòng & Môn</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cơ cấu sinh viên</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap w-36">Bồi dưỡng</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Trách nhiệm phụ trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedSessions.map((session, index) => (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
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
                          {session.classCounts.map(c => {
                            const isMonitorClass = monitorClasses.has(c.className);
                            return (
                              <span 
                                key={c.className} 
                                className={`text-xs px-2.5 py-0.5 rounded-md font-bold border flex gap-1.5 items-center ${
                                  isMonitorClass 
                                    ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-2xs' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <span>{c.className}</span>
                                <span className={`w-px h-3 ${isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                                <span>{c.count}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-amber-50 text-amber-800 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200 whitespace-nowrap">
                          {formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {session.responsibleClasses.map(cls => {
                            const isMonitorClass = monitorClasses.has(cls);
                            const cleanCls = cls.trim().toUpperCase();
                            const monitorUser = loginUsers.find(
                              (u) =>
                                isUserMonitor(u) &&
                                u.lop &&
                                u.lop.trim().toUpperCase() === cleanCls
                            );
                            
                            if (isMonitorClass) {
                              return (
                                <div key={cls} className="flex flex-col gap-0.5 items-start bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>{cls}</span>
                                  </div>
                                  {monitorUser && (
                                    <span className="text-[11px] text-emerald-600 font-medium opacity-90 pl-5">
                                      LT: {monitorUser.fullName || monitorUser.username}
                                    </span>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div key={cls} className="flex flex-col items-start bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
                                  <span className="font-bold text-xs">{cls}</span>
                                  <span className="text-[10px] italic opacity-75">Không có LT</span>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <PricingConfigModal
        isOpen={isPricingModalOpen && effectiveIsAdmin}
        onClose={() => setIsPricingModalOpen(false)}
        isAdmin={effectiveIsAdmin}
      />
    </div>
  );
}
