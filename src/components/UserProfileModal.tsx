import React, { useState, useEffect } from 'react';
import { LoginUser } from '../types';
import {
  X,
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
  Zap,
  FileKey,
  Send,
  CalendarDays,
} from 'lucide-react';
import TelegramConfigSection from './TelegramConfigSection';
import StudentTimetableCalendar from './StudentTimetableCalendar';

interface UserProfileModalProps {
  currentUser: LoginUser & { student?: any };
  onClose: () => void;
  onLogout: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
  hasExamSchedule?: boolean;
  initialTab?: 'PROFILE' | 'SCHEDULE' | 'EXTERNAL_ACCOUNTS' | 'TELEGRAM';
}

export default function UserProfileModal({
  currentUser,
  onClose,
  onLogout,
  onProfileUpdated,
  hasExamSchedule = false,
  initialTab = 'PROFILE',
}: UserProfileModalProps) {
  const student = currentUser?.student || {};
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SCHEDULE' | 'EXTERNAL_ACCOUNTS' | 'TELEGRAM'>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(student?.soDienThoai || currentUser?.phoneNumber || '');
  const [note, setNote] = useState(student?.ghiChu || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedMssv, setCopiedMssv] = useState(false);

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

  const isAdmin = Boolean(
    currentUser?.activeRole === 'admin' ||
    (currentUser?.isAdmin && currentUser?.activeRole !== 'sinh_vien' && currentUser?.activeRole !== 'lop_truong') ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );
  const isMonitor = currentUser?.isMonitor || (currentUser?.role ? currentUser.role.includes('lop_truong') : false);
  const fullName = student?.hoTen || currentUser.fullName || currentUser.username;
  const maSV = currentUser.username;
  const maLop = student?.maLop || currentUser.lop || 'Chưa cập nhật';
  const gioiTinh = student?.gioiTinh || 'Nam';
  const ngaySinh = student?.ngaySinh || 'Chưa cập nhật';
  const exams = student?.exams || [];

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
        setSuccessMsg('Đã lưu thông tin thành công!');
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
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save / Connect External Account
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

  // Handle Disconnect / Delete External Account
  const handleDeleteExternalAccount = async (sys: any) => {
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
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ');
    }
  };

  // Handle Test Connection
  const handleTestExternalConnection = async (sys: any) => {
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

  const configuredCount = externalAccounts.filter((a) => a.isConfigured).length;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Banner with Profile Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mt-2">
            <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden ring-4 ring-white/20">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${maSV}`}
                alt={fullName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight truncate">{fullName}</h2>
                {isAdmin && (
                  <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-300" /> Admin
                  </span>
                )}
                {isMonitor && (
                  <span className="bg-amber-400 text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" /> Lớp Trưởng
                  </span>
                )}
                {!isAdmin && !isMonitor && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Sinh Viên
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-blue-100 text-xs font-mono">
                <button
                  onClick={handleCopyMssv}
                  className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sao chép MSSV"
                >
                  <span>{maSV}</span>
                  {copiedMssv ? <CheckCheck className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
                <span>•</span>
                <span className="font-semibold text-white">Lớp {maLop}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tab Navigation Header */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'PROFILE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông Tin Cá Nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'SCHEDULE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Lịch Học & TKB</span>
            {configuredCount === 0 && (
              <Lock className="w-3 h-3 text-amber-500 opacity-80" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('EXTERNAL_ACCOUNTS')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer relative shrink-0 ${
              activeTab === 'EXTERNAL_ACCOUNTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Liên Kết Hệ Thống (QLĐTTX)</span>
            {configuredCount > 0 ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            ) : (
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                Chưa kết nối
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('TELEGRAM')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer relative shrink-0 ${
              activeTab === 'TELEGRAM'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Thông Báo Telegram</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: PERSONAL PROFILE */}
          {activeTab === 'PROFILE' && (
            <>
              {/* Profile Details Grid */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    Hồ Sơ Sinh Viên
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa SĐT / Ghi chú
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block mb-0.5">Mã sinh viên:</span>
                        <span className="font-mono font-bold text-slate-800">{maSV}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 font-bold block mb-0.5">Lớp:</span>
                        <span className="font-bold text-blue-600">{maLop}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại liên hệ</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú cá nhân</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Thêm ghi chú cá nhân, lịch trực, phân công..."
                        rows={2}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setPhone(student?.soDienThoai || currentUser?.phoneNumber || '');
                          setNote(student?.ghiChu || '');
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSaving ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Lưu Thông Tin
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Mã sinh viên:</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{maSV}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Giới tính:</span>
                      <span className="font-bold text-slate-800">{gioiTinh}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Ngày sinh:</span>
                      <span className="font-bold text-slate-800">{ngaySinh}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Lớp học chính:</span>
                      <span className="font-bold text-blue-600 text-sm">{maLop}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Số điện thoại:</span>
                      <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
                      </span>
                    </div>
                    {note && (
                      <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Ghi chú:</span>
                        <span className="text-slate-700 italic">"{note}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exam Schedule Summary Section */}
              {hasExamSchedule && exams && exams.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Lịch Thi Đã Đăng Ký ({exams.length} môn)
                    </h3>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-bold">
                        <tr>
                          <th className="px-3.5 py-2.5">Ngày thi</th>
                          <th className="px-3.5 py-2.5">Giờ</th>
                          <th className="px-3.5 py-2.5">Tên môn học</th>
                          <th className="px-3.5 py-2.5 text-center">Phòng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {exams.map((ex: any, idx: number) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="px-3.5 py-2 font-bold text-slate-700">{ex.NgayThi}</td>
                            <td className="px-3.5 py-2 text-blue-600 font-medium">{ex.GioThi}</td>
                            <td className="px-3.5 py-2 font-semibold text-slate-800">
                              {ex.TenMH} <span className="text-[10px] text-slate-400 font-mono">({ex.MaMH})</span>
                            </td>
                            <td className="px-3.5 py-2 text-center font-bold text-emerald-700">{ex.MAPTHI || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB: CLASS SCHEDULE & TIMETABLE (CALENDAR VIEW) */}
          {activeTab === 'SCHEDULE' && (
            <StudentTimetableCalendar
              currentUser={currentUser}
              onNavigateToExternalAccounts={() => setActiveTab('EXTERNAL_ACCOUNTS')}
            />
          )}

          {/* TAB 2: EXTERNAL ACCOUNTS (QLDTTX PTTC1) */}
          {activeTab === 'EXTERNAL_ACCOUNTS' && (
            <div className="flex flex-col gap-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-900 mb-1">Cấu Hình Tài Khoản Liên Kết Hệ Thống Ngoài</p>
                  <p className="text-slate-600">
                    Cấu hình tài khoản đăng nhập để hệ thống có thể kết nối và tự động đồng bộ thời khóa biểu, lịch thi,
                    điểm số và dữ liệu đăng ký môn học trực tiếp từ cổng Đào tạo Từ xa của trường.
                  </p>
                </div>
              </div>

              {isLoadingExternal ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Đang tải cấu hình liên kết...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
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
                        className={`rounded-2xl border transition-all p-5 flex flex-col gap-4 ${
                          sys.isConfigured
                            ? 'bg-white border-emerald-200 ring-2 ring-emerald-500/10 shadow-sm'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {/* Header: System Info & Status */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" />
                                {sys.systemName}
                              </h4>
                              {sys.isConfigured ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Đã Liên Kết
                                  </span>
                                  {sys.hasToken ? (
                                    <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-teal-300 inline-flex items-center gap-1">
                                      <FileKey className="w-3 h-3" /> Đã Cấp Token
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                                      Chưa Có Token
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                  Chưa Cấu Hình
                                </span>
                              )}
                            </div>

                            <a
                              href={sys.systemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-mono font-semibold flex items-center gap-1 hover:underline"
                            >
                              <span>{sys.systemUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {sys.description && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {sys.description}
                          </p>
                        )}

                        {/* Input Credentials Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Tên đăng nhập (Mã SV)
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
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
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
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 pr-9 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setExtForm((prev) => ({
                                    ...prev,
                                    [sys.systemKey]: { ...prev[sys.systemKey], showPass: !prev[sys.systemKey]?.showPass },
                                  }))
                                }
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                title={form.showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              >
                                {form.showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Status Message if any */}
                        {sys.syncMessage && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/60 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{sys.syncMessage}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveExternalAccount(sys)}
                              disabled={form.isSaving}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                                onClick={() => handleTestExternalConnection(sys)}
                                disabled={form.isTesting}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Kiểm tra trạng thái kết nối tới cổng ngoài"
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
                              className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
                              title="Hủy kết nối và xóa mật khẩu đã lưu"
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

          {/* TAB 3: TELEGRAM CONFIGURATION */}
          {activeTab === 'TELEGRAM' && (
            <TelegramConfigSection
              currentUser={{ ...currentUser, isAdmin }}
              onNavigateTab={(tab) => {
                if (tab === 'EXTERNAL_ACCOUNTS') setActiveTab('EXTERNAL_ACCOUNTS');
                else if (tab === 'SCHEDULE') setActiveTab('SCHEDULE');
              }}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng Xuất
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
