'use client';

import React from 'react';
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
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              Liên Kết Hệ Thống Quản Lý Đào Tạo Từ Xa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cổng kết nối: <strong className="text-indigo-600 font-mono">https://qldttx.pttc1.edu.vn/</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onFetchExternalAccounts}
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
                        placeholder={sys.hasPassword ? '•••••••• (Nhập lại để cập nhật)' : 'Nhập mật khẩu QLDTTX'}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 pr-10 text-base sm:text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

                {/* Test Connection Status Banner */}
                {isTestSuccess ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-emerald-950">Kiểm tra kết nối thành công!</strong>
                      <span className="text-[11px] text-emerald-700">
                        Tài khoản chính xác và hợp lệ. Đã mở khóa nút "Lưu Cấu Hình".
                      </span>
                    </div>
                  </div>
                ) : form.testStatus === 'FAILED' ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-rose-950">Kiểm tra kết nối thất bại!</strong>
                      <span className="text-[11px] text-rose-700">
                        {form.testMessage || 'Tên đăng nhập hoặc mật khẩu không chính xác trên cổng QLDTTX.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl sm:rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex-1">
                      <strong className="font-bold block text-amber-950">Yêu cầu kiểm tra kết nối</strong>
                      <span className="text-[11px] text-amber-800">
                        Vui lòng bấm <strong>"Kiểm Tra Kết Nối"</strong> thành công trước để mở khóa nút Lưu.
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Message from previous sync if available */}
                {sys.syncMessage && form.testStatus !== 'SUCCESS' && form.testStatus !== 'FAILED' && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{sys.syncMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-2.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Step 1: Test Connection */}
                    <button
                      type="button"
                      onClick={() => onTestConnection(sys)}
                      disabled={form.isTesting || !form.username?.trim() || (!form.password?.trim() && !sys.hasPassword)}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-xs ${
                        isTestSuccess
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      {form.isTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isTestSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>{form.isTesting ? 'Đang Kiểm Tra...' : isTestSuccess ? 'Đã Kiểm Tra Thành Công' : 'Kiểm Tra Kết Nối'}</span>
                    </button>

                    {/* Step 2: Save & Connect Button */}
                    <button
                      type="button"
                      onClick={() => onSaveExternalAccount(sys)}
                      disabled={form.isSaving || !isTestSuccess}
                      className={`px-5 py-2.5 text-xs font-bold rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
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
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{sys.isConfigured ? 'Cập Nhật Cấu Hình' : 'Lưu & Kết Nối'}</span>
                    </button>
                  </div>

                  {sys.isConfigured && (
                    <button
                      type="button"
                      onClick={() => onDeleteExternalAccount(sys)}
                      className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
  );
}
