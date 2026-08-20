import React, { useState, useMemo } from 'react';
import { ExamRecord } from '../types/class.types';
import { Users, MessageSquare, Download, ClipboardList, Copy, Check, CalendarDays, MapPin } from 'lucide-react';

interface ClassMonitorToolsProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
}

export default function ClassMonitorTools({ records, selectedClass, onClassChange }: ClassMonitorToolsProps) {
  const [copied, setCopied] = useState(false);

  const classes = useMemo(() => {
    const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [records]);

  // Set default class if available
  React.useEffect(() => {
    if (classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {
      onClassChange(classes[0]);
    }
  }, [classes, selectedClass, onClassChange]);

  const classRecords = useMemo(() => {
    return records.filter(r => r.MaLop === selectedClass);
  }, [records, selectedClass]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(classRecords.map(r => r.MaSV));
    const uniqueSubjects = new Set(classRecords.map(r => r.MaMH));
    return {
      students: uniqueStudents.size,
      subjects: uniqueSubjects.size,
      totalExams: classRecords.length
    };
  }, [classRecords]);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set(classRecords.map(r => r.MAPTHI).filter(Boolean));
    return Array.from(rooms).sort();
  }, [classRecords]);

  const roomDetails = useMemo(() => {
    if (classRecords.length === 0) return [];
    
    const groups = new Map<string, any>();
    classRecords.forEach(r => {
      const key = `${r.MAPTHI}-${r.MaMH}-${r.NgayThi}-${r.GioThi}`;
      if (!groups.has(key)) {
        groups.set(key, {
          room: r.MAPTHI,
          subjectCode: r.MaMH,
          subjectName: r.TenMH,
          date: r.NgayThi,
          time: r.GioThi,
          format: r.MaHTThi,
          students: 1
        });
      } else {
        groups.get(key).students += 1;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
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
  }, [classRecords]);

  const announcementText = useMemo(() => {
    if (classRecords.length === 0) return '';
    
    // Group exams by Subject
    const examsBySubject = classRecords.reduce((acc, curr) => {
      const key = curr.MaMH;
      if (!acc[key]) {
        acc[key] = {
          subjectName: curr.TenMH,
          date: curr.NgayThi,
          time: curr.GioThi,
          room: curr.MAPTHI,
          format: curr.MaHTThi,
          students: 1
        };
      } else {
        acc[key].students += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const subjectList = Object.values(examsBySubject).map((exam: any) => 
      `- ${exam.subjectName} (${exam.format || 'Thi'}):\n  + Ngày: ${exam.date} | Giờ: ${exam.time}\n  + Phòng: ${exam.room}\n  + Số lượng: ${exam.students} SV`
    ).join('\n\n');

    return `📢 THÔNG BÁO LỊCH THI LỚP ${selectedClass}\n\nChào các bạn, đây là tổng hợp lịch thi sắp tới của lớp mình:\n\n${subjectList}\n\nCác bạn nhớ mang thẻ SV và đến đúng giờ nhé! Chúc cả lớp thi tốt! 🍀`;
  }, [classRecords, selectedClass]);

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportClassCSV = () => {
    if (classRecords.length === 0) return;
    const headers = Object.keys(classRecords[0]).join(',');
    const rows = classRecords.map(record => 
      Object.values(record).map(val => `"${val || ''}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LichThi_${selectedClass}.csv`;
    link.click();
  };

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu lịch thi trước.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Công Cụ Lớp Trưởng</h2>
          <p className="text-sm text-slate-500">Hỗ trợ trích xuất và thông báo cho từng lớp</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm min-w-[200px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Chọn Lớp:</span>
          <select
            className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full"
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {selectedClass ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                Tổng quan lớp {selectedClass}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-slate-700">Sinh viên dự thi</span>
                  </div>
                  <span className="text-lg font-bold text-slate-800">{stats.students}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><CalendarDays className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-slate-700">Số môn thi</span>
                  </div>
                  <span className="text-lg font-bold text-slate-800">{stats.subjects}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ClipboardList className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-slate-700">Lượt thi (tổng)</span>
                  </div>
                  <span className="text-lg font-bold text-slate-800">{stats.totalExams}</span>
                </div>
              </div>
              <button 
                onClick={handleExportClassCSV}
                className="w-full mt-6 py-2.5 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Tải CSV Lớp Này
              </button>
            </div>

            {/* Exam Rooms Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Danh sách phòng thi
              </h3>
              {uniqueRooms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uniqueRooms.map(room => (
                    <span key={room} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-bold rounded-lg border border-rose-100">
                      {room}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Không có dữ liệu phòng thi.</p>
              )}
            </div>
          </div>

          {/* Announcement Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Mẫu thông báo Zalo / Facebook
                </h3>
                <button 
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Sao chép</>}
                </button>
              </div>
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <textarea 
                  className="w-full h-full bg-transparent resize-none outline-none text-sm text-slate-700 leading-relaxed font-medium min-h-[250px]"
                  value={announcementText}
                  readOnly
                />
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                * Văn bản được tự động tổng hợp từ dữ liệu lịch thi của lớp. Bạn có thể sao chép và dán trực tiếp vào nhóm lớp.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Room Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-2">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              Chi tiết lịch theo phòng thi
            </h3>
            <span className="text-sm text-slate-500 font-medium">
              {roomDetails.length} lịch thi
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">STT</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Ngày / Giờ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Phòng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Môn thi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Hình thức</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Số lượng SV</th>
                </tr>
              </thead>
              <tbody>
                {roomDetails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  roomDetails.map((item, index) => (
                    <tr key={index} className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{item.date}</span>
                          <span className="text-slate-500 font-normal">{item.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600">{item.room}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                        <div className="flex flex-col">
                          <span>{item.subjectName}</span>
                          <span className="text-slate-400 text-xs">{item.subjectCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.format || 'Thi'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{item.students}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu lớp.</p>
        </div>
      )}
    </div>
  );
}
