import React, { useMemo, useState, useEffect } from 'react';
import { ExamRecord, LoginUser } from '../types';
import { Users, Download, Search, Plus, Calendar, Edit3, Trash2, Phone, Mail, FileText, Crown, X, Check, UserCheck, Eye, Filter, ArrowRight } from 'lucide-react';

interface ClassMembersProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  currentUser?: LoginUser | null;
  loginUsers?: LoginUser[];
  onSelectStudentSchedule?: (studentId: string) => void;
}

interface StudentExtraInfo {
  role?: string;
  phone?: string;
  email?: string;
  note?: string;
}

export default function ClassMembers({ 
  records, 
  selectedClass, 
  onClassChange,
  currentUser,
  loginUsers = [],
  onSelectStudentSchedule
}: ClassMembersProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'NAM' | 'NU'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'HAS_ROLE' | 'HAS_NOTE'>('ALL');
  
  // Selected student for detail/schedule viewing
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Edit / Add student modals
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Form states for add/edit
  const [formData, setFormData] = useState({
    MaSV: '',
    HoLotSV: '',
    TenSV: '',
    PHAI: 'Nam',
    NgaySinhC: '',
    role: 'Sinh viên',
    phone: '',
    email: '',
    note: ''
  });

  // Local storage persistence for student notes/contacts & custom added students
  const [extraInfoMap, setExtraInfoMap] = useState<Record<string, StudentExtraInfo>>(() => {
    try {
      const saved = localStorage.getItem(`class_member_notes_${selectedClass}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [customStudents, setCustomStudents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`custom_class_students_${selectedClass}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Reload local storage when selectedClass changes
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`class_member_notes_${selectedClass}`);
      setExtraInfoMap(savedNotes ? JSON.parse(savedNotes) : {});

      const savedCustom = localStorage.getItem(`custom_class_students_${selectedClass}`);
      setCustomStudents(savedCustom ? JSON.parse(savedCustom) : []);
    } catch (e) {
      setExtraInfoMap({});
      setCustomStudents([]);
    }
  }, [selectedClass]);

  // Available classes in dataset
  const classes = useMemo(() => {
    const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [records]);

  // Set default class if current selected is invalid or not set
  useEffect(() => {
    const userClass = currentUser?.lop;
    if (userClass && classes.includes(userClass) && (!selectedClass || !classes.includes(selectedClass))) {
      onClassChange(userClass);
    } else if (classes.length > 0 && (!selectedClass || !classes.includes(selectedClass))) {
      onClassChange(classes[0]);
    }
  }, [classes, selectedClass, currentUser, onClassChange]);

  // Class monitor for the current selected class
  const classMonitor = useMemo(() => {
    return loginUsers.find(u => u.lop === selectedClass && u.role === 'lop_truong') || null;
  }, [loginUsers, selectedClass]);

  const userOwnClass = currentUser?.lop;
  const isMyClass = userOwnClass && userOwnClass === selectedClass;

  // Map of student exam subjects
  const studentExamsMap = useMemo(() => {
    const map = new Map<string, ExamRecord[]>();
    records.forEach(r => {
      if (r.MaSV) {
        const list = map.get(r.MaSV) || [];
        list.push(r);
        map.set(r.MaSV, list);
      }
    });
    return map;
  }, [records]);

  // List of unique students in current class
  const classStudents = useMemo(() => {
    const classRecords = records.filter(r => r.MaLop === selectedClass);
    const studentsMap = new Map<string, any>();
    
    // Process records
    classRecords.forEach(r => {
      if (r.MaSV && !studentsMap.has(r.MaSV)) {
        studentsMap.set(r.MaSV, {
          MaSV: r.MaSV,
          HoLotSV: r.HoLotSV || '',
          TenSV: r.TenSV || '',
          PHAI: r.PHAI || '',
          NgaySinhC: r.NgaySinhC || '',
          MaLop: r.MaLop,
          isCustom: false
        });
      }
    });

    // Merge custom added students for this class
    customStudents.forEach(cs => {
      if (cs.MaSV && !studentsMap.has(cs.MaSV)) {
        studentsMap.set(cs.MaSV, {
          ...cs,
          MaLop: selectedClass,
          isCustom: true
        });
      }
    });

    // Merge extra info (role, phone, email, notes)
    const students = Array.from(studentsMap.values()).map(s => {
      const extra = extraInfoMap[s.MaSV] || {};
      const exams = studentExamsMap.get(s.MaSV) || [];
      return {
        ...s,
        role: extra.role || (classMonitor?.username?.toLowerCase() === s.MaSV?.toLowerCase() ? 'Lớp trưởng' : 'Sinh viên'),
        phone: extra.phone || '',
        email: extra.email || '',
        note: extra.note || '',
        examCount: exams.length,
        exams: exams
      };
    });

    // Sort by Name, then HoLot
    return students.sort((a, b) => {
      const nameCompare = (a.TenSV || '').localeCompare(b.TenSV || '', 'vi');
      if (nameCompare !== 0) return nameCompare;
      return (a.HoLotSV || '').localeCompare(b.HoLotSV || '', 'vi');
    });
  }, [records, selectedClass, customStudents, extraInfoMap, studentExamsMap, classMonitor]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    const normalizeString = (str: string) => {
      return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
    };
    
    const searchStr = normalizeString(search);

    return classStudents.filter(s => {
      // Gender filter
      if (genderFilter === 'NAM') {
        const phai = (s.PHAI || '').toLowerCase();
        if (phai !== 'nam' && phai !== '1') return false;
      } else if (genderFilter === 'NU') {
        const phai = (s.PHAI || '').toLowerCase();
        if (phai !== 'nữ' && phai !== 'nu' && phai !== '0') return false;
      }

      // Role filter
      if (roleFilter === 'HAS_ROLE' && s.role === 'Sinh viên') return false;
      if (roleFilter === 'HAS_NOTE' && !s.note) return false;

      // Text search
      if (!searchStr) return true;
      const id = normalizeString(s.MaSV);
      const name = normalizeString(`${s.HoLotSV} ${s.TenSV}`);
      const role = normalizeString(s.role);
      const phone = normalizeString(s.phone);
      const note = normalizeString(s.note);

      return id.includes(searchStr) || name.includes(searchStr) || role.includes(searchStr) || phone.includes(searchStr) || note.includes(searchStr);
    });
  }, [classStudents, search, genderFilter, roleFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = classStudents.length;
    let maleCount = 0;
    let femaleCount = 0;
    let totalExams = 0;

    classStudents.forEach(s => {
      const p = (s.PHAI || '').toLowerCase();
      if (p === 'nữ' || p === 'nu' || p === '0') femaleCount++;
      else maleCount++;
      totalExams += s.examCount;
    });

    const avgExams = total > 0 ? (totalExams / total).toFixed(1) : '0';

    return { total, maleCount, femaleCount, totalExams, avgExams };
  }, [classStudents]);

  // Handle saving note/contact edit
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const mssv = editingStudent.MaSV;
    const updatedMap = {
      ...extraInfoMap,
      [mssv]: {
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        note: formData.note
      }
    };

    setExtraInfoMap(updatedMap);
    localStorage.setItem(`class_member_notes_${selectedClass}`, JSON.stringify(updatedMap));

    // If it's a custom added student, update basic info too
    if (editingStudent.isCustom) {
      const updatedCustom = customStudents.map(c => {
        if (c.MaSV === mssv) {
          return {
            ...c,
            HoLotSV: formData.HoLotSV,
            TenSV: formData.TenSV,
            PHAI: formData.PHAI,
            NgaySinhC: formData.NgaySinhC
          };
        }
        return c;
      });
      setCustomStudents(updatedCustom);
      localStorage.setItem(`custom_class_students_${selectedClass}`, JSON.stringify(updatedCustom));
    }

    setEditingStudent(null);
  };

  // Handle adding new student
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.MaSV.trim() || !formData.TenSV.trim()) return;

    const newStudent = {
      MaSV: formData.MaSV.trim(),
      HoLotSV: formData.HoLotSV.trim(),
      TenSV: formData.TenSV.trim(),
      PHAI: formData.PHAI,
      NgaySinhC: formData.NgaySinhC.trim(),
      MaLop: selectedClass,
      isCustom: true
    };

    const updatedCustom = [...customStudents, newStudent];
    setCustomStudents(updatedCustom);
    localStorage.setItem(`custom_class_students_${selectedClass}`, JSON.stringify(updatedCustom));

    if (formData.role || formData.phone || formData.email || formData.note) {
      const updatedMap = {
        ...extraInfoMap,
        [newStudent.MaSV]: {
          role: formData.role || 'Sinh viên',
          phone: formData.phone,
          email: formData.email,
          note: formData.note
        }
      };
      setExtraInfoMap(updatedMap);
      localStorage.setItem(`class_member_notes_${selectedClass}`, JSON.stringify(updatedMap));
    }

    setIsAddingStudent(false);
    setFormData({
      MaSV: '',
      HoLotSV: '',
      TenSV: '',
      PHAI: 'Nam',
      NgaySinhC: '',
      role: 'Sinh viên',
      phone: '',
      email: '',
      note: ''
    });
  };

  // Delete custom student
  const handleDeleteCustomStudent = (mssv: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sinh viên ${mssv} khỏi danh sách?`)) return;
    const updatedCustom = customStudents.filter(c => c.MaSV !== mssv);
    setCustomStudents(updatedCustom);
    localStorage.setItem(`custom_class_students_${selectedClass}`, JSON.stringify(updatedCustom));

    const updatedNotes = { ...extraInfoMap };
    delete updatedNotes[mssv];
    setExtraInfoMap(updatedNotes);
    localStorage.setItem(`class_member_notes_${selectedClass}`, JSON.stringify(updatedNotes));
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['STT', 'Mã SV', 'Họ lót', 'Tên', 'Giới tính', 'Ngày sinh', 'Chức vụ', 'SĐT', 'Email', 'Ghi chú', 'Số môn thi'].join(',');
    const rows = filteredStudents.map((s, index) => 
      [
        index + 1, 
        s.MaSV, 
        s.HoLotSV, 
        s.TenSV, 
        s.PHAI, 
        s.NgaySinhC, 
        s.role || 'Sinh viên',
        s.phone || '',
        s.email || '',
        s.note || '',
        s.examCount
      ].map(val => `"${val || ''}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSach_ThanhVien_Lop_${selectedClass}.csv`;
    link.click();
  };

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu lịch thi trước.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto min-h-0 bg-slate-50">
      {/* Header Banner & Class Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Danh Sách Thành Viên Lớp <span className="text-blue-600">{selectedClass}</span>
            </h2>
            {isMyClass && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Lớp của bạn
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Quản lý sĩ số, lịch thi và thông tin liên lạc thành viên</span>
            {classMonitor && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  LT: {classMonitor.fullName || classMonitor.username}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {userOwnClass && userOwnClass !== selectedClass && (
            <button
              onClick={() => onClassChange(userOwnClass)}
              className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-sm whitespace-nowrap"
            >
              Về Lớp Của Tôi ({userOwnClass})
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm min-w-[180px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp:</span>
            <select
              className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full cursor-pointer"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
            >
              {classes.map(c => (
                <option key={c} value={c}>
                  {c} {userOwnClass === c ? '(Lớp tôi)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-600" /> Xuất Danh Sách
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sĩ Số Lớp</p>
            <p className="text-2xl font-black text-slate-800">{stats.total} <span className="text-xs font-normal text-slate-500">Sinh viên</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Giới Tính</p>
            <p className="text-sm font-bold text-slate-800">
              <span className="text-blue-600">{stats.maleCount} Nam</span> / <span className="text-rose-500">{stats.femaleCount} Nữ</span>
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{ width: `${stats.total > 0 ? (stats.maleCount / stats.total) * 100 : 0}%` }}></div>
              <div className="bg-rose-400 h-full" style={{ width: `${stats.total > 0 ? (stats.femaleCount / stats.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đăng Ký Thi</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalExams} <span className="text-xs font-normal text-slate-500">Lượt thi</span></p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bình Quân Môn Thi</p>
            <p className="text-2xl font-black text-slate-800">{stats.avgExams} <span className="text-xs font-normal text-slate-500">Môn / SV</span></p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-1 min-h-[400px]">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, SĐT, Ghi chú..."
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-800 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Gender Filter Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-bold">
              <button
                onClick={() => setGenderFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${genderFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setGenderFilter('NAM')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${genderFilter === 'NAM' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Nam
              </button>
              <button
                onClick={() => setGenderFilter('NU')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${genderFilter === 'NU' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Nữ
              </button>
            </div>

            {/* Role Filter Selector */}
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-sm cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="HAS_ROLE">Có chức vụ trong lớp</option>
              <option value="HAS_NOTE">Có ghi chú</option>
            </select>

            {/* Add New Student Button */}
            <button
              onClick={() => {
                setFormData({
                  MaSV: '',
                  HoLotSV: '',
                  TenSV: '',
                  PHAI: 'Nam',
                  NgaySinhC: '',
                  role: 'Sinh viên',
                  phone: '',
                  email: '',
                  note: ''
                });
                setIsAddingStudent(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" /> Thêm Thành Viên
            </button>
          </div>
        </div>

        {/* Member Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 w-12 text-center">STT</th>
                <th className="px-4 sm:px-6 py-3.5">Mã SV</th>
                <th className="px-4 sm:px-6 py-3.5">Họ và Tên</th>
                <th className="px-4 sm:px-6 py-3.5 text-center">Phái</th>
                <th className="px-4 sm:px-6 py-3.5">Ngày sinh</th>
                <th className="px-4 sm:px-6 py-3.5 text-center">Số môn thi</th>
                <th className="px-4 sm:px-6 py-3.5">Chức vụ / Ghi chú</th>
                <th className="px-4 sm:px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const isFemale = (student.PHAI || '').toLowerCase().includes('nữ') || (student.PHAI || '').toLowerCase().includes('nu');
                  const hasRole = student.role && student.role !== 'Sinh viên';

                  return (
                    <tr key={student.MaSV} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 text-center text-slate-400 font-medium text-xs">{index + 1}</td>
                      <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => setSelectedStudentDetail(student)}
                          className="hover:underline flex items-center gap-1 text-left"
                        >
                          {student.MaSV}
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{student.HoLotSV} <span className="font-extrabold text-slate-900">{student.TenSV}</span></span>
                          {student.isCustom && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">Bổ sung</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isFemale 
                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {student.PHAI || 'Nam'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-slate-600 text-xs font-medium">{student.NgaySinhC || '—'}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedStudentDetail(student)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-slate-200"
                        >
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {student.examCount} môn
                        </button>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="flex flex-col gap-1">
                          {hasRole ? (
                            <span className="inline-flex items-center gap-1 font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md w-fit">
                              <Crown className="w-3 h-3 text-amber-600" />
                              {student.role}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Sinh viên</span>
                          )}

                          {student.phone && (
                            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {student.phone}
                            </span>
                          )}

                          {student.note && (
                            <span className="text-xs italic text-slate-500 line-clamp-1" title={student.note}>
                              "{student.note}"
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentDetail(student)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem lịch thi & chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setFormData({
                                MaSV: student.MaSV,
                                HoLotSV: student.HoLotSV,
                                TenSV: student.TenSV,
                                PHAI: student.PHAI || 'Nam',
                                NgaySinhC: student.NgaySinhC || '',
                                role: student.role || 'Sinh viên',
                                phone: student.phone || '',
                                email: student.email || '',
                                note: student.note || ''
                              });
                              setEditingStudent(student);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Chỉnh sửa ghi chú & thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {student.isCustom && (
                            <button
                              onClick={() => handleDeleteCustomStudent(student.MaSV)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa khỏi danh sách"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Student Detail & Exam Schedule */}
      {selectedStudentDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudentDetail(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                  {selectedStudentDetail.TenSV ? selectedStudentDetail.TenSV.charAt(0) : 'S'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    {selectedStudentDetail.HoLotSV} {selectedStudentDetail.TenSV}
                    <span className="text-xs font-mono font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {selectedStudentDetail.MaSV}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Lớp {selectedStudentDetail.MaLop}</p>
                </div>
              </div>

              <button onClick={() => setSelectedStudentDetail(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 min-h-0">
              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Giới tính:</span>
                  <span className="font-bold text-slate-800">{selectedStudentDetail.PHAI || 'Nam'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Ngày sinh:</span>
                  <span className="font-bold text-slate-800">{selectedStudentDetail.NgaySinhC || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Chức vụ:</span>
                  <span className="font-bold text-amber-700">{selectedStudentDetail.role || 'Sinh viên'}</span>
                </div>
                {selectedStudentDetail.phone && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">SĐT:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedStudentDetail.phone}</span>
                  </div>
                )}
                {selectedStudentDetail.email && (
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">Email:</span>
                    <span className="font-bold text-slate-800">{selectedStudentDetail.email}</span>
                  </div>
                )}
                {selectedStudentDetail.note && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">Ghi chú:</span>
                    <span className="text-slate-700 italic">"{selectedStudentDetail.note}"</span>
                  </div>
                )}
              </div>

              {/* Exam Schedule Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Lịch Thi Đã Đăng Ký ({selectedStudentDetail.exams.length} môn)
                  </h4>
                </div>

                {selectedStudentDetail.exams.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-4 text-center border border-dashed rounded-xl">Không có lịch thi nào được tìm thấy cho sinh viên này.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-3 py-2.5">Ngày thi</th>
                          <th className="px-3 py-2.5">Giờ thi</th>
                          <th className="px-3 py-2.5">Tên môn học</th>
                          <th className="px-3 py-2.5 text-center">Phòng</th>
                          <th className="px-3 py-2.5 text-center">Tổ/Nhóm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedStudentDetail.exams.map((ex: ExamRecord, idx: number) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="px-3 py-2.5 font-bold text-slate-700">{ex.NgayThi}</td>
                            <td className="px-3 py-2.5 text-blue-600 font-medium">{ex.GioThi}</td>
                            <td className="px-3 py-2.5 font-bold text-slate-800">
                              {ex.TenMH} <span className="text-[10px] text-slate-400 font-mono">({ex.MaMH})</span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{ex.MAPTHI || '—'}</td>
                            <td className="px-3 py-2.5 text-center text-slate-500">{ex['To thi'] || ex.NhomThi || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              {onSelectStudentSchedule ? (
                <button
                  onClick={() => {
                    const id = selectedStudentDetail.MaSV;
                    setSelectedStudentDetail(null);
                    onSelectStudentSchedule(id);
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-blue-200"
                >
                  Mở Lịch Thi Cá Nhân <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add or Edit Student */}
      {(isAddingStudent || editingStudent) && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddingStudent(false);
              setEditingStudent(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                {isAddingStudent ? `Thêm Thành Viên Vào Lớp ${selectedClass}` : `Cập Nhật Thông Tin (${editingStudent?.MaSV})`}
              </h3>
              <button 
                onClick={() => {
                  setIsAddingStudent(false);
                  setEditingStudent(null);
                }} 
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddingStudent ? handleAddStudentSubmit : handleSaveStudentEdit} className="p-6 flex flex-col gap-4 text-xs font-medium">
              {/* MSSV */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Mã Sinh Viên (MSSV) *</label>
                <input
                  type="text"
                  disabled={!!editingStudent && !editingStudent.isCustom}
                  required
                  value={formData.MaSV}
                  onChange={(e) => setFormData({ ...formData, MaSV: e.target.value })}
                  placeholder="Ví dụ: 21110001"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800 disabled:opacity-60"
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Họ và Tên Lót</label>
                  <input
                    type="text"
                    value={formData.HoLotSV}
                    onChange={(e) => setFormData({ ...formData, HoLotSV: e.target.value })}
                    placeholder="Nguyễn Văn"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.TenSV}
                    onChange={(e) => setFormData({ ...formData, TenSV: e.target.value })}
                    placeholder="An"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Gender & DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phái</label>
                  <select
                    value={formData.PHAI}
                    onChange={(e) => setFormData({ ...formData, PHAI: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Ngày Sinh</label>
                  <input
                    type="text"
                    value={formData.NgaySinhC}
                    onChange={(e) => setFormData({ ...formData, NgaySinhC: e.target.value })}
                    placeholder="01/01/2003"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Role & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Chức Vụ Trách Nhiệm</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-amber-700 cursor-pointer"
                  >
                    <option value="Sinh viên">Sinh viên</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó">Lớp phó</option>
                    <option value="Bí thư">Bí thư</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Khác">Chức vụ khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú cá nhân, hỗ trợ thi cử, đặc biệt..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStudent(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
