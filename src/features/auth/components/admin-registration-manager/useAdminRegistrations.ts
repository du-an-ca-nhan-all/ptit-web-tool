'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoginUser } from '../../../../types';
import {
  RegistrationCounts,
  RegistrationItem,
  RegistrationStatusFilter,
  ResetModalUser,
} from './types';
import { buildAuthHeaders } from './utils';

export function useAdminRegistrations(currentUser: LoginUser) {
  const [requests, setRequests] = useState<RegistrationItem[]>([]);
  const [counts, setCounts] = useState<RegistrationCounts>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatusFilter>('PENDING');

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
  const [resetModalUser, setResetModalUser] = useState<ResetModalUser>({
    username: '',
    fullName: '',
    lop: '',
  });

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

      const headers = buildAuthHeaders(false);

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
      const headers = buildAuthHeaders(true);

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
      const headers = buildAuthHeaders(true);

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
      const headers = buildAuthHeaders(true);

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

  return {
    requests,
    counts,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    isProcessing,
    successMsg,
    errorMsg,
    rejectingItem,
    setRejectingItem,
    rejectReason,
    setRejectReason,
    isResetModalOpen,
    setIsResetModalOpen,
    resetModalUser,
    setResetModalUser,
    isAdmin,
    fetchRequests,
    handleApprove,
    handleConfirmReject,
    handleDeleteRequest,
    handleToggleSelect,
    handleSelectAll,
  };
}
