import React, { useMemo, useEffect, useState } from 'react';
import { ExamRecord, LoginUser, ExamSession } from '../types';
import { Mail, MapPin, Users, Info, Calculator, X, DollarSign, Download } from 'lucide-react';
import { calculateRoomPrice, formatCurrency } from '../config/pricingConfig';

interface SessionEnvelope {
  id: string;
  room: string;
  date: string;
  time: string;
  subject: string;
  subjectCode: string;
  classCounts: { className: string; count: number }[];
  isResponsible: boolean;
}

interface RoomEnvelopeManagerProps {
  sessions: ExamSession[];

  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  loginUsers?: LoginUser[];
hideClassSelector?: boolean;
}

export default function RoomEnvelopeManager({ sessions = [], records, selectedClass, onClassChange, loginUsers = [], hideClassSelector = false }: RoomEnvelopeManagerProps) {
  const [splitSession, setSplitSession] = useState<SessionEnvelope | null>(null);
  const [envelopeAmount, setEnvelopeAmount] = useState<string>('100000');
  const [includedClasses, setIncludedClasses] = useState<Set<string>>(new Set());
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterResponsibleOnly, setFilterResponsibleOnly] = useState<boolean>(false);
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
        const className = r.MaLop || 'Khác';
        session.counts.set(className, (session.counts.get(className) || 0) + 1);
      }
    });

    const result: SessionEnvelope[] = Array.from(sessionMap.entries()).map(([id, session]) => {
      const classCounts = Array.from(session.counts.entries()).map(([className, count]) => ({ className, count })).sort((a, b) => b.count - a.count);
      
      const responsibleClass = classCounts[0]?.className;
      const isResponsible = selectedClass === responsibleClass && classCounts[0]?.count > 0;

      return {
        id,
        room: session.room,
        date: session.date,
        time: session.time,
        subject: session.subject,
        subjectCode: session.subjectCode,
        examFormat: session.examFormat,
        classCounts,
        isResponsible
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
            m = p0; d = p1; // Assume M/D/YYYY by default
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
  }, [records, selectedClass]);

  const availableDates = useMemo(() => {
    const dates = new Set(monitorEnvelopes.map(s => s.date));
    return Array.from(dates).sort();
  }, [monitorEnvelopes]);

  const filteredEnvelopes = useMemo(() => {
    return monitorEnvelopes.filter(s => {
      if (filterDate && s.date !== filterDate) return false;
      if (filterResponsibleOnly && !s.isResponsible) return false;
      return true;
    });
  }, [monitorEnvelopes, filterDate, filterResponsibleOnly]);

  const responsibleCount = filteredEnvelopes.filter(s => s.isResponsible).length;
  const totalExpectedMoney = filteredEnvelopes.filter(s => s.isResponsible).reduce((acc, s) => acc + calculateRoomPrice(s.subject, s.subjectCode, s.room, s.examFormat), 0);

  const monitorClasses = useMemo(() => {
    return new Set(loginUsers.filter(u => u.role === 'lop_truong' && u.lop).map(u => u.lop as string));
  }, [loginUsers]);

  
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
      const money = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat);
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

  const handleOpenSplit = (session: SessionEnvelope) => {
    setSplitSession(session);
    const initialIncluded = new Set<string>();
    session.classCounts.forEach(c => {
      if (monitorClasses.has(c.className)) {
        initialIncluded.add(c.className);
      }
    });
    setIncludedClasses(initialIncluded);
  };

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu trước.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-hidden h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            {hideClassSelector ? "Phân Công Phong Bì Lớp Mình" : "Phân Công Phong Bì"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý và theo dõi trách nhiệm phong bì phòng thi theo nguyên tắc: Lớp đông sinh viên nhất sẽ phụ trách.</p>
        </div>
        {!hideClassSelector && <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Lớp:</span>
          <select
            className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full min-w-[120px]"
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>}
      </div>

      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select 
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 min-w-[150px]"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="">Tất cả các ngày</option>
            {availableDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={filterResponsibleOnly}
              onChange={(e) => setFilterResponsibleOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
            />
            Chỉ hiện các phòng lớp mình đi lấy PB
          </label>
        </div>

        <button 
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 text-slate-700 w-full md:w-auto justify-center"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Tổng số phòng thi</p>
            <p className="text-3xl font-bold text-blue-900">{filteredEnvelopes.length}</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wider">Số phòng lớp phụ trách</p>
            <p className="text-3xl font-bold text-emerald-900">{responsibleCount}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Dự kiến bồi dưỡng</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-900">{formatCurrency(totalExpectedMoney)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-16">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-48">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-64">Phòng & Môn</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Cơ cấu sinh viên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 whitespace-nowrap">Bồi dưỡng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-48 text-right">Trách nhiệm</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnvelopes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không có lịch thi nào cho lớp này.
                  </td>
                </tr>
              ) : (
                filteredEnvelopes.map((session, index) => (
                  <tr key={session.id} className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''} ${session.isResponsible ? 'bg-emerald-50/10' : ''}`}>
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
                        {session.classCounts.map(c => (
                          <span 
                            key={c.className} 
                            className={`text-xs px-2.5 py-1 rounded-md font-bold border flex gap-1.5 items-center ${
                              c.className === selectedClass 
                                ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm' 
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
                      <span className="inline-block bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200 whitespace-nowrap">
                        {formatCurrency(calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {session.isResponsible ? (
                        <div className="flex flex-col gap-2 items-end w-full">
                          <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg w-full border border-emerald-200 shadow-sm">
                            <Mail className="w-4 h-4" />
                            Lớp mình
                          </div>
                          <button 
                            onClick={() => handleOpenSplit(session)}
                            className="flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1.5 rounded w-full transition-colors"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            Chia tiền
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-slate-500 text-sm w-full">
                          <span className="font-semibold text-slate-700">{session.classCounts[0]?.className}</span>
                          <span className="text-xs">({session.classCounts[0]?.count} SV)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {splitSession && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Chia tiền phòng thi
              </h3>
              <button onClick={() => setSplitSession(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
              <div className="text-sm font-semibold text-slate-700">{splitSession.room} - {splitSession.subject}</div>
              <div className="text-xs text-slate-500">{splitSession.date} {splitSession.time}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng tiền phong bì (VNĐ)</label>
              <input 
                type="number" 
                value={envelopeAmount} 
                onChange={(e) => setEnvelopeAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                placeholder="Ví dụ: 100000"
              />
            </div>

            <div className="flex-1 overflow-auto min-h-0 pr-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Các lớp tham gia chia (mặc định chọn các lớp có LT)</label>
              <div className="space-y-2">
                {splitSession.classCounts.map(c => {
                  const isChecked = includedClasses.has(c.className);
                  const hasMonitor = monitorClasses.has(c.className);
                  
                  return (
                    <label key={c.className} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newSet = new Set(includedClasses);
                            if (e.target.checked) newSet.add(c.className);
                            else newSet.delete(c.className);
                            setIncludedClasses(newSet);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-700 flex items-center gap-2">
                            {c.className} 
                            {!hasMonitor && <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Không có LT</span>}
                          </div>
                          <div className="text-xs text-slate-500">{c.count} sinh viên</div>
                        </div>
                      </div>
                      
                      {isChecked && (
                        <div className="text-sm font-bold text-blue-700">
                          {(() => {
                            const totalIncludedStudents = splitSession.classCounts
                              .filter(sc => includedClasses.has(sc.className))
                              .reduce((acc, sc) => acc + sc.count, 0);
                            if (totalIncludedStudents === 0) return '0đ';
                            const amount = parseInt(envelopeAmount) || 0;
                            const share = Math.round((amount * c.count) / totalIncludedStudents);
                            return share.toLocaleString('vi-VN') + 'đ';
                          })()}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSplitSession(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
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
