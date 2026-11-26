'use client';

import React from 'react';
import {
  Crown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Zap,
  Phone,
  Settings2,
  Check,
  X,
} from 'lucide-react';
import { StudentMonitorFlowSummary } from '../../types/dashboard.types';
import { FlowResultBadge } from './FlowResultBadge';
import { formatActionTypeName } from './utils';

interface FlowInfoGridProps {
  flowSummary: StudentMonitorFlowSummary;
  onNavigateTab: (tab: string, subTab?: string, options?: any) => void;
}

export function FlowInfoGrid({ flowSummary, onNavigateTab }: FlowInfoGridProps) {
  const {
    monitorUsername,
    monitorFullName,
    monitorPhone,
    allowRegisterCourse,
    allowCancelCourse,
    autoSyncOnAction,
    lastActionAt,
    lastActionType,
    lastActionResult,
    lastActionMessage,
    isExternalAccountReady,
    recentQueueItem,
  } = flowSummary;

  return (
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
            <FlowResultBadge result={lastActionResult || recentQueueItem?.status} />
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
  );
}
