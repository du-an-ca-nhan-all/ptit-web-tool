import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginUser } from '../../../../types';
import { ACTION_CONFIGS } from './actionConfigs';
import {
  ActivityLogItem,
  ActivityLogsPagination,
  DeleteLogsMode,
  MetadataViewTab,
} from './types';

export function useActivityLogs(currentUser: LoginUser) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState<ActivityLogsPagination>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  });
  const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [metadataViewTab, setMetadataViewTab] = useState<MetadataViewTab>('VISUAL');

  // Delete / Cleanup logs state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<DeleteLogsMode>('COUNT');
  const [deleteCount, setDeleteCount] = useState<number>(100);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [deleteDays, setDeleteDays] = useState<number>(30);
  const [cleanReminderLogs, setCleanReminderLogs] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [confirmAllText, setConfirmAllText] = useState('');

  const handleCopyJson = (data: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const filteredAvailableActions = useMemo(() => {
    if (selectedCategory === 'ALL') return availableActions;
    return availableActions.filter((act) => {
      const config = ACTION_CONFIGS[act];
      return config && config.category === selectedCategory;
    });
  }, [availableActions, selectedCategory]);

  const displayedLogs = useMemo(() => {
    if (selectedCategory === 'ALL' || actionFilter) return logs;
    return logs.filter((l) => {
      const config = ACTION_CONFIGS[l.action];
      return config && config.category === selectedCategory;
    });
  }, [logs, selectedCategory, actionFilter]);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
      currentUser?.activeRole === 'admin' ||
      (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  const fetchLogs = useCallback(
    async (pageToFetch = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageToFetch));
        params.set('limit', String(pagination.limit));
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (actionFilter) params.set('action', actionFilter);

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/activity-logs?${params.toString()}`, { headers });
        const data = await res.json();
        if (res.ok && data.success) {
          setLogs(data.logs || []);
          setPagination(data.pagination);
          if (data.availableActions) {
            setAvailableActions(data.availableActions);
          }
        }
      } catch (err) {
        console.error('Fetch logs error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, searchQuery, actionFilter]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleDeleteLogs = async () => {
    setIsDeleting(true);
    setDeleteSuccessMsg('');
    setDeleteErrorMsg('');

    try {
      let finalCount = deleteCount;
      if (customCountInput && !isNaN(parseInt(customCountInput, 10)) && parseInt(customCountInput, 10) > 0) {
        finalCount = parseInt(customCountInput, 10);
      }

      if (
        deleteMode === 'ALL' &&
        confirmAllText.trim().toUpperCase() !== 'XÓA TẤT CẢ' &&
        confirmAllText.trim().toUpperCase() !== 'XOA TAT CA'
      ) {
        setDeleteErrorMsg('Vui lòng nhập đúng cụm từ "XÓA TẤT CẢ" để xác nhận xoá toàn bộ log.');
        setIsDeleting(false);
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = {
        mode: deleteMode,
        cleanReminderLogs,
      };

      if (deleteMode === 'COUNT') {
        body.count = finalCount;
      } else if (deleteMode === 'DAYS') {
        body.days = deleteDays;
      }

      const res = await fetch('/api/activity-logs', {
        method: 'DELETE',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteSuccessMsg(data.message || `Đã xoá ${data.totalDeleted} bản ghi log thành công!`);
        fetchLogs(1);
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeleteSuccessMsg('');
          setConfirmAllText('');
        }, 1800);
      } else {
        setDeleteErrorMsg(data.error || 'Lỗi khi xoá nhật ký.');
      }
    } catch (err: any) {
      setDeleteErrorMsg('Lỗi kết nối máy chủ khi thực hiện xoá nhật ký.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openLogMetadata = (log: ActivityLogItem) => {
    setSelectedLogMetadata(log);
    setMetadataViewTab('VISUAL');
    setCopiedJson(false);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteSuccessMsg('');
    setDeleteErrorMsg('');
    setConfirmAllText('');
  };

  return {
    logs,
    isLoading,
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter,
    selectedCategory,
    setSelectedCategory,
    pagination,
    selectedLogMetadata,
    setSelectedLogMetadata,
    copiedJson,
    metadataViewTab,
    setMetadataViewTab,
    filteredAvailableActions,
    displayedLogs,
    isAdmin,
    showDeleteModal,
    setShowDeleteModal,
    deleteMode,
    setDeleteMode,
    deleteCount,
    setDeleteCount,
    customCountInput,
    setCustomCountInput,
    deleteDays,
    setDeleteDays,
    cleanReminderLogs,
    setCleanReminderLogs,
    isDeleting,
    deleteSuccessMsg,
    deleteErrorMsg,
    setDeleteErrorMsg,
    confirmAllText,
    setConfirmAllText,
    fetchLogs,
    handleCopyJson,
    handleDeleteLogs,
    openLogMetadata,
    openDeleteModal,
  };
}
