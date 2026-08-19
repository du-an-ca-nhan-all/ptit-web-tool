import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  Phone,
  GraduationCap,
  AlertCircle,
  Trash2,
  Eye,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { LoginUser } from '../types';
import AdminResetPasswordModal from './AdminResetPasswordModal';

interface RegistrationItem {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  lop?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

interface AdminRegistrationManagerProps {
  currentUser: LoginUser;
}

export default function AdminRegistrationManager({ currentUser }: AdminRegistrationManagerProps) {
  const [requests, setRequests] = useState<RegistrationItem[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // Selected items for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Action processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<RegistrationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Reset Password Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState({ username: '', fullName: '', lop: '' });

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Fetch registration requests
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/auth/registrations?${params.toString()}`, { headers });
      const data = await res.json();

      if (res.ok && data.success) {
        setRequests(data.requests || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách yêu cầu đăng ký.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Approve (Single or Bulk)
  const handleApprove = async (targetIds: number[]) => {
    if (targetIds.length === 0) return;
    setIsProcessing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/registrations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: targetIds.length > 1 ? 'BULK_APPROVE' : 'APPROVE',
          ids: targetIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Đã duyệt thành công ${targetIds.length} yêu cầu đăng ký!`);
        setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi khi duyệt yêu cầu đăng ký.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setIsProcessing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/registrations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'REJECT',
          id: rejectingItem.id,
          reason: rejectReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Đã từ chối yêu cầu đăng ký của ${rejectingItem.username}!`);
        setRejectingItem(null);
        setRejectReason('');
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lỗi khi từ chối yêu cầu.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Delete request
  const handleDeleteRequest = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xoá bản ghi đăng ký này?')) return;
    setIsProcessing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/registrations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'DELETE',
          id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã xoá bản ghi thành công!');
        fetchRequests();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Lỗi khi xoá bản ghi.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto my-8">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Màn hình Duyệt Đăng Ký Tài Khoản chỉ hiển thị và cho phép truy cập với Quản trị viên (Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Duyệt Đăng Ký Tài Khoản
              </h2>
              {counts.pending > 0 && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-full animate-pulse">
                  {counts.pending} Chờ Duyệt
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Xét duyệt và kích hoạt mật khẩu cho sinh viên đăng ký tài khoản mới trên cổng thông tin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              setResetModalUser({ username: '', fullName: '', lop: '' });
              setIsResetModalOpen(true);
            }}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
            title="Chủ động đặt lại mật khẩu cho bất kỳ người dùng nào"
          >
            <KeyRound className="w-4 h-4" />
            <span>Reset Mật Khẩu User</span>
          </button>

          <button
            onClick={() => fetchRequests()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'PENDING' ? 'text-amber-100' : 'text-slate-400'}`}>
              Chờ Duyệt
            </div>
            <div className={`text-2xl font-black ${statusFilter === 'PENDING' ? 'text-white' : 'text-amber-600'}`}>
              {counts.pending}
            </div>
          </div>
          <Clock className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
              : 'bg-white border-slate-200 hover:bg-emerald-50/50'
          }`}
        >
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'APPROVED' ? 'text-emerald-100' : 'text-slate-400'}`}>
              Đã Duyệt
            </div>
            <div className={`text-2xl font-black ${statusFilter === 'APPROVED' ? 'text-white' : 'text-emerald-600'}`}>
              {counts.approved}
            </div>
          </div>
          <CheckCircle2 className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
              : 'bg-white border-slate-200 hover:bg-rose-50/50'
          }`}
        >
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'REJECTED' ? 'text-rose-100' : 'text-slate-400'}`}>
              Đã Từ Chối
            </div>
            <div className={`text-2xl font-black ${statusFilter === 'REJECTED' ? 'text-white' : 'text-rose-600'}`}>
              {counts.rejected}
            </div>
          </div>
          <XCircle className={`w-8 h-8 opacity-40`} />
        </div>

        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-950 shadow-md'
              : 'bg-white border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
              Tổng Yêu Cầu
            </div>
            <div className={`text-2xl font-black ${statusFilter === 'ALL' ? 'text-white' : 'text-slate-800'}`}>
              {counts.total}
            </div>
          </div>
          <User className={`w-8 h-8 opacity-40`} />
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Toolbar & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã SV, Họ tên, Lớp, SĐT, Ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'PENDING'
                  ? `Chờ duyệt (${counts.pending})`
                  : st === 'APPROVED'
                  ? `Đã duyệt`
                  : st === 'REJECTED'
                  ? `Từ chối`
                  : `Tất cả`}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end animate-in fade-in">
            <span className="text-xs font-bold text-slate-600">
              Đã chọn: <b className="text-blue-600">{selectedIds.length}</b> mục
            </span>
            <button
              onClick={() => handleApprove(selectedIds)}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Duyệt ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Request List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px]">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-medium">Đang tải danh sách yêu cầu đăng ký...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[300px] text-center">
            <UserCheck className="w-12 h-12 text-slate-300" />
            <span className="text-sm font-bold text-slate-700">Không có yêu cầu đăng ký nào phù hợp</span>
            <span className="text-xs text-slate-400 max-w-sm">
              Tất cả các tài khoản sinh viên đã được xử lý hoặc chưa có sinh viên gửi yêu cầu trong bộ lọc này.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === requests.length && requests.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Sinh Viên / MSSV</th>
                  <th className="py-3.5 px-4">Lớp Học</th>
                  <th className="py-3.5 px-4">SĐT Liên Hệ</th>
                  <th className="py-3.5 px-4">Thời Gian Gửi</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4">Ghi Chú</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requests.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {item.fullName ? item.fullName.charAt(0) : item.username.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {item.fullName || 'Chưa rõ họ tên'}
                            </div>
                            <div className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-0.5">
                              {item.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {item.lop ? (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            {item.lop}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {item.phoneNumber ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {item.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Chờ Duyệt
                          </span>
                        ) : item.status === 'APPROVED' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Đã Duyệt
                            </span>
                            {item.reviewedBy && (
                              <span className="text-[10px] text-slate-400">
                                bởi @{item.reviewedBy}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" /> Đã Từ Chối
                            </span>
                            {item.reviewedBy && (
                              <span className="text-[10px] text-slate-400">
                                bởi @{item.reviewedBy}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={item.note || ''}>
                        {item.note || <span className="text-slate-400 italic">—</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove([item.id])}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Phê duyệt kích hoạt tài khoản sinh viên này"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Duyệt</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectReason('');
                                }}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Từ chối yêu cầu đăng ký"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser({
                                username: item.username,
                                fullName: item.fullName || item.username,
                                lop: item.lop || '',
                              });
                              setIsResetModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            title={`Đặt lại mật khẩu cho ${item.username}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteRequest(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Xoá bản ghi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Từ Chối Yêu Cầu Đăng Ký</h4>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div>Sinh viên: <b>{rejectingItem.fullName || rejectingItem.username}</b></div>
                <div className="font-mono text-blue-600 mt-0.5">MSSV: {rejectingItem.username}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do từ chối (tùy chọn):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Sai thông tin MSSV, không thuộc danh sách lớp..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      <AdminResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        initialUsername={resetModalUser.username}
        initialFullName={resetModalUser.fullName}
        initialClass={resetModalUser.lop}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </div>
  );
}
