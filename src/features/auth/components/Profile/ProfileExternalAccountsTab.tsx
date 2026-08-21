'use client';

import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  ShieldCheck,
  Check,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  ExternalLink,
  Trash2,
  BookOpen,
  GraduationCap,
  Pencil,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { LoginUser } from '../../types/auth.types';

interface ProfileExternalAccountsTabProps {
  currentUser: LoginUser;
  externalAccounts: any[];
  isLoadingExternal: boolean;
  extForm: {
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
  };
  setExtForm: React.Dispatch<React.SetStateAction<any>>;
  onFetchExternalAccounts: () => Promise<void>;
  onTestConnection: (sys: any) => Promise<void>;
  onSaveExternalAccount: (sys: any) => Promise<void>;
  onDeleteExternalAccount: (sys: any) => Promise<void>;
}

export function ProfileExternalAccountsTab({
  currentUser,
  externalAccounts,
  isLoadingExternal,
  extForm,
  setExtForm,
  onFetchExternalAccounts,
  onTestConnection,
  onSaveExternalAccount,
  onDeleteExternalAccount,
}: ProfileExternalAccountsTabProps) {
  // Quản lý trạng thái mở form chỉnh sửa cho từng hệ thống (systemKey)
  const [editingSystems, setEditingSystems] = useState<Record<string, boolean>>({});

  const handleStartEdit = (sys: any) => {
    setEditingSystems((prev) => ({ ...prev, [sys.systemKey]: true }));
    setExtForm((prev: any) => ({
      ...prev,
      [sys.systemKey]: {
        username: sys.extUsername || currentUser.username || '',
        password: '',
        showPass: false,
        isSaving: false,
        isTesting: false,
        testStatus: 'IDLE',
        testMessage: '',
        lastTestedUser: '',
        lastTestedPass: '',
      },
    }));
  };

  const handleCancelEdit = (sysKey: string) => {
    setEditingSystems((prev) => ({ ...prev, [sysKey]: false }));
    setExtForm((prev: any) => ({
      ...prev,
      [sysKey]: {
        ...prev[sysKey],
        password: '',
        testStatus: 'IDLE',
        testMessage: '',
        lastTestedUser: '',
        lastTestedPass: '',
      },
    }));
  };

  const handleSaveAccountWrapper = async (sys: any) => {
    await onSaveExternalAccount(sys);
    setEditingSystems((prev) => ({ ...prev, [sys.systemKey]: false }));
  };

  const renderSystemIcon = (iconKey?: string, isConnected = false) => {
    if (iconKey === 'BookOpen') {
      return (
        <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-sky-50 text-sky-600'}`}>
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
    }
    if (iconKey === 'GraduationCap') {
      return (
        <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-50 text-emerald-600'}`}>
          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      );
    }
    return (
      <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-indigo-50 text-indigo-600'}`}>
        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-5 sm:gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              Liên Kết Các Hệ Thống Đào Tạo & Học Tập Trực Tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tự động đồng bộ từ: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> • <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFetchExternalAccounts}
          disabled={isLoadingExternal}
          className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExternal ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Security & Instruction Banner */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-indigo-950">Quy trình liên kết tài khoản an toàn</p>
          <p className="text-slate-600 leading-relaxed">
            Để đảm bảo thông tin đăng nhập chính xác, hệ thống yêu cầu <strong>Kiểm Tra Kết Nối</strong> trực tiếp với cổng trường thành công trước khi lưu cấu hình. Thông tin được mã hóa bảo mật và chỉ dùng để tự động đồng bộ kết quả học tập, thời khóa biểu & lịch thi.
          </p>
        </div>
      </div>

      {isLoadingExternal ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Đang tải danh sách hệ thống liên kết...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-6">
          {externalAccounts.map((sys) => {
            const isEditing = !!editingSystems[sys.systemKey];
            const isConnected = sys.isConfigured && !isEditing;

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

            const isTestSuccess = Boolean(
              form.testStatus === 'SUCCESS' &&
              form.username?.trim() === form.lastTestedUser &&
              form.password?.trim() === form.lastTestedPass
            );

            // ==========================================
            // CASE 1: ĐÃ LIÊN KẾT (CONNECTED VIEW MODE)
            // ==========================================
            if (isConnected) {
              return (
                <div
                  key={sys.systemKey}
                  className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4.5 transition-all hover:border-emerald-300"
                >
                  {/* System Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {renderSystemIcon(sys.iconKey, true)}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-800 text-sm sm:text-base">
                            {sys.systemName}
                          </h4>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã Liên Kết
                          </span>
                        </div>
                        <a
                          href={sys.systemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 hover:underline mt-0.5"
                        >
                          <span>{sys.systemUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> Tài khoản liên kết
                      </span>
                      <span className="font-mono font-bold text-slate-800 text-sm truncate">
                        {sys.extUsername}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Key className="w-3 h-3" /> Mật khẩu
                      </span>
                      <span className="font-mono font-bold text-slate-600 text-sm">
                        ••••••••••••
                      </span>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3.5 flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Đồng bộ gần nhất
                      </span>
                      <span className="font-bold text-slate-700 text-xs truncate">
                        {sys.lastSyncAt ? new Date(sys.lastSyncAt).toLocaleString('vi-VN') : 'Đã kết nối'}
                      </span>
                    </div>
                  </div>

                  {/* Status / Sync message banner */}
                  {sys.syncMessage && (
                    <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{sys.syncMessage}</span>
                    </div>
                  )}

                  {/* Action Buttons for Connected State */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Button Test / Refresh Session */}
                      <button
                        type="button"
                        onClick={() => onTestConnection(sys)}
                        disabled={form.isTesting}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        title="Kiểm tra lại trạng thái kết nối và làm mới phiên"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${form.isTesting ? 'animate-spin' : ''}`} />
                        <span>{form.isTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Lại Kết Nối'}</span>
                      </button>

                      {/* Button Start Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sys)}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Chỉnh Sửa Thông Tin</span>
                      </button>
                    </div>

                    {/* Button Delete / Disconnect */}
                    <button
                      type="button"
                      onClick={() => onDeleteExternalAccount(sys)}
                      className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-2xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy Liên Kết</span>
                    </button>
                  </div>
                </div>
              );
            }

            // ==============================================================
            // CASE 2: CHƯA LIÊN KẾT HOẶC ĐANG CHỈNH SỬA (FORM SETUP / EDIT)
            // ==============================================================
            return (
              <div
                key={sys.systemKey}
                className={`rounded-3xl border transition-all p-5 sm:p-6 flex flex-col gap-4.5 shadow-xs ${
                  isEditing
                    ? 'bg-white border-indigo-300 ring-4 ring-indigo-50'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {renderSystemIcon(sys.iconKey, false)}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-800 text-sm sm:text-base">
                          {isEditing ? `Chỉnh Sửa Cấu Hình: ${sys.systemName}` : sys.systemName}
                        </h4>
                        {isEditing ? (
                          <span className="bg-indigo-100 text-indigo-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200 inline-flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Đang Chỉnh Sửa
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                            Chưa Liên Kết
                          </span>
                        )}
                      </div>
                      <a
                        href={sys.systemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1 hover:underline mt-0.5"
                      >
                        <span>{sys.systemUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleCancelEdit(sys.systemKey)}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 self-start sm:self-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hủy Chỉnh Sửa</span>
                    </button>
                  )}
                </div>

                {sys.description && !isEditing && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {sys.description}
                  </p>
                )}

                {/* 3-Step Flow Visual Indicator */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl">
                  {/* Step 1 */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-800 font-bold text-xs shadow-2xs border border-slate-200/60">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      1
                    </div>
                    <span className="truncate">1. Nhập thông tin</span>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isTestSuccess
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : form.testStatus === 'TESTING'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                        : form.testStatus === 'FAILED'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isTestSuccess
                          ? 'bg-emerald-600 text-white'
                          : form.testStatus === 'FAILED'
                          ? 'bg-rose-600 text-white'
                          : form.testStatus === 'TESTING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isTestSuccess ? <Check className="w-3 h-3" /> : 2}
                    </div>
                    <span className="truncate">
                      {isTestSuccess ? '2. Đã xác thực' : '2. Kiểm tra kết nối'}
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isTestSuccess
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isTestSuccess ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      3
                    </div>
                    <span className="truncate">3. Lưu & Kết nối</span>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Tên đăng nhập ({sys.systemName})
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) =>
                        setExtForm((prev: any) => ({
                          ...prev,
                          [sys.systemKey]: {
                            ...prev[sys.systemKey],
                            username: e.target.value,
                            testStatus: 'IDLE',
                            testMessage: '',
                          },
                        }))
                      }
                      placeholder={sys.placeholderUser || 'Nhập mã sinh viên / tên đăng nhập'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-slate-400" /> Mật khẩu {sys.hasPassword && isEditing && '(Để trống nếu giữ nguyên)'}
                    </label>
                    <div className="relative">
                      <input
                        type={form.showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) =>
                          setExtForm((prev: any) => ({
                            ...prev,
                            [sys.systemKey]: {
                              ...prev[sys.systemKey],
                              password: e.target.value,
                              testStatus: 'IDLE',
                              testMessage: '',
                            },
                          }))
                        }
                        placeholder={
                          isEditing && sys.hasPassword
                            ? '•••••••• (Nhập mật khẩu mới để đổi)'
                            : `Nhập mật khẩu ${sys.systemName}`
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 pr-10 text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtForm((prev: any) => ({
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

                {/* Interactive Status & Feedback Alert */}
                {isTestSuccess ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-emerald-950">Kiểm tra kết nối thành công!</strong>
                      <span className="text-emerald-800 text-[11px]">
                        Tài khoản và mật khẩu hoàn toàn chính xác. Nút <strong>"{isEditing ? 'Lưu Thay Đổi' : 'Lưu & Kết Nối'}"</strong> bên dưới đã được mở khóa.
                      </span>
                    </div>
                  </div>
                ) : form.testStatus === 'FAILED' ? (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-950 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-rose-950">Kiểm tra kết nối thất bại!</strong>
                      <span className="text-rose-800 text-[11px]">
                        {form.testMessage || `Tên đăng nhập hoặc mật khẩu không chính xác trên ${sys.systemName}. Vui lòng kiểm tra lại.`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-950">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-amber-950">Yêu cầu kiểm tra kết nối</strong>
                      <span className="text-amber-900 text-[11px]">
                        Vui lòng bấm nút <strong>"Kiểm Tra Kết Nối"</strong> (Bước 2) để xác thực tài khoản trước khi lưu.
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Step 2 Action Button: Test Connection */}
                    <button
                      type="button"
                      onClick={() => onTestConnection(sys)}
                      disabled={form.isTesting || !form.username?.trim() || (!form.password?.trim() && !sys.hasPassword)}
                      className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-xs ${
                        isTestSuccess
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-100'
                      }`}
                    >
                      {form.isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isTestSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {form.isTesting
                          ? 'Đang Kiểm Tra Kết Nối...'
                          : isTestSuccess
                          ? 'Đã Xác Thực Thành Công'
                          : 'Kiểm Tra Kết Nối'}
                      </span>
                    </button>

                    {/* Step 3 Action Button: Save & Connect */}
                    <button
                      type="button"
                      onClick={() => handleSaveAccountWrapper(sys)}
                      disabled={form.isSaving || !isTestSuccess}
                      className={`px-5 py-2.5 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        !isTestSuccess
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer active:scale-95'
                      }`}
                    >
                      {form.isSaving ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : !isTestSuccess ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      <span>{isEditing ? 'Lưu Thay Đổi' : 'Lưu & Kết Nối'}</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => handleCancelEdit(sys.systemKey)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Hủy Bỏ
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
