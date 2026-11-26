import { useState, useEffect, useMemo } from 'react';
import { ExternalAccountAdminItem, StatusFilter } from './types';
import {
  computeAccountMetrics,
  exportAccountsToCsv,
  extractClassList,
  filterAccounts,
} from './utils';
import { useAccountFormModal } from './useAccountFormModal';

export function useAdminExternalAccounts() {
  const [accounts, setAccounts] = useState<ExternalAccountAdminItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalClasses, setTotalClasses] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSystem, setSelectedSystem] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: number]: boolean }>({});

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
  const [viewingTokenAccount, setViewingTokenAccount] = useState<ExternalAccountAdminItem | null>(null);

  // Delete confirm modal
  const [deletingAccount, setDeletingAccount] = useState<ExternalAccountAdminItem | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/external-accounts?view=all');
      const data = await res.json();
      if (res.ok && data.accounts) {
        setAccounts(data.accounts);
        setTotalStudents(data.totalStudents || 0);
        setTotalClasses(data.totalClasses || 0);
      } else {
        setErrorMsg(data.error || 'Không thể tải danh sách tài khoản liên kết');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formModal = useAccountFormModal({
    setSuccessMsg,
    setErrorMsg,
    fetchAccounts,
  });

  const classList = useMemo(() => extractClassList(accounts), [accounts]);

  const filteredAccounts = useMemo(
    () =>
      filterAccounts({
        accounts,
        searchQuery,
        selectedClass,
        selectedSystem,
        statusFilter,
      }),
    [accounts, searchQuery, selectedClass, selectedSystem, statusFilter]
  );

  const metrics = useMemo(
    () => computeAccountMetrics(accounts, totalStudents),
    [accounts, totalStudents]
  );

  const toggleShowPassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyToken = (token: string, id: number) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleGetTokenSingle = async (acc: ExternalAccountAdminItem) => {
    setTestingId(acc.id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GET_TOKEN',
          systemKey: acc.systemKey,
          targetUsername: acc.username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lấy token thất bại');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setTestingId(null);
    }
  };

  const handleBatchGetTokens = async () => {
    const sysLabel = selectedSystem === 'ALL' ? 'toàn bộ các hệ thống' : selectedSystem;
    if (!confirm(`Bạn có chắc muốn lấy và xác thực Session/Token cho ${sysLabel}?`)) return;
    setIsBatchTesting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BATCH_GET_TOKENS',
          systemKey: selectedSystem === 'ALL' ? 'ALL' : selectedSystem,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lấy token hàng loạt thất bại');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsBatchTesting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          systemKey: deletingAccount.systemKey,
          targetUsername: deletingAccount.username,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setDeletingAccount(null);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi xóa tài khoản');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  const handleExportCSV = () => exportAccountsToCsv(accounts);

  return {
    accounts,
    totalStudents,
    totalClasses,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    selectedSystem,
    setSelectedSystem,
    statusFilter,
    setStatusFilter,
    visiblePasswords,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    isBatchTesting,
    testingId,
    copiedTokenId,
    viewingTokenAccount,
    setViewingTokenAccount,
    deletingAccount,
    setDeletingAccount,
    classList,
    filteredAccounts,
    metrics,
    fetchAccounts,
    toggleShowPassword,
    handleCopyToken,
    handleGetTokenSingle,
    handleBatchGetTokens,
    handleDeleteConfirm,
    handleExportCSV,
    formModal,
  };
}
