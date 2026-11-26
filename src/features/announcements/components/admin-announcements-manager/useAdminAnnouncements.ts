import React, { useState, useEffect, useCallback } from 'react';
import {
  AnnouncementFormData,
  AnnouncementItem,
  AnnouncementPagination,
  AnnouncementStats,
  PreviewTab,
} from './types';
import {
  INITIAL_FORM_DATA,
  INITIAL_PAGINATION,
  INITIAL_STATS,
} from './constants';
import { formatDateTimeLocalInput, getAuthHeaders } from './utils';

export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [stats, setStats] = useState<AnnouncementStats>(INITIAL_STATS);
  const [pagination, setPagination] = useState<AnnouncementPagination>(INITIAL_PAGINATION);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [displayModeFilter, setDisplayModeFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<AnnouncementFormData>(INITIAL_FORM_DATA);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('BANNER');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.set('admin', 'true');
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (displayModeFilter !== 'ALL') params.set('displayMode', displayModeFilter);
      if (roleFilter !== 'ALL') params.set('targetRole', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/announcements?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAnnouncements(data.announcements || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.stats) setStats(data.stats);
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách thông báo.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchQuery,
    typeFilter,
    displayModeFilter,
    roleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      content: '',
      type: 'INFO',
      displayMode: 'BANNER',
      targetRole: 'ALL',
      targetClass: '',
      linkUrl: '',
      linkText: 'Xem Chi Tiết',
      isPinned: false,
      isActive: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
    });
    setPreviewTab('BANNER');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      displayMode: item.displayMode,
      targetRole: item.targetRole,
      targetClass: item.targetClass || '',
      linkUrl: item.linkUrl || '',
      linkText: item.linkText || 'Xem Chi Tiết',
      isPinned: item.isPinned,
      isActive: item.isActive,
      startDate: formatDateTimeLocalInput(item.startDate),
      endDate: formatDateTimeLocalInput(item.endDate),
    });
    setPreviewTab(item.displayMode === 'MODAL' ? 'MODAL' : 'BANNER');
    setIsFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg('Vui lòng nhập nội dung thông báo.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: editingItem ? 'UPDATE' : 'CREATE',
          id: editingItem?.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Lưu thông báo thành công!');
        setIsFormModalOpen(false);
        fetchAnnouncements();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Không thể lưu thông báo.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ khi lưu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: AnnouncementItem) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          id: item.id,
          isActive: !item.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, isActive: !item.isActive } : a))
        );
        fetchAnnouncements();
      }
    } catch (caughtError) {
      console.warn(`[useAdminAnnouncements] Non-fatal error:`, caughtError);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'DELETE',
          id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã xóa thông báo thành công!');
        setDeletingId(null);
        fetchAnnouncements();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi khi xóa thông báo.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thông báo đã chọn?`)) {
      return;
    }

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          action: 'BULK_DELETE',
          ids: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Đã xóa thành công ${selectedIds.length} thông báo!`);
        setSelectedIds([]);
        fetchAnnouncements();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi khi xóa thông báo.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ.');
    }
  };

  return {
    announcements,
    stats,
    pagination,
    setPagination,
    isLoading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    displayModeFilter,
    setDisplayModeFilter,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    selectedIds,
    setSelectedIds,
    isFormModalOpen,
    setIsFormModalOpen,
    editingItem,
    previewItem,
    setPreviewItem,
    deletingId,
    setDeletingId,
    formData,
    setFormData,
    previewTab,
    setPreviewTab,
    isSaving,
    successMsg,
    errorMsg,
    fetchAnnouncements,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleToggleStatus,
    handleDelete,
    handleBulkDelete,
  };
}
