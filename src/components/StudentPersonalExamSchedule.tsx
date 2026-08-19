import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  CalendarDays,
  Globe,
  Layers,
  RefreshCw,
  Zap,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  CheckCheck,
  Copy,
  Info,
  CalendarCheck,
  Lock,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  User,
  Users,
  Timer,
  ChevronDown,
  ExternalLink,
  X,
  FileText,
} from 'lucide-react';
import { ExamRecord, LoginUser, ExamBatchItem } from '../types';
import { FilterState } from './FilterBar';
import FilterBar from './FilterBar';
import DataTable, { SortKey, SortDirection } from './DataTable';
import ExamRoomMembers from './ExamRoomMembers';
import {
  StudentQldtExamScheduleResult,
  StudentQldtExamItem,
} from '../lib/studentExamScheduleService';

interface StudentPersonalExamScheduleProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
  // Props cho chế độ File Lịch Thi Tổng Hợp
  records: ExamRecord[];
  totalRecords: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: SortKey; direction: SortDirection } | null>>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  classes: string[];
  subjects: { code: string; name: string }[];
  dates: string[];
  selectedExamRoom: ExamRecord | null;
  setSelectedExamRoom: (room: ExamRecord | null) => void;
  setConfirmStudentId: (id: string | null) => void;
  setConfirmClassCode: (code: string | null) => void;
  handleToggleExamPostpone: (record: ExamRecord, newStatus: boolean) => Promise<void>;
  canAccessMonitorTools: boolean;
  isLoadingBatchData: boolean;
  activeBatch: ExamBatchItem | null;
  loadDataFromApi: (batchCode?: string) => Promise<void>;
}

function formatSyncDateTime(isoString?: string | null): string {
  if (!isoString) return 'Chưa đồng bộ';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

function getRelativeSyncTime(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 10) return 'vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

function getFormatBadgeColor(formatStr: string): string {
  const f = (formatStr || '').toLowerCase();
  if (f.includes('trắc nghiệm')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (f.includes('thực hành') || f.includes('máy')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (f.includes('tiểu luận') || f.includes('báo cáo')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (f.includes('tự luận') || f.includes('viết')) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function StudentPersonalExamSchedule({
  currentUser,
  onNavigateToExternalAccounts,
  records,
  totalRecords,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  sortConfig,
  setSortConfig,
  filters,
  setFilters,
  classes,
  subjects,
  dates,
  selectedExamRoom,
  setSelectedExamRoom,
  setConfirmStudentId,
  setConfirmClassCode,
  handleToggleExamPostpone,
  canAccessMonitorTools,
  isLoadingBatchData,
  activeBatch,
  loadDataFromApi,
}: StudentPersonalExamScheduleProps) {
  // Mode: 'QLDTTX' (Cổng Quản lý đào tạo từ xa) | 'FILE_TONG' (File lịch thi tổng của học viện)
  const [viewSourceMode, setViewSourceMode] = useState<'QLDTTX' | 'FILE_TONG'>('QLDTTX');

  // State cho chế độ QLDTTX
  const [qldtData, setQldtData] = useState<StudentQldtExamScheduleResult | null>(null);
  const [isLoadingQldt, setIsLoadingQldt] = useState(true);
  const [isRefreshingQldt, setIsRefreshingQldt] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | undefined>(undefined);
  const [errorType, setErrorType] = useState<'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter & Search cho QLDTTX
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [selectedExamModal, setSelectedExamModal] = useState<StudentQldtExamItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-refresh timestamp tracker (10 minutes)
  const lastFetchTimeRef = useRef<number>(Date.now());

  // Fetch QLDTTX exam schedule
  const fetchQldtExams = useCallback(
    async (refresh = false, semesterId?: number) => {
      if (refresh) setIsRefreshingQldt(true);
      else setIsLoadingQldt(true);
      setErrorMsg(null);
      setErrorType(null);

      try {
        const queryParams = new URLSearchParams();
        if (refresh) queryParams.set('refresh', 'true');
        if (semesterId) queryParams.set('semesterId', String(semesterId));

        const res = await fetch(`/api/student/exam-schedule?${queryParams.toString()}`);
        const json = await res.json();
        lastFetchTimeRef.current = Date.now();

        if (res.ok && json.success) {
          setQldtData(json);
          setSelectedSemester(json.semesterId);
          setErrorType(null);

          if (refresh) {
            const timeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
            setSyncFeedback({
              type: 'success',
              message: `Đồng bộ thành công lịch thi cá nhân mới nhất từ QLDTTX (lúc ${timeFormatted})!`,
            });
            setTimeout(() => setSyncFeedback(null), 6000);
          }
        } else {
          const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
          setErrorType(type);
          setErrorMsg(json.error || 'Không thể tải lịch thi cá nhân từ QLDTTX');
          if (json.username) {
            setQldtData(json);
          }
          if (refresh) {
            setSyncFeedback({
              type: 'error',
              message: json.error || 'Đồng bộ từ cổng QLDTTX thất bại.',
            });
          }
        }
      } catch (err: any) {
        setErrorType('SERVER_ERROR');
        setErrorMsg('Lỗi kết nối máy chủ khi lấy dữ liệu lịch thi từ QLDTTX');
        if (refresh) {
          setSyncFeedback({
            type: 'error',
            message: 'Lỗi kết nối máy chủ khi đồng bộ lịch thi từ QLDTTX.',
          });
        }
      } finally {
        setIsLoadingQldt(false);
        setIsRefreshingQldt(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchQldtExams(false, selectedSemester);
  }, [fetchQldtExams, selectedSemester]);

  // Tự động kiểm tra và refresh nếu quay lại sau 10 phút
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= 10 * 60 * 1000) {
          lastFetchTimeRef.current = Date.now();
          fetchQldtExams(false, selectedSemester);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (elapsed >= 10 * 60 * 1000) {
        lastFetchTimeRef.current = Date.now();
        fetchQldtExams(false, selectedSemester);
      }
    }, 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(intervalId);
    };
  }, [fetchQldtExams, selectedSemester]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered QLDTTX exams
  const filteredQldtExams = useMemo(() => {
    if (!qldtData || !Array.isArray(qldtData.exams)) return [];
    return qldtData.exams.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ex.tenMon.toLowerCase().includes(q) ||
        ex.maMon.toLowerCase().includes(q) ||
        ex.maPhong.toLowerCase().includes(q) ||
        ex.hinhThucThi.toLowerCase().includes(q) ||
        ex.diaDiemThi.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === 'UPCOMING') matchStatus = ex.daysUntil >= 0;
      else if (statusFilter === 'PAST') matchStatus = ex.daysUntil < 0;

      return matchSearch && matchStatus;
    });
  }, [qldtData, searchQuery, statusFilter]);

  // Export CSV QLDTTX
  const handleExportQldtCSV = () => {
    if (!qldtData || !qldtData.exams || qldtData.exams.length === 0) return;
    let csv = '\uFEFF';
    csv += 'STT,Mã Môn,Tên Môn Học,Ngày Thi,Giờ Thi,Thời Lượng,Hình Thức Thi,Phòng Thi,Cơ Sở,SBD,Tổ Thi,Nhóm Thi,Địa Điểm Thi,Ghi Chú\n';
    qldtData.exams.forEach((ex) => {
      csv += `"${ex.stt}","${ex.maMon}","${ex.tenMon}","${ex.ngayThi}","${ex.gioBatDau}","${ex.soPhut}","${ex.hinhThucThi}","${ex.maPhong}","${ex.maCoSo}","${ex.toThi}","${ex.toThi}","${ex.nhomThi}","${ex.diaDiemThi.replace(/"/g, '""')}","${ex.ghiChu}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_thi_QLDTTX_${currentUser.username}_${qldtData.semesterId || ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Source Mode Switcher Bar */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800">Lịch Thi Cá Nhân</h2>
            <p className="text-[11px] text-slate-500">Lựa chọn nguồn dữ liệu tra cứu lịch thi của sinh viên</p>
          </div>
        </div>

        {/* Segmented Control Buttons */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200">
          <button
            onClick={() => setViewSourceMode('QLDTTX')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewSourceMode === 'QLDTTX'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cổng QLDTTX (Trực Tuyến)</span>
            {qldtData?.totalExams !== undefined && qldtData.totalExams > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  viewSourceMode === 'QLDTTX' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {qldtData.totalExams}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewSourceMode('FILE_TONG')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewSourceMode === 'FILE_TONG'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>File Lịch Thi Tổng Hợp</span>
            {totalRecords > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  viewSourceMode === 'FILE_TONG' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalRecords}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: XEM THEO CỔNG QLDTTX                                               */}
      {/* ========================================================================= */}
      {viewSourceMode === 'QLDTTX' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Header Card for QLDTTX */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-800">Lịch Thi Cá Nhân (Cổng QLDTTX)</h3>
                  {qldtData?.isCachedDb ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      Đã Lưu Trong CSDL
                    </span>
                  ) : qldtData?.isLiveSync ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đồng bộ Trực Tuyến QLĐT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      Dữ Liệu Đã Lưu
                    </span>
                  )}

                  {/* Last pull time */}
                  {qldtData?.lastSyncAt && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                      title="Thời điểm kéo dữ liệu từ Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX). Tự động cập nhật lại khi vào lại sau 10 phút."
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Lần kéo cuối:</span>
                      <strong className="font-mono text-slate-900">{formatSyncDateTime(qldtData.lastSyncAt)}</strong>
                      {getRelativeSyncTime(qldtData.lastSyncAt) && (
                        <span className="text-[10px] text-slate-500 font-normal">({getRelativeSyncTime(qldtData.lastSyncAt)})</span>
                      )}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cổng đào tạo: <strong className="text-indigo-600 font-mono">https://qldttx.pttc1.edu.vn/</strong> • {qldtData?.semesterName || 'Học kỳ thi'} • Tổng cộng <b>{qldtData?.totalExams || 0} môn thi</b>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Semester Selector */}
              {qldtData?.semesters && qldtData.semesters.length > 0 && (
                <div className="relative min-w-[200px]">
                  <select
                    value={selectedSemester || qldtData.semesterId}
                    onChange={(e) => {
                      const newSem = Number(e.target.value);
                      setSelectedSemester(newSem);
                      fetchQldtExams(false, newSem);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
                  >
                    {qldtData.semesters.map((s) => (
                      <option key={s.hocKy} value={s.hocKy}>
                        {s.tenHocKy}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Active Pull button from QLDTTX */}
              <button
                onClick={() => fetchQldtExams(true, selectedSemester)}
                disabled={isRefreshingQldt || isLoadingQldt}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                title="Chủ động kéo lại lịch thi mới nhất từ cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)"
              >
                {isRefreshingQldt ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                )}
                <span>{isRefreshingQldt ? 'Đang kéo lịch thi...' : 'Kéo Lại Từ QLDTTX'}</span>
              </button>

              {/* Export CSV */}
              {qldtData?.exams && qldtData.exams.length > 0 && (
                <button
                  onClick={handleExportQldtCSV}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Xuất danh sách lịch thi ra file CSV"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Xuất CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Sync Toast Feedback */}
          {syncFeedback && (
            <div
              className={`p-4 rounded-3xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {syncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
              <button onClick={() => setSyncFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Unlinked Account Notice Banner */}
          {!qldtData?.hasLinkedAccount && errorType === 'NOT_CONFIGURED' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Chưa liên kết tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Liên kết tài khoản QLDTTX để xem lịch thi chính thức từ trường, bao gồm phòng thi, số báo danh, địa điểm thi và hình thức thi.
                  </p>
                </div>
              </div>
              {onNavigateToExternalAccounts && (
                <button
                  onClick={onNavigateToExternalAccounts}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Liên Kết QLĐT Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Filter & Search Toolbar */}
          {qldtData?.exams && qldtData.exams.length > 0 && (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất Cả ({qldtData.exams.length})
                </button>
                <button
                  onClick={() => setStatusFilter('UPCOMING')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'UPCOMING'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Sắp Diễn Ra ({qldtData.upcomingExams.length})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('PAST')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'PAST'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Đã Thi Xong ({qldtData.pastExams.length})
                </button>
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm môn, phòng, hình thức thi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          {isLoadingQldt ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600">Đang tải lịch thi cá nhân từ QLDTTX...</span>
            </div>
          ) : !qldtData?.isConfigured && errorType === 'NOT_CONFIGURED' ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto my-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-800">Chưa Cấu Hình Tài Khoản QLDTTX</h4>
              <p className="text-xs text-slate-600 max-w-md">
                Vui lòng cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) để hệ thống tự động kéo thông tin lịch thi cá nhân, số báo danh và phòng thi.
              </p>
              {onNavigateToExternalAccounts && (
                <button
                  onClick={onNavigateToExternalAccounts}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Cấu Hình Tài Khoản Ngay
                </button>
              )}
            </div>
          ) : filteredQldtExams.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-800">Không Có Môn Thi Nào</h4>
              <p className="text-xs text-slate-500 max-w-md">
                {searchQuery
                  ? 'Không tìm thấy môn thi phù hợp với từ khóa tìm kiếm.'
                  : 'Bạn không có môn thi nào trong học kỳ này hoặc nhà trường chưa công bố lịch thi.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQldtExams.map((exam) => {
                const isUpcoming = exam.daysUntil >= 0;
                const isToday = exam.daysUntil === 0;

                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExamModal(exam)}
                    className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer group relative overflow-hidden"
                  >
                    {/* Top status indicator bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isToday
                          ? 'bg-rose-500'
                          : isUpcoming
                          ? 'bg-indigo-500'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                        <span className="font-mono text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                          {exam.maMon}
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getFormatBadgeColor(
                            exam.hinhThucThi
                          )}`}
                        >
                          {exam.hinhThucThi}
                        </span>

                        {isToday ? (
                          <span className="text-[10px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-full animate-pulse">
                            HÔM NAY THI
                          </span>
                        ) : isUpcoming ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Còn {exam.daysUntil} ngày
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Đã thi
                          </span>
                        )}
                      </div>

                      {/* Subject Name */}
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {exam.tenMon}
                      </h4>

                      {/* Date & Time Info */}
                      <div className="mt-3.5 bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Ngày thi:</span>
                          </div>
                          <strong className="text-slate-900 font-mono">{exam.ngayThi || 'Chưa công bố'}</strong>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>Giờ bắt đầu:</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 font-mono">{exam.gioBatDau || 'Chưa rõ'}</strong>
                            {exam.soPhut && <span className="text-[10px] text-slate-500 font-normal">({exam.soPhut})</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Building className="w-3.5 h-3.5 text-amber-600" />
                            <span>Phòng thi:</span>
                          </div>
                          <strong className="text-indigo-700 font-mono">{exam.maPhong || 'Chưa xếp phòng'}</strong>
                        </div>

                        {exam.toThi && (
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <User className="w-3.5 h-3.5 text-purple-600" />
                              <span>SBD / Tổ thi:</span>
                            </div>
                            <strong className="text-slate-900 font-mono">Tổ {exam.toThi} {exam.nhomThi ? `(Nhóm ${exam.nhomThi})` : ''}</strong>
                          </div>
                        )}
                      </div>

                      {/* Location Preview */}
                      {exam.diaDiemThi && (
                        <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-500 line-clamp-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{exam.diaDiemThi}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">{exam.kyThi}</span>
                      <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Xem chi tiết &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Chi Tiết Ca Thi QLDTTX */}
          {selectedExamModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setSelectedExamModal(null)}
                  className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5 mb-3">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    {selectedExamModal.maMon}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${getFormatBadgeColor(
                      selectedExamModal.hinhThucThi
                    )}`}
                  >
                    {selectedExamModal.hinhThucThi}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-4">{selectedExamModal.tenMon}</h3>

                <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Kỳ thi / Đợt thi:</span>
                    <strong className="text-slate-800">{selectedExamModal.kyThi} ({selectedExamModal.dotThi})</strong>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Ngày thi:</span>
                    <strong className="text-slate-900 font-mono text-sm">{selectedExamModal.ngayThi}</strong>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Giờ bắt đầu:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {selectedExamModal.gioBatDau} {selectedExamModal.soPhut && `(${selectedExamModal.soPhut})`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Phòng thi:</span>
                    <strong className="text-indigo-700 font-mono text-sm">{selectedExamModal.maPhong || 'Chưa rõ'}</strong>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Tổ thi / Nhóm thi:</span>
                    <strong className="text-slate-800 font-mono">
                      Tổ {selectedExamModal.toThi || '-'} | Nhóm {selectedExamModal.nhomThi || '-'}
                    </strong>
                  </div>

                  {selectedExamModal.siSo > 0 && (
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Sĩ số phòng thi:</span>
                      <strong className="text-slate-800">{selectedExamModal.siSo} thí sinh</strong>
                    </div>
                  )}

                  {selectedExamModal.ghepPhong && (
                    <div className="py-1 border-b border-slate-200/60">
                      <div className="text-slate-500 font-medium mb-1">Ghép phòng thi:</div>
                      <div className="text-slate-800 font-medium bg-white p-2 rounded-xl border border-slate-200">
                        {selectedExamModal.ghepPhong}
                      </div>
                    </div>
                  )}

                  {selectedExamModal.diaDiemThi && (
                    <div className="py-1">
                      <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>Địa điểm thi:</span>
                        </span>
                        <button
                          onClick={() => handleCopyText(selectedExamModal.diaDiemThi, 'addr')}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        >
                          {copiedId === 'addr' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === 'addr' ? 'Đã chép' : 'Sao chép địa chỉ'}</span>
                        </button>
                      </div>
                      <div className="text-slate-800 font-medium bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        {selectedExamModal.diaDiemThi}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setSelectedExamModal(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: XEM THEO FILE LỊCH THI TỔNG HỢP (ĐỢT THI IMPORT)                    */}
      {/* ========================================================================= */}
      {viewSourceMode === 'FILE_TONG' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {selectedExamRoom ? (
            <ExamRoomMembers
              roomRecord={selectedExamRoom}
              allRecords={records}
              batchCode={activeBatch?.code}
              onBack={() => setSelectedExamRoom(null)}
              onStudentClick={setConfirmStudentId}
              onClassClick={setConfirmClassCode}
              onTogglePostpone={handleToggleExamPostpone}
              canEditPostpone={canAccessMonitorTools}
            />
          ) : totalRecords === 0 && records.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa Có Dữ Liệu Lịch Thi File Tổng</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                Bạn không có lịch thi nào trong đợt thi này hoặc file lịch thi tổng chưa được Quản trị viên import. Bạn có thể chuyển sang tab <b>"Cổng QLDTTX"</b> ở trên để xem trực tiếp từ trường.
              </p>
              <button
                onClick={() => loadDataFromApi(activeBatch?.code)}
                disabled={isLoadingBatchData}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBatchData ? 'animate-spin' : ''}`} />
                {isLoadingBatchData ? 'Đang tải lại...' : 'Tải lại dữ liệu đợt thi'}
              </button>
            </div>
          ) : (
            <>
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                classes={classes}
                subjects={subjects}
                dates={dates}
                totalRecords={totalRecords}
                filteredCount={totalRecords}
                hideClassFilter={true}
              />
              <DataTable
                records={records}
                totalRecords={totalRecords}
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={setPageSize}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                onStudentClick={setConfirmStudentId}
                onClassClick={setConfirmClassCode}
                onRowClick={setSelectedExamRoom}
                onTogglePostpone={handleToggleExamPostpone}
                canEditPostpone={canAccessMonitorTools}
                isLoading={isLoadingBatchData}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
