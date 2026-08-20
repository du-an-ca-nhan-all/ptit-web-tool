import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  RefreshCw,
  User,
  Phone,
  Calendar,
  KeyRound,
  UserCheck,
  ShieldCheck,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Crown,
  Eye,
  Lock,
  Layers,
  X,
} from 'lucide-react';
import { LoginUser } from '../types';
import AdminResetPasswordModal from './AdminResetPasswordModal';

export interface StudentItem {
  id?: number;
  maSV: string;
  hoLot?: string;
  ten?: string;
  hoTen: string;
  gioiTinh?: string;
  ngaySinh?: string;
  maLop: string;
  trangThai?: string;
  // Admin-only fields:
  soDienThoai?: string | null;
  ghiChu?: string | null;
  examCount?: number;
  user?: {
    id: number;
    role: string;
    isActive: boolean;
    lastLogin?: string | null;
    hasPassword?: boolean;
  } | null;
  createdAt?: string;
}

interface AllStudentsListProps {
  currentUser?: LoginUser | null;
  onSelectStudentSchedule?: (studentId: string) => void;
  onImpersonate?: (username: string) => void;
  onClassClick?: (classCode: string) => void;
}

export default function AllStudentsList({
  currentUser,
  onSelectStudentSchedule,
  onImpersonate,
  onClassClick,
}: AllStudentsListProps) {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classesList, setClassesList] = useState<{ classCode: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Admin Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState({ username: '', fullName: '', lop: '' });

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Fetch Students API
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedClass !== 'ALL') params.set('classCode', selectedClass);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/students?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.students || []);
        if (data.classes) setClassesList(data.classes);
        if (data.pagination) {
          setTotalStudents(data.pagination.total || 0);
          setTotalPages(data.pagination.totalPages || 1);
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách sinh viên.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải danh sách sinh viên.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedClass, selectedStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset page when search or filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleClassChange = (val: string) => {
    setSelectedClass(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  // Helper status badge renderer
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'DANG_HOC':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đang học
          </span>
        );
      case 'BAO_LUU':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Bảo lưu
          </span>
        );
      case 'NGHI_HOC':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Nghỉ học
          </span>
        );
      case 'CHUYEN_LOP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Chuyển lớp
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Đang học'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-8 max-w-7xl mx-auto w-full gap-4 sm:gap-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Danh Sách Sinh Viên Toàn Trường
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] sm:text-xs font-bold rounded-full">
                {totalStudents} Sinh Viên
              </span>
              {isAdmin && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Full Quyền Admin
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              {isAdmin
                ? 'Xem toàn bộ hồ sơ chi tiết, trạng thái tài khoản, SĐT liên hệ và thao tác quản trị'
                : 'Tra cứu thông tin sinh viên các khóa ngành theo danh sách cơ bản'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setResetTarget({ username: '', fullName: '', lop: '' });
                setIsResetModalOpen(true);
              }}
              className="px-3.5 py-2 sm:px-4 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              title="Đặt lại mật khẩu cho sinh viên"
            >
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Reset MK</span>
            </button>
          )}

          <button
            onClick={() => fetchStudents()}
            className="px-3.5 py-2 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary (Admin view or General Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Sinh Viên
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-800">{totalStudents}</div>
          </div>
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Số Lớp
            </div>
            <div className="text-lg sm:text-2xl font-black text-indigo-600">{classesList.length}</div>
          </div>
          <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đang Hiển Thị
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600">{students.length}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border bg-white border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Chế Độ Xem
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-700 mt-0.5 sm:mt-1 flex items-center gap-1">
              {isAdmin ? (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Admin
                </span>
              ) : (
                <span className="text-slate-600">Cơ bản</span>
              )}
            </div>
          </div>
          <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 opacity-50" />
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-1 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] w-full sm:w-auto sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAdmin ? "Tìm theo Mã SV, Họ tên, Lớp, SĐT, Ghi chú..." : "Tìm theo Mã SV, Họ tên, Lớp..."}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Class Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 text-xs flex-1 sm:flex-initial">
              <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs w-full truncate"
              >
                <option value="ALL">Tất cả ({classesList.length})</option>
                {classesList.map((c) => (
                  <option key={c.classCode} value={c.classCode}>
                    {c.classCode} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-200 text-xs flex-1 sm:flex-initial">
              <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Trạng Thái:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs w-full truncate"
              >
                <option value="ALL">Tất cả</option>
                <option value="DANG_HOC">Đang học</option>
                <option value="BAO_LUU">Bảo lưu</option>
                <option value="NGHI_HOC">Nghỉ học</option>
                <option value="CHUYEN_LOP">Chuyển lớp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Page Size selector */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 text-xs text-slate-500 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span>Hiển thị:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 outline-none cursor-pointer text-xs"
          >
            <option value={25}>25 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
            <option value={200}>200 / trang</option>
          </select>
        </div>
      </div>

      {/* Main Content View */}
      {isLoading ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs font-medium">Đang tải danh sách sinh viên...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px] text-center">
          <GraduationCap className="w-12 h-12 text-slate-300" />
          <span className="text-sm font-bold text-slate-700">Không tìm thấy sinh viên nào</span>
          <span className="text-xs text-slate-400 max-w-sm">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo lớp khác.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ========================================================================= */}
          {/* MOBILE VIEW: Mobile Student Cards                                         */}
          {/* ========================================================================= */}
          <div className="block md:hidden space-y-3">
            {students.map((student, idx) => {
              const isFemale = student.gioiTinh === 'Nữ';
              const serialNumber = (currentPage - 1) * pageSize + idx + 1;

              return (
                <div
                  key={student.maSV}
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
                        {student.ten ? student.ten.charAt(0) : student.hoTen.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Big Student Name */}
                        <h3 className="text-base font-black text-slate-900 leading-snug flex items-center gap-1.5">
                          <span>{student.hoTen}</span>
                          {isAdmin && student.user?.role?.includes('lop_truong') && (
                            <span title="Lớp trưởng" className="text-amber-500 shrink-0">
                              <Crown className="w-3.5 h-3.5 fill-amber-400" />
                            </span>
                          )}
                        </h3>

                        {/* Student ID & Class Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <button
                            type="button"
                            onClick={() => onSelectStudentSchedule && onSelectStudentSchedule(student.maSV)}
                            className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg cursor-pointer hover:underline"
                          >
                            {student.maSV}
                          </button>

                          {student.maLop ? (
                            <button
                              type="button"
                              onClick={() => onClassClick && onClassClick(student.maLop)}
                              className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg cursor-pointer hover:underline truncate max-w-[130px]"
                            >
                              {student.maLop}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chưa phân lớp</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {renderStatusBadge(student.trangThai)}
                    </div>
                  </div>

                  {/* 2x2 Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-500" /> Ngày Sinh
                      </span>
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {student.ngaySinh || '—'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-sky-500" /> Giới Tính
                      </span>
                      <div className="font-bold text-slate-800 text-xs">
                        {student.gioiTinh || 'Nam'}
                      </div>
                    </div>

                    {/* ADMIN INFO CELLS */}
                    {isAdmin && (
                      <>
                        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" /> SĐT Liên Hệ
                          </span>
                          {student.soDienThoai ? (
                            <a
                              href={`tel:${student.soDienThoai}`}
                              className="font-mono font-bold text-emerald-700 hover:underline text-xs"
                            >
                              {student.soDienThoai}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3 text-purple-500" /> Tài Khoản
                          </span>
                          {student.user ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {student.user.hasPassword ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Có MK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Chưa đặt MK
                                </span>
                              )}
                              {student.user.role !== 'sinh_vien' && (
                                <span className="text-[9px] font-mono text-indigo-600 font-bold">
                                  @{student.user.role}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chưa tạo</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    {onSelectStudentSchedule && (
                      <button
                        type="button"
                        onClick={() => onSelectStudentSchedule(student.maSV)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {typeof student.examCount === 'number' && student.examCount > 0
                            ? `Xem Lịch Thi (${student.examCount} môn)`
                            : 'Xem Lịch Thi'}
                        </span>
                      </button>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget({
                              username: student.maSV,
                              fullName: student.hoTen,
                              lop: student.maLop,
                            });
                            setIsResetModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title={`Đặt lại mật khẩu cho ${student.maSV}`}
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset MK</span>
                        </button>

                        {onImpersonate && (
                          <button
                            type="button"
                            onClick={() => onImpersonate(student.maSV)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-xl transition cursor-pointer"
                            title={`Giả lập ${student.maSV}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* DESKTOP VIEW: Full 10-Column Data Table                                   */}
          {/* ========================================================================= */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Sinh Viên / Mã SV</th>
                    <th className="py-3.5 px-4">Giới Tính</th>
                    <th className="py-3.5 px-4">Ngày Sinh</th>
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>

                    {/* ADMIN FULL COLUMNS */}
                    {isAdmin && (
                      <>
                        <th className="py-3.5 px-4">SĐT Liên Hệ</th>
                        <th className="py-3.5 px-4">Tài Khoản</th>
                        <th className="py-3.5 px-4">Môn Thi</th>
                        <th className="py-3.5 px-4">Ghi Chú</th>
                      </>
                    )}

                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students.map((student, idx) => {
                    const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                    const isFemale = student.gioiTinh === 'Nữ';

                    return (
                      <tr
                        key={student.maSV}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-[11px]">
                          {serialNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isFemale ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {student.ten ? student.ten.charAt(0) : student.hoTen.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                <span>{student.hoTen}</span>
                                {isAdmin && student.user?.role?.includes('lop_truong') && (
                                  <span title="Lớp trưởng" className="text-amber-500">
                                    <Crown className="w-3.5 h-3.5 fill-amber-400" />
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                                {student.maSV}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isFemale
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {student.gioiTinh || 'Nam'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 text-xs font-medium font-mono">
                          {student.ngaySinh || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {student.maLop ? (
                            <button
                              type="button"
                              onClick={() => onClassClick && onClassClick(student.maLop)}
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                              title="Xem chi tiết lớp này"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                              <span>{student.maLop}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Chưa phân lớp</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {renderStatusBadge(student.trangThai)}
                        </td>

                        {/* ADMIN-ONLY DATA CELLS */}
                        {isAdmin && (
                          <>
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                              {student.soDienThoai ? (
                                <a
                                  href={`tel:${student.soDienThoai}`}
                                  className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{student.soDienThoai}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {student.user ? (
                                <div className="flex flex-col gap-0.5">
                                  {student.user.hasPassword ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Lock className="w-2.5 h-2.5" /> Có MK
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Chưa đặt MK
                                    </span>
                                  )}
                                  {student.user.role !== 'sinh_vien' && (
                                    <span className="text-[10px] font-mono text-indigo-600 font-bold">
                                      @{student.user.role}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Chưa tạo user</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {typeof student.examCount === 'number' && student.examCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectStudentSchedule && onSelectStudentSchedule(student.maSV)}
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  title="Xem lịch thi của sinh viên này"
                                >
                                  {student.examCount} môn
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate" title={student.ghiChu || ''}>
                              {student.ghiChu || <span className="text-slate-400 italic">—</span>}
                            </td>
                          </>
                        )}

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Tra cứu lịch thi của sinh viên */}
                            {onSelectStudentSchedule && (
                              <button
                                type="button"
                                onClick={() => onSelectStudentSchedule(student.maSV)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                title={`Xem lịch thi & môn học của ${student.maSV}`}
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}

                            {/* ADMIN ONLY ACTIONS */}
                            {isAdmin && (
                              <>
                                {/* Reset Password */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetTarget({
                                      username: student.maSV,
                                      fullName: student.hoTen,
                                      lop: student.maLop,
                                    });
                                    setIsResetModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                                  title={`Đặt lại mật khẩu cho sinh viên ${student.maSV}`}
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>

                                {/* Impersonate */}
                                {onImpersonate && (
                                  <button
                                    type="button"
                                    onClick={() => onImpersonate(student.maSV)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                                    title={`Đăng nhập giả lập với tư cách ${student.maSV}`}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-white sm:bg-slate-50/50 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Trang <b className="text-slate-900">{currentPage}</b> / {totalPages} (Tổng cộng{' '}
              <b className="text-slate-900">{totalStudents}</b> sinh viên)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {/* Admin Reset Password Modal */}
      {isAdmin && (
        <AdminResetPasswordModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          initialUsername={resetTarget.username}
          initialFullName={resetTarget.fullName}
          initialClass={resetTarget.lop}
          onSuccess={() => {
            fetchStudents();
          }}
        />
      )}
    </div>
  );
}
