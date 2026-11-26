'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Check,
  X,
  KeyRound,
  Zap,
} from 'lucide-react';
import { RegistrationItem } from './types';
import { formatDateTime } from './utils';

interface RegistrationMobileListProps {
  requests: RegistrationItem[];
  selectedIds: number[];
  isProcessing: boolean;
  onToggleSelect: (id: number) => void;
  onApprove: (ids: number[]) => void;
  onOpenReject: (item: RegistrationItem) => void;
  onOpenResetPassword: (item: RegistrationItem) => void;
  onDelete: (id: number) => void;
}

export function RegistrationMobileList({
  requests,
  selectedIds,
  isProcessing,
  onToggleSelect,
  onApprove,
  onOpenReject,
  onOpenResetPassword,
  onDelete,
}: RegistrationMobileListProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
      {requests.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <div
            key={item.id}
            className={`p-3.5 rounded-2xl border transition-all ${
              isSelected
                ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(item.id)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 mt-0.5"
                />
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {item.fullName ? item.fullName.charAt(0) : item.username.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {item.fullName || 'Chưa rõ họ tên'}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    {item.username}
                  </span>
                </div>
              </div>

              {/* Status Tag */}
              <div className="shrink-0 text-right">
                {item.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" /> Chờ Duyệt
                  </span>
                ) : item.status === 'APPROVED' ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Đã Duyệt
                    </span>
                    {item.reviewedBy && (
                      <span className={`text-[9px] ${item.reviewedBy.includes('TỰ ĐỘNG') ? 'text-indigo-600 font-bold inline-flex items-center gap-0.5' : 'text-slate-400'}`}>
                        {item.reviewedBy.includes('TỰ ĐỘNG') ? (
                          <>
                            <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            {item.reviewedBy}
                          </>
                        ) : (
                          `@{item.reviewedBy}`
                        )}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3 h-3" /> Đã Từ Chối
                  </span>
                )}
              </div>
            </div>

            {/* Metadata items */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Lớp</span>
                <span className="font-semibold text-slate-800">
                  {item.lop || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">SĐT</span>
                {item.phoneNumber ? (
                  <a href={`tel:${item.phoneNumber}`} className="font-mono font-bold text-blue-600 hover:underline">
                    {item.phoneNumber}
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Thời gian gửi</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              {item.note && (
                <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
                  Ghi chú: {item.note}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenResetPassword(item)}
                  className="px-2.5 py-1.5 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Đặt lại mật khẩu cho ${item.username}`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reset MK</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Xoá bản ghi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {item.status === 'PENDING' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenReject(item)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove([item.id])}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Duyệt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
