'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  RefreshCw,
  Search,
  AlertCircle,
  ExternalLink,
  Award,
  Layers,
  CheckCircle,
  FileText,
  Video,
  HelpCircle,
  Folder,
  MessageSquare,
  FileCheck,
  User,
  ArrowRight,
  Filter,
  X,
  Flame,
  GraduationCap,
  ListOrdered,
} from 'lucide-react';
import { LoginUser } from '@/src/features/auth/types/auth.types';
import { LmsCourseOverviewItem, LmsDashboardOverview, LmsSectionItem } from '../server/lmsServerService';

interface LmsCoursesViewProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
}

export default function LmsCoursesView({ currentUser, onNavigateToExternalAccounts }: LmsCoursesViewProps) {
  const [data, setData] = useState<LmsDashboardOverview | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED'>('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [sortBy, setSortBy] = useState<'PROGRESS_DESC' | 'PROGRESS_ASC' | 'NAME_ASC' | 'GRADE_DESC'>('PROGRESS_ASC');

  // Course Details Modal
  const [activeCourseDetails, setActiveCourseDetails] = useState<{
    course: LmsCourseOverviewItem;
    sections: LmsSectionItem[];
    totalActivities: number;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchLmsCourses = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/lms/courses');
      const json = await res.json();

      if (res.ok && json.isConfigured !== false) {
        setIsConfigured(true);
        setData(json);
      } else if (json.isConfigured === false) {
        setIsConfigured(false);
      } else {
        setErrorMsg(json.error || 'Không thể tải dữ liệu khóa học từ LMS');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLmsCourses();
  }, []);

  // Fetch course activities modal
  const handleOpenCourseDetails = async (course: LmsCourseOverviewItem) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch('/api/lms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COURSE_ACTIVITIES', courseId: course.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActiveCourseDetails({
          course,
          sections: json.sections || [],
          totalActivities: json.totalActivities || 0,
        });
      } else {
        alert(json.error || 'Không thể lấy chi tiết hoạt động môn học');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Distinct semesters list
  const semestersList = useMemo(() => {
    if (!data?.courses) return [];
    const set = new Set<string>();
    data.courses.forEach((c) => {
      if (c.category && c.category.trim()) set.add(c.category.trim());
    });
    return Array.from(set);
  }, [data?.courses]);

  // Counts for status filters
  const filterCounts = useMemo(() => {
    const all = data?.courses || [];
    const completed = all.filter((c) => c.progressPercent === 100);
    const inProgress = all.filter((c) => c.progressPercent > 0 && c.progressPercent < 100);
    const notStarted = all.filter((c) => c.progressPercent === 0);
    return {
      all: all.length,
      completed: completed.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
    };
  }, [data?.courses]);

  // Filtered & Sorted courses
  const filteredCourses = useMemo(() => {
    if (!data?.courses) return [];

    let list = data.courses.filter((c) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.courseCode.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        (c.instructor && c.instructor.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q));

      // Status
      let matchStatus = true;
      if (statusFilter === 'COMPLETED') matchStatus = c.progressPercent === 100;
      else if (statusFilter === 'IN_PROGRESS') matchStatus = c.progressPercent > 0 && c.progressPercent < 100;
      else if (statusFilter === 'NOT_STARTED') matchStatus = c.progressPercent === 0;

      // Semester
      let matchSem = true;
      if (selectedSemester !== 'ALL') matchSem = c.category?.trim() === selectedSemester.trim();

      return matchSearch && matchStatus && matchSem;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'PROGRESS_DESC') return b.progressPercent - a.progressPercent;
      if (sortBy === 'PROGRESS_ASC') {
        // Unfinished first, then by lower progress
        if (a.progressPercent === 100 && b.progressPercent < 100) return 1;
        if (b.progressPercent === 100 && a.progressPercent < 100) return -1;
        return a.progressPercent - b.progressPercent;
      }
      if (sortBy === 'NAME_ASC') return a.courseName.localeCompare(b.courseName, 'vi');
      if (sortBy === 'GRADE_DESC') {
        const gradeA = parseFloat(a.grade?.replace(',', '.') || '0');
        const gradeB = parseFloat(b.grade?.replace(',', '.') || '0');
        return gradeB - gradeA;
      }
      return 0;
    });

    return list;
  }, [data?.courses, searchQuery, statusFilter, selectedSemester, sortBy]);

  // Render activity type icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'videotime':
      case 'supervideo':
      case 'video':
        return <Video className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'resource':
        return <FileText className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'assign':
        return <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'forum':
        return <MessageSquare className="w-4 h-4 text-violet-600 shrink-0" />;
      case 'folder':
        return <Folder className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  // ==============================================================
  // UNCONFIGURED STATE (Chưa liên kết tài khoản LMS)
  // ==============================================================
  if (!isLoading && isConfigured === false) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Chưa Liên Kết Hệ Thống Học Tập Trực Tuyến (LMS)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Liên kết tài khoản <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong> để xem toàn bộ danh sách môn học, tiến độ hoàn thành bài giảng và điểm quá trình học tập.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToExternalAccounts}
          className="mt-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-sky-200 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <span>Liên Kết Tài Khoản LMS Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
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
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Khóa Học & Tiến Độ Học Tập LMS
              </h2>
              <span className="bg-sky-100 text-sky-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-sky-200">
                PTTC1 LMS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sinh viên: <strong className="text-slate-800">{data?.userFullName || currentUser.fullName}</strong> • Cổng học tập:{' '}
              <a
                href="https://lms.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 font-mono font-bold hover:underline inline-flex items-center gap-1"
              >
                lms.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLmsCourses}
          disabled={isLoading}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Đồng Bộ LMS</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số khóa học */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Khóa Học Đăng Ký</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
              {data?.stats.enrolledCourses || data?.courses.length || 0}
            </div>
            <div className="text-[11px] text-indigo-600 font-bold truncate">Tổng số môn ghi danh</div>
          </div>
        </div>

        {/* Card 2: Hoạt động đã hoàn thành */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Hoạt Động Hoàn Thành</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
              {data?.stats.completedActivities || 0}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold truncate">Video, Slide, Bài học</div>
          </div>
        </div>

        {/* Card 3: Khóa học hoàn thành 100% */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Đã Học Xong (100%)</div>
            <div className="text-xl sm:text-2xl font-black text-sky-600 mt-0.5">
              {filterCounts.completed}
            </div>
            <div className="text-[11px] text-sky-700 font-bold truncate">Môn hoàn thành</div>
          </div>
        </div>

        {/* Card 4: Hoạt động còn lại */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider truncate">Cần Hoàn Thành</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
              {data?.stats.dueActivities || 0}
            </div>
            <div className="text-[11px] text-amber-700 font-bold truncate">Hoạt động đang chờ</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã môn, tên môn, giảng viên..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none"
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

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          {/* Status Tabs Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tất cả ({filterCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                statusFilter === 'IN_PROGRESS' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đang học ({filterCounts.inProgress})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_STARTED')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                statusFilter === 'NOT_STARTED' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Chưa học ({filterCounts.notStarted})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                statusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đã học xong ({filterCounts.completed})
            </button>
          </div>

          {/* Semester / Category Filter Dropdown */}
          {semestersList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">Tất cả đợt / học kỳ</option>
                {semestersList.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="PROGRESS_ASC">Môn cần học trước</option>
              <option value="PROGRESS_DESC">Tiến độ: Cao đến Thấp</option>
              <option value="NAME_ASC">Tên môn học (A-Z)</option>
              <option value="GRADE_DESC">Điểm LMS cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses List Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Đang tải và đồng bộ toàn bộ khóa học từ LMS PTTC1...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Không tìm thấy môn học nào phù hợp</p>
          <p className="text-xs text-slate-400">Thử chọn tab "Tất cả" hoặc thay đổi bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((course) => {
            const isFinished = course.progressPercent === 100;
            const progressColor = isFinished
              ? 'bg-emerald-500'
              : course.progressPercent >= 50
              ? 'bg-sky-500'
              : course.progressPercent > 0
              ? 'bg-amber-500'
              : 'bg-slate-300';

            return (
              <div
                key={course.id}
                className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
                  isFinished
                    ? 'bg-slate-50/60 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Course Top Info */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100">
                      {course.courseCode}
                    </span>

                    {isFinished ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Đã Hoàn Thành
                      </span>
                    ) : course.progressPercent > 0 ? (
                      <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                        Đang học ({course.progressPercent}%)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                        Chưa học (0%)
                      </span>
                    )}
                  </div>

                  <h3
                    className="font-black text-slate-800 text-sm sm:text-base leading-snug line-clamp-2"
                    title={course.fullName}
                  >
                    {course.courseName || course.fullName}
                  </h3>

                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    {course.instructor ? (
                      <div className="flex items-center gap-1.5 truncate">
                        {course.instructorImg ? (
                          <img
                            src={course.instructorImg}
                            alt={course.instructor}
                            className="w-4 h-4 rounded-full shrink-0"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{course.instructor}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">LMS PTTC1</span>
                    )}

                    {course.category && (
                      <span className="text-[10px] text-slate-400 font-bold truncate max-w-[130px] shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
                        {course.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Data & Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {course.totalActivities > 0 ? (
                        <>
                          <strong className="text-slate-800">{course.completedActivities}</strong> /{' '}
                          {course.totalActivities} hoạt động
                        </>
                      ) : (
                        'Đã ghi danh'
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      {course.grade && (
                        <span className="font-bold text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          ⭐ Điểm: <strong>{course.grade}</strong>
                        </span>
                      )}
                      <span className="font-black text-slate-800 font-mono">{course.progressPercent}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Course Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenCourseDetails(course)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Xem Chi Tiết Bài Học</span>
                  </button>

                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl transition-colors cursor-pointer shrink-0"
                    title="Mở môn học trên hệ thống LMS"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Course Sections & Activities Detail */}
      {activeCourseDetails && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCourseDetails(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight line-clamp-1">
                    {activeCourseDetails.course.courseName || activeCourseDetails.course.fullName}
                  </h3>
                  <p className="text-xs text-sky-100 mt-0.5">
                    {activeCourseDetails.totalActivities} hoạt động bài học • Tiến độ:{' '}
                    <strong>{activeCourseDetails.course.progressPercent}%</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCourseDetails(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Sections List */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {activeCourseDetails.sections.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-bold">
                  Không tìm thấy danh sách bài học chi tiết.
                </div>
              ) : (
                activeCourseDetails.sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{sec.title}</span>
                    </h4>

                    <div className="space-y-1.5 pl-7">
                      {sec.activities.map((act) => (
                        <a
                          key={act.id}
                          href={act.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-white hover:bg-sky-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-xs transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getActivityIcon(act.type)}
                            <span className="font-medium text-slate-700 group-hover:text-sky-700 truncate">
                              {act.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                            {act.type}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <a
                href={activeCourseDetails.course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Mở Trên LMS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setActiveCourseDetails(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
