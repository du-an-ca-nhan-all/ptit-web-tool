'use client';

import React from 'react';
import { UserCheck, X, ShieldAlert, Search } from 'lucide-react';
import { ExamRecord } from '../../types';

interface ImpersonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  impersonateTargetInput: string;
  setImpersonateTargetInput: (val: string) => void;
  onImpersonate: (targetUsername: string) => void;
  isImpersonating: boolean;
  impersonateError: string;
  records: ExamRecord[];
  currentUsername?: string;
}

export default function ImpersonateModal({
  isOpen,
  onClose,
  impersonateTargetInput,
  setImpersonateTargetInput,
  onImpersonate,
  isImpersonating,
  impersonateError,
  records,
  currentUsername,
}: ImpersonateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black">Đăng Nhập Như Người Dùng Khác</h3>
              <p className="text-xs text-purple-200">Tính năng quản trị: Giả lập tài khoản sinh viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4">
          {impersonateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{impersonateError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (impersonateTargetInput.trim()) {
                onImpersonate(impersonateTargetInput.trim());
              }
            }}
            className="flex flex-col gap-3"
          >
            <label className="text-xs font-bold text-slate-700">
              Nhập Mã sinh viên cần đăng nhập (Ví dụ: <code className="text-purple-600 font-mono">K25DTCN340</code>):
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={impersonateTargetInput}
                  onChange={(e) => setImpersonateTargetInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã sinh viên (MaSV)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isImpersonating || !impersonateTargetInput.trim()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImpersonating ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>Đăng Nhập</span>
              </button>
            </div>
          </form>

          {/* Quick suggestions from records */}
          {records.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gợi ý nhanh sinh viên trong hệ thống:
              </span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {Array.from(
                  new Map(
                    records
                      .filter((r) => r.MaSV && r.MaSV.toUpperCase() !== currentUsername?.toUpperCase())
                      .map((r) => [r.MaSV, r])
                  ).values()
                )
                  .filter((r: any) =>
                    !impersonateTargetInput ||
                    r.MaSV?.toUpperCase().includes(impersonateTargetInput) ||
                    `${r.HoLotSV} ${r.TenSV}`.toUpperCase().includes(impersonateTargetInput) ||
                    r.MaLop?.toUpperCase().includes(impersonateTargetInput)
                  )
                  .slice(0, 8)
                  .map((r: any) => (
                    <div
                      key={r.MaSV}
                      className="p-2.5 bg-slate-50 hover:bg-purple-50 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-700 text-xs bg-purple-100 px-2 py-0.5 rounded-lg">
                          {r.MaSV}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {r.HoLotSV} {r.TenSV}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({r.MaLop})</span>
                      </div>
                      <button
                        onClick={() => onImpersonate(r.MaSV)}
                        disabled={isImpersonating}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
