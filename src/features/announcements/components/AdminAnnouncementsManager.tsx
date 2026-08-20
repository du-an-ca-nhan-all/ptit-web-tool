import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Sparkles,
  Pin,
  ExternalLink,
  Layers,
  Calendar,
  User,
  Users,
  Shield,
  Filter,
  Check,
  X,
  Clock,
  Globe,
  Radio,
  EyeOff,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { AnnouncementItem } from '../../../lib/announcements';

interface AdminAnnouncementsManagerProps {
  currentUser: LoginUser;
}

export default function AdminAnnouncementsManager({
  currentUser,
}: AdminAnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    activeCount: 0,
    modalCount: 0,
    totalViews: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [displayModeFilter, setDisplayModeFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER' | 'MAINTENANCE' | 'SYSTEM';
    displayMode: 'BANNER' | 'MODAL' | 'BOTH';
    targetRole: 'ALL' | 'sinh_vien' | 'lop_truong' | 'admin';
    targetClass: string;
    linkUrl: string;
    linkText: string;
    isPinned: boolean;
    isActive: boolean;
    startDate: string;
    endDate: string;
  }>({
    title: '',
    content: '',
    type: 'INFO',
    displayMode: 'BANNER',
    targetRole: 'ALL',
    targetClass: '',
    linkUrl: '',
    linkText: '',
    isPinned: false,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const [previewTab, setPreviewTab] = useState<'BANNER' | 'MODAL'>('BANNER');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Announcements
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

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/announcements?${params.toString()}`, { headers });
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

  // Open Create Modal
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

  // Open Edit Modal
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
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '',
    });
    setPreviewTab(item.displayMode === 'MODAL' ? 'MODAL' : 'BANNER');
    setIsFormModalOpen(true);
  };

  // Save Announcement (Create or Update)
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
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

  // Toggle Status
  const handleToggleStatus = async (item: AnnouncementItem) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
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
    } catch {}
  };

  // Delete Announcement
  const handleDelete = async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
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

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} thông báo đã chọn?`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Cảnh báo
          </span>
        );
      case 'DANGER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-rose-600" /> Khẩn cấp
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-orange-600" /> Bảo trì
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Thành công
          </span>
        );
      case 'SYSTEM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Hệ thống
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
            <Megaphone className="w-3 h-3 text-sky-600" /> Thông tin
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-sky-300 mb-2.5 sm:mb-3">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Admin Announcements & Notifications</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            Quản Lý Thông Báo Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tạo và cấu hình các thông báo pop-up hoặc thanh banner hiển thị nổi bật cho toàn bộ sinh viên, lớp trưởng hoặc theo từng lớp khi truy cập website.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={fetchAnnouncements}
            disabled={isLoading}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl sm:rounded-2xl transition cursor-pointer active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl sm:rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Thông Báo Mới</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Thông Báo</div>
            <div className="text-lg sm:text-2xl font-black text-slate-800">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang Hiển Thị</div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600">{stats.activeCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Popup / Modal</div>
            <div className="text-lg sm:text-2xl font-black text-indigo-600">{stats.modalCount}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Lượt Xem</div>
            <div className="text-lg sm:text-2xl font-black text-amber-600">{stats.totalViews.toLocaleString('vi-VN')}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, người tạo hoặc mã lớp..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả loại</option>
            <option value="INFO">Thông tin</option>
            <option value="WARNING">Cảnh báo</option>
            <option value="DANGER">Khẩn cấp</option>
            <option value="MAINTENANCE">Bảo trì</option>
            <option value="SUCCESS">Thành công</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>

          {/* Display Mode Filter */}
          <select
            value={displayModeFilter}
            onChange={(e) => {
              setDisplayModeFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="BANNER">Thanh Banner</option>
            <option value="MODAL">Popup Modal</option>
            <option value="BOTH">Cả hai</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bật (Active)</option>
            <option value="INACTIVE">Đang tắt (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="text-xs font-bold text-indigo-900">
            Đã chọn <strong>{selectedIds.length}</strong> thông báo
          </div>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa đã chọn</span>
          </button>
        </div>
      )}

      {/* Announcements Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3 sm:p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      announcements.length > 0 &&
                      selectedIds.length === announcements.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(announcements.map((a) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="p-3 sm:p-4">Tiêu Đề & Nội Dung</th>
                <th className="p-3 sm:p-4">Loại & Hình Thức</th>
                <th className="p-3 sm:p-4">Đối Tượng</th>
                <th className="p-3 sm:p-4">Thời Gian</th>
                <th className="p-3 sm:p-4 text-center">Lượt Xem</th>
                <th className="p-3 sm:p-4 text-center">Trạng Thái</th>
                <th className="p-3 sm:p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                      <span>Đang tải thông báo...</span>
                    </div>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Megaphone className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">Chưa có thông báo nào</p>
                      <p className="text-xs text-slate-400">Bấm nút "Tạo Thông Báo Mới" ở trên để phát thông báo đầu tiên.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                announcements.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedIds.includes(item.id) ? 'bg-sky-50/50' : ''
                    }`}
                  >
                    <td className="p-3 sm:p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((prev) => [...prev, item.id]);
                          } else {
                            setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>

                    {/* Title and content */}
                    <td className="p-3 sm:p-4 max-w-xs md:max-w-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        {item.isPinned && (
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" /> Ghim
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      {item.linkUrl && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-600 font-medium">
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{item.linkText || item.linkUrl}</span>
                        </div>
                      )}
                    </td>

                    {/* Type and Display Mode */}
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {getTypeBadge(item.type)}
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {item.displayMode === 'BOTH'
                            ? 'Banner & Modal'
                            : item.displayMode === 'MODAL'
                            ? 'Popup Modal'
                            : 'Thanh Banner'}
                        </span>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="font-bold text-slate-700">
                          {item.targetRole === 'ALL'
                            ? 'Tất cả đối tượng'
                            : item.targetRole === 'sinh_vien'
                            ? 'Sinh viên'
                            : item.targetRole === 'lop_truong'
                            ? 'Lớp trưởng'
                            : 'Quản trị viên'}
                        </span>
                        {item.targetClass && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded self-start">
                            Lớp: {item.targetClass}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Timing */}
                    <td className="p-3 sm:p-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <div>
                        {item.startDate ? (
                          <span>
                            Từ: {new Date(item.startDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span>Ngay tức thì</span>
                        )}
                      </div>
                      {item.endDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Đến: {new Date(item.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </td>

                    {/* Views */}
                    <td className="p-3 sm:p-4 text-center font-bold text-slate-700">
                      {item.viewCount}
                    </td>

                    {/* Active toggle */}
                    <td className="p-3 sm:p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Bật
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" /> Tắt
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 sm:p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem trước giao diện"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa thông báo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> ({pagination.total} thông báo)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ANNOUNCEMENT MODAL WITH LIVE PREVIEW */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-sky-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingItem ? 'Chỉnh Sửa Thông Báo' : 'Tạo Thông Báo Mới'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Soạn thảo thông báo và xem trước giao diện trực tiếp
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content: 2-Column Grid (Form on Left, Live Preview on Right) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column (7 cols) */}
              <form onSubmit={handleSave} className="lg:col-span-7 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề thông báo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đã có lịch thi Học kỳ 2 Năm học 2025-2026!"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung chi tiết <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Nhập nội dung thông báo. Có thể xuống dòng hoặc trình bày chi tiết..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                  />
                </div>

                {/* Type and Display Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức độ / Loại thông báo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
                    >
                      <option value="INFO">ℹ️ Thông tin (Info)</option>
                      <option value="WARNING">⚠️ Cảnh báo (Warning)</option>
                      <option value="DANGER">🚨 Khẩn cấp (Danger)</option>
                      <option value="MAINTENANCE">🔧 Bảo trì (Maintenance)</option>
                      <option value="SUCCESS">✅ Thành công / Mới (Success)</option>
                      <option value="SYSTEM">✨ Hệ thống (System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hình thức hiển thị
                    </label>
                    <select
                      value={formData.displayMode}
                      onChange={(e: any) => {
                        setFormData({ ...formData, displayMode: e.target.value });
                        if (e.target.value === 'MODAL') setPreviewTab('MODAL');
                        if (e.target.value === 'BANNER') setPreviewTab('BANNER');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
                    >
                      <option value="BANNER">Thanh Banner (Đầu trang)</option>
                      <option value="MODAL">Popup Modal (Bật lên khi vào web)</option>
                      <option value="BOTH">Cả hai (Banner & Popup)</option>
                    </select>
                  </div>
                </div>

                {/* Target Role & Target Class */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đối tượng nhận
                    </label>
                    <select
                      value={formData.targetRole}
                      onChange={(e: any) => setFormData({ ...formData, targetRole: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
                    >
                      <option value="ALL">👥 Tất cả người dùng</option>
                      <option value="sinh_vien">🎓 Chỉ Sinh viên</option>
                      <option value="lop_truong">👑 Chỉ Lớp trưởng</option>
                      <option value="admin">🛡️ Chỉ Quản trị viên</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã lớp cụ thể (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Để trống nếu áp dụng tất cả lớp"
                      value={formData.targetClass}
                      onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Call-to-action button & link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đường dẫn liên kết (CTA Link)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: /schedule hoặc https://..."
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chữ hiển thị trên nút bấm
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Xem Lịch Thi Ngay"
                      value={formData.linkText}
                      onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Date scheduling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bắt đầu hiển thị từ
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kết thúc / Hết hạn vào (Tùy chọn)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Checkbox Options */}
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span>📌 Ghim thông báo lên đầu</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>✅ Kích hoạt ngay (Active)</span>
                  </label>
                </div>
              </form>

              {/* Live Preview Column (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-600" />
                    <span>Xem Trước Trực Tiếp</span>
                  </span>

                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('BANNER')}
                      className={`px-2 py-0.5 rounded transition ${
                        previewTab === 'BANNER'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('MODAL')}
                      className={`px-2 py-0.5 rounded transition ${
                        previewTab === 'MODAL'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Popup Modal
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  {previewTab === 'BANNER' ? (
                    <div className="p-3 bg-white rounded-xl border border-sky-300 shadow-xs flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {formData.isPinned && (
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold uppercase">
                            Ghim
                          </span>
                        )}
                        {getTypeBadge(formData.type)}
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {formData.title || 'Tiêu đề thông báo mẫu'}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                        {formData.content || 'Nội dung thông báo sẽ xuất hiện tại đây...'}
                      </p>
                      {formData.linkUrl && (
                        <div className="pt-1 flex justify-end">
                          <span className="px-2.5 py-1 bg-sky-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <span>{formData.linkText || 'Xem Chi Tiết'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                      <div className="p-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="w-4 h-4" />
                          <h4 className="text-xs font-bold text-white truncate">
                            {formData.title || 'Tiêu đề thông báo mẫu'}
                          </h4>
                        </div>
                        <X className="w-3.5 h-3.5 opacity-80" />
                      </div>
                      <div className="p-3.5 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                        {formData.content || 'Nội dung chi tiết của thông báo popup bật lên...'}
                      </div>
                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Không hiện lại trong 24h</span>
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold">
                          Đã Hiểu
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 text-center">
                  Giao diện thực tế sẽ tự động tối ưu theo thiết bị người dùng.
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{editingItem ? 'Lưu Thay Đổi' : 'Đăng Thông Báo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Xem Trước Thông Báo #{previewItem.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {previewItem.isPinned && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">
                    Ghim
                  </span>
                )}
                {getTypeBadge(previewItem.type)}
                <h4 className="text-sm font-bold text-slate-900">{previewItem.title}</h4>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {previewItem.content}
              </div>
              {previewItem.linkUrl && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={previewItem.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{previewItem.linkText || 'Xem Chi Tiết'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 flex flex-col gap-4 border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Xác Nhận Xóa Thông Báo</h3>
                <p className="text-xs text-slate-500">Thao tác này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thông báo ID <strong>#{deletingId}</strong> không? Sau khi xóa, thông báo sẽ ngừng hiển thị ngay lập tức.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
