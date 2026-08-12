import React, { useMemo, useState } from 'react';
import { ExamRecord } from '../types';
import { Users, Download, Search } from 'lucide-react';

interface ClassMembersProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
}

export default function ClassMembers({ records, selectedClass, onClassChange }: ClassMembersProps) {
  const [search, setSearch] = useState('');

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

  const uniqueStudents = useMemo(() => {
    const classRecords = records.filter(r => r.MaLop === selectedClass);
    const studentsMap = new Map<string, any>();
    
    classRecords.forEach(r => {
      if (r.MaSV && !studentsMap.has(r.MaSV)) {
        studentsMap.set(r.MaSV, {
          MaSV: r.MaSV,
          HoLotSV: r.HoLotSV,
          TenSV: r.TenSV,
          PHAI: r.PHAI,
          NgaySinhC: r.NgaySinhC
        });
      }
    });

    const students = Array.from(studentsMap.values()).sort((a, b) => {
      // Sort by Name, then HoLot
      const nameCompare = (a.TenSV || '').localeCompare(b.TenSV || '');
      if (nameCompare !== 0) return nameCompare;
      return (a.HoLotSV || '').localeCompare(b.HoLotSV || '');
    });

    return students;
  }, [records, selectedClass]);

  const filteredStudents = useMemo(() => {
    const normalizeString = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
    };
    
    const searchStr = normalizeString(search);
    if (!searchStr) return uniqueStudents;

    return uniqueStudents.filter(s => {
      const id = normalizeString(s.MaSV || '');
      const name = normalizeString(`${s.HoLotSV || ''} ${s.TenSV || ''}`.replace(/\s+/g, ' '));
      return id.includes(searchStr) || name.includes(searchStr);
    });
  }, [uniqueStudents, search]);

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['STT', 'Mã SV', 'Họ lót', 'Tên', 'Giới tính', 'Ngày sinh'].join(',');
    const rows = filteredStudents.map((s, index) => 
      [index + 1, s.MaSV, s.HoLotSV, s.TenSV, s.PHAI, s.NgaySinhC]
        .map(val => `"${val || ''}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSachSInhVien_${selectedClass}.csv`;
    link.click();
  };

  if (records.length === 0) {
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
          <h2 className="text-xl font-bold text-slate-800">Danh Sách Thành Viên</h2>
          <p className="text-sm text-slate-500">Xem và tìm kiếm sinh viên trong lớp</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm sinh viên..."
              className="bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm min-w-[150px] w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Lớp:</span>
            <select
              className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            Sĩ số: <span className="font-bold">{uniqueStudents.length}</span>
            {search && <span className="text-slate-400 ml-2">(Tìm thấy {filteredStudents.length})</span>}
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất DS
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Mã SV</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Họ lót</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Tên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Phái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Ngày sinh</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy sinh viên nào.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.MaSV} className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 font-medium">{student.MaSV}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{student.HoLotSV}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{student.TenSV}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.PHAI}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.NgaySinhC}</td>
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
