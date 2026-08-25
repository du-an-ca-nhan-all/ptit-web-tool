import React, { useMemo, useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Users,
  BarChart3,
  RefreshCw,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { LoginUser } from '../../../types';

interface CourseCompareProps {
  data: {
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null;
  currentUser?: LoginUser | null;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  onReload?: () => void;
  embedded?: boolean;
  onSubTabChange?: (tab: 'COURSES' | 'COMPARE') => void;
}

// Helper safely extracting courses from any nesting structure
const extractCoursesFromAccount = (acc: any): any[] => {
  if (!acc) return [];
  const rawList =
    acc.data?.data?.ds_kqdkmh ||
    acc.data?.ds_kqdkmh ||
    acc.ds_kqdkmh ||
    (Array.isArray(acc.data) ? acc.data : []) ||
    [];

  return rawList
    .map((item: any) => item.to_hoc || item)
    .filter((c: any) => c && (c.ma_mon || c.MaMH));
};

export default function CourseCompare({
  data: initialData,
  currentUser,
  onNavigateTab,
  onReload,
  embedded = false,
  onSubTabChange,
}: CourseCompareProps) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsLoading(false);
    }
  }, [initialData]);

  const loadCompareData = async () => {
    setIsLoading(true);
    const classCode = currentUser?.lop || 'D25TXCN11-K';
    const username = currentUser?.username || '';
    try {
      const res = await fetch(
        `/api/course-compare?classCode=${encodeURIComponent(classCode)}${username ? `&username=${encodeURIComponent(username)}` : ''}`
      );
      const json = await res.json();
      if (json && json.hasData) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load course compare data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompareData();
  }, [currentUser]);

  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string>(
    currentUser?.username?.toUpperCase() || initialData?.subAccount?.username?.toUpperCase() || ''
  );

  useEffect(() => {
    if (currentUser?.username) {
      setSelectedStudentUsername(currentUser.username.toUpperCase());
    } else if (data?.subAccount?.username) {
      setSelectedStudentUsername(data.subAccount.username.toUpperCase());
    }
  }, [currentUser?.username, data?.subAccount?.username]);

  const [selectedCourse, setSelectedCourse] = useState<{
    type: 'missing' | 'diffGroup';
    courseCode: string;
    courseName: string;
    monitorGroup: string;
    myGroup?: string;
  } | null>(null);

  const [isPulling, setIsPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState('');

  // Handle direct pull from QLDTTX for current student
  const handlePullMyCourses = async () => {
    if (!currentUser) return;
    setIsPulling(true);
    setPullMsg('');
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
      const resData = await res.json();
      if (res.ok && resData.success) {
        setPullMsg('Đã đồng bộ môn học mới nhất thành công!');
        await loadCompareData();
        if (onReload) onReload();
        setTimeout(() => setPullMsg(''), 4000);
      } else {
        alert(resData.error || 'Đồng bộ thất bại. Vui lòng kiểm tra lại tài khoản liên kết QLDTTX.');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsPulling(false);
    }
  };

  const activeSubAccount = useMemo(() => {
    if (!data?.allSubAccounts || data.allSubAccounts.length === 0) return data?.subAccount || null;
    if (!selectedStudentUsername) return data?.subAccount || data.allSubAccounts[0] || null;
    return (
      data.allSubAccounts.find(
        (acc: any) => (acc.username || '').toUpperCase() === selectedStudentUsername.toUpperCase()
      ) ||
      data.subAccount ||
      null
    );
  }, [data, selectedStudentUsername]);

  const monitorCourses = useMemo(() => {
    return extractCoursesFromAccount(data?.main);
  }, [data]);

  const myCourses = useMemo(() => {
    return extractCoursesFromAccount(activeSubAccount);
  }, [activeSubAccount]);

  const hasMonitorData = monitorCourses.length > 0 && !!data?.main;
  const isCurrentUserMonitor = !!currentUser?.isMonitor || !!currentUser?.isAdmin;

  const popupStats = useMemo(() => {
    if (!selectedCourse || !data?.allSubAccounts) return null;
    const { courseCode } = selectedCourse;

    let totalAnalyzed = 0;
    const missingUsers: any[] = [];
    const groupMap = new Map<string, any[]>();

    data.allSubAccounts.forEach((acc) => {
      // Bỏ qua lớp trưởng
      if (data.main && acc.username?.toLowerCase() === data.main.username?.toLowerCase()) return;

      const courses = extractCoursesFromAccount(acc);
      const course = courses.find((c: any) => (c.ma_mon || c.MaMH) === courseCode);

      totalAnalyzed++;
      if (!course) {
        missingUsers.push(acc.username);
      } else {
        const grp = course.nhom_to || course.NhomTo || '01';
        if (!groupMap.has(grp)) groupMap.set(grp, []);
        groupMap.get(grp)!.push(acc.username);
      }
    });

    return {
      totalAnalyzed,
      missingUsers,
      groupMap,
    };
  }, [selectedCourse, data]);

  const comparison = useMemo(() => {
    const monitorMap = new Map<string, any>(
      monitorCourses.map((c: any) => [c.ma_mon || c.MaMH, c])
    );
    const myMap = new Map<string, any>(
      myCourses.map((c: any) => [c.ma_mon || c.MaMH, c])
    );

    const exactMatch: any[] = [];
    const diffGroup: { monitor: any; mine: any }[] = [];
    const missing: any[] = [];
    const extra: any[] = [];

    monitorCourses.forEach((mc: any) => {
      const code = mc.ma_mon || mc.MaMH;
      const myC = myMap.get(code);
      if (!myC) {
        missing.push(mc);
      } else if ((myC.nhom_to || myC.NhomTo) !== (mc.nhom_to || mc.NhomTo)) {
        diffGroup.push({ monitor: mc, mine: myC });
      } else {
        exactMatch.push(mc);
      }
    });

    myCourses.forEach((myC: any) => {
      const code = myC.ma_mon || myC.MaMH;
      if (!monitorMap.has(code)) {
        extra.push(myC);
      }
    });

    return { exactMatch, diffGroup, missing, extra };
  }, [monitorCourses, myCourses]);

  const currentStudentName = activeSubAccount?.username?.toUpperCase() || currentUser?.username?.toUpperCase() || 'Bạn';

  if (isLoading && !data) {
    return (
      <div className={embedded ? "w-full" : "p-4 md:p-8 max-w-7xl mx-auto w-full"}>
        <div className="flex flex-col items-center justify-center py-28 gap-3.5 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-700">Đang đối chiếu dữ liệu đăng ký môn học...</p>
          <p className="text-xs text-slate-400">Đang tải và so sánh danh sách môn học với Lớp trưởng</p>
        </div>
      </div>
    );
  }

  const handleGoToMyCourses = () => {
    if (onSubTabChange) {
      onSubTabChange('COURSES');
    } else if (onNavigateTab) {
      onNavigateTab('registered_courses');
    }
  };

  return (
    <div className={embedded ? "space-y-6 animate-in fade-in duration-200" : "p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"}>
      {/* Toast */}
      {pullMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pullMsg}</span>
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
                  So Sánh Đăng Ký Môn Học
                </h1>
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Mặc Định Đối Chiếu Với Lớp Trưởng
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {hasMonitorData ? (
                  <>
                    Đối chiếu danh sách môn học & nhóm tổ của <strong className="text-indigo-600 font-mono">({currentStudentName})</strong> với mốc chuẩn <strong className="text-emerald-700 font-mono">Lớp trưởng ({data?.main?.username || 'Lớp trưởng'})</strong>
                  </>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Chưa có mốc chuẩn đối chiếu từ Lớp trưởng của lớp
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => {
              loadCompareData();
              if (onReload) onReload();
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tải Lại</span>
          </button>

          {currentUser && (
            <button
              onClick={handlePullMyCourses}
              disabled={isPulling}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPulling ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              )}
              <span>Đồng Bộ Từ QLDTTX</span>
            </button>
          )}

          {(onNavigateTab || onSubTabChange) && (
            <button
              onClick={handleGoToMyCourses}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl transition-colors border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem Danh Sách Môn ĐK</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Warning when Monitor has not pulled course data */}
      {!hasMonitorData && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-tight">
                  Lớp Trưởng Chưa Đồng Bộ Dữ Liệu Đăng Ký Môn Học
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  Chưa Có Mốc Chuẩn
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1.5 leading-relaxed max-w-2xl">
                {isCurrentUserMonitor ? (
                  <>
                    Bạn là <strong>Lớp trưởng</strong> nhưng chưa kéo kết quả đăng ký môn học của mình từ cổng trường (<strong>https://qldttx.pttc1.edu.vn/</strong>).
                    Vui lòng bấm nút <strong>"Đồng Bộ Môn Học Lớp Trưởng Ngay"</strong> bên dưới để tạo mốc đối chiếu cho toàn bộ sinh viên trong lớp.
                  </>
                ) : (
                  <>
                    <strong>Lớp trưởng</strong> của lớp <strong className="text-indigo-700 font-mono">({currentUser?.lop || 'Lớp bạn'})</strong> chưa đồng bộ dữ liệu môn học đã đăng ký kỳ này từ cổng QLDTTX.
                    Vì vậy hệ thống chưa thể tạo mốc chuẩn để đối chiếu môn học và nhóm tổ. Bạn vẫn có thể xem và đồng bộ danh sách môn học của riêng mình.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {isCurrentUserMonitor ? (
              <button
                onClick={handlePullMyCourses}
                disabled={isPulling}
                className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-amber-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPulling ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current text-yellow-300" />
                )}
                <span>Đồng Bộ Môn Học Lớp Trưởng Ngay</span>
              </button>
            ) : (onNavigateTab || onSubTabChange) ? (
              <button
                onClick={handleGoToMyCourses}
                className="w-full sm:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-colors shrink-0 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Môn Của Bạn</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Student Selector Dropdown (When class has multiple students) */}
      {data?.allSubAccounts && data.allSubAccounts.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Sinh viên cần đối chiếu với Lớp trưởng:
              </span>
              <span className="text-[11px] text-slate-400">
                Mặc định so sánh với mốc đăng ký của Lớp trưởng ({data?.main?.username || 'Lớp trưởng'})
              </span>
            </div>
          </div>
          <select
            value={selectedStudentUsername}
            onChange={(e) => setSelectedStudentUsername(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[260px]"
          >
            {data.allSubAccounts.map((acc: any) => (
              <option key={acc.username} value={acc.username?.toUpperCase()}>
                {acc.username?.toUpperCase()} {acc.username?.toUpperCase() === currentUser?.username?.toUpperCase() ? '(Bạn)' : ''} {acc.isMonitor || acc.username?.toUpperCase() === data?.main?.username?.toUpperCase() ? '★ Lớp trưởng' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Comparison Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Trùng khớp</span>
          </div>
          <span className="text-3xl font-black text-emerald-700 mt-1">
            {hasMonitorData ? comparison.exactMatch.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Môn học cùng nhóm tổ với LT</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Khác nhóm tổ</span>
          </div>
          <span className="text-3xl font-black text-amber-700 mt-1">
            {hasMonitorData ? comparison.diffGroup.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">Cùng môn, khác nhóm học với LT</span>
        </div>

        <div className="bg-white border border-rose-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <XCircle className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Thiếu môn</span>
          </div>
          <span className="text-3xl font-black text-rose-700 mt-1">
            {hasMonitorData ? comparison.missing.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">LT đăng ký nhưng SV chưa ĐK</span>
        </div>

        <div className="bg-white border border-purple-200 rounded-3xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Info className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-wider">Đăng ký thêm</span>
          </div>
          <span className="text-3xl font-black text-purple-700 mt-1">
            {hasMonitorData ? comparison.extra.length : '—'}
          </span>
          <span className="text-xs text-slate-400 mt-1">SV ĐK nhưng LT không ĐK</span>
        </div>
      </div>

      {/* When Monitor Has No Data */}
      {!hasMonitorData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mt-2">
            Chưa thể đối chiếu vì Lớp trưởng chưa có dữ liệu môn học
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Khi Lớp trưởng thực hiện đồng bộ kết quả đăng ký môn học từ cổng trường QLDTTX, toàn bộ kết quả đối chiếu 4 trạng thái (Trùng khớp, Khác nhóm, Thiếu môn, ĐK thêm) sẽ tự động hiển thị tại đây.
          </p>
          {(onNavigateTab || onSubTabChange) && (
            <button
              onClick={handleGoToMyCourses}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem Môn Học Đã Đăng Ký Của Bạn</span>
            </button>
          )}
        </div>
      )}

      {/* Comparison Sections (When Monitor has data) */}
      {hasMonitorData && (
        <div className="flex flex-col gap-6">
          {/* Thiếu môn */}
          {comparison.missing.length > 0 && (
            <div className="bg-white rounded-3xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
                <h3 className="font-black text-rose-900 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Môn Sinh Viên Chưa Đăng Ký ({comparison.missing.length})
                </h3>
                <span className="text-xs text-rose-700 font-medium">Cần kiểm tra để tránh thiếu tín chỉ</span>
              </div>
              <div className="divide-y divide-slate-100">
                {comparison.missing.map((c: any) => {
                  const code = c.ma_mon || c.MaMH;
                  const name = c.ten_mon || c.TenMH;
                  const tc = c.so_tc || c.SoTC;
                  const grp = c.nhom_to || c.NhomTo;
                  const lop = c.lop || c.Lop;

                  return (
                    <div
                      key={code}
                      className="p-4 flex items-center justify-between hover:bg-rose-50/20 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {code}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Số TC: {tc}</span>
                          <span>•</span>
                          <span>Nhóm tổ của LT: <strong className="text-indigo-600">{grp}</strong></span>
                          {lop && <span>• Lớp HP: {lop}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedCourse({
                            type: 'missing',
                            courseCode: code,
                            courseName: name,
                            monitorGroup: grp,
                          })
                        }
                        className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Xem thống kê lớp</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Khác nhóm tổ */}
          {comparison.diffGroup.length > 0 && (
            <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-black text-amber-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Môn Khác Nhóm Tổ ({comparison.diffGroup.length})
                </h3>
                <span className="text-xs text-amber-700 font-medium">Sinh viên và Lớp trưởng học khác ca/nhóm</span>
              </div>
              <div className="divide-y divide-slate-100">
                {comparison.diffGroup.map(({ monitor: mc, mine: myC }) => {
                  const code = mc.ma_mon || mc.MaMH;
                  const name = mc.ten_mon || mc.TenMH;
                  const monitorGrp = mc.nhom_to || mc.NhomTo;
                  const myGrp = myC.nhom_to || myC.NhomTo;

                  return (
                    <div
                      key={code}
                      className="p-4 flex items-center justify-between hover:bg-amber-50/20 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {code}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                          <span>
                            Nhóm của SV: <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{myGrp}</strong>
                          </span>
                          <span>
                            Nhóm của LT: <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{monitorGrp}</strong>
                          </span>
                        </div>
                      </div>

                    <button
                      onClick={() =>
                        setSelectedCourse({
                          type: 'diffGroup',
                          courseCode: code,
                          courseName: name,
                          monitorGroup: monitorGrp,
                          myGroup: myGrp,
                        })
                      }
                      className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Xem thống kê lớp</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          {/* Trùng khớp */}
          {comparison.exactMatch.length > 0 && (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
                <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Môn Trùng Khớp Hoàn Toàn ({comparison.exactMatch.length})
                </h3>
                <span className="text-xs text-emerald-700 font-medium">Học chung nhóm tổ với Lớp trưởng</span>
              </div>
              <div className="divide-y divide-slate-100">
                {comparison.exactMatch.map((c: any) => {
                  const code = c.ma_mon || c.MaMH;
                  const name = c.ten_mon || c.TenMH;
                  const tc = c.so_tc || c.SoTC;
                  const grp = c.nhom_to || c.NhomTo;
                  const lop = c.lop || c.Lop;

                  return (
                    <div key={code} className="p-4 flex items-center justify-between hover:bg-emerald-50/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {code}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Số TC: {tc}</span>
                          <span>•</span>
                          <span>Nhóm tổ: <strong className="text-emerald-700">{grp}</strong></span>
                          {lop && <span>• Lớp HP: {lop}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ✓ Cùng nhóm {grp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Đăng ký thêm */}
          {comparison.extra.length > 0 && (
            <div className="bg-white rounded-3xl border border-purple-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between">
                <h3 className="font-black text-purple-900 text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" />
                  Môn Đăng Ký Thêm ({comparison.extra.length})
                </h3>
                <span className="text-xs text-purple-700 font-medium">Môn học cải thiện hoặc ngoài chương trình LT</span>
              </div>
              <div className="divide-y divide-slate-100">
                {comparison.extra.map((c: any) => {
                  const code = c.ma_mon || c.MaMH;
                  const name = c.ten_mon || c.TenMH;
                  const tc = c.so_tc || c.SoTC;
                  const grp = c.nhom_to || c.NhomTo;

                  return (
                    <div key={code} className="p-4 flex items-center justify-between hover:bg-purple-50/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {code}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{name}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>Số TC: {tc}</span>
                          <span>•</span>
                          <span>Nhóm tổ: {grp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Popup Stats */}
      {selectedCourse && popupStats && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCourse(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{selectedCourse.courseName}</h3>
                  <p className="text-xs text-slate-300 font-mono">{selectedCourse.courseCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold block mb-1">
                  Thống kê trên {popupStats.totalAnalyzed} sinh viên trong lớp có dữ liệu:
                </span>
              </div>

              {/* Group Distribution */}
              <div className="flex flex-col gap-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  Phân bố theo nhóm tổ:
                </h4>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {Array.from(popupStats.groupMap.entries()).map(([grp, users]) => (
                    <div
                      key={grp}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          Nhóm {grp}
                        </span>
                        {grp === selectedCourse.monitorGroup && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                            Nhóm của LT
                          </span>
                        )}
                        {grp === selectedCourse.myGroup && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            Nhóm của bạn
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-700">{users.length} SV</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing list */}
              {popupStats.missingUsers.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <h4 className="font-black text-rose-700 uppercase tracking-wider text-[11px]">
                    Chưa đăng ký ({popupStats.missingUsers.length} SV):
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {popupStats.missingUsers.map((u: string) => (
                      <span
                        key={u}
                        className="px-2 py-1 bg-rose-50 text-rose-800 font-mono font-bold rounded-lg border border-rose-200 text-[11px]"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCourse(null)}
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
