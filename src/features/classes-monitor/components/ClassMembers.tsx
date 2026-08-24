import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ExamRecord, LoginUser } from '../types/class.types';
import {
  Users,
  Download,
  Search,
  Plus,
  Calendar,
  Edit3,
  Phone,
  Crown,
  X,
  UserCheck,
  Eye,
  UserPlus,
  UserMinus,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
  PauseCircle,
  XCircle,
  HelpCircle,
  Check,
  Layers,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import AdminResetPasswordModal from '../../auth/components/AdminResetPasswordModal';

interface ClassMembersProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
  currentUser?: LoginUser | null;
  loginUsers?: LoginUser[];
  onSelectStudentSchedule?: (studentId: string) => void;
  hasExamSchedule?: boolean;
  onImpersonate?: (username: string) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  onReloadMonitors?: () => void;
}

interface StudentExtraInfo {
  phone?: string;
  note?: string;
}

export default function ClassMembers({
  records,
  selectedClass,
  onClassChange,
  currentUser,
  loginUsers = [],
  onSelectStudentSchedule,
  hasExamSchedule = false,
  onImpersonate,
  onTogglePostpone,
  onReloadMonitors,
}: ClassMembersProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'NAM' | 'NU'>('ALL');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'EXCLUDED'>('ACTIVE');

  // Selected student for detail/schedule viewing
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // Assign / Transfer Monitor Modal State (Admin Only)
  const [isAssignMonitorModalOpen, setIsAssignMonitorModalOpen] = useState(false);
  const [selectedCandidateMaSV, setSelectedCandidateMaSV] = useState<string>('');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>('');
  const [assignReason, setAssignReason] = useState<string>('');
  const [isSubmittingMonitor, setIsSubmittingMonitor] = useState<boolean>(false);
  const [monitorModalError, setMonitorModalError] = useState<string>('');

  // Receive Transfer Student Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [searchGlobalQuery, setSearchGlobalQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [receiveReason, setReceiveReason] = useState('');
  const [selectedStudentToReceive, setSelectedStudentToReceive] = useState<any | null>(null);

  // Exclude / Transfer Status Modal
  const [studentToExclude, setStudentToExclude] = useState<any | null>(null);
  const [excludeType, setExcludeType] = useState<'BAO_LUU' | 'NGHI_HOC' | 'CHUYEN_LOP' | 'LOAI_BO'>('BAO_LUU');
  const [excludeTargetClass, setExcludeTargetClass] = useState('');
  const [excludeReason, setExcludeReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Notification message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states for note/phone editing
  const [formData, setFormData] = useState({
    phone: '',
    note: '',
  });

  // Database students & excluded students
  const [activeStudents, setActiveStudents] = useState<any[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [allSystemClasses, setAllSystemClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/exam-records?distinct=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.classes && Array.isArray(data.classes)) {
          setAllSystemClasses(data.classes);
        }
      })
      .catch(() => {});
  }, []);

  // Available classes in dataset
  const classes = useMemo(() => {
    const set = new Set<string>();
    allSystemClasses.forEach((c) => c && set.add(c));
    loginUsers.forEach((u) => u.lop && set.add(u.lop));
    records.forEach((r) => r.MaLop && set.add(r.MaLop));
    if (currentUser?.lop) set.add(currentUser.lop);
    if (selectedClass) set.add(selectedClass);
    return Array.from(set).filter(Boolean).sort();
  }, [allSystemClasses, loginUsers, records, currentUser?.lop, selectedClass]);

  // Load students from database API when selectedClass changes
  const fetchClassMembers = useCallback(async () => {
    if (!selectedClass) return;
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/class-members?classCode=${encodeURIComponent(selectedClass)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveStudents(data.students || []);
        setExcludedStudents(data.excludedStudents || []);
      }
    } catch (err) {
      console.error('Failed to fetch class members:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchClassMembers();
  }, [fetchClassMembers]);

  // Set default class only if current selected is empty
  useEffect(() => {
    if (!selectedClass) {
      const userClass = currentUser?.lop;
      if (userClass) {
        onClassChange(userClass);
      } else if (classes.length > 0) {
        onClassChange(classes[0]);
      }
    }
  }, [classes, selectedClass, currentUser, onClassChange]);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Class monitor for the current selected class
  const classMonitor = useMemo(() => {
    return (
      loginUsers.find(
        (u) =>
          u.lop === selectedClass &&
          (u.role === 'lop_truong' || (u.role && u.role.includes('lop_truong')) || u.isMonitor)
      ) || null
    );
  }, [loginUsers, selectedClass]);

  const userOwnClass = currentUser?.lop;
  const isMyClass = userOwnClass && userOwnClass === selectedClass;
  const canManageClass = isAdmin || (!!currentUser?.isMonitor && isMyClass);

  const candidateList = useMemo(() => {
    if (!candidateSearchQuery.trim()) return activeStudents;
    const q = candidateSearchQuery.trim().toLowerCase();
    return activeStudents.filter(
      (s) =>
        s.MaSV.toLowerCase().includes(q) ||
        `${s.HoLotSV} ${s.TenSV}`.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [activeStudents, candidateSearchQuery]);

  // Admin Reset Password Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordStudent, setResetPasswordStudent] = useState({ username: '', fullName: '', lop: '' });

  const openAssignMonitorModal = (preselectedMaSV?: string | null) => {
    setSelectedCandidateMaSV(preselectedMaSV || '');
    setCandidateSearchQuery('');
    setAssignReason('');
    setMonitorModalError('');
    setIsAssignMonitorModalOpen(true);
  };

  const handleAssignMonitor = async (action: 'ASSIGN' | 'TRANSFER' | 'REMOVE') => {
    if ((action === 'ASSIGN' || action === 'TRANSFER') && !selectedCandidateMaSV) {
      setMonitorModalError('Vui lòng chọn một sinh viên để chỉ định làm Lớp trưởng.');
      return;
    }

    setIsSubmittingMonitor(true);
    setMonitorModalError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/class-monitors', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action,
          classCode: selectedClass,
          newMonitorMaSV: selectedCandidateMaSV,
          fromMaSV: classMonitor?.username,
          reason: assignReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Cập nhật Lớp trưởng thành công!');
        setIsAssignMonitorModalOpen(false);
        if (onReloadMonitors) {
          onReloadMonitors();
        }
      } else {
        setMonitorModalError(data.error || 'Có lỗi xảy ra khi cập nhật Lớp trưởng.');
      }
    } catch (err: any) {
      setMonitorModalError('Lỗi kết nối máy chủ khi cập nhật Lớp trưởng.');
    } finally {
      setIsSubmittingMonitor(false);
    }
  };

  // Search Global Student database
  useEffect(() => {
    if (!searchGlobalQuery.trim() || searchGlobalQuery.trim().length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(searchGlobalQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setGlobalSearchResults(data.students || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchGlobalQuery]);

  // Filtered active & excluded lists
  const currentList = activeTab === 'ACTIVE' ? activeStudents : excludedStudents;

  const filteredStudents = useMemo(() => {
    const normalizeString = (str: string) => {
      return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
    };

    const searchStr = normalizeString(search);

    return currentList.filter((s) => {
      // Gender filter
      if (genderFilter === 'NAM') {
        const phai = (s.PHAI || '').toLowerCase();
        if (phai !== 'nam' && phai !== '1') return false;
      } else if (genderFilter === 'NU') {
        const phai = (s.PHAI || '').toLowerCase();
        if (phai !== 'nữ' && phai !== 'nu' && phai !== '0') return false;
      }

      // Text search
      if (!searchStr) return true;
      const id = normalizeString(s.MaSV);
      const name = normalizeString(`${s.HoLotSV} ${s.TenSV}`);
      const phone = normalizeString(s.phone);
      const note = normalizeString(s.note);

      return (
        id.includes(searchStr) ||
        name.includes(searchStr) ||
        phone.includes(searchStr) ||
        note.includes(searchStr)
      );
    });
  }, [currentList, search, genderFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = activeStudents.length;
    let maleCount = 0;
    let femaleCount = 0;
    let totalExams = 0;

    activeStudents.forEach((s) => {
      const p = (s.PHAI || '').toLowerCase();
      if (p === 'nữ' || p === 'nu' || p === '0') femaleCount++;
      else maleCount++;
      totalExams += s.examCount || 0;
    });

    const avgExams = total > 0 ? (totalExams / total).toFixed(1) : '0';

    return { total, maleCount, femaleCount, totalExams, avgExams };
  }, [activeStudents]);

  // Handle Receive Student
  const handleConfirmReceiveStudent = async (student: any) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECEIVE',
          maSV: student.maSV || student.MaSV,
          targetClass: selectedClass,
          currentClass: student.maLop || student.MaLop,
          reason: receiveReason,
          studentInfo: student,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã tiếp nhận sinh viên thành công!');
        setIsReceiveModalOpen(false);
        setSearchGlobalQuery('');
        setReceiveReason('');
        setSelectedStudentToReceive(null);
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi tiếp nhận sinh viên', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Exclude / Status Change
  const handleConfirmExclude = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToExclude) return;

    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXCLUDE',
          maSV: studentToExclude.MaSV,
          currentClass: selectedClass,
          type: excludeType,
          targetClass: excludeType === 'CHUYEN_LOP' ? excludeTargetClass : undefined,
          reason: excludeReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã cập nhật trạng thái sinh viên thành công!');
        setStudentToExclude(null);
        setExcludeReason('');
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi xử lý', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Restore Student
  const handleRestoreStudent = async (student: any) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn khôi phục sinh viên ${student.MaSV} (${student.HoTen}) quay lại danh sách lớp ${selectedClass}?`
      )
    )
      return;

    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/class-members/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESTORE',
          maSV: student.MaSV,
          targetClass: selectedClass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Đã khôi phục sinh viên thành công!');
        fetchClassMembers();
      } else {
        showToast(data.error || 'Lỗi khi khôi phục', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Save Note / Phone Edit
  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch('/api/class-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaSV: editingStudent.MaSV,
          MaLop: selectedClass,
          phone: formData.phone,
          note: formData.note,
        }),
      });

      if (res.ok) {
        showToast('Đã lưu thông tin liên hệ thành công!');
        setEditingStudent(null);
        fetchClassMembers();
      }
    } catch (err) {
      showToast('Không thể lưu thông tin', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = [
      'STT',
      'Mã SV',
      'Họ lót',
      'Tên',
      'Giới tính',
      'Ngày sinh',
      'SĐT',
      'Ghi chú',
      ...(hasExamSchedule ? ['Số môn thi'] : []),
    ].join(',');

    const rows = filteredStudents
      .map((s, index) =>
        [
          index + 1,
          s.MaSV,
          s.HoLotSV,
          s.TenSV,
          s.PHAI,
          s.NgaySinhC,
          s.phone || '',
          s.note || '',
          ...(hasExamSchedule ? [s.examCount || 0] : []),
        ]
          .map((val) => `"${val || ''}"`)
          .join(',')
      )
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSach_${activeTab === 'ACTIVE' ? 'ThanhVien' : 'BienDong'}_Lop_${selectedClass}.csv`;
    link.click();
  };

  return (
    <div className="p-3 sm:p-4 md:p-8 flex-1 flex flex-col gap-4 sm:gap-6 w-full max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200/50'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-200/50'
          }`}
        >
          {toastMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Notice when viewing another class */}
      {userOwnClass && userOwnClass !== selectedClass && (
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs shadow-blue-200">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <span>Đang xem danh sách lớp: <strong className="text-blue-700 font-mono text-sm">{selectedClass}</strong></span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  Lớp Khác
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Lớp chính của bạn: <strong className="text-slate-800 font-mono">{userOwnClass}</strong>. Bấm nút bên cạnh để quay về lớp của bạn bất cứ lúc nào.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClassChange(userOwnClass)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Về Lớp Của Tôi ({userOwnClass})</span>
          </button>
        </div>
      )}

      {/* Header Banner & Class Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
              Quản Lý Thành Viên Lớp <span className="text-blue-600">{selectedClass}</span>
            </h2>
            {isMyClass ? (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Lớp của bạn
              </span>
            ) : userOwnClass ? (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-600" /> Đang xem lớp khác
              </span>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {classMonitor ? (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  LT: {classMonitor.fullName || classMonitor.username}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openAssignMonitorModal(classMonitor.username)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-colors cursor-pointer border border-amber-300"
                    title="Chuyển lớp trưởng sang sinh viên khác trong lớp"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Đổi Lớp Trưởng
                  </button>
                )}
              </>
            ) : (
              isAdmin && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => openAssignMonitorModal(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                    title="Chỉ định Lớp trưởng cho lớp này"
                  >
                    <Crown className="w-3 h-3 text-amber-500" /> Chỉ Định Lớp Trưởng
                  </button>
                </>
              )
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {userOwnClass && userOwnClass !== selectedClass && (
            <button
              onClick={() => onClassChange(userOwnClass)}
              className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span>Về Lớp Của Tôi ({userOwnClass})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 shadow-2xs flex-1 sm:flex-initial min-w-[140px] sm:min-w-[170px]">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp:</span>
            <select
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 outline-none w-full cursor-pointer"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c} {userOwnClass === c ? '⭐ (Lớp của tôi)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Button Tiếp Nhận Sinh Viên - Chỉ hiện khi là Lớp Trưởng của lớp này hoặc Admin */}
          {canManageClass ? (
            <button
              onClick={() => {
                setIsReceiveModalOpen(true);
                setSearchGlobalQuery('');
                setGlobalSearchResults([]);
                setSelectedStudentToReceive(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
              title="Tiếp nhận sinh viên chuyển biên chế vào lớp này"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tiếp Nhận SV
            </button>
          ) : (
            <span
              className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 cursor-default"
              title={`Chỉ Lớp trưởng của lớp ${selectedClass} mới có quyền tiếp nhận và điều chuyển sinh viên`}
            >
              Chỉ xem
            </span>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> Xuất CSV
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className={`grid gap-2.5 sm:gap-4 shrink-0 ${hasExamSchedule ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Sĩ Số Đang Học</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800">
              {stats.total} <span className="text-[10px] sm:text-xs font-normal text-slate-500">SV</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <UserCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Giới Tính</p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              <span className="text-blue-600">{stats.maleCount} Nam</span> /{' '}
              <span className="text-rose-500">{stats.femaleCount} Nữ</span>
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${stats.total > 0 ? (stats.maleCount / stats.total) * 100 : 0}%` }}
              ></div>
              <div
                className="bg-rose-400 h-full"
                style={{ width: `${stats.total > 0 ? (stats.femaleCount / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {hasExamSchedule && (
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Đăng Ký Thi</p>
              <p className="text-lg sm:text-2xl font-black text-slate-800">
                {stats.totalExams} <span className="text-[10px] sm:text-xs font-normal text-slate-500">Lượt</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <UserMinus className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Biến Động</p>
            <p className="text-lg sm:text-2xl font-black text-rose-600">
              {excludedStudents.length}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-slate-500">Bảo lưu</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col shrink-0 sm:flex-1">
        {/* Navigation Tabs between Active Members & Excluded List */}
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-4 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Đang Theo Học ({activeStudents.length})
            </button>

            <button
              onClick={() => setActiveTab('EXCLUDED')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'EXCLUDED'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Bảo Lưu / Chuyển Đi ({excludedStudents.length})
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
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
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-xs font-bold">
              <button
                onClick={() => setGenderFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  genderFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setGenderFilter('NAM')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  genderFilter === 'NAM' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Nam
              </button>
              <button
                onClick={() => setGenderFilter('NU')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  genderFilter === 'NU' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Nữ
              </button>
            </div>
          </div>
        </div>

        {/* Member Table View (Desktop & Mobile) */}
        {isLoadingList ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-medium">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Đang tải danh sách thành viên lớp {selectedClass}...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            {activeTab === 'ACTIVE'
              ? 'Không tìm thấy thành viên nào phù hợp với bộ lọc.'
              : 'Không có sinh viên nào trong danh sách biến động/bảo lưu.'}
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* MOBILE VIEW: Mobile Student Cards                                         */}
            {/* ========================================================================= */}
            <div className="block md:hidden p-3.5 space-y-3">
              {filteredStudents.map((student, index) => {
                const isFemale =
                  (student.PHAI || '').toLowerCase().includes('nữ') ||
                  (student.PHAI || '').toLowerCase().includes('nu');

                return (
                  <div
                    key={student.MaSV}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-3 relative overflow-hidden active:scale-98"
                  >
                    {/* Header: Avatar, Big Name & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                            isFemale
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}
                        >
                          {student.TenSV ? student.TenSV.charAt(0) : student.HoLotSV ? student.HoLotSV.charAt(0) : 'S'}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Big Student Name */}
                          <h3 className="text-base font-black text-slate-900 leading-snug flex items-center gap-1.5 flex-wrap">
                            <span>
                              {student.HoLotSV} {student.TenSV}
                            </span>
                            {student.isMonitor && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                                <Crown className="w-3 h-3 text-amber-600 fill-amber-400" /> Lớp trưởng
                              </span>
                            )}
                            {student.isTransferred && (
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shrink-0">
                                <ArrowRightLeft className="w-3 h-3" /> Chuyển đến
                              </span>
                            )}
                          </h3>

                          {/* Student ID & Gender Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(student)}
                              className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg cursor-pointer hover:underline"
                            >
                              {student.MaSV}
                            </button>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                isFemale
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}
                            >
                              {student.PHAI || 'Nam'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
                        #{index + 1}
                      </span>
                    </div>

                    {/* 2x2 Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-500" /> Ngày Sinh
                        </span>
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {student.NgaySinhC || '—'}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-500" /> SĐT Liên Hệ
                        </span>
                        {student.phone ? (
                          <a
                            href={`tel:${student.phone}`}
                            className="font-mono font-bold text-emerald-700 hover:underline text-xs"
                          >
                            {student.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </div>

                      {hasExamSchedule && (
                        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" /> Đăng Ký Thi
                          </span>
                          <div className="font-bold text-slate-800 text-xs">
                            {student.examCount || 0} môn thi
                          </div>
                        </div>
                      )}

                      {student.note && (
                        <div className={`flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60 ${hasExamSchedule ? '' : 'col-span-2'}`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-purple-500" /> Ghi Chú
                          </span>
                          <span className="text-xs text-slate-600 italic line-clamp-2">
                            "{student.note}"
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap text-xs">
                      {activeTab === 'ACTIVE' ? (
                        <>
                          {hasExamSchedule && onSelectStudentSchedule ? (
                            <button
                              type="button"
                              onClick={() => onSelectStudentSchedule(student.MaSV)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Lịch Thi ({student.examCount || 0} môn)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(student)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem Chi Tiết</span>
                            </button>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentDetail(student)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition cursor-pointer"
                              title="Xem thông tin chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canManageClass && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      phone: student.phone || '',
                                      note: student.note || '',
                                    });
                                    setEditingStudent(student);
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl transition cursor-pointer"
                                  title="Chỉnh sửa SĐT & ghi chú"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setStudentToExclude(student);
                                    setExcludeType('BAO_LUU');
                                    setExcludeReason('');
                                    setExcludeTargetClass(classes.find((c) => c !== selectedClass) || '');
                                  }}
                                  className="p-1.5 text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer"
                                  title="Điều chuyển / Bảo lưu"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordStudent({
                                    username: student.MaSV,
                                    fullName: `${student.HoLotSV || ''} ${student.TenSV || ''}`.trim(),
                                    lop: selectedClass,
                                  });
                                  setIsResetPasswordModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl transition cursor-pointer"
                                title={`Đặt lại mật khẩu cho ${student.MaSV}`}
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onImpersonate && (
                              <button
                                type="button"
                                onClick={() => onImpersonate(student.MaSV)}
                                className="p-1.5 text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl transition cursor-pointer"
                                title={`Giả lập ${student.MaSV}`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        canManageClass && (
                          <button
                            type="button"
                            onClick={() => handleRestoreStudent(student)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục Vào Lớp
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* DESKTOP VIEW: Full 8-Column Member Table                                  */}
            {/* ========================================================================= */}
            <div className="hidden md:block flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3.5 w-12 text-center">STT</th>
                    <th className="px-4 sm:px-6 py-3.5">Mã SV</th>
                    <th className="px-4 sm:px-6 py-3.5">Họ và Tên</th>
                    <th className="px-4 sm:px-6 py-3.5 text-center">Phái</th>
                    <th className="px-4 sm:px-6 py-3.5">Ngày sinh</th>
                    {hasExamSchedule && <th className="px-4 sm:px-6 py-3.5 text-center">Môn thi</th>}
                    <th className="px-4 sm:px-6 py-3.5">SĐT & Ghi chú</th>
                    <th className="px-4 sm:px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((student, index) => {
                    const isFemale =
                      (student.PHAI || '').toLowerCase().includes('nữ') ||
                      (student.PHAI || '').toLowerCase().includes('nu');

                    return (
                      <tr key={student.MaSV} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-4 sm:px-6 py-3.5 text-center text-slate-400 font-medium text-xs">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-blue-600">
                          <button
                            onClick={() => setSelectedStudentDetail(student)}
                            className="hover:underline flex items-center gap-1 text-left cursor-pointer"
                          >
                            {student.MaSV}
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 font-semibold text-slate-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>
                              {student.HoLotSV}{' '}
                              <span className="font-extrabold text-slate-900">{student.TenSV}</span>
                            </span>

                            {student.isMonitor && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-600" /> Lớp trưởng
                              </span>
                            )}

                            {student.isTransferred && (
                              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                                <ArrowRightLeft className="w-3 h-3" /> Chuyển đến
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isFemale
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {student.PHAI || 'Nam'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-slate-600 text-xs font-medium">
                          {student.NgaySinhC || '—'}
                        </td>
                        {hasExamSchedule && (
                          <td className="px-4 sm:px-6 py-3.5 text-center">
                            <button
                              onClick={() => setSelectedStudentDetail(student)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              {student.examCount || 0} môn
                            </button>
                          </td>
                        )}
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex flex-col gap-1 max-w-[280px]">
                            {student.phone && (
                              <span className="text-[11px] font-mono text-slate-700 flex items-center gap-1 font-semibold">
                                <Phone className="w-3 h-3 text-slate-400" /> {student.phone}
                              </span>
                            )}
                            {student.note ? (
                              <span className="text-xs text-slate-600 line-clamp-1 italic" title={student.note}>
                                "{student.note}"
                              </span>
                            ) : !student.phone ? (
                              <span className="text-xs text-slate-400">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === 'ACTIVE' ? (
                              <>
                                <button
                                  onClick={() => setSelectedStudentDetail(student)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title={hasExamSchedule ? "Xem lịch thi & chi tiết" : "Xem thông tin chi tiết"}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {onImpersonate && (
                                  <button
                                    onClick={() => onImpersonate(student.MaSV)}
                                    className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                    title={`Đăng nhập với tư cách ${student.MaSV} (${student.TenSV})`}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}

                                {isAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResetPasswordStudent({
                                          username: student.MaSV,
                                          fullName: `${student.HoLotSV || ''} ${student.TenSV || ''}`.trim(),
                                          lop: selectedClass,
                                        });
                                        setIsResetPasswordModalOpen(true);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                      title={`Đặt lại mật khẩu cho sinh viên ${student.MaSV}`}
                                    >
                                      <KeyRound className="w-4 h-4" />
                                    </button>

                                    {student.MaSV === classMonitor?.username ? (
                                      <span
                                        className="p-1.5 text-amber-600 bg-amber-50 rounded-lg cursor-default"
                                        title="Đang là Lớp Trưởng"
                                      >
                                        <Crown className="w-4 h-4 fill-amber-400 text-amber-600" />
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => openAssignMonitorModal(student.MaSV)}
                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                        title={`Chỉ định ${student.HoLotSV} ${student.TenSV} làm Lớp Trưởng`}
                                      >
                                        <Crown className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}

                                {canManageClass && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setFormData({
                                          phone: student.phone || '',
                                          note: student.note || '',
                                        });
                                        setEditingStudent(student);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Chỉnh sửa SĐT & ghi chú"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>

                                    {/* Button Điều chuyển / Loại khỏi lớp */}
                                    <button
                                      onClick={() => {
                                        setStudentToExclude(student);
                                        setExcludeType('BAO_LUU');
                                        setExcludeReason('');
                                        setExcludeTargetClass(classes.find((c) => c !== selectedClass) || '');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Điều chuyển / Bảo lưu / Loại khỏi lớp"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            ) : (
                              /* Actions for Excluded Students: Restore button */
                              canManageClass ? (
                                <button
                                  onClick={() => handleRestoreStudent(student)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer shadow-sm"
                                  title="Khôi phục lại vào danh sách lớp"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Chỉ xem</span>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: Tiếp Nhận Sinh Viên (Receive Student Modal) */}
      {isReceiveModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReceiveModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Tiếp Nhận Sinh Viên Vào Lớp {selectedClass}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tìm kiếm sinh viên từ lớp khác hoặc nhập mã sinh viên để quản lý
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 min-h-0">
              {/* Search Bar */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tìm kiếm sinh viên toàn trường (Mã SV, Họ tên, Lớp cũ...)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nhập Mã SV (ví dụ: B24DTCN...) hoặc Họ tên sinh viên..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchGlobalQuery}
                    onChange={(e) => setSearchGlobalQuery(e.target.value)}
                  />
                  {isSearchingGlobal && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              {/* Search Results List */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Kết quả tìm kiếm ({globalSearchResults.length})
                </div>

                {globalSearchResults.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                    {searchGlobalQuery.trim().length >= 2 ? (
                      <div>
                        <p className="font-semibold text-slate-600 mb-1">
                          Không tìm thấy sinh viên nào khớp với "{searchGlobalQuery}"
                        </p>
                        <p className="text-[11px]">
                          Bạn có thể tiếp nhận trực tiếp bằng cách nhập Mã SV và nhấn Tiếp Nhận.
                        </p>
                        <button
                          onClick={() => {
                            handleConfirmReceiveStudent({
                              maSV: searchGlobalQuery.trim().toUpperCase(),
                              hoTen: searchGlobalQuery.trim().toUpperCase(),
                              ten: searchGlobalQuery.trim().toUpperCase(),
                              maLop: 'Chưa rõ',
                            });
                          }}
                          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                        >
                          + Tiếp nhận trực tiếp Mã SV "{searchGlobalQuery.trim().toUpperCase()}"
                        </button>
                      </div>
                    ) : (
                      'Nhập ít nhất 2 ký tự để tìm kiếm sinh viên...'
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {globalSearchResults.map((st) => (
                      <div
                        key={st.maSV}
                        className={`p-3.5 flex items-center justify-between hover:bg-indigo-50/40 transition-colors ${
                          selectedStudentToReceive?.maSV === st.maSV ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                              {st.maSV}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{st.hoTen}</span>
                            <span className="text-[11px] text-slate-400">({st.gioiTinh})</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>Lớp hiện tại: <strong className="text-slate-700">{st.maLop}</strong></span>
                            {hasExamSchedule && (
                              <>
                                <span>•</span>
                                <span>{st.examCount || 0} môn thi</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedStudentToReceive(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            selectedStudentToReceive?.maSV === st.maSV
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                          }`}
                        >
                          {selectedStudentToReceive?.maSV === st.maSV ? 'Đã Chọn ✓' : 'Chọn SV Này'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Receive Reason / Note */}
              {selectedStudentToReceive && (
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Sinh viên được chọn: <strong className="text-indigo-700">{selectedStudentToReceive.hoTen} ({selectedStudentToReceive.maSV})</strong>
                    </span>
                    <span className="text-slate-500">Chuyển từ lớp: <strong>{selectedStudentToReceive.maLop}</strong></span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Lý do tiếp nhận / Ghi chú điều chuyển (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Chuyển biên chế theo quyết định khoa / Học ghép..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={receiveReason}
                      onChange={(e) => setReceiveReason(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={!selectedStudentToReceive || isProcessingAction}
                onClick={() => handleConfirmReceiveStudent(selectedStudentToReceive)}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessingAction ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Xác Nhận Tiếp Nhận Vào Lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Điều Chuyển / Loại Bỏ Sinh Viên (Exclude / Transfer Status Modal) */}
      {studentToExclude && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStudentToExclude(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Điều Chuyển / Biến Động Sĩ Số
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật trạng thái bảo lưu, nghỉ học hoặc chuyển lớp cho sinh viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentToExclude(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExclude} className="p-6 flex flex-col gap-4">
              {/* Student Info Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Sinh viên:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {studentToExclude.HoLotSV} {studentToExclude.TenSV}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 block">
                    {studentToExclude.MaSV}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Lớp {selectedClass}</span>
                </div>
              </div>

              {/* Action Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Hình thức biến động / Lý do điều chuyển *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                      excludeType === 'BAO_LUU'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="excludeType"
                      value="BAO_LUU"
                      checked={excludeType === 'BAO_LUU'}
                      onChange={() => setExcludeType('BAO_LUU')}
                      className="hidden"
                    />
                    <PauseCircle className={`w-4 h-4 ${excludeType === 'BAO_LUU' ? 'text-amber-600' : 'text-slate-400'}`} />
                    Bảo lưu kết quả
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                      excludeType === 'CHUYEN_LOP'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="excludeType"
                      value="CHUYEN_LOP"
                      checked={excludeType === 'CHUYEN_LOP'}
                      onChange={() => setExcludeType('CHUYEN_LOP')}
                      className="hidden"
                    />
                    <ArrowRightLeft className={`w-4 h-4 ${excludeType === 'CHUYEN_LOP' ? 'text-blue-600' : 'text-slate-400'}`} />
                    Chuyển sang lớp khác
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                      excludeType === 'NGHI_HOC'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="excludeType"
                      value="NGHI_HOC"
                      checked={excludeType === 'NGHI_HOC'}
                      onChange={() => setExcludeType('NGHI_HOC')}
                      className="hidden"
                    />
                    <XCircle className={`w-4 h-4 ${excludeType === 'NGHI_HOC' ? 'text-rose-600' : 'text-slate-400'}`} />
                    Nghỉ học / Thôi học
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                      excludeType === 'LOAI_BO'
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="excludeType"
                      value="LOAI_BO"
                      checked={excludeType === 'LOAI_BO'}
                      onChange={() => setExcludeType('LOAI_BO')}
                      className="hidden"
                    />
                    <UserMinus className={`w-4 h-4 ${excludeType === 'LOAI_BO' ? 'text-slate-700' : 'text-slate-400'}`} />
                    Loại khỏi lớp quản lý
                  </label>
                </div>
              </div>

              {/* Target Class Selector (if CHUYEN_LOP) */}
              {excludeType === 'CHUYEN_LOP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Chọn lớp chuyển đến *
                  </label>
                  <select
                    required
                    value={excludeTargetClass}
                    onChange={(e) => setExcludeTargetClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn lớp tiếp nhận --</option>
                    {classes
                      .filter((c) => c !== selectedClass)
                      .map((c) => (
                        <option key={c} value={c}>
                          Lớp {c}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Reason / Decision text */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Lý do / Số quyết định (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Quyết định bảo lưu HK2 2025-2026..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                  value={excludeReason}
                  onChange={(e) => setExcludeReason(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentToExclude(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction || (excludeType === 'CHUYEN_LOP' && !excludeTargetClass)}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-rose-200 flex items-center gap-1.5 cursor-pointer"
                >
                  {isProcessingAction ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Xác Nhận Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Student Detail & Exam Schedule */}
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
                  <p className="text-xs text-slate-500">Lớp {selectedClass}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
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
                  <span className="text-slate-400 font-bold uppercase tracking-wider block">Lớp:</span>
                  <span className="font-bold text-blue-600">{selectedClass}</span>
                </div>
                {selectedStudentDetail.phone && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">SĐT liên hệ:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedStudentDetail.phone}</span>
                  </div>
                )}
                {selectedStudentDetail.note && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">Ghi chú:</span>
                    <span className="text-slate-700 italic">"{selectedStudentDetail.note}"</span>
                  </div>
                )}
              </div>

              {/* Exam Schedule Section (Only when exam schedule is active) */}
              {hasExamSchedule && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Lịch Thi Đã Đăng Ký ({selectedStudentDetail.exams?.length || 0} môn)
                    </h4>
                  </div>

                  {!selectedStudentDetail.exams || selectedStudentDetail.exams.length === 0 ? (
                    <p className="text-slate-400 italic text-xs py-4 text-center border border-dashed rounded-xl">
                      Không có lịch thi nào được tìm thấy cho sinh viên này.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {/* Mobile Exam Cards inside Modal */}
                      <div className="block sm:hidden space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedStudentDetail.exams.map((ex: ExamRecord, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col gap-2 ${
                              ex.isPostponed ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h5 className={`text-xs font-black ${ex.isPostponed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {ex.TenMH}
                                </h5>
                                <span className="font-mono text-[10px] text-blue-600 font-bold">{ex.MaMH}</span>
                              </div>

                              {onTogglePostpone ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const nextStatus = !ex.isPostponed;
                                    await onTogglePostpone(ex, nextStatus);
                                    setSelectedStudentDetail((prev: any) => {
                                      if (!prev) return prev;
                                      return {
                                        ...prev,
                                        exams: prev.exams.map((e: ExamRecord) =>
                                          (ex.id && e.id === ex.id) ||
                                          (e.MaMH === ex.MaMH && e.MAPTHI === ex.MAPTHI && e.NgayThi === ex.NgayThi && e.GioThi === ex.GioThi)
                                            ? { ...e, isPostponed: nextStatus }
                                            : e
                                        ),
                                      };
                                    });
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                                    ex.isPostponed
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {ex.isPostponed ? '✕ Hoãn' : '✓ Dự thi'}
                                </button>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                                    ex.isPostponed
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {ex.isPostponed ? 'Hoãn' : 'Dự thi'}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 text-[11px] p-2 bg-slate-50 rounded-lg">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Ngày: </span>
                                <span className="font-bold text-slate-800">{ex.NgayThi}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Giờ: </span>
                                <span className="font-bold text-blue-600">{ex.GioThi}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Phòng: </span>
                                <span className="font-bold text-emerald-700">{ex.MAPTHI || '—'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Tổ: </span>
                                <span className="font-bold text-slate-700">{ex['To thi'] || ex.NhomThi || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table inside Modal */}
                      <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="px-3 py-2.5">Ngày thi</th>
                              <th className="px-3 py-2.5">Giờ thi</th>
                              <th className="px-3 py-2.5">Tên môn học</th>
                              <th className="px-3 py-2.5 text-center">Phòng</th>
                              <th className="px-3 py-2.5 text-center">Tổ/Nhóm</th>
                              <th className="px-3 py-2.5 text-center">Trạng thái thi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedStudentDetail.exams.map((ex: ExamRecord, idx: number) => (
                              <tr key={idx} className={`hover:bg-blue-50/50 ${ex.isPostponed ? 'bg-amber-50/30' : ''}`}>
                                <td className="px-3 py-2.5 font-bold text-slate-700">{ex.NgayThi}</td>
                                <td className="px-3 py-2.5 text-blue-600 font-medium">{ex.GioThi}</td>
                                <td className="px-3 py-2.5 font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span className={ex.isPostponed ? 'line-through text-slate-400' : ''}>{ex.TenMH}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({ex.MaMH})</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{ex.MAPTHI || '—'}</td>
                                <td className="px-3 py-2.5 text-center text-slate-500">
                                  {ex['To thi'] || ex.NhomThi || '—'}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {onTogglePostpone ? (
                                    <button
                                      onClick={async () => {
                                        const nextStatus = !ex.isPostponed;
                                        await onTogglePostpone(ex, nextStatus);
                                        setSelectedStudentDetail((prev: any) => {
                                          if (!prev) return prev;
                                          return {
                                            ...prev,
                                            exams: prev.exams.map((e: ExamRecord) =>
                                              (ex.id && e.id === ex.id) ||
                                              (e.MaMH === ex.MaMH && e.MAPTHI === ex.MAPTHI && e.NgayThi === ex.NgayThi && e.GioThi === ex.GioThi)
                                                ? { ...e, isPostponed: nextStatus }
                                                : e
                                            ),
                                          };
                                        });
                                      }}
                                      title={ex.isPostponed ? 'Bấm để chuyển về Dự thi' : 'Bấm để đánh dấu Hoãn thi (không chia tiền)'}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                        ex.isPostponed
                                          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-xs'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                                      }`}
                                    >
                                      {ex.isPostponed ? '✕ Hoãn thi' : '✓ Dự thi'}
                                    </button>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        ex.isPostponed
                                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                                    </span>
                                  )}
                                </td>
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

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              {onSelectStudentSchedule ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedStudentDetail.MaSV;
                    setSelectedStudentDetail(null);
                    onSelectStudentSchedule(id);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-200 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Xem Lịch Thi Chi Tiết
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Student Contact Info */}
      {editingStudent && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingStudent(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Chỉnh Sửa Thông Tin
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="p-6 flex flex-col gap-4">
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Sinh viên:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {editingStudent.HoLotSV} {editingStudent.TenSV}
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {editingStudent.MaSV}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0912345678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú về sinh viên..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈ ĐỊNH / CHUYỂN ĐỔI LỚP TRƯỞNG (ADMIN ONLY) */}
      {isAssignMonitorModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingMonitor) setIsAssignMonitorModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200 border border-white/20">
                  <Crown className="w-5 h-5 fill-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {classMonitor ? 'Chuyển Đổi Lớp Trưởng' : 'Chỉ Định Lớp Trưởng'}
                  </h3>
                  <p className="text-xs text-amber-100/80">
                    Lớp <span className="font-bold underline">{selectedClass}</span> • Quyền Quản trị viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmittingMonitor && setIsAssignMonitorModalOpen(false)}
                disabled={isSubmittingMonitor}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 min-h-0">
              {/* Error feedback */}
              {monitorModalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{monitorModalError}</span>
                </div>
              )}

              {/* Current Monitor Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Lớp Trưởng Hiện Tại:
                </span>
                {classMonitor ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Crown className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {classMonitor.fullName || classMonitor.username}
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          Mã SV: <span className="font-bold text-slate-700">{classMonitor.username}</span>
                          {classMonitor.phoneNumber && ` • SĐT: ${classMonitor.phoneNumber}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignMonitor('REMOVE')}
                      disabled={isSubmittingMonitor}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Hủy vai trò Lớp trưởng của sinh viên này mà không chỉ định người mới"
                    >
                      Hủy vai trò
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-dashed border-slate-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    Lớp này hiện chưa có Lớp trưởng được chỉ định.
                  </div>
                )}
              </div>

              {/* Candidate Selection */}
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chọn Sinh Viên Làm Lớp Trưởng Mới:
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {activeStudents.length} thành viên trong lớp
                  </span>
                </div>

                {/* Candidate search filter */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo Họ tên hoặc Mã SV trong lớp..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Candidates List */}
                <div className="border border-slate-200 rounded-2xl overflow-y-auto max-h-56 divide-y divide-slate-100 bg-white">
                  {candidateList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Không tìm thấy sinh viên phù hợp trong lớp.
                    </div>
                  ) : (
                    candidateList.map((st) => {
                      const isCurrent = classMonitor?.username === st.MaSV;
                      const isSelected = selectedCandidateMaSV === st.MaSV;
                      return (
                        <div
                          key={st.MaSV}
                          onClick={() => !isCurrent && setSelectedCandidateMaSV(st.MaSV)}
                          className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-50/40 opacity-70 cursor-not-allowed'
                              : isSelected
                              ? 'bg-amber-50 border-l-4 border-amber-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isSelected ? <Check className="w-4 h-4" /> : st.TenSV.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {st.HoLotSV} {st.TenSV}
                                {isCurrent && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                    Đang là LT
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {st.MaSV} {st.phone ? `• ${st.phone}` : ''}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isCurrent}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-xs'
                                : isCurrent
                                ? 'text-slate-400 bg-transparent'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                          >
                            {isSelected ? 'Đã Chọn' : isCurrent ? 'Hiện tại' : 'Chọn'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Optional Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do chỉ định / chuyển giao (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bổ nhiệm đầu kỳ, thay đổi theo đề xuất của lớp..."
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignMonitorModalOpen(false)}
                disabled={isSubmittingMonitor}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => handleAssignMonitor(classMonitor ? 'TRANSFER' : 'ASSIGN')}
                disabled={isSubmittingMonitor || !selectedCandidateMaSV || selectedCandidateMaSV === classMonitor?.username}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingMonitor ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>
                      {classMonitor ? 'Xác Nhận Chuyển Lớp Trưởng' : 'Xác Nhận Chỉ Định Lớp Trưởng'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        initialUsername={resetPasswordStudent.username}
        initialFullName={resetPasswordStudent.fullName}
        initialClass={resetPasswordStudent.lop}
        onSuccess={() => {
          showToast(`Đã cập nhật mật khẩu cho ${resetPasswordStudent.username}!`);
        }}
      />
    </div>
  );
}
