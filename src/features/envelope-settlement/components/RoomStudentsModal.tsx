import React, { useState, useMemo } from 'react';
import { X, Search, Users, MapPin, Calendar, Clock, BookOpen, GraduationCap, Copy, Check } from 'lucide-react';
import { ExamRecord, ExamSession } from '../../../types';

interface RoomStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession | null;
  records?: ExamRecord[];
  userClass?: string;
  initialClassFilter?: string;
}

export default function RoomStudentsModal({
  isOpen,
  onClose,
  session,
  records = [],
  userClass = '',
  initialClassFilter = 'ALL',
}: RoomStudentsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(initialClassFilter);
  const [copiedMssv, setCopiedMssv] = useState(false);

  // Sync initialClassFilter when modal opens or session changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedClass(initialClassFilter || 'ALL');
      setSearchQuery('');
      setCopiedMssv(false);
    }
  }, [isOpen, session, initialClassFilter]);

  // Extract all students for this room/session
  const roomRecords = useMemo(() => {
    if (!session) return [];
    if (session.records && session.records.length > 0) {
      return session.records;
    }
    if (records && records.length > 0) {
      return records.filter(
        (r) =>
          (r.MAPTHI === session.room || r.MAPTHI === (session as any).MAPTHI) &&
          (r.NgayThi === session.date || r.NgayThi === (session as any).NgayThi) &&
          (r.GioThi === session.time || r.GioThi === (session as any).GioThi) &&
          (r.TenMH === session.subject || r.TenMH === (session as any).TenMH)
      );
    }
    return [];
  }, [session, records]);

  // Class breakdown counts
  const classBreakdown = useMemo(() => {
    const countsMap = new Map<string, number>();
    roomRecords.forEach((r) => {
      const cls = r.MaLop || 'Khác';
      countsMap.set(cls, (countsMap.get(cls) || 0) + 1);
    });
    return Array.from(countsMap.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count || a.className.localeCompare(b.className));
  }, [roomRecords]);

  // Filtered & sorted student list
  const filteredStudents = useMemo(() => {
    let result = roomRecords;

    if (selectedClass && selectedClass !== 'ALL') {
      const cleanCls = selectedClass.trim().toUpperCase();
      result = result.filter((r) => (r.MaLop || '').trim().toUpperCase() === cleanCls);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const mssv = (r.MaSV || '').toLowerCase();
        const fullName = `${r.HoLotSV || r.HoDem || ''} ${r.TenSV || r.Ten || ''}`.toLowerCase();
        const lop = (r.MaLop || '').toLowerCase();
        return mssv.includes(q) || fullName.includes(q) || lop.includes(q);
      });
    }

    return [...result].sort((a, b) => {
      const nameA = (a.TenSV || a.Ten || '').toLowerCase();
      const nameB = (b.TenSV || b.Ten || '').toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB, 'vi');
      const hoA = (a.HoLotSV || a.HoDem || '').toLowerCase();
      const hoB = (b.HoLotSV || b.HoDem || '').toLowerCase();
      return hoA.localeCompare(hoB, 'vi');
    });
  }, [roomRecords, selectedClass, searchQuery]);

  const handleCopyAllMssv = () => {
    if (filteredStudents.length === 0) return;
    const mssvList = filteredStudents.map((s) => s.MaSV).filter(Boolean).join('\n');
    navigator.clipboard.writeText(mssvList).then(() => {
      setCopiedMssv(true);
      setTimeout(() => setCopiedMssv(false), 2000);
    });
  };

  if (!isOpen || !session) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">
                  Danh Sách Sinh Viên Trong Phòng
                </h3>
                <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                  Phòng {session.room}
                </span>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                  {roomRecords.length} SV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px] sm:max-w-xl">
                {session.subject} {session.subjectCode ? `(${session.subjectCode})` : ''} • {session.date} lúc {session.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info Banner */}
        <div className="px-5 py-3 bg-blue-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-medium" title={session.subject}>
              Môn: <strong className="text-slate-900 font-bold">{session.subject}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Ngày: <strong className="text-slate-900 font-bold">{session.date}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Giờ: <strong className="text-slate-900 font-bold">{session.time}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Phòng: <strong className="text-rose-700 font-bold">{session.room}</strong>
              {session.examFormat && (
                <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                  {session.examFormat}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Class Filters, Copy */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0 bg-white">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo MSSV, Họ và tên, Lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-700 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyAllMssv}
                disabled={filteredStudents.length === 0}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                title="Sao chép danh sách MSSV đang hiển thị"
              >
                {copiedMssv ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã chép MSSV!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chép {filteredStudents.length} MSSV</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Class Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lớp:</span>
            <button
              type="button"
              onClick={() => setSelectedClass('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                selectedClass === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Tất cả ({roomRecords.length})
            </button>
            {classBreakdown.map((c) => {
              const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
              const isSelected = selectedClass.trim().toUpperCase() === c.className.trim().toUpperCase();
              return (
                <button
                  key={c.className}
                  type="button"
                  onClick={() => setSelectedClass(isSelected ? 'ALL' : c.className)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : isMyClass
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span>{c.className}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-extrabold ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {c.count}
                  </span>
                  {isMyClass && !isSelected && (
                    <span className="text-[9px] bg-blue-200 text-blue-900 px-1 py-0.2 rounded font-semibold">
                      Lớp bạn
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Không tìm thấy sinh viên nào</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc bỏ lọc lớp' : 'Phòng thi này chưa có dữ liệu sinh viên'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">STT</th>
                    <th className="px-4 py-3 w-32">Mã SV</th>
                    <th className="px-4 py-3 min-w-[180px]">Họ và Tên</th>
                    <th className="px-3 py-3 w-20 text-center">Phái</th>
                    <th className="px-3 py-3 w-28">Ngày sinh</th>
                    <th className="px-4 py-3 w-32">Lớp</th>
                    <th className="px-3 py-3 w-24 text-center">Tổ thi</th>
                    <th className="px-3 py-3 w-28 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredStudents.map((student, idx) => {
                    const fullName = `${student.HoLotSV || student.HoDem || ''} ${student.TenSV || student.Ten || ''}`.trim();
                    const isMyClass =
                      userClass && (student.MaLop || '').trim().toUpperCase() === userClass.trim().toUpperCase();

                    return (
                      <tr
                        key={student.id || `${student.MaSV}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMyClass ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{student.MaSV}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          <span>{fullName || student.MaSV}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-500">
                          {student.PHAI || (student as any).Phai || '-'}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">
                          {student.NgaySinhC || (student as any).NgaySinh || '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] border ${
                              isMyClass
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {student.MaLop || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                          {student['To thi'] || student.ToThi || student.NhomThi || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {student.isPostponed ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                              Hoãn thi
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Dự thi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Đang hiển thị <strong>{filteredStudents.length}</strong> / <strong>{roomRecords.length}</strong> sinh viên
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
