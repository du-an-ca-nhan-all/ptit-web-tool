'use client';

import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Calendar,
  Award,
  Globe,
  Send,
  CalendarDays,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { LoginUser, ExamRecord } from '../types/auth.types';
import { ProfileSubTab } from '../../../types/navigation';
import { ProfileHeroBanner } from './Profile/ProfileHeroBanner';
import { ProfileOverviewTab } from './Profile/ProfileOverviewTab';
import { ProfileSecurityTab } from './Profile/ProfileSecurityTab';
import { ProfileExternalAccountsTab } from './Profile/ProfileExternalAccountsTab';
import { ProfileExamScheduleTab } from './Profile/ProfileExamScheduleTab';
import { TelegramConfigSection } from '../../telegram';
import { StudentTimetableCalendar, StudentGradesView } from '../../external-portal';

export interface UserProfileScreenProps {
  currentUser: LoginUser & { student?: any };
  onLogout: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
  hasExamSchedule?: boolean;
  onNavigateTab?: (tab: string) => void;
  userRoles?: string[];
  activeRole?: string;
  onSelectRole?: (role: string) => void;
  activeSubTab?: ProfileSubTab;
  onSubTabChange?: (subTab: ProfileSubTab) => void;
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
  activeSubTab: activeSubTabProp,
  onSubTabChange,
}: UserProfileScreenProps) {
  const student = currentUser?.student || {};
  const [internalSubTab, setInternalSubTab] = useState<ProfileSubTab>(activeSubTabProp || 'OVERVIEW');
  const activeSubTab = activeSubTabProp !== undefined ? activeSubTabProp : internalSubTab;

  const setActiveSubTab = (subTab: ProfileSubTab) => {
    setInternalSubTab(subTab);
    onSubTabChange?.(subTab);
  };

  // Edit personal profile state
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(student?.soDienThoai || currentUser?.phoneNumber || '');
  const [note, setNote] = useState(student?.ghiChu || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      testStatus?: 'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED';
      testMessage?: string;
      lastTestedUser?: string;
      lastTestedPass?: string;
    };
  }>({});

  const currentEffectiveRole =
    activeRole || (currentUser?.isAdmin ? 'admin' : currentUser?.isMonitor ? 'lop_truong' : 'sinh_vien');
  const isAdmin = currentEffectiveRole === 'admin';
  const fullName = student?.hoTen || currentUser.fullName || currentUser.username;
  const maSV = currentUser.username;
  const maLop = student?.maLop || currentUser.lop || 'Chưa cập nhật';
  const gioiTinh = student?.gioiTinh || 'Nam';
  const ngaySinh = student?.ngaySinh || 'Chưa cập nhật';
  const trangThai = student?.trangThai || 'DANG_HOC';
  const exams: ExamRecord[] = student?.exams || [];

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
    const form = extForm[sys.systemKey] || {
      username: sys.extUsername || currentUser.username || '',
      password: '',
      showPass: false,
      isSaving: false,
      isTesting: false,
      testStatus: 'IDLE' as const,
      testMessage: '',
      lastTestedUser: '',
      lastTestedPass: '',
    };

    if (!form.username || !form.username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập hệ thống');
      return;
    }
    if (!form.password || !form.password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản hệ thống ngoài');
      return;
    }

    const isTestPassed =
      form.testStatus === 'SUCCESS' &&
      form.username.trim() === form.lastTestedUser &&
      form.password.trim() === form.lastTestedPass;

    if (!isTestPassed) {
      setErrorMsg('Yêu cầu bấm "Kiểm Tra Kết Nối" thành công trước khi có thể lưu cấu hình.');
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
        setSuccessMsg(data.message || 'Lưu cấu hình tài khoản thành công!');
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
    const form = extForm[sys.systemKey] || {
      username: sys.extUsername || currentUser.username || '',
      password: '',
      showPass: false,
      isSaving: false,
      isTesting: false,
      testStatus: 'IDLE' as const,
      testMessage: '',
      lastTestedUser: '',
      lastTestedPass: '',
    };

    const targetUser = form.username ? form.username.trim() : sys.extUsername || '';
    const targetPass = form.password ? form.password.trim() : '';

    if (!targetUser) {
      setErrorMsg('Vui lòng nhập tên đăng nhập / mã sinh viên trước khi kiểm tra');
      return;
    }
    if (!targetPass && !sys.hasPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu tài khoản QLDTTX trước khi kiểm tra');
      return;
    }

    setExtForm((prev) => ({
      ...prev,
      [sys.systemKey]: {
        ...prev[sys.systemKey],
        isTesting: true,
        testStatus: 'TESTING',
        testMessage: '',
      },
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
          extUsername: targetUser,
          extPassword: targetPass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExtForm((prev) => ({
          ...prev,
          [sys.systemKey]: {
            ...prev[sys.systemKey],
            isTesting: false,
            testStatus: 'SUCCESS',
            testMessage: data.message || 'Kiểm tra kết nối và xác thực tài khoản thành công!',
            lastTestedUser: targetUser,
            lastTestedPass: targetPass,
          },
        }));
        setSuccessMsg(data.message || 'Kiểm tra kết nối thành công! Đã mở khóa nút Lưu.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errMsg = data.error || 'Kiểm tra kết nối thất bại.';
        setExtForm((prev) => ({
          ...prev,
          [sys.systemKey]: {
            ...prev[sys.systemKey],
            isTesting: false,
            testStatus: 'FAILED',
            testMessage: errMsg,
            lastTestedUser: '',
            lastTestedPass: '',
          },
        }));
        setErrorMsg(errMsg);
      }
    } catch (err) {
      const errMsg = 'Lỗi kết nối máy chủ khi kiểm tra tài khoản.';
      setExtForm((prev) => ({
        ...prev,
        [sys.systemKey]: {
          ...prev[sys.systemKey],
          isTesting: false,
          testStatus: 'FAILED',
          testMessage: errMsg,
          lastTestedUser: '',
          lastTestedPass: '',
        },
      }));
      setErrorMsg(errMsg);
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

  const configuredCount = externalAccounts.filter((a) => a.isConfigured).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      {/* Main Profile Hero Banner */}
      <ProfileHeroBanner
        currentUser={currentUser}
        currentEffectiveRole={currentEffectiveRole}
        fullName={fullName}
        maSV={maSV}
        maLop={maLop}
        trangThai={trangThai}
        phone={phone}
        hasExamSchedule={hasExamSchedule}
        exams={exams}
        configuredCount={configuredCount}
        onOpenExternalAccountsTab={() => setActiveSubTab('EXTERNAL_ACCOUNTS')}
      />

      {/* Screen Sub-Tabs Navigation */}
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
        <ProfileOverviewTab
          currentUser={currentUser}
          maSV={maSV}
          fullName={fullName}
          gioiTinh={gioiTinh}
          ngaySinh={ngaySinh}
          maLop={maLop}
          phone={phone}
          setPhone={setPhone}
          note={note}
          setNote={setNote}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          onSaveProfile={handleSaveProfile}
          onLogout={onLogout}
          hasExamSchedule={hasExamSchedule}
          onNavigateTab={onNavigateTab}
          onSelectSubTab={setActiveSubTab}
        />
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

      {/* SUB-TAB 2: EXTERNAL ACCOUNTS */}
      {activeSubTab === 'EXTERNAL_ACCOUNTS' && (
        <ProfileExternalAccountsTab
          currentUser={currentUser}
          externalAccounts={externalAccounts}
          isLoadingExternal={isLoadingExternal}
          extForm={extForm}
          setExtForm={setExtForm}
          onFetchExternalAccounts={fetchExternalAccounts}
          onTestConnection={handleTestConnection}
          onSaveExternalAccount={handleSaveExternalAccount}
          onDeleteExternalAccount={handleDeleteExternalAccount}
        />
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
        <ProfileExamScheduleTab exams={exams} maSV={maSV} />
      )}

      {/* SUB-TAB 4: SECURITY & SETTINGS */}
      {activeSubTab === 'SECURITY' && <ProfileSecurityTab />}
    </div>
  );
}
