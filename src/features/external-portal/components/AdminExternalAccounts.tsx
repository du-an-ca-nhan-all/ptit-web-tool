import React, { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Globe,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  User as UserIcon,
  Download,
  ShieldCheck,
  Check,
  X,
  Layers,
  Sparkles,
  Users,
  Zap,
  Copy,
  CheckCheck,
  FileKey,
  Lock,
  BookOpen,
  Clock,
  Smartphone,
} from 'lucide-react';
import { LoginUser, AVAILABLE_EXTERNAL_SYSTEMS } from '../../../types';
import { SlinkConnectionGuide } from './SlinkConnectionGuide';

interface ExternalAccountAdminItem {
  id: number;
  username: string; // Mã SV
  hoTen: string;
  maLop: string;
  soDienThoai: string;
  systemKey: string;
  systemName: string;
  systemUrl: string;
  extUsername: string;
  extPassword?: string;
  token?: string | null;
  hasToken?: boolean;
  status: string;
  lastSyncAt: string | null;
  syncMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminExternalAccountsProps {
  currentUser: LoginUser;
}

export default function AdminExternalAccounts({ currentUser }: AdminExternalAccountsProps) {
  const [accounts, setAccounts] = useState<ExternalAccountAdminItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalClasses, setTotalClasses] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSystem, setSelectedSystem] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONNECTED' | 'ERROR' | 'HAS_TOKEN'>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: number]: boolean }>({});

  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);
  const [viewingTokenAccount, setViewingTokenAccount] = useState<ExternalAccountAdminItem | null>(null);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formData, setFormData] = useState({
    username: '',
    extUsername: '',
    extPassword: '',
    systemKey: AVAILABLE_EXTERNAL_SYSTEMS[0]?.key || 'QLDTTX_PTTC1',
    systemName: AVAILABLE_EXTERNAL_SYSTEMS[0]?.name || 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
    systemUrl: AVAILABLE_EXTERNAL_SYSTEMS[0]?.url || 'https://qldttx.pttc1.edu.vn/',
  });
  const [showModalPass, setShowModalPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalTesting, setIsModalTesting] = useState(false);
  const [modalTestStatus, setModalTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [modalTestError, setModalTestError] = useState('');
  const [lastTestedModalUser, setLastTestedModalUser] = useState('');
  const [lastTestedModalPass, setLastTestedModalPass] = useState('');

  // Delete confirm modal
  const [deletingAccount, setDeletingAccount] = useState<ExternalAccountAdminItem | null>(null);

  // Fetch all external accounts for Admin
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
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Distinct classes for filter
  const classList = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      if (a.maLop && a.maLop !== 'Chưa phân lớp') set.add(a.maLop);
    });
    return Array.from(set).sort();
  }, [accounts]);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      // Search
      const matchSearch =
        !searchQuery.trim() ||
        a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.maLop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.extUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.soDienThoai && a.soDienThoai.includes(searchQuery));

      // Class
      const matchClass = selectedClass === 'ALL' || a.maLop === selectedClass;

      // System
      const matchSystem = selectedSystem === 'ALL' || a.systemKey === selectedSystem;

      // Status
      let matchStatus = true;
      if (statusFilter === 'CONNECTED') matchStatus = a.status === 'CONNECTED';
      else if (statusFilter === 'ERROR') matchStatus = a.status === 'ERROR';
      else if (statusFilter === 'HAS_TOKEN') matchStatus = !!a.token;

      return matchSearch && matchClass && matchStatus && matchSystem;
    });
  }, [accounts, searchQuery, selectedClass, selectedSystem, statusFilter]);

  // Toggle single password visibility
  const toggleShowPassword = (id: number) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy token
  const handleCopyToken = (token: string, id: number) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Get/Refresh Single Token
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
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setTestingId(null);
    }
  };

  // Batch Get Tokens / Test all accounts
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
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsBatchTesting(false);
    }
  };

  // Test credentials before saving in modal
  const handleTestModalCredentials = async () => {
    if (!formData.username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên trước khi kiểm tra');
      return;
    }
    if (!formData.extUsername.trim()) {
      setErrorMsg(`Vui lòng nhập Tên đăng nhập ${formData.systemName} trước khi kiểm tra`);
      return;
    }
    if (!formData.extPassword.trim()) {
      setErrorMsg(`Vui lòng nhập Mật khẩu ${formData.systemName} trước khi kiểm tra`);
      return;
    }

    const testUser = formData.extUsername.trim();
    const testPass = formData.extPassword.trim();

    setIsModalTesting(true);
    setModalTestStatus('TESTING');
    setModalTestError('');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          systemKey: formData.systemKey,
          systemName: formData.systemName,
          systemUrl: formData.systemUrl,
          targetUsername: formData.username.trim(),
          extUsername: testUser,
          extPassword: testPass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModalTestStatus('SUCCESS');
        setLastTestedModalUser(testUser);
        setLastTestedModalPass(testPass);
        setSuccessMsg(data.message || 'Kiểm tra kết nối thành công! Đã mở khóa nút Lưu.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errMsg = data.error || 'Kiểm tra kết nối thất bại.';
        setModalTestStatus('FAILED');
        setModalTestError(errMsg);
        setLastTestedModalUser('');
        setLastTestedModalPass('');
        setErrorMsg(errMsg);
      }
    } catch (err) {
      const errMsg = 'Lỗi kết nối máy chủ khi kiểm tra tài khoản.';
      setModalTestStatus('FAILED');
      setModalTestError(errMsg);
      setLastTestedModalUser('');
      setLastTestedModalPass('');
      setErrorMsg(errMsg);
    } finally {
      setIsModalTesting(false);
    }
  };

  // Save Modal (Add or Edit) - Requires successful test first!
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      setErrorMsg('Vui lòng nhập Mã sinh viên');
      return;
    }
    if (!formData.extUsername.trim()) {
      setErrorMsg('Vui lòng nhập Tên đăng nhập QLDTTX');
      return;
    }
    if (!formData.extPassword.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu QLDTTX');
      return;
    }

    const isTestPassed =
      modalTestStatus === 'SUCCESS' &&
      formData.extUsername.trim() === lastTestedModalUser &&
      formData.extPassword.trim() === lastTestedModalPass;

    if (!isTestPassed) {
      setErrorMsg('Yêu cầu bấm "Kiểm Tra Kết Nối" thành công trước khi có thể lưu cấu hình.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE',
          systemKey: formData.systemKey,
          systemName: formData.systemName,
          systemUrl: formData.systemUrl,
          targetUsername: formData.username.trim(),
          extUsername: formData.extUsername.trim(),
          extPassword: formData.extPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Lưu cấu hình tài khoản thành công!');
        setIsModalOpen(false);
        fetchAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu tài khoản');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Account
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
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (accounts.length === 0) {
      alert('Không có dữ liệu để xuất file');
      return;
    }

    const headers = [
      'STT',
      'Mã Sinh Viên',
      'Họ và Tên',
      'Lớp',
      'SĐT',
      'Hệ Thống',
      'URL',
      'Tên Đăng Nhập QLDTTX',
      'Mật Khẩu',
      'Token',
      'Trạng Thái',
      'Cập Nhật Lần Cuối',
    ];
    const rows = accounts.map((a, idx) => [
      idx + 1,
      a.username,
      `"${a.hoTen}"`,
      a.maLop,
      a.soDienThoai || '',
      `"${a.systemName}"`,
      a.systemUrl,
      a.extUsername,
      `"${a.extPassword || ''}"`,
      `"${a.token || ''}"`,
      a.status,
      a.updatedAt ? new Date(a.updatedAt).toLocaleString('vi-VN') : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_sach_tai_khoan_QLDTTX_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const connectedCount = accounts.filter((a) => a.status === 'CONNECTED').length;
  const hasTokenCount = accounts.filter((a) => !!a.token).length;
  const qldttxAccounts = accounts.filter((a) => a.systemKey === 'QLDTTX_PTTC1');
  const qldttxCount = qldttxAccounts.length;
  const qldttxTokenCount = qldttxAccounts.filter((a) => !!a.token).length;
  const lmsAccounts = accounts.filter((a) => a.systemKey === 'LMS_PTTC1');
  const lmsCount = lmsAccounts.length;
  const lmsTokenCount = lmsAccounts.filter((a) => !!a.token).length;
  const slinkAccounts = accounts.filter((a) => a.systemKey === 'SLINK_PTIT');
  const slinkCount = slinkAccounts.length;
  const slinkTokenCount = slinkAccounts.filter((a) => !!a.token).length;
  const coveragePercent = totalStudents > 0 ? ((accounts.length / totalStudents) * 100).toFixed(1) : '0';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
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
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Quản Lý Tài Khoản Cổng Đào Tạo & LMS
                </h1>
                <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  Admin
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Cổng liên kết: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong> (PTIT Cơ sở 1)
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={fetchAccounts}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>

          <button
            onClick={handleBatchGetTokens}
            disabled={isBatchTesting || accounts.length === 0}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-amber-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Lấy và xác thực Session/Token cho toàn bộ tài khoản"
          >
            {isBatchTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Lấy Session/Token</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={accounts.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => {
              setModalMode('ADD');
              setFormData({
                username: '',
                extUsername: '',
                extPassword: '',
                systemKey: AVAILABLE_EXTERNAL_SYSTEMS[0]?.key || 'QLDTTX_PTTC1',
                systemName: AVAILABLE_EXTERNAL_SYSTEMS[0]?.name || 'Cổng Quản Lý Đào Tạo Từ Xa (PTTC1)',
                systemUrl: AVAILABLE_EXTERNAL_SYSTEMS[0]?.url || 'https://qldttx.pttc1.edu.vn/',
              });
              setModalTestStatus('IDLE');
              setModalTestError('');
              setLastTestedModalUser('');
              setLastTestedModalPass('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm / Cấu Hình Cho SV</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tài Khoản Đã Liên Kết</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {accounts.length}{' '}
              <span className="text-xs font-normal text-slate-400">/ {totalStudents} SV</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Tỷ lệ SV: {coveragePercent}%</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileKey className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cổng QLDTTX (PTTC1)</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {qldttxCount}{' '}
              <span className="text-xs font-normal text-slate-400">({qldttxTokenCount} Token)</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Sẵn sàng crawl/đồng bộ</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">LMS Trực Tuyến</div>
            <div className="text-2xl font-black text-sky-600 mt-0.5">
              {lmsCount}{' '}
              <span className="text-xs font-normal text-slate-400">({lmsTokenCount} Session)</span>
            </div>
            <div className="text-[11px] text-sky-700 font-bold mt-0.5">Tài khoản lms.pttc1.edu.vn</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">PTIT S-Link</div>
            <div className="text-2xl font-black text-purple-600 mt-0.5">
              {slinkCount}{' '}
              <span className="text-xs font-normal text-slate-400">({slinkTokenCount} Token)</span>
            </div>
            <div className="text-[11px] text-purple-700 font-bold mt-0.5">SSO slink.ptit.edu.vn</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cổng Mục Tiêu</div>
            <div className="flex flex-col gap-0.5 mt-0.5">
              <a
                href="https://qldttx.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-mono font-semibold"
              >
                qldttx.pttc1.edu.vn <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://lms.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-600 hover:underline flex items-center gap-1 font-mono font-semibold"
              >
                lms.pttc1.edu.vn <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://slink.ptit.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-mono font-semibold"
              >
                slink.ptit.edu.vn <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Mã SV, Họ tên, Lớp, SĐT..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
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
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* System filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-400 font-bold">Hệ thống:</span>
              <select
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả hệ thống</option>
                {AVAILABLE_EXTERNAL_SYSTEMS.map((sys) => (
                  <option key={sys.key} value={sys.key}>
                    {sys.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs shadow-2xs">
              <span className="text-slate-400 font-bold">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả lớp ({classList.length})</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({accounts.length})
              </button>
              <button
                onClick={() => setStatusFilter('HAS_TOKEN')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'HAS_TOKEN'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Có Token ({hasTokenCount})
              </button>
              <button
                onClick={() => setStatusFilter('CONNECTED')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'CONNECTED'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã liên kết ({connectedCount})
              </button>
            </div>
          </div>
        </div>

        {/* SLINK Guide Banner when filtered by SLINK_PTIT */}
        {selectedSystem === 'SLINK_PTIT' && (
          <div className="p-4 pb-0">
            <SlinkConnectionGuide variant="banner" />
          </div>
        )}

        {/* Accounts Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải danh sách tài khoản liên kết...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Globe className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản liên kết nào</p>
              <p className="text-xs text-slate-400 max-w-sm">
                {searchQuery || selectedClass !== 'ALL'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                  : 'Chưa có sinh viên nào cấu hình tài khoản cổng QLĐT Từ Xa.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">STT</th>
                  <th className="px-4 py-3.5">Sinh Viên</th>
                  <th className="px-4 py-3.5">Lớp</th>
                  <th className="px-4 py-3.5">Hệ Thống</th>
                  <th className="px-4 py-3.5">Tên Đăng Nhập</th>
                  <th className="px-4 py-3.5">Mật Khẩu</th>
                  <th className="px-4 py-3.5">Access Token</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-center">Cập Nhật</th>
                  <th className="px-4 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc, index) => {
                  const isPassVisible = !!visiblePasswords[acc.id];
                  const isCurrentTesting = testingId === acc.id;
                  const isCopied = copiedTokenId === acc.id;

                  return (
                    <tr key={acc.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                              {acc.username}
                            </span>
                            <span className="font-bold text-slate-800 text-sm">{acc.hoTen}</span>
                          </div>
                          {acc.soDienThoai && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <span>SĐT: {acc.soDienThoai}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {acc.maLop}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {acc.systemKey === 'LMS_PTTC1' ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                            <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>LMS PTTC1</span>
                          </span>
                        ) : acc.systemKey === 'SLINK_PTIT' ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>PTIT S-Link</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Cổng QLDTTX</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {acc.extUsername}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-800">
                            {isPassVisible ? acc.extPassword || '(Trống)' : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(acc.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                            title={isPassVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {acc.token ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setViewingTokenAccount(acc)}
                              className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg truncate max-w-[140px] cursor-pointer hover:bg-emerald-100 transition-colors"
                              title="Bấm để xem toàn bộ Session / Token"
                            >
                              {acc.token.replace(/^Bearer\s+/i, '').substring(0, 16)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyToken(acc.token!, acc.id)}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded-md transition-colors cursor-pointer"
                              title="Sao chép Session / Token"
                            >
                              {isCopied ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa cấp</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {acc.status === 'CONNECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" /> Đã Liên Kết
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertCircle className="w-3 h-3" /> Lỗi Kết Nối
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {acc.updatedAt ? new Date(acc.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Get / Refresh Token button */}
                          <button
                            onClick={() => handleGetTokenSingle(acc)}
                            disabled={isCurrentTesting}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            title={
                              acc.systemKey === 'LMS_PTTC1'
                                ? 'Lấy / Làm mới Session LMS'
                                : acc.systemKey === 'SLINK_PTIT'
                                ? 'Lấy / Làm mới Token PTIT S-Link'
                                : 'Lấy / Làm mới Token QLDTTX'
                            }
                          >
                            {isCurrentTesting ? (
                              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setModalMode('EDIT');
                              setFormData({
                                username: acc.username,
                                extUsername: acc.extUsername,
                                extPassword: acc.extPassword || '',
                                systemKey: acc.systemKey,
                                systemName: acc.systemName,
                                systemUrl: acc.systemUrl,
                              });
                              setModalTestStatus('IDLE');
                              setModalTestError('');
                              setLastTestedModalUser('');
                              setLastTestedModalPass('');
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                            title="Sửa thông tin tài khoản"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setDeletingAccount(acc)}
                            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Hủy liên kết tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal View Full Token */}
      {viewingTokenAccount && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingTokenAccount(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FileKey className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Chi Tiết Access Token</h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    {viewingTokenAccount.hoTen} ({viewingTokenAccount.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTokenAccount(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Giá trị Bearer Token (Dùng cho API Crawl & Đồng bộ):
                </label>
                <textarea
                  readOnly
                  value={viewingTokenAccount.token || 'Chưa có token'}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 break-all outline-none select-all"
                />
              </div>

              {viewingTokenAccount.syncMessage && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    viewingTokenAccount.status === 'ERROR' ||
                    viewingTokenAccount.syncMessage.toLowerCase().includes('lỗi') ||
                    viewingTokenAccount.syncMessage.toLowerCase().includes('thất bại')
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-slate-50 border border-slate-200 text-slate-600'
                  }`}
                >
                  <span
                    className={`font-bold block mb-0.5 ${
                      viewingTokenAccount.status === 'ERROR' ||
                      viewingTokenAccount.syncMessage.toLowerCase().includes('lỗi') ||
                      viewingTokenAccount.syncMessage.toLowerCase().includes('thất bại')
                        ? 'text-rose-900'
                        : 'text-slate-700'
                    }`}
                  >
                    Nhật ký trạng thái:
                  </span>
                  <span>{viewingTokenAccount.syncMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleGetTokenSingle(viewingTokenAccount)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-200"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Làm Mới Token Ngay</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (viewingTokenAccount.token) {
                        navigator.clipboard.writeText(viewingTokenAccount.token);
                        alert('Đã sao chép Token vào clipboard!');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingTokenAccount(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Account */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  {formData.systemKey === 'LMS_PTTC1' ? (
                    <BookOpen className="w-5 h-5 text-white" />
                  ) : formData.systemKey === 'SLINK_PTIT' ? (
                    <Smartphone className="w-5 h-5 text-white" />
                  ) : (
                    <Globe className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {modalMode === 'ADD'
                      ? `Thêm Cấu Hình Tài Khoản ${
                          formData.systemKey === 'LMS_PTTC1'
                            ? 'LMS'
                            : formData.systemKey === 'SLINK_PTIT'
                            ? 'PTIT S-Link'
                            : 'QLDTTX'
                        }`
                      : `Chỉnh Sửa Tài Khoản ${
                          formData.systemKey === 'LMS_PTTC1'
                            ? 'LMS'
                            : formData.systemKey === 'SLINK_PTIT'
                            ? 'PTIT S-Link'
                            : 'QLDTTX'
                        }`}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-0.5 font-mono">{formData.systemUrl}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hệ thống kết nối
                </label>
                <select
                  value={formData.systemKey}
                  onChange={(e) => {
                    const sel = AVAILABLE_EXTERNAL_SYSTEMS.find((s) => s.key === e.target.value);
                    if (sel) {
                      setFormData({
                        ...formData,
                        systemKey: sel.key,
                        systemName: sel.name,
                        systemUrl: sel.url,
                      });
                      setModalTestStatus('IDLE');
                      setModalTestError('');
                      setLastTestedModalUser('');
                      setLastTestedModalPass('');
                    }
                  }}
                  disabled={modalMode === 'EDIT'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                >
                  {AVAILABLE_EXTERNAL_SYSTEMS.map((sys) => (
                    <option key={sys.key} value={sys.key}>
                      {sys.name} ({sys.url})
                    </option>
                  ))}
                </select>
              </div>

              {formData.systemKey === 'SLINK_PTIT' && (
                <SlinkConnectionGuide
                  variant="compact"
                  defaultUsername={formData.extUsername || ''}
                />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã sinh viên trong hệ thống (MaSV)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value.toUpperCase() });
                    setModalTestStatus('IDLE');
                    setModalTestError('');
                  }}
                  disabled={modalMode === 'EDIT'}
                  placeholder="Ví dụ: K25DTCN402"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formData.systemKey === 'SLINK_PTIT'
                    ? 'Email sinh viên PTIT (Tên đăng nhập S-Link)'
                    : `Tên đăng nhập trên ${formData.systemName} (Mã SV / Username)`}
                </label>
                <input
                  type="text"
                  value={formData.extUsername}
                  onChange={(e) => {
                    setFormData({ ...formData, extUsername: e.target.value });
                    setModalTestStatus('IDLE');
                    setModalTestError('');
                  }}
                  placeholder={
                    formData.systemKey === 'SLINK_PTIT'
                      ? 'Ví dụ: b21dcpt001@stu.ptit.edu.vn'
                      : 'Ví dụ: K25DTCN402'
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu trên {formData.systemName}
                </label>
                <div className="relative">
                  <input
                    type={showModalPass ? 'text' : 'password'}
                    value={formData.extPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, extPassword: e.target.value });
                      setModalTestStatus('IDLE');
                      setModalTestError('');
                    }}
                    placeholder={`Nhập mật khẩu tài khoản ${
                      formData.systemKey === 'LMS_PTTC1'
                        ? 'LMS'
                        : formData.systemKey === 'SLINK_PTIT'
                        ? 'PTIT S-Link'
                        : 'QLDTTX'
                    }`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pr-10 text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPass(!showModalPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showModalPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Modal Test Connection Banner */}
              {(() => {
                const isTestPassed =
                  modalTestStatus === 'SUCCESS' &&
                  formData.extUsername.trim() === lastTestedModalUser &&
                  formData.extPassword.trim() === lastTestedModalPass;

                if (isTestPassed) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <strong className="font-bold block text-emerald-950">Kiểm tra kết nối thành công!</strong>
                        <span className="text-[11px] text-emerald-700">Tài khoản hợp lệ. Đã mở khóa nút Lưu.</span>
                      </div>
                    </div>
                  );
                }

                if (modalTestStatus === 'FAILED') {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div className="flex-1">
                        <strong className="font-bold block text-rose-950">Kiểm tra kết nối thất bại!</strong>
                        <span className="text-[11px] text-rose-700">{modalTestError || 'Tên đăng nhập hoặc mật khẩu không chính xác.'}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-amber-950">Yêu cầu kiểm tra kết nối</strong>
                      <span className="text-[11px] text-amber-800">
                        Vui lòng bấm <strong>"Kiểm Tra Kết Nối"</strong> thành công trước để mở khóa nút Lưu.
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>

                <div className="flex items-center gap-2">
                  {(() => {
                    const isTestPassed =
                      modalTestStatus === 'SUCCESS' &&
                      formData.extUsername.trim() === lastTestedModalUser &&
                      formData.extPassword.trim() === lastTestedModalPass;

                    return (
                      <>
                        <button
                          type="button"
                          onClick={handleTestModalCredentials}
                          disabled={isModalTesting || !formData.extUsername.trim() || !formData.extPassword.trim()}
                          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isTestPassed
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                              : 'bg-sky-600 hover:bg-sky-700 text-white'
                          }`}
                        >
                          {isModalTesting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isTestPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span>{isModalTesting ? 'Đang Kiểm Tra...' : isTestPassed ? 'Đã Kiểm Tra' : 'Kiểm Tra Kết Nối'}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSaving || !isTestPassed}
                          className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                            !isTestPassed
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 cursor-pointer active:scale-95'
                          }`}
                        >
                          {isSaving ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : !isTestPassed ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{modalMode === 'ADD' ? 'Thêm & Lưu' : 'Cập Nhật Cấu Hình'}</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingAccount(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Hủy Liên Kết Tài Khoản?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Bạn có chắc chắn muốn hủy liên kết tài khoản QLDTTX của sinh viên{' '}
              <strong>{deletingAccount.hoTen}</strong> (Mã SV:{' '}
              <span className="font-mono font-bold text-indigo-600">{deletingAccount.username}</span>)?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
