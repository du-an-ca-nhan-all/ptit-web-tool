'use client';

import React from 'react';
import {
  BookOpen,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Globe,
  X,
  ShieldCheck,
  Flame,
  GitFork,
  Lock,
} from 'lucide-react';
import { LoginUser } from '../../../../types';
import { MonitorFlowConfigInfo } from '../../hooks/useCourseRegistration';
import { CourseRegistrationHookResult, CourseRegistrationSubTab } from './types';

interface PortalHeaderAndAlertsProps {
  currentUser: LoginUser;
  onNavigateTab?: (tab: string, subTab?: string) => void;
  openCourses: CourseRegistrationHookResult['openCourses'];
  externalAccount: CourseRegistrationHookResult['externalAccount'];
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  isLoading: boolean;
  isRefreshing: boolean;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  errorMsg: string;
  setErrorMsg: (msg: string) => void;
  fetchPortalData: CourseRegistrationHookResult['fetchPortalData'];
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function PortalHeaderAndAlerts({
  currentUser,
  onNavigateTab,
  openCourses,
  externalAccount,
  monitorFlowConfig,
  isLoading,
  isRefreshing,
  successMsg,
  setSuccessMsg,
  errorMsg,
  setErrorMsg,
  fetchPortalData,
  setActiveSubTab,
}: PortalHeaderAndAlertsProps) {
  return (
    <>
      {/* Toast notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Screen Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl shadow-md shadow-indigo-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Cổng Đăng Ký Môn Học (QLHT)
                </h1>
                {openCourses.hoc_ky_dang_ky && (
                  <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    {openCourses.hoc_ky_dang_ky}
                  </span>
                )}
                {openCourses.trong_thoi_gian_dang_ky ? (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang Mở Đăng Ký
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Ngoài Thời Gian ĐK
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Sinh viên:{' '}
                <strong className="text-indigo-600 font-mono">
                  {currentUser.fullName || currentUser.username}
                </strong>{' '}
                ({currentUser.username}) • Lớp: <strong className="text-blue-600">{currentUser.lop || 'Chưa phân lớp'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={() => fetchPortalData(false)}
            disabled={isLoading || isRefreshing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại dữ liệu mới nhất từ Cổng trường"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          {!externalAccount.isConfigured && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Liên Kết Tài Khoản QLDTTX</span>
            </button>
          )}

          {(currentUser.isMonitor || currentUser.isAdmin) && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('monitor_flow')}
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-2xl transition-colors border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Quản lý cấu hình Flow Action ĐKMH theo Lớp trưởng"
            >
              <GitFork className="w-3.5 h-3.5 text-amber-600" />
              <span>Flow Action Lớp</span>
            </button>
          )}

          {externalAccount.isConfigured && (
            <button
              onClick={() => setActiveSubTab('SNIPER_BOT')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-orange-200 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Auto Canh Slot (Sniper)</span>
            </button>
          )}
        </div>
      </div>

      {/* Monitor Flow Locked Alert Banner */}
      {monitorFlowConfig?.isEnabled && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-amber-500/10 border-2 border-amber-400/90 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-amber-950">
                    Tính Năng Đăng Ký Môn Học Đang Được Điều Phối Tự Động Theo Lớp Trưởng
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                    Lớp {monitorFlowConfig.classCode}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Tài khoản của bạn đã được liên kết trong hệ thống <strong>Flow ĐKMH theo Lớp Trưởng</strong> (
                  <strong className="text-indigo-800 font-semibold">{monitorFlowConfig.monitorFullName || monitorFlowConfig.monitorUsername}</strong> - <span className="font-mono text-indigo-700 font-bold">{monitorFlowConfig.monitorUsername}</span>
                  {monitorFlowConfig.monitorPhone ? ` • SĐT: ${monitorFlowConfig.monitorPhone}` : ''}).
                </p>
                <div className="text-xs text-amber-900 bg-white/85 border border-amber-200/90 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Thao tác tự Đăng ký, Hủy môn và Auto Canh Slot (Sniper) thủ công đã tạm khóa.</span>
                  </div>
                  <p className="text-slate-600 text-[11px] pl-5.5 leading-relaxed">
                    Lớp trưởng sẽ điều phối đăng ký môn học đồng bộ cho cả lớp để đảm bảo tất cả sinh viên học chung nhóm tổ. Bạn vẫn có thể xem danh sách môn mở và theo dõi kết quả các môn đã được ghi nhận. Nếu muốn tự đăng ký riêng, vui lòng liên hệ Lớp trưởng để tạm tắt chế độ Flow cho bạn.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => setActiveSubTab('REGISTERED_COURSES')}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Kết Quả ĐKMH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Account Not Linked Alert */}
      {!externalAccount.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">
                Chưa Cấu Hình Tài Khoản Cổng QLĐT Từ Xa (QLDTTX)
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-2xl">
                Hệ thống cần tài khoản và mật khẩu Cổng QLĐT Từ Xa (
                <a
                  href="https://qldttx.pttc1.edu.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold hover:text-amber-950"
                >
                  https://qldttx.pttc1.edu.vn
                </a>
                ) của bạn để thực hiện tra cứu danh sách môn mở, kiểm tra slot trống và gửi lệnh đăng ký môn học trực tiếp.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
              Cấu Hình Ngay →
            </button>
          )}
        </div>
      )}
    </>
  );
}
