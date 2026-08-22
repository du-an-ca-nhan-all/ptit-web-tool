import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Zap,
  BookOpen,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Video,
  User,
  Users,
  Search,
  Filter,
  CalendarDays,
  CalendarRange,
  ListFilter,
  ArrowRight,
  CheckCheck,
  Copy,
  Info,
  CalendarCheck,
  Moon,
  Sun,
  Flame,
  X,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Edit3,
  Globe,
  CalendarPlus,
  Download,
  Smartphone,
  Share2,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import {
  TimetableCalendarEvent,
  TimetableSubjectSummary,
  StudentTimetableCalendarResult,
} from '../server/studentTimetableServerService';

interface StudentTimetableCalendarProps {
  currentUser: LoginUser;
  onNavigateToExternalAccounts?: () => void;
}

const SUBJECT_COLOR_PALETTES = [
  {
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    pill: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badge: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-500',
    accentBorder: 'border-l-indigo-500',
    hover: 'hover:bg-indigo-100/70',
  },
  {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badge: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
    accentBorder: 'border-l-emerald-500',
    hover: 'hover:bg-emerald-100/70',
  },
  {
    bg: 'bg-sky-50 border-sky-200 text-sky-800',
    pill: 'bg-sky-100 text-sky-800 border-sky-200',
    badge: 'bg-sky-600 text-white',
    dot: 'bg-sky-500',
    accentBorder: 'border-l-sky-500',
    hover: 'hover:bg-sky-100/70',
  },
  {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    pill: 'bg-amber-100 text-amber-800 border-amber-200',
    badge: 'bg-amber-600 text-white',
    dot: 'bg-amber-500',
    accentBorder: 'border-l-amber-500',
    hover: 'hover:bg-amber-100/70',
  },
  {
    bg: 'bg-purple-50 border-purple-200 text-purple-800',
    pill: 'bg-purple-100 text-purple-800 border-purple-200',
    badge: 'bg-purple-600 text-white',
    dot: 'bg-purple-500',
    accentBorder: 'border-l-purple-500',
    hover: 'hover:bg-purple-100/70',
  },
  {
    bg: 'bg-rose-50 border-rose-200 text-rose-800',
    pill: 'bg-rose-100 text-rose-800 border-rose-200',
    badge: 'bg-rose-600 text-white',
    dot: 'bg-rose-500',
    accentBorder: 'border-l-rose-500',
    hover: 'hover:bg-rose-100/70',
  },
  {
    bg: 'bg-teal-50 border-teal-200 text-teal-800',
    pill: 'bg-teal-100 text-teal-800 border-teal-200',
    badge: 'bg-teal-600 text-white',
    dot: 'bg-teal-500',
    accentBorder: 'border-l-teal-500',
    hover: 'hover:bg-teal-100/70',
  },
  {
    bg: 'bg-orange-50 border-orange-200 text-orange-800',
    pill: 'bg-orange-100 text-orange-800 border-orange-200',
    badge: 'bg-orange-600 text-white',
    dot: 'bg-orange-500',
    accentBorder: 'border-l-orange-500',
    hover: 'hover:bg-orange-100/70',
  },
  {
    bg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    pill: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    badge: 'bg-cyan-600 text-white',
    dot: 'bg-cyan-500',
    accentBorder: 'border-l-cyan-500',
    hover: 'hover:bg-cyan-100/70',
  },
];

const WEEKDAYS = [
  { num: 2, label: 'Thứ 2', short: 'T2' },
  { num: 3, label: 'Thứ 3', short: 'T3' },
  { num: 4, label: 'Thứ 4', short: 'T4' },
  { num: 5, label: 'Thứ 5', short: 'T5' },
  { num: 6, label: 'Thứ 6', short: 'T6' },
  { num: 7, label: 'Thứ 7', short: 'T7' },
  { num: 8, label: 'Chủ Nhật', short: 'CN' },
];

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

export default function StudentTimetableCalendar({
  currentUser,
  onNavigateToExternalAccounts,
}: StudentTimetableCalendarProps) {
  const [data, setData] = useState<StudentTimetableCalendarResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Calendar View Mode: 'MONTH' | 'WEEK' | 'AGENDA'
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'AGENDA'>(() => {
    if (typeof window === 'undefined') return 'MONTH';
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view')?.toUpperCase();
    if (v === 'WEEK' || v === 'AGENDA' || v === 'MONTH') return v;
    return 'MONTH';
  });

  // Active Date (Default: Today or URL query)
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    if (typeof window === 'undefined') return formatIso(new Date());
    const params = new URLSearchParams(window.location.search);
    const d = params.get('date') || params.get('day');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return formatIso(new Date());
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (typeof window === 'undefined') return new Date();
    const params = new URLSearchParams(window.location.search);
    const d = params.get('date') || params.get('day');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'ALL';
    const params = new URLSearchParams(window.location.search);
    return params.get('subject') || 'ALL';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || params.get('search') || '';
  });

  const [selectedEventModal, setSelectedEventModal] = useState<TimetableCalendarEvent | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [copiedIcsUrl, setCopiedIcsUrl] = useState(false);

  // Sync viewMode, selectedSubjectFilter, selectedDay, searchQuery to URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;

    if (viewMode !== 'MONTH') {
      if (url.searchParams.get('view') !== viewMode.toLowerCase()) {
        url.searchParams.set('view', viewMode.toLowerCase());
        changed = true;
      }
    } else if (url.searchParams.has('view')) {
      url.searchParams.delete('view');
      changed = true;
    }

    if (selectedSubjectFilter !== 'ALL') {
      if (url.searchParams.get('subject') !== selectedSubjectFilter) {
        url.searchParams.set('subject', selectedSubjectFilter);
        changed = true;
      }
    } else if (url.searchParams.has('subject')) {
      url.searchParams.delete('subject');
      changed = true;
    }

    const todayIso = formatIso(new Date());
    if (selectedDay && selectedDay !== todayIso) {
      if (url.searchParams.get('date') !== selectedDay) {
        url.searchParams.set('date', selectedDay);
        changed = true;
      }
    } else if (url.searchParams.has('date')) {
      url.searchParams.delete('date');
      changed = true;
    }

    if (searchQuery) {
      if (url.searchParams.get('q') !== searchQuery) {
        url.searchParams.set('q', searchQuery);
        changed = true;
      }
    } else if (url.searchParams.has('q')) {
      url.searchParams.delete('q');
      changed = true;
    }

    if (changed) {
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  }, [viewMode, selectedSubjectFilter, selectedDay, searchQuery]);

  // Track the timestamp of the last fetch to automatically re-pull if returning after 10 minutes
  const lastFetchTimeRef = useRef<number>(Date.now());

  // Fetch timetable from API
  const fetchTimetable = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const res = await fetch(`/api/student/timetable${refresh ? '?refresh=true' : ''}`);
      const json = await res.json();
      lastFetchTimeRef.current = Date.now();

      if (res.ok && json.success) {
        setData(json);
        setErrorType(null);

        if (refresh) {
          const syncTimeFormatted = formatSyncDateTime(json.lastSyncAt || new Date().toISOString());
          setSyncFeedback({
            type: 'success',
            message: `Đồng bộ thành công thời khóa biểu mới nhất từ QLDTTX (lúc ${syncTimeFormatted})!`,
          });
          setTimeout(() => setSyncFeedback(null), 6000);
        }

        // Auto jump calendar date to nearest active session if current month has no events and no URL date
        if (json.events && json.events.length > 0) {
          const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const hasUrlDate = Boolean(params?.get('date') || params?.get('day'));
          if (!hasUrlDate) {
            const todayIso = formatIso(new Date());
            const hasTodayOrFuture = json.events.some((e: any) => e.date >= todayIso);
            if (!hasTodayOrFuture && json.events[0]?.date) {
              const firstDate = new Date(json.events[0].date);
              if (!isNaN(firstDate.getTime())) {
                setCurrentDate(firstDate);
                setSelectedDay(json.events[0].date);
              }
            }
          }
        }
      } else {
        const type = json.errorType || (res.status === 401 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR');
        setErrorType(type);
        setError(json.error || 'Không thể tải lịch học cá nhân');
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
      setError('Lỗi kết nối máy chủ khi lấy dữ liệu thời khóa biểu');
      if (refresh) {
        setSyncFeedback({
          type: 'error',
          message: 'Lỗi kết nối máy chủ khi đồng bộ thời khóa biểu từ QLDTTX.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Tự động kiểm tra và pull lại nếu người dùng quay lại tab/vào lại sau 10 phút (10 * 60 * 1000 ms)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= 10 * 60 * 1000) {
          lastFetchTimeRef.current = Date.now();
          fetchTimetable(false);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleFocusOrVisibility);

    function handleFocusOrVisibility() {
      handleVisibilityOrFocus();
    }

    // Interval định kỳ mỗi 10 phút kiểm tra làm mới nền nếu tab vẫn đang mở
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (elapsed >= 10 * 60 * 1000) {
        lastFetchTimeRef.current = Date.now();
        fetchTimetable(false);
      }
    }, 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleFocusOrVisibility);
      clearInterval(intervalId);
    };
  }, [fetchTimetable]);

  // Filtered Events
  const allEvents = useMemo(() => data?.events || [], [data]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchSubject = selectedSubjectFilter === 'ALL' || ev.subjectCode === selectedSubjectFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        ev.subjectName.toLowerCase().includes(query) ||
        ev.subjectCode.toLowerCase().includes(query) ||
        ev.room.toLowerCase().includes(query) ||
        (ev.lecturer && ev.lecturer.toLowerCase().includes(query));
      return matchSubject && matchQuery;
    });
  }, [allEvents, selectedSubjectFilter, searchQuery]);

  // Map events by Date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimetableCalendarEvent[]>();
    for (const ev of filteredEvents) {
      if (!map.has(ev.date)) {
        map.set(ev.date, []);
      }
      map.get(ev.date)!.push(ev);
    }
    return map;
  }, [filteredEvents]);

  // Calendar Navigation
  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'WEEK') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'WEEK') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(formatIso(today));
  };

  // Month grid generation
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-based offset (0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

    const days: {
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      events: TimetableCalendarEvent[];
    }[] = [];

    // Preceding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const iso = formatIso(d);
      days.push({
        date: d,
        dateStr: iso,
        isCurrentMonth: false,
        isToday: iso === formatIso(new Date()),
        isSelected: iso === selectedDay,
        events: eventsByDate.get(iso) || [],
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = formatIso(d);
      days.push({
        date: d,
        dateStr: iso,
        isCurrentMonth: true,
        isToday: iso === formatIso(new Date()),
        isSelected: iso === selectedDay,
        events: eventsByDate.get(iso) || [],
      });
    }

    // Trailing days to fill standard 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const iso = formatIso(d);
      days.push({
        date: d,
        dateStr: iso,
        isCurrentMonth: false,
        isToday: iso === formatIso(new Date()),
        isSelected: iso === selectedDay,
        events: eventsByDate.get(iso) || [],
      });
    }

    return days;
  }, [currentDate, selectedDay, eventsByDate]);

  // Week grid generation
  const weekDays = useMemo(() => {
    const cur = new Date(currentDate);
    let dayOfWeek = cur.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dayOfWeek);

    const days: {
      date: Date;
      dateStr: string;
      weekday: string;
      dayNum: number;
      isToday: boolean;
      events: TimetableCalendarEvent[];
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatIso(d);
      days.push({
        date: d,
        dateStr: iso,
        weekday: WEEKDAYS[i].label,
        dayNum: d.getDate(),
        isToday: iso === formatIso(new Date()),
        events: eventsByDate.get(iso) || [],
      });
    }
    return days;
  }, [currentDate, eventsByDate]);

  const todayIso = formatIso(new Date());

  // Events of the selected day
  const selectedDayEvents = useMemo(() => {
    return eventsByDate.get(selectedDay) || [];
  }, [selectedDay, eventsByDate]);

  // Jump to next class helper for mobile empty state
  const handleJumpToNextClass = useCallback(() => {
    const futureEvents = allEvents
      .filter((ev) => ev.date >= selectedDay && ev.date !== selectedDay)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (futureEvents.length > 0) {
      const nextDate = futureEvents[0].date;
      setSelectedDay(nextDate);
      setCurrentDate(new Date(nextDate));
    } else {
      const upcomingFromToday = allEvents
        .filter((ev) => ev.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (upcomingFromToday.length > 0) {
        const nextDate = upcomingFromToday[0].date;
        setSelectedDay(nextDate);
        setCurrentDate(new Date(nextDate));
      } else if (allEvents.length > 0) {
        const firstDate = allEvents[0].date;
        setSelectedDay(firstDate);
        setCurrentDate(new Date(firstDate));
      }
    }
  }, [allEvents, selectedDay, todayIso]);

  // Copy link
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Banner / Quick Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-xs shadow-indigo-500/20 shrink-0 mt-0.5 sm:mt-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-black text-slate-800">Thời Khóa Biểu & Lịch Học Cá Nhân</h2>
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
                  title="Thời điểm kéo dữ liệu từ Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)."
                >
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Kéo cuối:</span>
                  <strong className="font-mono text-slate-900">{formatSyncDateTime(data.lastSyncAt)}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Cổng: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • {data?.semesterName || 'Học kỳ hiện tại'} • <b>{data?.uniqueSubjectsCount || 0} môn học</b> ({data?.totalEvents || 0} buổi học)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Pull button from QLDTTX */}
          <button
            onClick={() => fetchTimetable(true)}
            disabled={isRefreshing || isLoading}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Chủ động kéo lại thời khóa biểu mới nhất từ cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)"
          >
            {isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            )}
            <span>{isRefreshing ? 'Đang kéo...' : 'Kéo Lại QLDTTX'}</span>
          </button>

          {/* Sync to External Calendars (Google / Apple / Outlook) */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Đồng bộ thời khóa biểu tự động lên Google Calendar, Apple Calendar (iPhone/Mac), hoặc Outlook"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Đồng Bộ Lịch</span>
          </button>

          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MONTH'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Tháng</span>
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'WEEK'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Tuần</span>
            </button>
            <button
              onClick={() => setViewMode('AGENDA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'AGENDA'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh Sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Toast Feedback Banner */}
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
          <button
            onClick={() => setSyncFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
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
                Liên kết tài khoản QLDTTX để hệ thống tự động cập nhật thời khóa biểu, phòng học và thông báo nhắc lịch học ca tối qua Telegram.
              </p>
            </div>
          </div>
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Liên Kết QLĐT Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Subject Filter & Navigation Controls */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Date Navigator (Visible on Desktop / MD+) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
            title="Thời gian trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold active:scale-95 transition cursor-pointer"
          >
            Hôm Nay
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer"
            title="Thời gian tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-sm sm:text-base font-black text-slate-800 ml-2 font-mono">
            {viewMode === 'MONTH' && (
              <span>
                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
              </span>
            )}
            {viewMode === 'WEEK' && (
              <span>
                Tuần {weekDays[0]?.dayNum}/{weekDays[0]?.date.getMonth() + 1} - {weekDays[6]?.dayNum}/{weekDays[6]?.date.getMonth() + 1}, {currentDate.getFullYear()}
              </span>
            )}
            {viewMode === 'AGENDA' && (
              <span>
                Toàn Bộ Lịch Học ({data?.semesterName || 'Học kỳ 1'})
              </span>
            )}
          </div>
        </div>

        {/* Filter by Subject & Search (Responsive for both Mobile & Desktop) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial md:min-w-[200px]">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
            >
              <option value="ALL">Tất Cả Môn Học ({data?.uniqueSubjectsCount || 0})</option>
              {data?.subjects.map((sub) => (
                <option key={sub.subjectCode} value={sub.subjectCode}>
                  {sub.subjectName} ({sub.subjectCode})
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-1 md:flex-initial md:min-w-[170px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm môn, phòng..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Main Calendar View Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[300px] sm:min-h-[400px]">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Đang tải lịch học và thời khóa biểu...</span>
        </div>
      ) : errorType === 'NOT_CONFIGURED' ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-5 sm:gap-6 max-w-2xl mx-auto my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Yêu Cầu Cấu Hình Cổng QLDTTX (PTTC1)</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
              Chưa Cấu Hình Tài Khoản Đào Tạo Từ Xa
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Để xem được <b>Thời Khóa Biểu & Lịch Học Cá Nhân</b> được cập nhật chính xác từ trường, bạn cần cấu hình thông tin đăng nhập tại Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-indigo-600">https://qldttx.pttc1.edu.vn/</span>).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-slate-600 text-left w-full space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Quyền lợi sau khi kết nối tài khoản QLDTTX:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px]">
              <li>Tự động tải lịch học, phòng học và giảng viên học kỳ hiện tại</li>
              <li>Hiển thị lịch trực quan theo dạng Tháng, Tuần và Lịch biểu chi tiết</li>
              <li>Nhận thông báo nhắc lịch học ca tối qua Kênh/Nhóm Telegram cá nhân</li>
            </ul>
          </div>

          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Globe className="w-4 h-4" />
              <span>Đến Cấu Hình Tài Khoản QLDTTX Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : errorType === 'INVALID_CREDENTIALS' ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center gap-5 sm:gap-6 max-w-2xl mx-auto my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Lỗi Xác Thực Tài Khoản QLDTTX</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
              Tài Khoản Hoặc Mật Khẩu Không Chính Xác
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Hệ thống không thể kết nối tới Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-rose-600">https://qldttx.pttc1.edu.vn/</span>) do thông tin đăng nhập sai hoặc mật khẩu đã bị thay đổi.
            </p>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-rose-800 text-left w-full space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-rose-600" />
              <span>Nguyên nhân có thể do:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700 space-y-1">
              • Bạn vừa đổi mật khẩu trên cổng QLDTTX nhưng chưa cập nhật tại đây.<br />
              • Mã sinh viên hoặc mật khẩu nhập chưa chính xác.<br />
              • Phiên đăng nhập (Token) của trường đã hết hạn.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center w-full">
            {onNavigateToExternalAccounts && (
              <button
                onClick={onNavigateToExternalAccounts}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Edit3 className="w-4 h-4" />
                <span>Cập Nhật Lại Mật Khẩu QLDTTX</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => fetchTimetable(true)}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Thử Lại</span>
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-9 h-9 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-800">Không thể tải lịch học</h3>
          <p className="text-xs text-slate-500 max-w-md">{error}</p>
          <button
            onClick={() => fetchTimetable(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : allEvents.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4">
          <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">Chưa có dữ liệu thời khóa biểu cho học kỳ này</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Hệ thống chưa tìm thấy lịch học của bạn. Nếu bạn vừa đăng ký môn học hoặc liên kết tài khoản QLDTTX, vui lòng bấm &quot;Làm Mới Từ QLĐT&quot;.
            </p>
          </div>
          <button
            onClick={() => fetchTimetable(true)}
            disabled={isRefreshing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Đồng Bộ Lịch Học Ngay</span>
          </button>
        </div>
      ) : (
        <>
          {/* VIEW 1: MONTH CALENDAR */}
          {viewMode === 'MONTH' && (
            <>
              {/* DESKTOP CALENDAR VIEW (hidden on mobile, visible on md+) */}
              <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Month Grid (3 cols on desktop) */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Weekday header */}
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-600 py-3">
                    {WEEKDAYS.map((wd) => (
                      <div key={wd.num} className={wd.num === 8 ? 'text-rose-600' : ''}>
                        <span>{wd.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Cells */}
                  <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
                    {monthGridDays.map((dayItem) => {
                      const hasEvents = dayItem.events.length > 0;
                      const isToday = dayItem.isToday;
                      const isSelected = dayItem.dateStr === selectedDay;

                      return (
                        <div
                          key={dayItem.dateStr}
                          onClick={() => setSelectedDay(dayItem.dateStr)}
                          className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                            !dayItem.isCurrentMonth
                              ? 'bg-slate-50/40 text-slate-300'
                              : isSelected
                              ? 'bg-indigo-50/50 ring-2 ring-indigo-500/50 inset-0 z-10'
                              : 'hover:bg-slate-50/80 text-slate-800'
                          }`}
                        >
                          {/* Day Number & Header */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                isToday
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : ''
                              }`}
                            >
                              {dayItem.date.getDate()}
                            </span>

                            {hasEvents && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                                {dayItem.events.length} ca
                              </span>
                            )}
                          </div>

                          {/* Events list in cell */}
                          <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                            {dayItem.events.slice(0, 2).map((ev) => {
                              const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                              return (
                                <button
                                  key={ev.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventModal(ev);
                                  }}
                                  className={`text-left text-[11px] p-1 rounded-lg border font-medium truncate flex items-center gap-1 transition ${pal.pill} ${pal.hover}`}
                                  title={`${ev.subjectName} (${ev.startTime} - ${ev.endTime}) - ${ev.room}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pal.dot}`} />
                                  <span className="font-mono text-[10px] font-bold shrink-0">{ev.startTime}</span>
                                  <span className="truncate">{ev.subjectName}</span>
                                </button>
                              );
                            })}

                            {dayItem.events.length > 2 && (
                              <div className="text-[10px] font-bold text-slate-400 pl-1">
                                +{dayItem.events.length - 2} ca học khác...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Side Details Panel for Selected Day */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Lịch Học Ngày
                        </h3>
                        <div className="text-xs font-bold text-indigo-600 font-mono">
                          {new Date(selectedDay).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {selectedDay === todayIso && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full animate-pulse">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {/* Session cards for the day */}
                  {selectedDayEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <CalendarCheck className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">Không có lịch học vào ngày này</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
                      {selectedDayEvents.map((ev) => {
                        const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                        return (
                          <div
                            key={ev.id}
                            className={`p-3.5 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-2 shadow-2xs`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-black leading-tight">
                                {ev.subjectName}
                              </span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 border border-slate-200 shrink-0">
                                {ev.subjectCode}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 text-[11px] opacity-90">
                              <div className="flex items-center gap-1.5 font-bold">
                                <Clock className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                                <span className="font-mono">{ev.startTime} - {ev.endTime}</span>
                                <span className="text-[10px] font-normal">({ev.periodStr})</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                                <span className="font-semibold">{ev.room}</span>
                                {ev.group && <span>• Tổ: {ev.group}</span>}
                              </div>

                              {ev.lecturer && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <User className="w-3.5 h-3.5 shrink-0" />
                                  <span>GV: {ev.lecturer}</span>
                                </div>
                              )}

                              {ev.onlineLink && (
                                <a
                                  href={ev.onlineLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Vào Lớp Học Online</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* MOBILE CALENDAR VIEW (Dedicated Touch Experience, visible on < md) */}
              <div className="block md:hidden space-y-3.5">
                {/* 1. Mobile Compact Month Picker Card */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
                  {/* Month header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-indigo-600" />
                      <span className="font-black text-xs text-slate-800">
                        Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
                        title="Tháng trước"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleToday}
                        className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold active:scale-95 transition"
                      >
                        Hôm nay
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition"
                        title="Tháng sau"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 7-column weekday headers */}
                  <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 py-1">
                    {WEEKDAYS.map((wd) => (
                      <div key={wd.num} className={wd.num === 8 ? 'text-rose-500' : ''}>
                        {wd.short}
                      </div>
                    ))}
                  </div>

                  {/* 7-column date grid */}
                  <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center mt-1">
                    {monthGridDays.map((dayItem) => {
                      const hasEvents = dayItem.events.length > 0;
                      const isToday = dayItem.isToday;
                      const isSelected = dayItem.dateStr === selectedDay;

                      return (
                        <button
                          key={dayItem.dateStr}
                          onClick={() => setSelectedDay(dayItem.dateStr)}
                          className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs font-bold'
                              : isToday
                              ? 'border border-rose-500 bg-rose-50/70 text-rose-700 font-bold'
                              : !dayItem.isCurrentMonth
                              ? 'text-slate-300'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xs font-mono font-bold leading-none">
                            {dayItem.date.getDate()}
                          </span>

                          {/* Event dots under the date number */}
                          {hasEvents && (
                            <div className="flex items-center gap-0.5 mt-1">
                              {dayItem.events.slice(0, 3).map((ev, idx) => {
                                const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                                return (
                                  <span
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSelected ? 'bg-white' : pal.dot
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Month Footer info pill */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Có ca học</span>
                      <span className="text-slate-300">•</span>
                      <span className="w-2 h-2 rounded-full border border-rose-500 bg-rose-100" />
                      <span>Hôm nay</span>
                    </div>

                    <span className="font-bold text-slate-700">
                      {monthGridDays.reduce((acc, d) => (d.isCurrentMonth ? acc + d.events.length : acc), 0)} ca / tháng
                    </span>
                  </div>
                </div>

                {/* 2. Mobile Daily Schedule Timeline for Selected Day */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
                  {/* Header of selected day */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Lịch Học Ngày
                        </div>
                        <h3 className="text-xs font-black text-slate-800 font-mono">
                          {new Date(selectedDay).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {selectedDay === todayIso && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full animate-pulse">
                          Hôm nay
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full font-mono">
                        {selectedDayEvents.length} ca
                      </span>
                    </div>
                  </div>

                  {/* Sessions list on mobile */}
                  {selectedDayEvents.length === 0 ? (
                    <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2.5">
                      <CalendarCheck className="w-7 h-7 text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">
                        Không có lịch học vào ngày này
                      </p>
                      <button
                        onClick={handleJumpToNextClass}
                        className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                        <span>Xem Ca Học Gần Nhất</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {selectedDayEvents.map((ev) => {
                        const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEventModal(ev)}
                            className={`p-3.5 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-2.5 shadow-2xs active:scale-98 transition cursor-pointer`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-black text-slate-900 leading-snug">
                                  {ev.subjectName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600 font-mono">
                                  <span>Mã: {ev.subjectCode}</span>
                                  {ev.group && <span>• Tổ: {ev.group}</span>}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/90 border border-slate-200 shrink-0 text-slate-700">
                                Chi tiết
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-200/60">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="font-mono">{ev.startTime} - {ev.endTime}</span>
                                <span className="text-[10px] text-slate-500 font-normal">({ev.periodStr})</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="font-semibold">{ev.room}</span>
                              </div>

                              {ev.lecturer && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>GV: {ev.lecturer}</span>
                                </div>
                              )}
                            </div>

                            {ev.onlineLink && (
                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                                <a
                                  href={ev.onlineLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Vào Lớp Học Online</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(ev.onlineLink!);
                                  }}
                                  className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs transition cursor-pointer"
                                  title="Sao chép link phòng học"
                                >
                                  {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: WEEK CALENDAR */}
          {viewMode === 'WEEK' && (
            <>
              {/* Desktop 7-col week grid */}
              <div className="hidden md:grid md:grid-cols-7 gap-4">
                {weekDays.map((dayItem) => {
                  const isToday = dayItem.isToday;
                  return (
                    <div
                      key={dayItem.dateStr}
                      className={`bg-white rounded-3xl p-4 border flex flex-col gap-3 shadow-sm min-h-[300px] ${
                        isToday ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                      }`}
                    >
                      {/* Week Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <div className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {dayItem.weekday}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {dayItem.dayNum}/{dayItem.date.getMonth() + 1}
                          </div>
                        </div>

                        {isToday && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title="Hôm nay" />
                        )}
                      </div>

                      {/* Events inside this day */}
                      {dayItem.events.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[11px] text-slate-300 italic">
                          Không có ca học
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {dayItem.events.map((ev) => {
                            const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEventModal(ev)}
                                className={`p-3 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-3 flex flex-col gap-1.5 transition cursor-pointer hover:shadow-xs`}
                              >
                                <div className="text-xs font-bold leading-tight line-clamp-2">
                                  {ev.subjectName}
                                </div>

                                <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700">
                                  <Clock className="w-3 h-3 text-indigo-600" />
                                  <span>{ev.startTime} - {ev.endTime}</span>
                                </div>

                                <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate">{ev.room}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile stacked 7-day cards */}
              <div className="block md:hidden space-y-2.5">
                {weekDays.map((dayItem) => {
                  const isToday = dayItem.isToday;
                  const hasEvents = dayItem.events.length > 0;

                  return (
                    <div
                      key={dayItem.dateStr}
                      className={`bg-white rounded-2xl p-3.5 border transition-all ${
                        isToday
                          ? 'border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                            {dayItem.weekday}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {dayItem.dayNum}/{dayItem.date.getMonth() + 1}/{dayItem.date.getFullYear()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isToday && (
                            <span className="px-2 py-0.2 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold rounded-full">
                              Hôm nay
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              hasEvents
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {hasEvents ? `${dayItem.events.length} ca` : 'Trống'}
                          </span>
                        </div>
                      </div>

                      {hasEvents ? (
                        <div className="mt-2.5 flex flex-col gap-2">
                          {dayItem.events.map((ev) => {
                            const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEventModal(ev)}
                                className={`p-3 rounded-xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col gap-1.5 active:scale-98 transition cursor-pointer`}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <h4 className="text-xs font-black text-slate-900 leading-snug">
                                    {ev.subjectName}
                                  </h4>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200 shrink-0">
                                    {ev.subjectCode}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-700">
                                  <div className="flex items-center gap-1 font-bold">
                                    <Clock className="w-3 h-3 text-indigo-600" />
                                    <span>{ev.startTime} - {ev.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1 truncate text-slate-600">
                                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="truncate">{ev.room}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pt-2 text-center text-[11px] text-slate-400 italic">
                          Không có ca học
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* VIEW 3: AGENDA / FULL SEMESTER TIMELINE */}
          {viewMode === 'AGENDA' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-indigo-600" />
                  <span>Danh Sách Lịch Học ({filteredEvents.length} ca học)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredEvents.map((ev) => {
                  const pal = SUBJECT_COLOR_PALETTES[ev.colorIndex % SUBJECT_COLOR_PALETTES.length];
                  const isToday = ev.date === todayIso;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventModal(ev)}
                      className={`p-3.5 sm:p-4 rounded-2xl border ${pal.bg} ${pal.accentBorder} border-l-4 flex flex-col justify-between gap-2.5 sm:gap-3 shadow-2xs hover:shadow-sm active:scale-98 transition cursor-pointer`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] sm:text-xs font-mono font-bold text-indigo-600 bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200">
                            {ev.dayOfWeekStr}, {new Date(ev.date).toLocaleDateString('vi-VN')}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-slate-800 leading-snug">
                          {ev.subjectName}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Mã: {ev.subjectCode} • Nhóm: {ev.group}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-[11px] text-slate-700">
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{ev.startTime} - {ev.endTime} ({ev.periodStr})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{ev.room}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* SESSION DETAILS MODAL */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                  {selectedEventModal.subjectCode} • Tổ {selectedEventModal.group}
                </span>
                <h3 className="text-base font-black text-slate-800 leading-tight">
                  {selectedEventModal.subjectName}
                </h3>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" /> Ngày học:
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedEventModal.dayOfWeekStr}, {new Date(selectedEventModal.date).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Giờ học:
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedEventModal.startTime} - {selectedEventModal.endTime} ({selectedEventModal.periodStr})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Phòng học:
                </span>
                <span className="font-bold text-slate-800">
                  {selectedEventModal.room}
                </span>
              </div>

              {selectedEventModal.lecturer && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-600" /> Giảng viên:
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedEventModal.lecturer}
                  </span>
                </div>
              )}

              {selectedEventModal.classCode && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-600" /> Lớp học phần:
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedEventModal.classCode}
                  </span>
                </div>
              )}
            </div>

            {selectedEventModal.onlineLink && (
              <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Video className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-xs font-bold text-sky-900 truncate">
                    {selectedEventModal.onlineLink}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyLink(selectedEventModal.onlineLink!)}
                    className="p-1.5 bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-xl text-xs transition cursor-pointer"
                    title="Sao chép link"
                  >
                    {copiedLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={selectedEventModal.onlineLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>Vào học</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ĐỒNG BỘ LỊCH LÊN GOOGLE / APPLE / OUTLOOK CALENDAR */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 md:p-7 border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <CalendarPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">
                    Đồng Bộ Lịch Lên Google / Apple / Outlook
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tự động đồng bộ thời khóa biểu vào ứng dụng Lịch trên điện thoại & máy tính
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick explanation box */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900 leading-relaxed space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Đồng bộ tự động & Nhắc nhở trước giờ học</span>
              </div>
              <p className="text-emerald-800/90 text-[11px]">
                Khi đăng ký qua URL này, ứng dụng Lịch (Google Calendar, iPhone, Mac, Outlook) sẽ định kỳ tự động quét và cập nhật nếu phòng học hoặc thời gian có thay đổi từ cổng trường.
              </p>
            </div>

            {/* 3 QUICK ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Google Calendar 1-click */}
              <a
                href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
                  (typeof window !== 'undefined' ? window.location.origin : '')
                    .replace(/^https?:\/\//i, 'webcal://') +
                    `/api/calendar/timetable/${encodeURIComponent(currentUser.username)}.ics`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/60 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Google Calendar</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Thêm bằng 1-Click</div>
                </div>
              </a>

              {/* 2. Apple Calendar (iOS / Mac) */}
              <a
                href={
                  (typeof window !== 'undefined' ? window.location.origin : '')
                    .replace(/^https?:\/\//i, 'webcal://') +
                  `/api/calendar/timetable/${encodeURIComponent(currentUser.username)}.ics`
                }
                className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200/80 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Apple Calendar</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">iPhone, iPad, Mac</div>
                </div>
              </a>

              {/* 3. Tải File .ics */}
              <a
                href={`/api/calendar/timetable/${encodeURIComponent(currentUser.username)}.ics`}
                download={`timetable_${currentUser.username}.ics`}
                className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer group shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Tải File .ics</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Nhập thủ công</div>
                </div>
              </a>
            </div>

            {/* DIRECT URL BOX WITH COPY BUTTON */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Đường link đăng ký lịch cá nhân (iCal / WebCal URL):</span>
                {copiedIcsUrl && (
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Đã sao chép!
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/api/calendar/timetable/${currentUser.username}.ics`
                      : `/api/calendar/timetable/${currentUser.username}.ics`
                  }
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/api/calendar/timetable/${currentUser.username}.ics`;
                    navigator.clipboard.writeText(fullUrl);
                    setCopiedIcsUrl(true);
                    setTimeout(() => setCopiedIcsUrl(false), 2500);
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm active:scale-95"
                >
                  {copiedIcsUrl ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedIcsUrl ? 'Đã Chép' : 'Sao Chép'}</span>
                </button>
              </div>
            </div>

            {/* STEP-BY-STEP INSTRUCTIONS ACCORDION */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                Hướng dẫn cấu hình từng ứng dụng
              </div>

              <div className="space-y-2 text-slate-600 text-[11px] bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">1</span>
                  <span>Google Calendar (Trên máy tính hoặc điện thoại):</span>
                </div>
                <p className="pl-5 text-slate-600">
                  Mở Google Calendar trên máy tính ➔ Ở cột bên trái, bấm dấu <strong>+</strong> cạnh mục <em>"Lịch khác"</em> ➔ Chọn <strong>"Từ URL" (From URL)</strong> ➔ Dán link URL ở trên vào và bấm <strong>Thêm lịch</strong>.
                </p>

                <div className="font-bold text-slate-800 flex items-center gap-1.5 pt-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center">2</span>
                  <span>Apple Calendar (iPhone, iPad, MacBook):</span>
                </div>
                <p className="pl-5 text-slate-600">
                  Bấm trực tiếp nút <strong>"Apple Calendar"</strong> ở trên, hoặc vào <em>Cài đặt trên iPhone ➔ Lịch ➔ Tài khoản ➔ Thêm tài khoản ➔ Khác ➔ Thêm Lịch đã đăng ký</em> ➔ Dán link vào.
                </p>

                <div className="font-bold text-slate-800 flex items-center gap-1.5 pt-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">3</span>
                  <span>Microsoft Outlook & Notion Calendar:</span>
                </div>
                <p className="pl-5 text-slate-600">
                  Trong Outlook Calendar, chọn <strong>Add calendar</strong> ➔ <strong>Subscribe from web</strong> ➔ Dán link URL vào và lưu lại.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
