'use client';

import React from 'react';
import {
  GitMerge,
  Crown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  Phone,
  BookOpen,
  Settings2,
  Check,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { StudentMonitorFlowSummary } from '../types/dashboard.types';

interface StudentMonitorFlowCardProps {
  flowSummary: StudentMonitorFlowSummary;
  onNavigateTab: (tab: string, subTab?: string, options?: any) => void;
}

export default function StudentMonitorFlowCard({
  flowSummary,
  onNavigateTab,
}: StudentMonitorFlowCardProps) {
  const {
    isEnabled,
    classCode,
    monitorUsername,
    monitorFullName,
    monitorPhone,
    allowRegisterCourse,
    allowCancelCourse,
    autoSyncOnAction,
    note,
    lastActionAt,
    lastActionType,
    lastActionResult,
    lastActionMessage,
    isExternalAccountReady,
    recentQueueItem,
  } = flowSummary;

  const formatActionTypeName = (type?: string | null) => {
    if (!type) return 'Đồng bộ môn học';
    const upper = type.toUpperCase();
    if (upper.includes('REGISTER')) return 'Đăng ký môn học';
    if (upper.includes('CANCEL')) return 'Hủy môn học';
    if (upper.includes('SYNC')) return 'Đồng bộ danh sách môn';
    return type;
  };

  const getResultBadge = (result?: string | null) => {
    if (!result) return null;
    const upper = result.toUpperCase();
    if (upper === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Thành công
        </span>
      );
    }
    if (upper === 'FAILED' || upper === 'ERROR') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          Thất bại
        </span>
      );
    }
    if (upper === 'QUEUED' || upper === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
          Đang chờ xử lý
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        {result}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 rounded-3xl p-6 sm:p-7 border border-indigo-200/90 shadow-sm relative overflow-hidden">
      {/* Decorative accent blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100/80">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Tự Động Flow Đăng Ký Môn Theo Lớp Trưởng
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Lớp {classCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tài khoản của bạn đã được liên kết để tự động đồng bộ & đăng ký môn học theo Lớp trưởng
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex items-center gap-2">
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang Nhận Flow (Active)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Tạm Dừng Nhận Flow
              </span>
            )}
          </div>
        </div>

        {/* 4-Box Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Lớp Trưởng Phụ Trách */}
          <div className="bg-white/95 border border-indigo-100/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  Lớp Trưởng Điều Phối
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm truncate">
                {monitorFullName || monitorUsername}
              </div>
              <div className="font-mono text-xs text-indigo-600 font-semibold mt-0.5">
                {monitorUsername}
              </div>
            </div>

            {monitorPhone && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{monitorPhone}</span>
              </div>
            )}
          </div>

          {/* Card 2: Quyền & Hành Động Flow */}
          <div className="bg-white/95 border border-indigo-100/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
                  Quyền & Chế Độ Flow
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Đăng ký môn:</span>
                  {allowRegisterCourse ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <Check className="w-3 h-3" /> Cho phép
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <X className="w-3 h-3" /> Tắt
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Hủy môn:</span>
                  {allowCancelCourse ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <Check className="w-3 h-3" /> Cho phép
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <X className="w-3 h-3" /> Tắt
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-medium mt-2 pt-1.5 border-t border-slate-100">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Đồng bộ tức thì: <strong>{autoSyncOnAction ? 'Bật' : 'Theo đợt'}</strong></span>
            </div>
          </div>

          {/* Card 3: Trạng Thái Cổng ĐKMH (QLDTTX) */}
          <div className="bg-white/95 border border-indigo-100/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  Cổng ĐKMH (QLDTTX)
                </span>
                {isExternalAccountReady ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-xs">
                {isExternalAccountReady ? (
                  <div>
                    <div className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tài khoản đã sẵn sàng
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hệ thống tự động thực thi lệnh flow khi Lớp trưởng thao tác.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Chưa liên kết tài khoản
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cần cấu hình tài khoản QLDTTX để flow tự động có thể đăng ký môn.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!isExternalAccountReady && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile', 'EXTERNAL_ACCOUNTS')}
                className="w-full mt-2 py-1 px-2 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition text-center cursor-pointer"
              >
                Liên kết ngay
              </button>
            )}
          </div>

          {/* Card 4: Tác Vụ Gần Nhất */}
          <div className="bg-white/95 border border-indigo-100/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Lần Flow Gần Nhất
                </span>
                {getResultBadge(lastActionResult || recentQueueItem?.status)}
              </div>

              {lastActionAt || recentQueueItem ? (
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-800 truncate">
                    {formatActionTypeName(lastActionType || recentQueueItem?.flowAction)}
                  </div>
                  {(recentQueueItem?.ten_mon || recentQueueItem?.ma_mon) && (
                    <div className="text-[11px] text-slate-600 truncate font-mono">
                      {recentQueueItem.ma_mon}: {recentQueueItem.ten_mon} ({recentQueueItem.nhom_to})
                    </div>
                  )}
                  {(lastActionMessage || recentQueueItem?.resultMessage) && (
                    <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      {lastActionMessage || recentQueueItem?.resultMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1">
                  Chưa có tác vụ flow nào được thực thi
                </div>
              )}
            </div>

            {lastActionAt && (
              <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                {new Date(lastActionAt).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        </div>

        {/* Note if any */}
        {note && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ghi chú từ Lớp trưởng:</span> {note}
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Môn học sẽ được đăng ký cùng nhóm tổ với Lớp trưởng để đảm bảo học chung lịch.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('course_registration')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer justify-center"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem Môn Đã Đăng Ký</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
