'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ReminderItemDto, EnrolledCourseOption } from '../../types/reminder.types';
import { ReminderTabFilter, ReminderStatusFilter, ReminderStats } from './types';

export function useRemindersData() {
  const [reminders, setReminders] = useState<ReminderItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Expand / Collapse descriptions per card
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const toggleExpandDescription = (id: number) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Detail Modal State (Xem chi tiết đầy đủ)
  const [viewingReminder, setViewingReminder] = useState<ReminderItemDto | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>('');
  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Filter & Search
  const [activeTab, setActiveTab] = useState<ReminderTabFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReminderStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Enrolled Courses for dropdown
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseOption[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

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
        setViewingReminder((prev) => (prev && prev.id === reminder.id ? data.reminder : prev));
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
        if (viewingReminder?.id === reminder.id) setViewingReminder(null);
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
        if (viewingReminder?.id === reminder.id) setViewingReminder(null);
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
  const stats = useMemo<ReminderStats>(() => {
    const total = reminders.length;
    const personal = reminders.filter((r) => r.type === 'PERSONAL').length;
    const course = reminders.filter((r) => r.type === 'COURSE').length;
    const completed = reminders.filter((r) => r.isCompleted).length;
    const active = total - completed;
    return { total, personal, course, completed, active };
  }, [reminders]);

  return {
    reminders,
    isLoading,
    isRefreshing,
    errorMsg,
    setErrorMsg,
    successMsg,
    setSuccessMsg,
    expandedDescriptions,
    toggleExpandDescription,
    viewingReminder,
    setViewingReminder,
    copiedKey,
    handleCopyText,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    enrolledCourses,
    isLoadingCourses,
    fetchReminders,
    handleToggleComplete,
    handleDeleteReminder,
    handleDismissReminder,
    filteredReminders,
    stats,
  };
}
