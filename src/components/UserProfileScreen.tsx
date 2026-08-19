import React, { useState, useEffect, useMemo } from 'react';
import { LoginUser, ExamRecord } from '../types';
import {
  User as UserIcon,
  Phone,
  Calendar,
  GraduationCap,
  Crown,
  Edit3,
  Check,
  LogOut,
  Sparkles,
  BookOpen,
  FileText,
  Copy,
  CheckCheck,
  Globe,
  Link2,
  ExternalLink,
  Lock,
  Key,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  Layers,
  Award,
  Clock,
  MapPin,
  ChevronRight,
  Shield,
  X,
  Send,
  CalendarDays,
} from 'lucide-react';
import TelegramConfigSection from './TelegramConfigSection';
import StudentTimetableCalendar from './StudentTimetableCalendar';
import StudentGradesView from './StudentGradesView';

interface UserProfileScreenProps {
  currentUser: LoginUser & { student?: any };
  onLogout: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
  hasExamSchedule?: boolean;
  onNavigateTab?: (tab: string) => void;
  userRoles?: string[];
  activeRole?: string;
  onSelectRole?: (role: string) => void;
}

export default function UserProfileScreen({
  currentUser,
  onLogout,
  onProfileUpdated,
  hasExamSchedule = false,
  onNavigateTab,
  userRoles = [],
  activeRole,
  onSelectRole,
}: UserProfileScreenProps) {
  const student = currentUser?.student || {};
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'SCHEDULE' | 'GRADES' | 'EXTERNAL_ACCOUNTS' | 'TELEGRAM' | 'EXAMS' | 'SECURITY'>('OVERVIEW');

  // Edit personal profile state
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(student?.soDienThoai || currentUser?.phoneNumber || '');
  const [note, setNote] = useState(student?.ghiChu || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedMssv, setCopiedMssv] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // External Accounts state
  const [externalAccounts, setExternalAccounts] = useState<any[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [extForm, setExtForm] = useState<{
    [key: string]: {
      username: string;
      password: string;
      showPass: boolean;
      isSaving: boolean;
      isTesting: boolean;
    };
  }>({});

  const currentEffectiveRole = activeRole || (currentUser?.isAdmin ? 'admin' : currentUser?.isMonitor ? 'lop_truong' : 'sinh_vien');
  const isAdmin = currentEffectiveRole === 'admin';
  const isMonitor = currentEffectiveRole === 'lop_truong';
  const fullName = student?.hoTen || currentUser.fullName || currentUser.username;
  const maSV = currentUser.username;
  const maLop = student?.maLop || currentUser.lop || 'Chưa cập nhật';
  const gioiTinh = student?.gioiTinh || 'Nam';
  const ngaySinh = student?.ngaySinh || 'Chưa cập nhật';
  const trangThai = student?.trangThai || 'DANG_HOC';
  const exams: ExamRecord[] = student?.exams || [];

  const handleCopyMssv = () => {
    navigator.clipboard.writeText(maSV);
    setCopiedMssv(true);
    setTimeout(() => setCopiedMssv(false), 2000);
  };

  // Fetch External Accounts
  const fetchExternalAccounts = async () => {
    setIsLoadingExternal(true);
    try {
      const res = await fetch('/api/external-accounts');
      const data = await res.json();
      if (res.ok && data.accounts) {
        setExternalAccounts(data.accounts);
        const formState: any = {};
        data.accounts.forEach((acc: any) => {
          formState[acc.systemKey] = {
            username: acc.extUsername || currentUser.username,
            password: '',
            showPass: false,
            isSaving: false,
            isTesting: false,
          };
        });
        setExtForm(formState);
      }
    } catch (err) {
      console.error('Fetch external accounts error:', err);
    } finally {
      setIsLoadingExternal(false);
    }
  };

  useEffect(() => {
    fetchExternalAccounts();
  }, []);

  // Save profile info (phone & note)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soDienThoai: phone.trim(),
          ghiChu: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã lưu thông tin cá nhân thành công!');
        setIsEditing(false);
        if (onProfileUpdated) {
          onProfileUpdated({
            ...currentUser,
            phoneNumber: phone.trim(),
            student: {
              ...student,
              soDienThoai: phone.trim(),
              ghiChu: note.trim(),
            },
          });
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save / Connect External Account
  const handleSaveExternalAccount = async (sys: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    const form = extForm[sys.systemKey] || { username: '', password: '' };

    if (!form.username || !form.username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập hệ thống');
      return;
    }
    if (!form.password || !form.password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản hệ thống ngoài');
      return;
    }

    setExtForm((prev) => ({
      ...prev,
      [sys.systemKey]: { ...prev[sys.systemKey], isSaving: true },
    }));

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE',
          systemKey: sys.systemKey,
          systemName: sys.systemName,
          systemUrl: sys.systemUrl,
          extUsername: form.username.trim(),
          extPassword: form.password.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchExternalAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu tài khoản');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setExtForm((prev) => ({
        ...prev,
        [sys.systemKey]: { ...prev[sys.systemKey], isSaving: false },
      }));
    }
  };

  // Test Connection
  const handleTestConnection = async (sys: any) => {
    setErrorMsg('');
    setSuccessMsg('');
    setExtForm((prev) => ({
      ...prev,
      [sys.systemKey]: { ...prev[sys.systemKey], isTesting: true },
    }));

    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          systemKey: sys.systemKey,
          systemName: sys.systemName,
          systemUrl: sys.systemUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchExternalAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Kiểm tra kết nối thất bại');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    } finally {
      setExtForm((prev) => ({
        ...prev,
        [sys.systemKey]: { ...prev[sys.systemKey], isTesting: false },
      }));
    }
  };

  // Delete External Account
  const handleDeleteExternalAccount = async (sys: any) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${sys.systemName}?`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/external-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          systemKey: sys.systemKey,
          systemName: sys.systemName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        fetchExternalAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  // Handle Change Password with Double Confirmation
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassErrorMsg('Vui lòng điền đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận lại mật khẩu mới.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('Mật khẩu mới và mật khẩu xác nhận không khớp nhau. Vui lòng kiểm tra lại.');
      return;
    }

    if (currentPassword === newPassword) {
      setPassErrorMsg('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPassSuccessMsg(data.message || 'Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassSuccessMsg(''), 5000);
      } else {
        setPassErrorMsg(data.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch (err: any) {
      setPassErrorMsg('Lỗi kết nối máy chủ khi thực hiện đổi mật khẩu.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const configuredCount = externalAccounts.filter((a) => a.isConfigured).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl sm:rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          {/* User Identity Info */}
          <div className="flex items-center sm:items-start md:items-center gap-3.5 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-white p-1 shadow-2xl shrink-0 overflow-hidden ring-2 sm:ring-4 ring-white/20">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${maSV}`}
                alt={fullName}
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight break-words">{fullName}</h1>
                {currentEffectiveRole === 'admin' && (
                  <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shadow-xs shrink-0">
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" /> Admin
                  </span>
                )}
                {currentEffectiveRole === 'lop_truong' && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shadow-xs shrink-0">
                    <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Lớp Trưởng
                  </span>
                )}
                {currentEffectiveRole === 'sinh_vien' && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                    <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sinh Viên
                  </span>
                )}
              </div>

              {/* Badges Line */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 mt-2 text-blue-100 text-xs sm:text-sm font-mono flex-wrap">
                <button
                  onClick={handleCopyMssv}
                  className="bg-black/30 hover:bg-black/45 active:scale-95 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Sao chép MSSV"
                >
                  <span className="font-bold text-white tracking-wider">{maSV}</span>
                  {copiedMssv ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 opacity-75" />}
                </button>
                <span className="bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-xl font-bold text-white text-[11px] sm:text-xs shrink-0">
                  Lớp {maLop}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-sans font-semibold shrink-0">
                  {trangThai === 'DANG_HOC'
                    ? '● Đang theo học'
                    : trangThai === 'BAO_LUU'
                    ? '● Đang bảo lưu'
                    : '● Đã chuyển lớp'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics on Banner (Balanced 3-column on mobile & desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/10 md:border-t-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center flex flex-col justify-center">
              <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">Lịch Thi</div>
              <div className="text-sm sm:text-base md:text-lg font-black text-white mt-0.5">
                {hasExamSchedule ? `${exams.length} môn` : 'Đang đóng'}
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
              className="bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 active:scale-95 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center cursor-pointer transition-all flex flex-col justify-center"
              title="Nhấp để xem liên kết QLĐT"
            >
              <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">Cổng QLĐT</div>
              <div className="text-sm sm:text-base md:text-lg font-black text-emerald-300 mt-0.5">
                {configuredCount > 0 ? 'Đã kết nối' : 'Chưa kết nối'}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center flex flex-col justify-center">
              <div className="text-[10px] sm:text-[11px] text-blue-200 uppercase font-bold tracking-wider">Số ĐT</div>
              <div className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5 truncate">
                {phone || 'Chưa có'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Sub-Tabs Navigation (Optimized for Mobile Horizontal Scroll) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 border border-slate-200 shadow-xs flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none scroll-smooth -mx-1 sm:mx-0 px-2 sm:px-1.5">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Thông Tin Học Vụ</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SCHEDULE')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
            activeSubTab === 'SCHEDULE'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Lịch Học & TKB</span>
          {configuredCount === 0 ? (
            <Lock className="w-3 h-3 text-amber-500 opacity-80" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('GRADES')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
            activeSubTab === 'GRADES'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Bảng Điểm & Kết Quả</span>
          {configuredCount === 0 ? (
            <Lock className="w-3 h-3 text-amber-500 opacity-80" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
            activeSubTab === 'EXTERNAL_ACCOUNTS'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Liên Kết QLĐT Từ Xa</span>
          {configuredCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('TELEGRAM')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
            activeSubTab === 'TELEGRAM'
              ? 'bg-sky-600 text-white shadow-xs shadow-sky-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Cấu Hình Telegram</span>
        </button>

        {hasExamSchedule && (
          <button
            onClick={() => setActiveSubTab('EXAMS')}
            className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
              activeSubTab === 'EXAMS'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Lịch Thi ({exams.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('SECURITY')}
          className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
            activeSubTab === 'SECURITY'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Bảo Mật & Mật Khẩu</span>
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & PERSONAL INFO */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Personal Info Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">Hồ Sơ & Lý Lịch Học Tập</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Thông tin cá nhân trích xuất từ cơ sở dữ liệu sinh viên</p>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa SĐT / Ghi Chú</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 sm:gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Mã sinh viên:</span>
                    <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
                    <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Lớp học chính:</span>
                    <span className="font-bold text-blue-600 text-sm sm:text-base">{maLop}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú cá nhân / Ghi chú ban cán sự</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Thêm ghi chú cá nhân, phân công, trực nhật..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-base sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setPhone(student?.soDienThoai || currentUser?.phoneNumber || '');
                      setNote(student?.ghiChu || '');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-colors cursor-pointer text-center justify-center flex items-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Lưu Thay Đổi</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Mã sinh viên</span>
                  <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Họ và Tên</span>
                  <span className="font-black text-slate-800 text-sm sm:text-base">{fullName}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Giới tính</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{gioiTinh}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ngày sinh</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{ngaySinh}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Lớp biên chế</span>
                  <span className="font-bold text-blue-600 text-xs sm:text-sm">{maLop}</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
                  <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Số điện thoại</span>
                  <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
                  </span>
                </div>

                {note && (
                  <div className="sm:col-span-2 p-3.5 sm:p-4 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60">
                    <span className="text-amber-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ghi chú cá nhân</span>
                    <p className="text-slate-700 text-xs italic break-words">"{note}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side Info Cards */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Institution Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-3.5 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate sm:whitespace-normal">Học Viện Công Nghệ Bưu Chính Viễn Thông</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Hệ Đào Tạo Từ Xa (PTTC1)</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100">
                Cổng tiện ích học tập, đối chiếu môn học & tra cứu lịch thi trực tuyến PTIT EduSync. Dữ liệu được đồng bộ trực tiếp từ cổng trường.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span>Cổng QLĐT:</span>
                <a
                  href="https://qldttx.pttc1.edu.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono flex items-center gap-1"
                >
                  qldttx.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-2.5 sm:gap-3">
              <h4 className="font-black text-slate-800 text-xs sm:text-sm mb-1">Truy Cập Nhanh</h4>

              <button
                onClick={() => setActiveSubTab('SCHEDULE')}
                className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Lịch Học & Thời Khóa Biểu</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
              </button>

              <button
                onClick={() => setActiveSubTab('GRADES')}
                className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Điểm & Bảng Điểm Học Tập</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
              </button>

              <button
                onClick={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
                className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Cấu Hình Tài Khoản QLDTTX</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
              </button>

              {hasExamSchedule && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('personal_schedule')}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-blue-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 truncate">Xem Toàn Bộ Lịch Thi</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full p-2.5 sm:p-3 bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer text-rose-700 mt-1"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">Đăng Xuất Khỏi Hệ Thống</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: CLASS SCHEDULE & TIMETABLE (CALENDAR VIEW) */}
      {activeSubTab === 'SCHEDULE' && (
        <StudentTimetableCalendar
          currentUser={currentUser}
          onNavigateToExternalAccounts={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
        />
      )}

      {/* SUB-TAB: STUDENT GRADES & ACADEMIC ANALYTICS */}
      {activeSubTab === 'GRADES' && (
        <StudentGradesView
          currentUser={currentUser}
          onNavigateToExternalAccounts={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
        />
      )}

      {/* SUB-TAB 2: EXTERNAL ACCOUNTS (No Token Display) */}
      {activeSubTab === 'EXTERNAL_ACCOUNTS' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-800">Liên Kết Hệ Thống Quản Lý Đào Tạo Từ Xa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cổng kết nối: <strong className="text-indigo-600 font-mono">https://qldttx.pttc1.edu.vn/</strong>
                </p>
              </div>
            </div>

            <button
              onClick={fetchExternalAccounts}
              disabled={isLoadingExternal}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExternal ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 mb-1">Cơ chế đồng bộ an toàn</p>
              <p className="text-slate-600">
                Thông tin đăng nhập được lưu trữ mã hóa và chỉ dùng để tự động đồng bộ lịch thi, đăng ký môn học và thời khóa biểu từ cổng đào tạo của nhà trường.
              </p>
            </div>
          </div>

          {isLoadingExternal ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải cấu hình kết nối...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-6">
              {externalAccounts.map((sys) => {
                const form = extForm[sys.systemKey] || {
                  username: sys.extUsername || currentUser.username,
                  password: '',
                  showPass: false,
                  isSaving: false,
                  isTesting: false,
                };

                return (
                  <div
                    key={sys.systemKey}
                    className={`rounded-2xl sm:rounded-3xl border transition-all p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 ${
                      sys.isConfigured
                        ? 'bg-white border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Header: System Info & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                            <span className="truncate">{sys.systemName}</span>
                          </h4>
                          {sys.isConfigured ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3" /> Đã Liên Kết
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                              Chưa Cấu Hình
                            </span>
                          )}
                        </div>

                        <a
                          href={sys.systemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 hover:underline truncate"
                        >
                          <span className="truncate">{sys.systemUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {sys.description && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl sm:rounded-2xl border border-slate-100">
                        {sys.description}
                      </p>
                    )}

                    {/* Input Credentials Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Tên đăng nhập (Mã SV trên QLDTTX)
                        </label>
                        <input
                          type="text"
                          value={form.username}
                          onChange={(e) =>
                            setExtForm((prev) => ({
                              ...prev,
                              [sys.systemKey]: { ...prev[sys.systemKey], username: e.target.value },
                            }))
                          }
                          placeholder={sys.placeholderUser || 'Nhập mã sinh viên'}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-slate-400" /> Mật khẩu {sys.hasPassword && '(Đã lưu)'}
                        </label>
                        <div className="relative">
                          <input
                            type={form.showPass ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) =>
                              setExtForm((prev) => ({
                                ...prev,
                                [sys.systemKey]: { ...prev[sys.systemKey], password: e.target.value },
                              }))
                            }
                            placeholder={sys.hasPassword ? '•••••••• (Nhập lại để cập nhật)' : 'Nhập mật khẩu QLDTTX'}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setExtForm((prev) => ({
                                ...prev,
                                [sys.systemKey]: { ...prev[sys.systemKey], showPass: !prev[sys.systemKey]?.showPass },
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title={form.showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {form.showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Message */}
                    {sys.syncMessage && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{sys.syncMessage}</span>
                      </div>
                    )}

                    {/* Action Buttons (Mobile-friendly layout) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveExternalAccount(sys)}
                          disabled={form.isSaving}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {form.isSaving ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{sys.isConfigured ? 'Cập Nhật Cấu Hình' : 'Lưu & Kết Nối'}</span>
                        </button>

                        {sys.isConfigured && (
                          <button
                            type="button"
                            onClick={() => handleTestConnection(sys)}
                            disabled={form.isTesting}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                            title="Kiểm tra kết nối tới cổng trường"
                          >
                            {form.isTesting ? (
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>Kiểm Tra Kết Nối</span>
                          </button>
                        )}
                      </div>

                      {sys.isConfigured && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExternalAccount(sys)}
                          className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          title="Hủy liên kết tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hủy Liên Kết</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: TELEGRAM CONFIGURATION */}
      {activeSubTab === 'TELEGRAM' && (
        <TelegramConfigSection
          currentUser={{ ...currentUser, isAdmin, activeRole: currentEffectiveRole }}
          onNavigateTab={(tab) => {
            if (tab === 'EXTERNAL_ACCOUNTS') setActiveSubTab('EXTERNAL_ACCOUNTS');
            else if (tab === 'SCHEDULE') setActiveSubTab('SCHEDULE');
            else if (onNavigateTab) onNavigateTab(tab);
          }}
        />
      )}

      {/* SUB-TAB 3: EXAM SCHEDULE FOR THIS STUDENT */}
      {activeSubTab === 'EXAMS' && hasExamSchedule && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-800">Lịch Thi Đã Đăng Ký Của Bạn</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng cộng: <strong className="text-blue-600">{exams.length} môn thi</strong>
                </p>
              </div>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">
              Không tìm thấy lịch thi nào cho sinh viên {maSV}.
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (block on mobile, hidden on md+) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {exams.map((ex: ExamRecord, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                      ex.isPostponed
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Header: Date, Time & Index */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{ex.NgayThi} • {ex.GioThi}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ex.isPostponed
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                        </span>
                      </div>
                    </div>

                    {/* Subject Name & Code */}
                    <div>
                      <div className="font-mono text-xs font-bold text-indigo-700">{ex.MaMH}</div>
                      <div className={`font-black text-slate-800 text-sm mt-0.5 ${ex.isPostponed ? 'line-through text-slate-400' : ''}`}>
                        {ex.TenMH}
                      </div>
                    </div>

                    {/* Highlights Grid: Room, Format, Group */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase block">Phòng Thi</span>
                        <span className="text-xs font-black text-emerald-900 font-mono mt-0.5 block truncate">
                          {ex.MAPTHI || '—'}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Hình Thức</span>
                        <span className="text-xs font-bold text-slate-700 mt-0.5 block truncate">
                          {ex.MaHTThi || '—'}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổ/Nhóm</span>
                        <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block truncate">
                          {ex['To thi'] || ex.NhomThi || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (hidden on mobile, block on md+) */}
              <div className="hidden md:block border border-slate-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center">STT</th>
                      <th className="px-4 py-3">Ngày Thi</th>
                      <th className="px-4 py-3">Giờ Thi</th>
                      <th className="px-4 py-3">Mã Môn</th>
                      <th className="px-4 py-3">Tên Môn Học</th>
                      <th className="px-4 py-3 text-center">Phòng Thi</th>
                      <th className="px-4 py-3 text-center">Hình Thức</th>
                      <th className="px-4 py-3 text-center">Tổ/Nhóm</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.map((ex: ExamRecord, idx: number) => (
                      <tr key={idx} className={`transition-colors ${ex.isPostponed ? 'bg-amber-50/40' : 'hover:bg-blue-50/40'}`}>
                        <td className="px-4 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{ex.NgayThi}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{ex.GioThi}</td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-700">{ex.MaMH}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className={ex.isPostponed ? 'line-through text-slate-400' : ''}>{ex.TenMH}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                          {ex.MAPTHI || '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-600">{ex.MaHTThi || '—'}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">
                          {ex['To thi'] || ex.NhomThi || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ex.isPostponed
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SECURITY & SETTINGS */}
      {activeSubTab === 'SECURITY' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6 max-w-2xl">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
            <div className="p-2 sm:p-2.5 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">Bảo Mật Tài Khoản PTIT EduSync</h3>
              <p className="text-xs text-slate-500 mt-0.5">Đổi mật khẩu đăng nhập cổng portal sinh viên</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-amber-800 leading-relaxed flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Lưu ý về mật khẩu đăng nhập:</strong>
              Mật khẩu khởi tạo ban đầu là <strong>Mã sinh viên</strong> (viết in hoa). Bạn có thể đổi sang bất kỳ mật khẩu nào tùy ý và nhập lại 2 lần để xác nhận.
            </div>
          </div>

          {/* Feedback messages */}
          {passSuccessMsg && (
            <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
              <button onClick={() => setPassSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {passErrorMsg && (
            <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-between shadow-2xs animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passErrorMsg}</span>
              </div>
              <button onClick={() => setPassErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5 sm:gap-4">
            {/* Field 1: Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu hiện tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại (mặc định là MSSV)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 2: New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu mới (Lần 1) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Confirm New Password (2nd time) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xác nhận mật khẩu mới (Nhập lại lần 2) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới để chắc chắn"
                  className={`w-full bg-slate-50 border rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs text-slate-800 focus:bg-white focus:ring-2 outline-none transition-all ${
                    confirmPassword
                      ? newPassword === confirmPassword
                        ? 'border-emerald-400 focus:ring-emerald-500'
                        : 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Realtime Matching Status */}
              {confirmPassword && (
                <div className="mt-1.5">
                  {newPassword === confirmPassword ? (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      Hai mật khẩu mới trùng khớp hoàn toàn
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-flex">
                      <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                      Mật khẩu xác nhận chưa khớp với mật khẩu mới
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                * Yêu cầu nhập đúng 2 lần mật khẩu mới
              </span>
              <button
                type="submit"
                disabled={
                  isChangingPass ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              >
                {isChangingPass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Cập Nhật Mật Khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
