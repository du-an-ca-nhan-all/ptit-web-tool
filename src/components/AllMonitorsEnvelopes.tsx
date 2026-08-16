import React, { useMemo, useState } from 'react';
import { ExamRecord, LoginUser, ExamSession, isUserMonitor } from '../types';
import { Mail, Search, MapPin, DollarSign } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';

interface AllMonitorsEnvelopesProps {
  sessions: ExamSession[];
  records: ExamRecord[];
  loginUsers?: LoginUser[];
}

export default function AllMonitorsEnvelopes({ sessions = [], loginUsers = [] }: AllMonitorsEnvelopesProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
    return displayedSessions.reduce((sum, s) => sum + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);
  }, [displayedSessions]);

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto min-h-0 bg-slate-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            Phân Công Phong Bì Lớp Trưởng
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách tất cả các phòng thi có sinh viên thuộc lớp do Lớp Trưởng quản lý.
          </p>
        </div>
        
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm môn, phòng, lớp, tên LT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Tổng số phòng thi liên quan</p>
            <p className="text-3xl font-bold text-slate-800">{displayedSessions.length}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Tổng quỹ dự kiến (tất cả lớp trưởng)</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-16">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-48">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-64">Phòng & Môn</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">Bồi dưỡng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-64">Trách nhiệm phụ trách</th>
              </tr>
            </thead>
            <tbody>
              {displayedSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy phòng thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                displayedSessions.map((session, index) => (
                  <tr key={session.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{session.date}</span>
                        <span className="text-slate-500 text-sm">{session.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-rose-600 text-base">{session.room}</span>
                        <span className="text-slate-700 font-medium text-sm mt-0.5 break-words whitespace-normal" title={session.subject}>{session.subject}</span>
                        <span className="text-slate-400 text-xs">{session.subjectCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {session.classCounts.map(c => {
                          const isMonitorClass = monitorClasses.has(c.className);
                          return (
                            <span 
                              key={c.className} 
                              className={`text-xs px-2.5 py-1 rounded-md font-bold border flex gap-1.5 items-center ${
                                isMonitorClass 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm' 
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
                      <span className="inline-block bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200 whitespace-nowrap">
                        {formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
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
                                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{cls}</span>
                                </div>
                                {monitorUser && (
                                  <span className="text-xs text-emerald-600 font-medium opacity-90 pl-5">
                                    LT: {monitorUser.fullName || monitorUser.username}
                                  </span>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div key={cls} className="flex flex-col items-start bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
                                <span className="font-bold text-sm">{cls}</span>
                                <span className="text-xs italic opacity-75">Không có LT</span>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
