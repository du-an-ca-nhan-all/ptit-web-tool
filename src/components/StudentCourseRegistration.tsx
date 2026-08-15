import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  RefreshCw,
  Zap,
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  GraduationCap,
  DollarSign,
  Globe,
  ExternalLink,
  ChevronRight,
  Info,
  Filter,
  Check,
  X,
  FileText,
  Users,
} from 'lucide-react';
import { LoginUser } from '../types';

interface StudentCourseRegistrationProps {
  currentUser: LoginUser;
  onNavigateTab?: (tab: string) => void;
}

export default function StudentCourseRegistration({
  currentUser,
  onNavigateTab,
}: StudentCourseRegistrationProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [summary, setSummary] = useState<{
    totalCourses: number;
    totalCredits: number;
    tuitionFee: number;
    lastPulledAt: string | null;
    hasRegistration: boolean;
    classCode: string;
    externalAccount: {
      isConfigured: boolean;
      status: string;
      hasToken: boolean;
      lastSyncAt: string | null;
    };
  }>({
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
    lastPulledAt: null,
    hasRegistration: false,
    classCode: currentUser.lop || '',
    externalAccount: {
      isConfigured: false,
      status: 'DISCONNECTED',
      hasToken: false,
      lastSyncAt: null,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [isBatchPulling, setIsBatchPulling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<any | null>(null);

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = currentUser?.isAdmin || (currentUser?.role ? currentUser.role.includes('admin') : false);
  const isMonitor = currentUser?.isMonitor || (currentUser?.role ? currentUser.role.includes('lop_truong') : false);

  // 1. Fetch current registered courses from database
  const fetchRegisteredCourses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/course-registrations?username=${currentUser.username}&classCode=${currentUser.lop || ''}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCourses(data.courses || []);
        setSummary({
          totalCourses: data.totalCourses || (data.courses || []).length,
          totalCredits: data.totalCredits || 0,
          tuitionFee: data.tuitionFee || 0,
          lastPulledAt: data.lastPulledAt,
          hasRegistration: data.hasRegistration,
          classCode: data.classCode,
          externalAccount: data.externalAccount || {
            isConfigured: false,
            status: 'DISCONNECTED',
            hasToken: false,
            lastSyncAt: null,
          },
        });
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu môn học đã đăng ký');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisteredCourses();
  }, [currentUser.username]);

  // 2. Active Pull from QLDTTX portal
  const handlePullFromQLDTTX = async () => {
    setIsPulling(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/course-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL',
          targetUsername: currentUser.username,
          classCode: currentUser.lop,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setCourses(data.courses || []);
        setSummary((prev) => ({
          ...prev,
          totalCourses: data.totalCourses || (data.courses || []).length,
          totalCredits: data.totalCredits || 0,
          tuitionFee: data.tuitionFee || 0,
          lastPulledAt: data.lastPulledAt,
          hasRegistration: true,
        }));
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Đồng bộ từ cổng QLDTTX thất bại');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsPulling(false);
    }
  };

  // 3. Batch Pull for class (Admin / Monitor)
  const handleBatchPullClass = async () => {
    if (!confirm(`Bạn có chắc chắn muốn đồng bộ toàn bộ môn học đã đăng ký cho các sinh viên lớp ${currentUser.lop}?`)) {
      return;
    }

    setIsBatchPulling(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/course-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_PULL',
          classCode: currentUser.lop,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchRegisteredCourses();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.error || 'Đồng bộ hàng loạt thất bại');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsBatchPulling(false);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((item) => {
      const toHoc = item.to_hoc || {};
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        (toHoc.ma_mon && toHoc.ma_mon.toLowerCase().includes(query)) ||
        (toHoc.ten_mon && toHoc.ten_mon.toLowerCase().includes(query)) ||
        (toHoc.nhom_to && toHoc.nhom_to.toLowerCase().includes(query)) ||
        (toHoc.lop && toHoc.lop.toLowerCase().includes(query)) ||
        (toHoc.tkb && toHoc.tkb.toLowerCase().includes(query))
      );
    });
  }, [courses, searchQuery]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Môn Học Đã Đăng Ký (ĐKMH)
                </h1>
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Kỳ Hiện Tại
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Sinh viên: <strong className="text-indigo-600 font-mono">{currentUser.fullName || currentUser.username}</strong> ({currentUser.username}) • Lớp: <strong className="text-blue-600">{currentUser.lop || 'Chưa phân lớp'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Reload local button */}
          <button
            onClick={fetchRegisteredCourses}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại từ cơ sở dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          {/* Active Pull from QLDTTX button */}
          <button
            onClick={handlePullFromQLDTTX}
            disabled={isPulling}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Đồng bộ kết quả ĐKMH trực tiếp từ cổng trường QLDTTX"
          >
            {isPulling ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            )}
            <span>Đồng Bộ Từ QLDTTX</span>
          </button>

          {/* Batch Pull for monitor/admin */}
          {(isAdmin || isMonitor) && currentUser.lop && (
            <button
              onClick={handleBatchPullClass}
              disabled={isBatchPulling}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-amber-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Kéo kết quả ĐKMH cho toàn bộ sinh viên trong lớp đã liên kết tài khoản"
            >
              {isBatchPulling ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Đồng Bộ Cả Lớp</span>
            </button>
          )}

          {/* Quick Navigate to Course Compare */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('course_compare')}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-2xl transition-colors border border-blue-200 flex items-center gap-1.5 cursor-pointer"
              title="So sánh kết quả ĐKMH với Lớp trưởng"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>So Sánh ĐKMH</span>
            </button>
          )}
        </div>
      </div>

      {/* External Account Not Linked Warning */}
      {!summary.externalAccount?.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Chưa cấu hình tài khoản QLĐT Từ Xa
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Để hệ thống tự động kéo kết quả đăng ký môn học trực tiếp từ cổng trường (https://qldttx.pttc1.edu.vn/), vui lòng liên kết tài khoản trong phần Hồ Sơ.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              Cấu Hình Ngay →
            </button>
          )}
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Số Môn Đã Đăng Ký</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {summary.totalCourses}{' '}
              <span className="text-xs font-normal text-slate-400">môn học</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">Học kỳ hiện tại</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Số Tín Chỉ</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {summary.totalCredits}{' '}
              <span className="text-xs font-normal text-slate-400">tín chỉ (TC)</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Khối lượng học tập</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Học Phí Tạm Tính</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {summary.tuitionFee.toLocaleString('vi-VN')} <span className="text-xs font-bold text-slate-400">đ</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Theo biểu giá PTTC1</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đồng Bộ Lần Cuối</div>
            <div className="text-sm font-bold text-slate-800 truncate mt-0.5">
              {summary.lastPulledAt ? new Date(summary.lastPulledAt).toLocaleTimeString('vi-VN') : 'Chưa đồng bộ'}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {summary.lastPulledAt ? new Date(summary.lastPulledAt).toLocaleDateString('vi-VN') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên môn, mã môn, nhóm tổ, TKB..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-bold self-end sm:self-center">
            Hiển thị: <strong className="text-blue-600">{filteredCourses.length}</strong> / {courses.length} môn học
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải danh sách môn học đã đăng ký...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu môn học đã đăng ký</p>
              <p className="text-xs text-slate-400 max-w-sm">
                {summary.externalAccount?.isConfigured
                  ? 'Bấm nút "Đồng Bộ Từ QLDTTX" phía trên để kéo toàn bộ môn học kỳ này về máy.'
                  : 'Vui lòng liên kết tài khoản cổng QLĐT Từ Xa để tải môn học.'}
              </p>
              {summary.externalAccount?.isConfigured && (
                <button
                  onClick={handlePullFromQLDTTX}
                  disabled={isPulling}
                  className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>Đồng Bộ Ngay</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">STT</th>
                  <th className="px-4 py-3.5">Mã Môn</th>
                  <th className="px-4 py-3.5">Tên Môn Học</th>
                  <th className="px-4 py-3.5 text-center">Số TC</th>
                  <th className="px-4 py-3.5 text-center">Nhóm / Tổ</th>
                  <th className="px-4 py-3.5">Lớp Học Phần</th>
                  <th className="px-4 py-3.5">Thời Khóa Biểu (TKB)</th>
                  <th className="px-4 py-3.5 text-right">Học Phí (VNĐ)</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((item, index) => {
                  const toHoc = item.to_hoc || {};
                  const soTC = toHoc.so_tc || toHoc.so_tc_hp || 0;
                  const fee = toHoc.phai_dong || item.hoc_phi_tam_tinh || 0;
                  const formattedFee = Number(fee).toLocaleString('vi-VN');

                  return (
                    <tr
                      key={item.id_kqdk || index}
                      onClick={() => setSelectedCourseDetail(item)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                          {toHoc.ma_mon}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 text-sm">{toHoc.ten_mon}</span>
                        {item.ngay_dang_ky && (
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Đăng ký: {new Date(item.ngay_dang_ky).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                          {soTC} TC
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                          {toHoc.nhom_to || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {toHoc.lop || '—'}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        {toHoc.tkb ? (
                          <div
                            className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: toHoc.tkb }}
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa xếp TKB</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                        {formattedFee} đ
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3" /> Đã Đăng Ký
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal View Course Detail */}
      {selectedCourseDetail && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCourseDetail(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedCourseDetail.to_hoc?.ten_mon}</h3>
                  <p className="text-xs text-blue-100 font-mono mt-0.5">
                    Mã môn: {selectedCourseDetail.to_hoc?.ma_mon} • Nhóm tổ: {selectedCourseDetail.to_hoc?.nhom_to}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-0.5">Số tín chỉ:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedCourseDetail.to_hoc?.so_tc || selectedCourseDetail.to_hoc?.so_tc_hp} TC
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-0.5">Học phí phải đóng:</span>
                  <span className="font-bold text-emerald-700 text-sm font-mono">
                    {Number(selectedCourseDetail.to_hoc?.phai_dong || selectedCourseDetail.hoc_phi_tam_tinh || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {selectedCourseDetail.to_hoc?.tkb && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/60">
                  <span className="text-blue-900 font-bold block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Lịch học / Thời khóa biểu:
                  </span>
                  <div
                    className="text-slate-700 leading-relaxed font-sans text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedCourseDetail.to_hoc.tkb }}
                  />
                </div>
              )}

              {selectedCourseDetail.ngay_dang_ky && (
                <div className="text-slate-500 text-[11px] flex items-center gap-1.5 pt-2 border-t border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Thời gian đăng ký hệ thống:{' '}
                    <strong>{new Date(selectedCourseDetail.ngay_dang_ky).toLocaleString('vi-VN')}</strong>
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourseDetail(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
