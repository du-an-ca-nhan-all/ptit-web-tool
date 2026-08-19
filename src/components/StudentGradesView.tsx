import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  BookOpen,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
  GraduationCap,
  Layers,
  ArrowRight,
  Target,
  Calculator,
  Flame,
  Check,
  X,
  Copy,
  CheckCheck,
  Zap,
} from 'lucide-react';
import { LoginUser } from '../types';
import {
  StudentGradesResult,
  StudentCourseGrade,
  SemesterGradeSummary,
  GpaTrendItem,
  GradeDistributionBucket,
  AcademicTargetGoal,
} from '../lib/studentGradesService';

interface StudentGradesViewProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
}

// Helper định dạng ngày giờ cập nhật: "14:58:20 19/08/2026"
const formatSyncDateTime = (dateStr?: string | null) => {
  if (!dateStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Chưa cập nhật';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins}:${secs} ${day}/${month}/${year}`;
  } catch {
    return 'Chưa cập nhật';
  }
};

// Helper hiển thị thời gian tương đối: "vừa xong", "5 phút trước", "2 giờ trước", etc.
const getRelativeSyncTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 0) return 'vừa xong';
    if (diffSec < 60) return 'vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return 'hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return '';
  }
};

export default function StudentGradesView({
  currentUser,
  onNavigateToExternalAccounts,
}: StudentGradesViewProps) {
  const [data, setData] = useState<StudentGradesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'PROGRESSION' | 'DISTRIBUTION' | 'ADVISING' | 'SIMULATOR'>('PROGRESSION');
  const [selectedCourseModal, setSelectedCourseModal] = useState<StudentCourseGrade | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Fetch grades from API
  const fetchGrades = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setSyncFeedback(null);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setErrorType(null);

    try {
      const res = await fetch(`/api/student/grades${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setErrorType(null);
        if (refresh) {
          const syncTimeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
          setSyncFeedback({
            type: 'success',
            message: `Đồng bộ thành công dữ liệu bảng điểm mới nhất từ QLDTTX (lúc ${syncTimeFormatted})!`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        }
      } else {
        const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
        setErrorType(type);
        setError(json.error || 'Không thể tải kết quả học tập');
        if (json.username) {
          setData(json);
        }
        if (refresh) {
          setSyncFeedback({
            type: 'error',
            message: json.error || 'Đồng bộ từ cổng QLDTTX thất bại. Vui lòng kiểm tra lại tài khoản.',
          });
        }
      }
    } catch (err: any) {
      setErrorType('SERVER_ERROR');
      setError('Lỗi kết nối máy chủ khi lấy dữ liệu bảng điểm');
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: 'Lỗi kết nối máy chủ khi đồng bộ điểm từ QLDTTX.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Filtered semesters and courses
  const semesters = useMemo(() => data?.semesters || [], [data]);

  const filteredSemesters = useMemo(() => {
    return semesters
      .filter((sem) => selectedSemester === 'ALL' || sem.semesterId === selectedSemester)
      .map((sem) => {
        const filteredCourses = sem.courses.filter((course) => {
          // Grade status filter
          let matchGrade = true;
          if (selectedGradeFilter === 'PASSED') matchGrade = course.isPassed === true;
          else if (selectedGradeFilter === 'FAILED') matchGrade = course.isPassed === false;
          else if (selectedGradeFilter === 'IN_PROGRESS') matchGrade = course.isPassed === null;
          else if (selectedGradeFilter === 'EXCELLENT') matchGrade = course.letterGrade === 'A+' || course.letterGrade === 'A';
          else if (selectedGradeFilter === 'LOW') matchGrade = course.letterGrade === 'C' || course.letterGrade === 'D+' || course.letterGrade === 'D' || course.letterGrade === 'F';

          // Search query
          const q = searchQuery.toLowerCase().trim();
          const matchQuery =
            !q ||
            course.subjectName.toLowerCase().includes(q) ||
            course.subjectCode.toLowerCase().includes(q) ||
            course.group.toLowerCase().includes(q);

          return matchGrade && matchQuery;
        });

        return {
          ...sem,
          courses: filteredCourses,
        };
      })
      .filter((sem) => sem.courses.length > 0 || selectedGradeFilter === 'ALL');
  }, [semesters, selectedSemester, selectedGradeFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!data || !data.semesters) return;
    let csv = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese
    csv += 'Học kỳ,Mã MH,Tên môn học,Số tín chỉ,Nhóm/Tổ,Điểm thi,Điểm TK (10),Điểm TK (4),Điểm TK (C),Kết quả,Ghi chú\n';

    data.semesters.forEach((sem) => {
      sem.courses.forEach((c) => {
        const status = c.isPassed === true ? 'Đạt' : c.isPassed === false ? 'Chưa đạt' : 'Đang học';
        const note = c.reasonNotCalculated || (c.isCalculatedInGpa ? 'Tính điểm TB' : 'Không tính điểm TB');
        csv += `"${sem.semesterName}","${c.subjectCode}","${c.subjectName}",${c.credits},"${c.group}","${c.examScore ?? ''}","${c.finalScore10 ?? ''}","${c.finalScore4 ?? ''}","${c.letterGrade}","${status}","${note}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_diem_${currentUser.username}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy grade summary text
  const handleCopySummary = () => {
    if (!data?.summary) return;
    const s = data.summary;
    const text = `📊 KẾT QUẢ HỌC TẬP PTIT EDUSYNC - SINH VIÊN ${currentUser.username}
• Họ và tên: ${currentUser.fullName || currentUser.username}
• Điểm TB tích lũy hệ 4: ${s.gpa4 !== null ? s.gpa4.toFixed(2) : '—'} / 4.0
• Điểm TB tích lũy hệ 10: ${s.gpa10 !== null ? s.gpa10.toFixed(2) : '—'} / 10.0
• Xếp loại học lực: ${s.classification}
• Số tín chỉ tích lũy: ${s.totalCreditsAccumulated} / ${s.curriculumTargetCredits} TC (${s.graduationProgressRate}%)
• Tỉ lệ hoàn thành môn: ${s.passRate}% (${s.totalPassedSubjects} môn đạt, ${s.totalInProgressSubjects} môn đang học)
• Cập nhật lần cuối: ${formatSyncDateTime(data.lastSyncAt)}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Top Banner / Quick Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl shadow-xs shadow-indigo-500/20 shrink-0 mt-0.5 sm:mt-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-black text-slate-800">Bảng Điểm & Kết Quả Học Tập</h2>
              {data?.isCachedDb ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                  Đã Lưu CSDL
                </span>
              ) : data?.isLiveSync ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ Trực Tuyến
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  Dữ Liệu Đã Lưu
                </span>
              )}

              {/* Last Update Badge */}
              {data?.lastSyncAt && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                  title="Thời điểm kéo dữ liệu từ Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)"
                >
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Cập nhật:</span>
                  <strong className="font-mono text-slate-900">{formatSyncDateTime(data.lastSyncAt)}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Cổng: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • Tổng số <b>{semesters.length} học kỳ</b> ({summary?.totalSubjects || 0} học phần)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Pull button from QLDTTX */}
          <button
            onClick={() => fetchGrades(true)}
            disabled={isRefreshing || isLoading}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Chủ động kết nối và kéo bảng điểm, điểm thành phần mới nhất từ Cổng Quản Lý Đào Tạo Từ Xa"
          >
            {isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            )}
            <span>{isRefreshing ? 'Đang kéo...' : 'Đồng Bộ QLDTTX'}</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Sao chép tóm tắt kết quả học tập"
          >
            {copiedSummary ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? 'Đã chép' : 'Sao Chép'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!data?.semesters?.length}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl sm:rounded-2xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Xuất bảng điểm ra file Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Message Banner */}
      {syncFeedback && (
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="p-1 bg-rose-500 text-white rounded-lg shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unlinked Account Notice Banner */}
      {!data?.hasLinkedAccount && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Chưa liên kết tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Liên kết tài khoản QLDTTX để hệ thống tự động trích xuất bảng điểm thi, điểm thành phần và phân tích tiến độ học tập chi tiết.
              </p>
            </div>
          </div>
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Liên Kết QLĐT Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[400px]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Đang tải bảng điểm và phân tích kết quả học tập...</span>
        </div>
      ) : errorType === 'NOT_CONFIGURED' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Yêu Cầu Cấu Hình Cổng QLDTTX (PTTC1)</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Chưa Cấu Hình Tài Khoản Đào Tạo Từ Xa
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Để xem được <b>Bảng Điểm & Kết Quả Học Tập</b> từ nhà trường, bạn cần cấu hình thông tin đăng nhập tại Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-indigo-600">https://qldttx.pttc1.edu.vn/</span>).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 text-left w-full space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Các phân tích hữu ích có sẵn khi kết nối:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px]">
              <li>Điểm trung bình tích lũy hệ 4.0 và hệ 10.0 cập nhật thời gian thực</li>
              <li>Chi tiết từng thành phần điểm (Điểm thi, Kiểm tra, Chuyên cần, Bài tập lớn)</li>
              <li>Biểu đồ xu hướng GPA qua từng học kỳ và phân bố điểm chữ A/B/C/D/F</li>
              <li>Bộ mô phỏng mục tiêu tốt nghiệp (Bằng Khá, Giỏi, Xuất sắc)</li>
            </ul>
          </div>

          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Award className="w-4 h-4" />
              <span>Đến Cấu Hình Tài Khoản QLDTTX Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : errorType === 'INVALID_CREDENTIALS' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Lỗi Xác Thực Tài Khoản QLDTTX</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Tài Khoản Hoặc Mật Khẩu Không Chính Xác
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Không thể đăng nhập vào cổng QLDTTX để lấy dữ liệu bảng điểm. Vui lòng kiểm tra lại mã sinh viên và mật khẩu.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {onNavigateToExternalAccounts && (
              <button
                onClick={onNavigateToExternalAccounts}
                className="px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Cập Nhật Lại Mật Khẩu QLDTTX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => fetchGrades(true)}
              disabled={isRefreshing}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Thử Lại</span>
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-800">Không thể tải kết quả học tập</h3>
          <p className="text-xs text-slate-500 max-w-md">{error}</p>
          <button
            onClick={() => fetchGrades(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* OVERVIEW KEY STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: GPA Cumulative */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-5 shadow-sm border border-indigo-700/50 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">GPA Tích Lũy</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900 shadow-xs">
                    {summary?.classification || 'Khá'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
                    {summary?.gpa4 !== null ? summary?.gpa4.toFixed(2) : '—'}
                  </span>
                  <span className="text-xs text-indigo-200 font-bold">/ 4.0</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-indigo-700/60 flex items-center justify-between text-xs text-indigo-200">
                <span>Hệ 10: <b className="text-white font-mono">{summary?.gpa10 !== null ? summary?.gpa10.toFixed(2) : '—'}</b></span>
                <span>Học lực: <b className="text-emerald-300">{summary?.classification}</b></span>
              </div>
            </div>

            {/* Card 2: Credits Earned */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tín Chỉ Tích Lũy</span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-800 font-mono">
                    {summary?.totalCreditsAccumulated || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ {summary?.curriculumTargetCredits || 130} TC</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summary?.graduationProgressRate || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Tiến độ tốt nghiệp</span>
                  <span className="font-bold text-emerald-600">{summary?.graduationProgressRate || 0}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Completion & Pass Rate */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỉ Lệ Đạt Môn</span>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl sm:text-4xl font-black text-blue-600 font-mono">
                    {summary?.passRate || 0}%
                  </span>
                  <span className="text-xs text-slate-400 font-bold">hoàn thành</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Đạt: <b className="text-emerald-600 font-bold">{summary?.totalPassedSubjects || 0} môn</b></span>
                <span>Rớt: <b className="text-rose-600 font-bold">{summary?.totalFailedSubjects || 0} môn</b></span>
              </div>
            </div>

            {/* Card 4: In-Progress / Current Term */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Môn Đang Học</span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl sm:text-4xl font-black text-amber-600 font-mono">
                    {summary?.totalInProgressSubjects || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">môn ({summary?.totalInProgressCredits || 0} TC)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 text-[11px] text-slate-500" title="Thời gian hệ thống kéo điểm từ cổng QLDTTX">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Đồng bộ: <b className="text-slate-800">{data?.lastSyncAt ? getRelativeSyncTime(data.lastSyncAt) || 'Vừa xong' : '—'}</b></span>
                </span>
                <span className="font-bold text-indigo-600">Kỳ hiện tại</span>
              </div>
            </div>
          </div>

          {/* ANALYTICS SECTION ("CÁC PHÂN TÍCH LỌ KIA") */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
            {/* Analytics Sub-tabs header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Phân Tích Chuyên Sâu & Xu Hướng Học Tập</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê tiến trình GPA, ma trận phân bố điểm chữ và mô phỏng mục tiêu tốt nghiệp
                </p>
              </div>

              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 overflow-x-auto">
                <button
                  onClick={() => setActiveAnalyticsTab('PROGRESSION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeAnalyticsTab === 'PROGRESSION'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Tiến Trình GPA</span>
                </button>

                <button
                  onClick={() => setActiveAnalyticsTab('DISTRIBUTION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeAnalyticsTab === 'DISTRIBUTION'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Phân Bố Điểm Chữ</span>
                </button>

                <button
                  onClick={() => setActiveAnalyticsTab('ADVISING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeAnalyticsTab === 'ADVISING'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Môn Cần Cải Thiện</span>
                </button>

                <button
                  onClick={() => setActiveAnalyticsTab('SIMULATOR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeAnalyticsTab === 'SIMULATOR'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-purple-500" />
                  <span>Dự Báo Mục Tiêu</span>
                </button>
              </div>
            </div>

            {/* TAB 1: GPA PROGRESSION CHART / TIMELINE */}
            {activeAnalyticsTab === 'PROGRESSION' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data?.gpaProgression.map((prog, idx) => {
                    const isCurrent = idx === data.gpaProgression.length - 1;
                    return (
                      <div
                        key={prog.semesterId}
                        className={`rounded-2xl p-4 border transition-all ${
                          isCurrent
                            ? 'bg-indigo-50/50 border-indigo-300 shadow-xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-800">{prog.semesterName}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">HK {prog.semesterId}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">GPA Học Kỳ</span>
                            <div className="text-lg font-black font-mono text-indigo-600 mt-0.5">
                              {prog.gpa4 !== null ? prog.gpa4.toFixed(2) : '—'}
                              <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4.0</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Hệ 10: {prog.gpa10 !== null ? prog.gpa10.toFixed(2) : '—'}</span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">GPA Tích Lũy</span>
                            <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                              {prog.gpaCumulative4 !== null ? prog.gpaCumulative4.toFixed(2) : '—'}
                              <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4.0</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Hệ 10: {prog.gpaCumulative10 !== null ? prog.gpaCumulative10.toFixed(2) : '—'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>TC Đạt Kỳ: <b>{prog.creditsSemester} TC</b></span>
                          <span>TC Tích Lũy: <b className="text-emerald-700">{prog.creditsCumulative} TC</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Visual Height Progression Comparison */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Biểu Đồ Tương Quan GPA Qua Từng Kỳ</span>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-indigo-600" /> GPA Kỳ</div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500" /> GPA Tích Lũy</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 pt-6 pb-2 items-end min-h-[160px]">
                    {data?.gpaProgression.map((prog) => {
                      const semGpa = prog.gpa4 ?? 0;
                      const cumGpa = prog.gpaCumulative4 ?? 0;
                      const semHeight = Math.max(10, (semGpa / 4.0) * 120);
                      const cumHeight = Math.max(10, (cumGpa / 4.0) * 120);

                      return (
                        <div key={prog.semesterId} className="flex flex-col items-center gap-2">
                          <div className="flex items-end gap-2 h-[130px]">
                            {/* Semester GPA Bar */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-mono font-bold text-indigo-700">
                                {prog.gpa4 !== null ? prog.gpa4.toFixed(2) : ''}
                              </span>
                              <div
                                className="w-8 sm:w-12 bg-indigo-600 rounded-t-xl transition-all duration-500 shadow-sm"
                                style={{ height: `${semHeight}px` }}
                              />
                            </div>

                            {/* Cumulative GPA Bar */}
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[10px] font-mono font-bold text-emerald-700">
                                {prog.gpaCumulative4 !== null ? prog.gpaCumulative4.toFixed(2) : ''}
                              </span>
                              <div
                                className="w-8 sm:w-12 bg-emerald-500 rounded-t-xl transition-all duration-500 shadow-sm"
                                style={{ height: `${cumHeight}px` }}
                              />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 text-center truncate max-w-[120px]">
                            {prog.semesterId}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GRADE DISTRIBUTION */}
            {activeAnalyticsTab === 'DISTRIBUTION' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data?.gradeDistribution.buckets.map((b) => (
                    <div key={b.grade} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-sm shadow-xs ${b.colorClass}`}>
                            {b.grade}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{b.description}</span>
                            <span className="text-[10px] text-slate-400">{b.credits} Tín chỉ</span>
                          </div>
                        </div>
                        <span className="text-base font-black font-mono text-slate-800">{b.count} môn</span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="h-1.5 bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${b.percentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-right font-mono text-slate-400 mt-1">
                        {b.percentage.toFixed(1)}% tổng số môn
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SMART ADVISING & IMPROVEMENT COURSES */}
            {activeAnalyticsTab === 'ADVISING' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* High Achieving Courses */}
                  <div className="border border-emerald-200 bg-emerald-50/30 rounded-3xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                      <h4 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>Môn Đạt Điểm Xuất Sắc (A / A+) ({data?.topCourses.length || 0})</span>
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-700">Điểm cao</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
                      {data?.topCourses.map((c) => (
                        <div key={c.id} className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{c.subjectName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{c.subjectCode} • {c.credits} TC • {c.semesterId}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-lg border border-emerald-300 font-mono">
                              {c.letterGrade} ({c.finalScore10?.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      ))}
                      {!data?.topCourses.length && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">Chưa có môn nào đạt điểm A/A+.</div>
                      )}
                    </div>
                  </div>

                  {/* Improvement Courses */}
                  <div className="border border-amber-200 bg-amber-50/30 rounded-3xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                      <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-600" />
                        <span>Cơ Hội Học Cải Thiện Nâng GPA ({data?.improvementCourses.length || 0})</span>
                      </h4>
                      <span className="text-[11px] font-bold text-amber-700">Điểm C / D / F</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
                      {data?.improvementCourses.map((c) => (
                        <div key={c.id} className="bg-white p-3 rounded-2xl border border-amber-100 shadow-2xs flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{c.subjectName}</span>
                            <span className="text-[10px] font-mono text-slate-400">{c.subjectCode} • {c.credits} TC • {c.semesterId}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-xs rounded-lg border border-amber-300 font-mono">
                              {c.letterGrade} ({c.finalScore10?.toFixed(1)})
                            </span>
                            <span className="block text-[10px] text-amber-600 font-bold mt-0.5">Có thể học cải thiện</span>
                          </div>
                        </div>
                      ))}
                      {!data?.improvementCourses.length && (
                        <div className="text-center py-6 text-emerald-600 text-xs font-bold">Tuyệt vời! Không có môn nào điểm thấp cần cải thiện.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GRADUATION TARGET SIMULATOR */}
            {activeAnalyticsTab === 'SIMULATOR' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data?.targetGoals.map((goal, idx) => (
                    <div
                      key={idx}
                      className={`rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                        goal.status === 'ACHIEVED'
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : goal.status === 'POSSIBLE'
                          ? 'bg-blue-50/50 border-blue-300'
                          : goal.status === 'CHALLENGING'
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-rose-50/50 border-rose-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-slate-800">{goal.label}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              goal.status === 'ACHIEVED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : goal.status === 'POSSIBLE'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : goal.status === 'CHALLENGING'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {goal.status === 'ACHIEVED'
                              ? 'Đã Đạt'
                              : goal.status === 'POSSIBLE'
                              ? 'Khả Thi Cao'
                              : goal.status === 'CHALLENGING'
                              ? 'Cần Nỗ Lực'
                              : 'Khó Đạt'}
                          </span>
                        </div>

                        <div className="my-3">
                          <span className="text-[11px] text-slate-500 uppercase font-bold block">GPA Yêu Cầu Các Kỳ Tới</span>
                          <div className="text-2xl font-black font-mono text-slate-800 mt-1">
                            {goal.requiredGpaOnRemaining !== null ? (
                              <span className={goal.requiredGpaOnRemaining <= 3.2 ? 'text-blue-600' : 'text-amber-600'}>
                                {goal.requiredGpaOnRemaining.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-600">Đã Hoàn Thành</span>
                            )}
                            {goal.requiredGpaOnRemaining !== null && (
                              <span className="text-xs text-slate-400 font-normal ml-1">/ 4.0</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 italic bg-white/70 p-3 rounded-2xl border border-slate-200/60 mt-2">
                        {goal.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DETAILED SEMESTER-BY-SEMESTER GRADE TABLES */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">Bảng Điểm Chi Tiết Từng Môn Học</h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Semester filter */}
                <div className="relative min-w-[170px]">
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
                  >
                    <option value="ALL">Tất Cả Học Kỳ ({semesters.length})</option>
                    {semesters.map((s) => (
                      <option key={s.semesterId} value={s.semesterId}>
                        {s.semesterName}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Grade status filter */}
                <div className="relative min-w-[150px]">
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
                  >
                    <option value="ALL">Tất Cả Trạng Thái</option>
                    <option value="PASSED">Môn Đã Đạt</option>
                    <option value="IN_PROGRESS">Môn Đang Học (Chưa nhập điểm)</option>
                    <option value="FAILED">Môn Chưa Đạt (Rớt / F)</option>
                    <option value="EXCELLENT">Điểm Cao (A/A+)</option>
                    <option value="LOW">Điểm Thấp (C/D/F)</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative min-w-[150px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã / tên môn..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Semester Tables Accordion */}
            <div className="flex flex-col gap-6">
              {filteredSemesters.map((sem) => (
                <div key={sem.semesterId} className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {/* Semester Header banner */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold font-mono text-sm text-indigo-300">
                        {sem.semesterId.slice(-2)}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white">{sem.semesterName}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Mã HK: {sem.semesterId} • {sem.courses.length} học phần
                        </span>
                      </div>
                    </div>

                    {/* Quick Semester Metrics */}
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      {sem.gpa4Semester !== null && (
                        <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                          <span className="text-slate-300">GPA Kỳ:</span>
                          <span className="font-mono font-black text-amber-300">{sem.gpa4Semester.toFixed(2)}</span>
                        </div>
                      )}

                      {sem.gpa4Cumulative !== null && (
                        <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                          <span className="text-slate-300">GPA TL:</span>
                          <span className="font-mono font-black text-emerald-300">{sem.gpa4Cumulative.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <span className="text-slate-300">TC Đạt:</span>
                        <span className="font-mono font-bold text-white">{sem.creditsPassedSemester} TC</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Course Cards (Mobile View) */}
                  <div className="block md:hidden p-3.5 divide-y divide-slate-100">
                    {sem.courses.map((course, idx) => (
                      <div
                        key={course.id}
                        className={`py-3.5 first:pt-1 last:pb-1 flex flex-col gap-2.5 ${
                          course.isPassed === false ? 'bg-rose-50/30 -mx-3.5 px-3.5 rounded-xl' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {course.subjectCode}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {course.credits} TC • Nhóm {course.group}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 leading-snug">
                              {course.subjectName}
                            </h5>
                            {!course.isCalculatedInGpa && course.reasonNotCalculated && (
                              <span className="text-[10px] text-amber-700 italic block mt-0.5">
                                • {course.reasonNotCalculated}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {course.letterGrade ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border shadow-2xs ${
                                  course.letterGrade.startsWith('A')
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : course.letterGrade.startsWith('B')
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : course.letterGrade.startsWith('C')
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : course.letterGrade.startsWith('D')
                                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {course.letterGrade}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-bold">—</span>
                            )}

                            {course.isPassed === true ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Đạt
                              </span>
                            ) : course.isPassed === false ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <X className="w-2.5 h-2.5 stroke-[3]" /> Chưa đạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-2.5 h-2.5" /> Đang học
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Scores Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Điểm Thi</span>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {course.examScore !== null ? course.examScore.toFixed(1) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Tổng Kết (10)</span>
                            <span className="text-xs font-mono font-black text-slate-800">
                              {course.finalScore10 !== null ? course.finalScore10.toFixed(1) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Tổng Kết (4)</span>
                            <span className="text-xs font-mono font-black text-indigo-600">
                              {course.finalScore4 !== null ? course.finalScore4.toFixed(1) : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Chi tiết TP) */}
                        {course.components.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCourseModal(course)}
                            className="w-full py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition text-[11px] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <span>Xem chi tiết {course.components.length} điểm thành phần</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Course Table (Desktop View) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-center">STT</th>
                          <th className="px-4 py-3">Mã MH</th>
                          <th className="px-4 py-3">Tên Môn Học</th>
                          <th className="px-4 py-3 text-center">TC</th>
                          <th className="px-4 py-3 text-center">Tổ/Nhóm</th>
                          <th className="px-4 py-3 text-center">Điểm Thi</th>
                          <th className="px-4 py-3 text-center">Điểm TK (10)</th>
                          <th className="px-4 py-3 text-center">Điểm TK (4)</th>
                          <th className="px-4 py-3 text-center">Điểm Chữ</th>
                          <th className="px-4 py-3 text-center">Kết Quả</th>
                          <th className="px-4 py-3 text-center">Chi Tiết TP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sem.courses.map((course, idx) => (
                          <tr
                            key={course.id}
                            className={`transition-colors hover:bg-slate-50/80 ${
                              course.isPassed === true
                                ? ''
                                : course.isPassed === false
                                ? 'bg-rose-50/30'
                                : 'bg-slate-50/20'
                            }`}
                          >
                            <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{course.subjectCode}</td>
                            <td className="px-4 py-3.5 font-bold text-slate-800">
                              <div className="flex flex-col">
                                <span>{course.subjectName}</span>
                                {!course.isCalculatedInGpa && course.reasonNotCalculated && (
                                  <span className="text-[10px] font-normal text-amber-700 italic">
                                    • {course.reasonNotCalculated}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{course.credits}</td>
                            <td className="px-4 py-3.5 text-center font-mono text-slate-500">{course.group}</td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                              {course.examScore !== null ? course.examScore.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-black text-slate-800">
                              {course.finalScore10 !== null ? course.finalScore10.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-black text-indigo-600">
                              {course.finalScore4 !== null ? course.finalScore4.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {course.letterGrade ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono border ${
                                    course.letterGrade.startsWith('A')
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : course.letterGrade.startsWith('B')
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : course.letterGrade.startsWith('C')
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : course.letterGrade.startsWith('D')
                                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                                      : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {course.letterGrade}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {course.isPassed === true ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đạt
                                </span>
                              ) : course.isPassed === false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3 h-3 stroke-[3]" /> Chưa đạt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3 h-3" /> Đang học
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {course.components.length > 0 ? (
                                <button
                                  onClick={() => setSelectedCourseModal(course)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition text-[11px] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>{course.components.length} TP</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {!filteredSemesters.length && (
                <div className="py-16 text-center text-slate-400 italic text-xs">
                  Không tìm thấy môn học nào phù hợp với bộ lọc đã chọn.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* COMPONENT GRADES MODAL (CHI TIẾT ĐIỂM THÀNH PHẦN) */}
      {selectedCourseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 font-mono">
                  {selectedCourseModal.subjectCode} • {selectedCourseModal.credits} Tín chỉ
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-0.5">{selectedCourseModal.subjectName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCourseModal.semesterName} (Nhóm {selectedCourseModal.group})</p>
              </div>
              <button
                onClick={() => setSelectedCourseModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Danh Sách Điểm Thành Phần</h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Ký Hiệu</th>
                      <th className="px-4 py-2.5">Tên Thành Phần</th>
                      <th className="px-4 py-2.5 text-center">Trọng Số</th>
                      <th className="px-4 py-2.5 text-center">Điểm Số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCourseModal.components.map((tp, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{tp.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{tp.name}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">{tp.weight}%</td>
                        <td className="px-4 py-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">
                          {tp.score !== null ? tp.score.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Kết (10)</span>
                <span className="text-lg font-black font-mono text-slate-800 mt-0.5 block">
                  {selectedCourseModal.finalScore10 !== null ? selectedCourseModal.finalScore10.toFixed(1) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Kết (4)</span>
                <span className="text-lg font-black font-mono text-indigo-600 mt-0.5 block">
                  {selectedCourseModal.finalScore4 !== null ? selectedCourseModal.finalScore4.toFixed(1) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Điểm Chữ</span>
                <span className="text-lg font-black font-mono text-emerald-600 mt-0.5 block">
                  {selectedCourseModal.letterGrade || '—'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCourseModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
