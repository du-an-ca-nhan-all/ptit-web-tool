'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  BookOpen,
  User,
  Users,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MapPin,
  Send,
  Sparkles,
  Info,
  X,
  ChevronRight,
  EyeOff,
  Check,
  CalendarCheck,
  Flame,
} from 'lucide-react';
import {
  ReminderItemDto,
  ReminderType,
  CreateReminderInput,
  EnrolledCourseOption,
  PRESET_REMINDER_OFFSETS,
  formatOffsetMinutes,
} from '../types/reminder.types';
import { LoginUser } from '@/src/types';

interface RemindersManagerProps {
  currentUser: LoginUser;
  onNavigateToTelegramConfig?: () => void;
  onNavigateToCalendar?: () => void;
}

export default function RemindersManager({
  currentUser,
  onNavigateToTelegramConfig,
  onNavigateToCalendar,
}: RemindersManagerProps) {
  const [reminders, setReminders] = useState<ReminderItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'PERSONAL' | 'COURSE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Enrolled Courses for dropdown
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Modal Create/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    location: string;
    type: ReminderType;
    eventTime: string; // YYYY-MM-DDTHH:mm
    selectedCourseKey: string;
    customMaMon: string;
    customTenMon: string;
    customNhomTo: string;
    customLop: string;
    offsetMinutesList: number[];
    customOffsetVal: string;
    customOffsetUnit: 'minutes' | 'hours' | 'days';
  }>({
    title: '',
    description: '',
    location: '',
    type: 'PERSONAL',
    eventTime: '',
    selectedCourseKey: '',
    customMaMon: '',
    customTenMon: '',
    customNhomTo: '',
    customLop: '',
    offsetMinutesList: [1440, 60], // Mặc định trước 1 ngày & trước 1 giờ
    customOffsetVal: '',
    customOffsetUnit: 'hours',
  });

  // Fetch reminders
  const fetchReminders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      if (res.ok && data.success) {
        setReminders(data.reminders || []);
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách nhắc hẹn');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch enrolled courses
  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const res = await fetch('/api/reminders/courses');
      const data = await res.json();
      if (res.ok && data.success) {
        setEnrolledCourses(data.courses || []);
      }
    } catch (err) {
      console.warn('Fetch enrolled courses error:', err);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    fetchCourses();
  }, [fetchReminders, fetchCourses]);

  // Open Create Modal
  const handleOpenCreateModal = (prefillType?: ReminderType) => {
    const now = new Date();
    // Default time: tomorrow at 08:00
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(8, 0, 0, 0);
    const defaultTimeStr = tomorrow.toISOString().slice(0, 16);

    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      type: prefillType || 'PERSONAL',
      eventTime: defaultTimeStr,
      selectedCourseKey: enrolledCourses[0]?.idToHoc || '',
      customMaMon: '',
      customTenMon: '',
      customNhomTo: '',
      customLop: '',
      offsetMinutesList: [1440, 60], // Trước 1 ngày & 1 giờ
      customOffsetVal: '',
      customOffsetUnit: 'hours',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (reminder: ReminderItemDto) => {
    setEditingReminder(reminder);
    const d = new Date(reminder.eventTime);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    // Find course key if matches
    const courseMatch = enrolledCourses.find(
      (c) => c.idToHoc === reminder.idToHoc || (c.maMon === reminder.maMon && c.nhomTo === reminder.nhomTo)
    );

    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      location: reminder.location || '',
      type: reminder.type,
      eventTime: localIso,
      selectedCourseKey: courseMatch ? courseMatch.idToHoc : (reminder.idToHoc || ''),
      customMaMon: reminder.maMon || '',
      customTenMon: reminder.tenMon || '',
      customNhomTo: reminder.nhomTo || '',
      customLop: reminder.lop || '',
      offsetMinutesList: (reminder.alerts || []).map((a) => a.offsetMinutes),
      customOffsetVal: '',
      customOffsetUnit: 'hours',
    });
    setIsModalOpen(true);
  };

  // Toggle Offset Minutes
  const handleToggleOffset = (minutes: number) => {
    setFormData((prev) => {
      const exists = prev.offsetMinutesList.includes(minutes);
      const updated = exists
        ? prev.offsetMinutesList.filter((m) => m !== minutes)
        : [...prev.offsetMinutesList, minutes];
      return { ...prev, offsetMinutesList: updated };
    });
  };

  // Add Custom Offset
  const handleAddCustomOffset = () => {
    const val = parseInt(formData.customOffsetVal, 10);
    if (isNaN(val) || val < 0) return;

    let multiplier = 1;
    if (formData.customOffsetUnit === 'hours') multiplier = 60;
    if (formData.customOffsetUnit === 'days') multiplier = 1440;

    const totalMinutes = val * multiplier;
    if (!formData.offsetMinutesList.includes(totalMinutes)) {
      setFormData((prev) => ({
        ...prev,
        offsetMinutesList: [...prev.offsetMinutesList, totalMinutes],
        customOffsetVal: '',
      }));
    }
  };

  // Remove Offset
  const handleRemoveOffset = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      offsetMinutesList: prev.offsetMinutesList.filter((m) => m !== minutes),
    }));
  };

  // Handle Form Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề nhắc hẹn');
      return;
    }
    if (!formData.eventTime) {
      alert('Vui lòng chọn thời gian diễn ra');
      return;
    }
    if (formData.offsetMinutesList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 mốc thông báo');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let payload: CreateReminderInput = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        type: formData.type,
        eventTime: new Date(formData.eventTime).toISOString(),
        offsetMinutesList: formData.offsetMinutesList,
      };

      if (formData.type === 'COURSE') {
        const selectedCourse = enrolledCourses.find((c) => c.idToHoc === formData.selectedCourseKey);
        if (selectedCourse) {
          payload.idToHoc = selectedCourse.idToHoc;
          payload.idMon = selectedCourse.idMon;
          payload.maMon = selectedCourse.maMon;
          payload.tenMon = selectedCourse.tenMon;
          payload.nhomTo = selectedCourse.nhomTo;
          payload.lop = selectedCourse.lop;
          payload.tkbRaw = selectedCourse.tkb;
          payload.giangVien = selectedCourse.giangVien;
        } else {
          payload.maMon = formData.customMaMon.trim().toUpperCase() || undefined;
          payload.tenMon = formData.customTenMon.trim() || undefined;
          payload.nhomTo = formData.customNhomTo.trim() || undefined;
          payload.lop = formData.customLop.trim() || undefined;
        }
      }

      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders';
      const method = editingReminder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(editingReminder ? 'Đã cập nhật nhắc hẹn' : 'Đã tạo nhắc hẹn thành công!');
        setIsModalOpen(false);
        fetchReminders();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Complete Status
  const handleToggleComplete = async (reminder: ReminderItemDto) => {
    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_COMPLETE' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminder.id ? data.reminder : r))
        );
      }
    } catch (err) {
      console.error('Toggle complete error:', err);
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (reminder: ReminderItemDto) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhắc hẹn "${reminder.title}"?`)) return;

    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        setSuccessMsg('Đã xóa nhắc hẹn');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Lỗi khi xóa nhắc hẹn');
    }
  };

  // Dismiss Reminder for current user
  const handleDismissReminder = async (reminder: ReminderItemDto) => {
    if (!confirm(`Ẩn nhắc hẹn "${reminder.title}" khỏi lịch cá nhân của bạn?`)) return;

    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISMISS' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
      }
    } catch (err) {
      console.error('Dismiss reminder error:', err);
    }
  };

  // Filtered List
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      // Type Filter
      if (activeTab === 'PERSONAL' && r.type !== 'PERSONAL') return false;
      if (activeTab === 'COURSE' && r.type !== 'COURSE') return false;

      // Status Filter
      if (statusFilter === 'ACTIVE' && r.isCompleted) return false;
      if (statusFilter === 'COMPLETED' && !r.isCompleted) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q) || false;
        const matchSubject =
          r.tenMon?.toLowerCase().includes(q) ||
          r.maMon?.toLowerCase().includes(q) ||
          false;
        const matchLoc = r.location?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchSubject && !matchLoc) return false;
      }

      return true;
    });
  }, [reminders, activeTab, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = reminders.length;
    const personal = reminders.filter((r) => r.type === 'PERSONAL').length;
    const course = reminders.filter((r) => r.type === 'COURSE').length;
    const completed = reminders.filter((r) => r.isCompleted).length;
    const active = total - completed;
    return { total, personal, course, completed, active };
  }, [reminders]);

  // Format countdown
  const getCountdownLabel = (dateStr: string) => {
    const now = Date.now();
    const event = new Date(dateStr).getTime();
    const diffMs = event - now;

    if (diffMs < 0) {
      const pastHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      if (pastHours < 24) return 'Đã qua';
      return `Đã qua ${Math.floor(pastHours / 24)} ngày`;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainHours = diffHours % 24;

    if (diffDays === 0 && remainHours === 0) return 'Sắp diễn ra (< 1 giờ)';
    if (diffDays === 0) return `Hôm nay (còn ${remainHours} giờ)`;
    if (diffDays === 1) return `Ngày mai (còn 1 ngày ${remainHours}h)`;
    return `Còn ${diffDays} ngày ${remainHours}h`;
  };

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 uppercase tracking-widest">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hệ Thống Lịch Nhắc Hẹn & Báo Thức Telegram</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 fill-amber-400/20 animate-bounce" />
              <span>Lịch Nhắc Hẹn Thông Minh</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tạo lời nhắc cá nhân hoặc tạo nhắc hẹn theo môn học cho toàn bộ bạn học cùng lớp, môn, tổ.
              Hệ thống tự động đồng bộ vào lịch cá nhân và phát thông báo qua Telegram trước 3 ngày, 1 ngày, 5 giờ, 1 giờ...
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-emerald-300 font-medium">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gửi Telegram tự động</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-blue-300 font-medium">
                <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Hiển thị trên Lịch Học TKB</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-amber-300 font-medium">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Đồng bộ cùng lớp & tổ môn</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenCreateModal('PERSONAL')}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nhắc Hẹn Cá Nhân</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('COURSE')}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ Nhắc Hẹn Môn Học</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SUCCESS / ERROR FEEDBACK ── */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tổng nhắc hẹn</span>
            <Bell className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-slate-800">{stats.total}</span>
          <span className="text-[11px] text-slate-400">{stats.active} đang hoạt động</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Nhắc hẹn cá nhân</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600">{stats.personal}</span>
          <span className="text-[11px] text-slate-400">Riêng tài khoản bạn</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Theo môn học & tổ</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600">{stats.course}</span>
          <span className="text-[11px] text-slate-400">Chia sẻ cùng lớp/tổ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600">{stats.completed}</span>
          <span className="text-[11px] text-slate-400">Nhiệm vụ đã chốt</span>
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tất Cả ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('PERSONAL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PERSONAL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cá Nhân ({stats.personal})</span>
          </button>
          <button
            onClick={() => setActiveTab('COURSE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'COURSE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theo Môn Học ({stats.course})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, môn, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Chưa hoàn thành</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </select>

          <button
            onClick={() => fetchReminders(true)}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── REMINDER LIST ── */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc hẹn...</p>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Chưa có lịch nhắc hẹn nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tạo lời nhắc cho các bài tập lớn, thi giữa kỳ, nộp báo cáo hoặc các sự kiện quan trọng để hệ thống nhắc qua Telegram!
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenCreateModal('PERSONAL')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
            >
              + Tạo Nhắc Hẹn Cá Nhân
            </button>
            <button
              onClick={() => handleOpenCreateModal('COURSE')}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer"
            >
              + Tạo Nhắc Hẹn Môn Học
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((reminder) => {
            const isCreator = reminder.creatorUsername === currentUser.username;
            const isPersonal = reminder.type === 'PERSONAL';
            const countdown = getCountdownLabel(reminder.eventTime);
            const isPassed = countdown.startsWith('Đã qua');
            const eventDateObj = new Date(reminder.eventTime);

            return (
              <div
                key={reminder.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  reminder.isCompleted
                    ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80'
                    : isPassed
                    ? 'border-slate-200'
                    : isPersonal
                    ? 'border-blue-200/80 hover:border-blue-300'
                    : 'border-amber-200/80 hover:border-amber-300'
                }`}
              >
                <div className="p-5 flex flex-col gap-3">
                  {/* Top Bar: Type Badge & Countdown */}
                  <div className="flex items-center justify-between gap-2">
                    {isPersonal ? (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-200 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-blue-600" />
                        <span>Cá Nhân</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 flex items-center gap-1.5 truncate max-w-[200px]">
                        <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{reminder.tenMon || reminder.maMon || 'Môn học'}</span>
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        reminder.isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isPassed
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono'
                      }`}
                    >
                      {reminder.isCompleted ? '✓ Đã xong' : countdown}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div>
                    <h4
                      className={`font-bold text-sm sm:text-base leading-snug ${
                        reminder.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {reminder.title}
                    </h4>

                    {!isPersonal && (
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
                        {reminder.maMon && (
                          <span className="font-bold text-indigo-600">{reminder.maMon}</span>
                        )}
                        {reminder.nhomTo && <span>Tổ: {reminder.nhomTo}</span>}
                        {reminder.lop && <span>Lớp: {reminder.lop}</span>}
                        {reminder.giangVien && <span>GV: {reminder.giangVien}</span>}
                      </div>
                    )}
                  </div>

                  {/* Event Time */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      {eventDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {eventDateObj.toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Location or Online link */}
                  {reminder.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      {reminder.location.startsWith('http') ? (
                        <a
                          href={reminder.location}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{reminder.location}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="truncate">{reminder.location}</span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {reminder.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg">
                      &ldquo;{reminder.description}&rdquo;
                    </p>
                  )}

                  {/* Notification Alerts List */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Send className="w-3 h-3 text-sky-500" />
                        <span>Mốc thông báo Telegram</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {reminder.alerts?.length || 0} mốc
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {reminder.alerts?.map((alert, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium flex items-center gap-1 ${
                            alert.isSent
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {alert.isSent ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{alert.label || formatOffsetMinutes(alert.offsetMinutes)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Participants Count for Course */}
                  {!isPersonal && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {reminder.totalParticipants || 1} bạn học được thêm vào lịch
                        </span>
                      </span>
                      <span className="text-emerald-600 font-medium">
                        {reminder.telegramRecipientCount || 0} nhận Telegram
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate">
                    {isCreator ? (
                      <span className="font-semibold text-slate-600">Bạn đã tạo</span>
                    ) : (
                      <span>Người tạo: <b>{reminder.creatorName || reminder.creatorUsername}</b></span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleComplete(reminder)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        reminder.isCompleted
                          ? 'text-emerald-600 hover:bg-emerald-100'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-200'
                      }`}
                      title={reminder.isCompleted ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {isCreator ? (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(reminder)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                          title="Chỉnh sửa nhắc hẹn"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                          title="Xóa nhắc hẹn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDismissReminder(reminder)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                        title="Ẩn khỏi lịch cá nhân"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    formData.type === 'PERSONAL'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {formData.type === 'PERSONAL' ? <User className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base sm:text-lg">
                    {editingReminder ? 'Chỉnh Sửa Lịch Nhắc Hẹn' : 'Tạo Lịch Nhắc Hẹn Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formData.type === 'PERSONAL'
                      ? 'Lịch nhắc hẹn riêng cho bản thân'
                      : 'Lịch nhắc hẹn cho cả lớp/tổ học cùng môn'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4 scrollbar-thin">
              {/* Type Switcher (only for new reminders) */}
              {!editingReminder && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Loại nhắc hẹn:</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'PERSONAL' }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        formData.type === 'PERSONAL'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Nhắc Hẹn Cá Nhân</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: 'COURSE' }))}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        formData.type === 'COURSE'
                          ? 'bg-white text-amber-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Nhắc Hẹn Môn Học</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Course Selection if type === 'COURSE' */}
              {formData.type === 'COURSE' && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      <span>Chọn môn học hiện tại bạn đang học:</span>
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
                      {enrolledCourses.length} môn đang học
                    </span>
                  </div>

                  {enrolledCourses.length > 0 ? (
                    <select
                      value={formData.selectedCourseKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, selectedCourseKey: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {enrolledCourses.map((c) => (
                        <option key={c.idToHoc} value={c.idToHoc}>
                          {c.maMon} - {c.tenMon} (Tổ: {c.nhomTo || '01'}{c.lop ? ` | Lớp: ${c.lop}` : ''})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Mã môn (vd: INT1306)"
                        value={formData.customMaMon}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customMaMon: e.target.value }))}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Tên môn học"
                        value={formData.customTenMon}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customTenMon: e.target.value }))}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Nhóm/Tổ (vd: 03)"
                        value={formData.customNhomTo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customNhomTo: e.target.value }))}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Mã lớp (vd: D25TXCN11-K)"
                        value={formData.customLop}
                        onChange={(e) => setFormData((prev) => ({ ...prev, customLop: e.target.value }))}
                        className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Tất cả sinh viên học cùng môn, tổ và lớp này sẽ được tự động thêm vào lịch cá nhân và nhận thông báo Telegram trước thời điểm sự kiện!
                    </span>
                  </p>
                </div>
              )}

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Tiêu đề nhắc hẹn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nộp bài tập lớn nhóm 3, Thi trắc nghiệm giữa kỳ..."
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Event Time Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Thời gian diễn ra / Hạn chót <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.eventTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, eventTime: e.target.value }))}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Location or Online Link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Địa điểm / Đường dẫn học online (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng 302-A2, hoặc link Zoom / Google Meet / LMS"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Dặn dò / Ghi chú chi tiết (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  placeholder="Chi tiết đề bài, nội dung cần chuẩn bị, dặn dò của giáo viên..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* ── NOTIFICATION OFFSETS CONFIGURATION ── */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>Thông báo Telegram trước bao lâu:</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Có thể chọn nhiều mốc
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                  {PRESET_REMINDER_OFFSETS.map((offset) => {
                    const isSelected = formData.offsetMinutesList.includes(offset.value);
                    return (
                      <button
                        key={offset.value}
                        type="button"
                        onClick={() => handleToggleOffset(offset.value)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{offset.label}</span>
                        {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Offset Addition */}
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    placeholder="Nhập số..."
                    value={formData.customOffsetVal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customOffsetVal: e.target.value }))}
                    className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <select
                    value={formData.customOffsetUnit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customOffsetUnit: e.target.value as any }))}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="minutes">Phút trước</option>
                    <option value="hours">Giờ trước</option>
                    <option value="days">Ngày trước</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomOffset}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Thêm mốc
                  </button>
                </div>

                {/* Selected Badges Preview */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 self-center">Các mốc đã chọn:</span>
                  {formData.offsetMinutesList.sort((a, b) => b - a).map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>{formatOffsetMinutes(m)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOffset(m)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>{editingReminder ? 'Lưu Thay Đổi' : 'Tạo Nhắc Hẹn'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
