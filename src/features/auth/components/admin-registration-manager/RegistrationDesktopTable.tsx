'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  GraduationCap,
  Trash2,
  Check,
  X,
  KeyRound,
  Zap,
} from 'lucide-react';
import { RegistrationItem } from './types';
import { formatDateTime } from './utils';

interface RegistrationDesktopTableProps {
  requests: RegistrationItem[];
  selectedIds: number[];
  isProcessing: boolean;
  onSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onApprove: (ids: number[]) => void;
  onOpenReject: (item: RegistrationItem) => void;
  onOpenResetPassword: (item: RegistrationItem) => void;
  onDelete: (id: number) => void;
}

export function RegistrationDesktopTable({
  requests,
  selectedIds,
  isProcessing,
  onSelectAll,
  onToggleSelect,
  onApprove,
  onOpenReject,
  onOpenResetPassword,
  onDelete,
}: RegistrationDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3.5 px-4 w-10">
              <input
                type="checkbox"
                checked={selectedIds.length === requests.length && requests.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </th>
            <th className="py-3.5 px-4">Sinh Viên / MSSV</th>
            <th className="py-3.5 px-4">Lớp Học</th>
            <th className="py-3.5 px-4">SĐT Liên Hệ</th>
            <th className="py-3.5 px-4">Thời Gian Gửi</th>
            <th className="py-3.5 px-4">Trạng Thái</th>
            <th className="py-3.5 px-4">Ghi Chú</th>
            <th className="py-3.5 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {requests.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <tr
                key={item.id}
                className={`hover:bg-slate-50/80 transition-colors ${
                  isSelected ? 'bg-blue-50/40' : ''
                }`}
              >
                <td className="py-3.5 px-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                      {item.fullName ? item.fullName.charAt(0) : item.username.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {item.fullName || 'Chưa rõ họ tên'}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-0.5">
                        {item.username}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-bold text-slate-700">
                  {item.lop ? (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {item.lop}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                  {item.phoneNumber ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {item.phoneNumber}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                  {formatDateTime(item.createdAt)}
                </td>

                <td className="py-3.5 px-4">
                  {item.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Chờ Duyệt
                    </span>
                  ) : item.status === 'APPROVED' ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã Duyệt
                      </span>
                      {item.reviewedBy && (
                        <span className={`text-[10px] ${item.reviewedBy.includes('TỰ ĐỘNG') ? 'text-indigo-600 font-bold inline-flex items-center gap-0.5' : 'text-slate-400'}`}>
                          {item.reviewedBy.includes('TỰ ĐỘNG') ? (
                            <>
                              <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              {item.reviewedBy}
                            </>
                          ) : (
                            `bởi @${item.reviewedBy}`
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Đã Từ Chối
                      </span>
                      {item.reviewedBy && (
                        <span className="text-[10px] text-slate-400">
                          bởi @{item.reviewedBy}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                <td
                  className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate"
                  title={item.note || ''}
                >
                  {item.note || <span className="text-slate-400 italic">—</span>}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onApprove([item.id])}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Phê duyệt kích hoạt tài khoản sinh viên này"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>

                        <button
                          onClick={() => onOpenReject(item)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Từ chối yêu cầu đăng ký"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenResetPassword(item)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                      title={`Đặt lại mật khẩu cho ${item.username}`}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Xoá bản ghi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
