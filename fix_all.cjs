const fs = require('fs');

const content = `import React, { useMemo, useState } from 'react';
import { ExamRecord, LoginUser } from '../types';
import { Mail, Search, MapPin, Users } from 'lucide-react';

interface AllMonitorsEnvelopesProps {
  records: ExamRecord[];
  loginUsers?: LoginUser[];
}

export default function AllMonitorsEnvelopes({ records, loginUsers = [] }: AllMonitorsEnvelopesProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const monitorClasses = useMemo<Set<string>>(() => {
    return new Set(loginUsers.filter(u => u.role === 'lop_truong' && u.lop).map(u => u.lop as string));
  }, [loginUsers]);

  const sessions = useMemo(() => {
    if (records.length === 0) return [];

    const sessionKeys = new Set(records.map(r => \`\${r.MAPTHI}|\${r.NgayThi}|\${r.GioThi}|\${r.TenMH}\`));

    const sessionMap = new Map<string, {
      room: string;
      date: string;
      time: string;
      subject: string;
      subjectCode: string;
      counts: Map<string, number>;
    }>();

    records.forEach(r => {
      const key = \`\${r.MAPTHI}|\${r.NgayThi}|\${r.GioThi}|\${r.TenMH}\`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          room: r.MAPTHI,
          date: r.NgayThi,
          time: r.GioThi,
          subject: r.TenMH,
          subjectCode: r.MaMH,
          counts: new Map<string, number>()
        });
      }
      const session = sessionMap.get(key)!;
      const className = r.MaLop || 'Khác';
      session.counts.set(className, (session.counts.get(className) || 0) + 1);
    });

    const allSessions = Array.from(sessionMap.entries()).map(([id, session]) => {
      const classCounts = Array.from(session.counts.entries())
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => b.count - a.count);

      const maxCount = classCounts[0]?.count || 0;
      const responsibleClasses = classCounts.filter(c => c.count === maxCount).map(c => c.className);

      return {
        id,
        room: session.room,
        date: session.date,
        time: session.time,
        subject: session.subject,
        subjectCode: session.subjectCode,
        classCounts,
        responsibleClasses
      };
    });

    const filteredSessions = allSessions.filter(s => 
      s.classCounts.some(c => monitorClasses.has(c.className))
    );

    return filteredSessions.sort((a, b) => {
      const parseDateTime = (dateStr: string, timeStr: string) => {
        if (!dateStr) return 0;
        const parts = dateStr.split(/[\\/\\-]/);
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
        let h = 0, min = 0;
        if (timeStr) {
          const timeMatch = timeStr.match(/(\\d+)g(\\d+)?/);
          if (timeMatch) {
            h = parseInt(timeMatch[1], 10);
            min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          } else {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
              h = parseInt(parts[0], 10);
              min = parseInt(parts[1], 10);
            }
          }
        }
        return new Date(y, m - 1, d, h, min).getTime();
      };

      return parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time);
    });
  }, [records, monitorClasses]);

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu trước.</p>
      </div>
    );
  }

  const displayedSessions = sessions.filter(session => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return session.room.toLowerCase().includes(term) ||
           session.subject.toLowerCase().includes(term) ||
           session.subjectCode.toLowerCase().includes(term) ||
           session.classCounts.some(c => 
             c.className.toLowerCase().includes(term) || 
             (loginUsers.find(u => u.lop === c.className)?.fullName || '').toLowerCase().includes(term)
           );
  });

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-hidden h-full bg-slate-50">
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
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-64">Trách nhiệm phụ trách</th>
              </tr>
            </thead>
            <tbody>
              {displayedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy phòng thi nào phù hợp.
                  </td>
                </tr>
              ) : (
                displayedSessions.map((session, index) => (
                  <tr key={session.id} className={\`hover:bg-slate-50 transition-colors \${index % 2 === 1 ? 'bg-slate-50/30' : ''}\`}>
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
                              className={\`text-xs px-2.5 py-1 rounded-md font-bold border flex gap-1.5 items-center \${
                                isMonitorClass
                                  ? 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }\`}
                            >
                              <span>{c.className}</span>
                              <span className={\`w-px h-3 \${isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'}\`}></span>
                              <span>{c.count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {session.responsibleClasses.map(cls => {
                          const isMonitorClass = monitorClasses.has(cls);
                          const user = loginUsers.find(u => u.lop === cls);
                          
                          if (isMonitorClass) {
                            return (
                              <div key={cls} className="flex flex-col gap-0.5 items-start bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{cls}</span>
                                </div>
                                {user && (
                                  <span className="text-xs text-emerald-600 font-medium opacity-90 pl-5">
                                    {user.fullName}
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
`

fs.writeFileSync('src/components/AllMonitorsEnvelopes.tsx', content);
