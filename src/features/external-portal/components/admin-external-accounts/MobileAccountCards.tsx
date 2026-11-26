import React from 'react';
import {
  Globe,
  BookOpen,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Copy,
  CheckCheck,
  Zap,
  Edit3,
  Trash2,
} from 'lucide-react';
import { ExternalAccountAdminItem } from './types';
import { isSyncMessageError } from './utils';

interface MobileAccountCardsProps {
  accounts: ExternalAccountAdminItem[];
  visiblePasswords: { [id: number]: boolean };
  testingId: number | null;
  copiedTokenId: number | null;
  onToggleShowPassword: (id: number) => void;
  onViewToken: (acc: ExternalAccountAdminItem) => void;
  onCopyToken: (token: string, id: number) => void;
  onGetTokenSingle: (acc: ExternalAccountAdminItem) => void;
  onEdit: (acc: ExternalAccountAdminItem) => void;
  onDelete: (acc: ExternalAccountAdminItem) => void;
}

export function MobileAccountCards({
  accounts,
  visiblePasswords,
  testingId,
  copiedTokenId,
  onToggleShowPassword,
  onViewToken,
  onCopyToken,
  onGetTokenSingle,
  onEdit,
  onDelete,
}: MobileAccountCardsProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-4 space-y-3">
      {accounts.map((acc) => {
        const isPassVisible = !!visiblePasswords[acc.id];
        const isCurrentTesting = testingId === acc.id;
        const isCopied = copiedTokenId === acc.id;

        return (
          <div
            key={acc.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-3 hover:border-indigo-200 transition-all"
          >
            {/* Card Header: Initial avatar, Full Name, MSSV, Class & System badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                  {acc.hoTen ? acc.hoTen.charAt(0) : acc.username.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {acc.hoTen || 'Chưa rõ họ tên'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                      {acc.username}
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                      {acc.maLop}
                    </span>
                  </div>
                </div>
              </div>

              {/* System tag */}
              <div className="shrink-0">
                {acc.systemKey === 'LMS_PTTC1' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                    <BookOpen className="w-3 h-3 text-sky-600 shrink-0" />
                    <span>LMS</span>
                  </span>
                ) : acc.systemKey === 'SLINK_PTIT' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    <Smartphone className="w-3 h-3 text-purple-600 shrink-0" />
                    <span>S-Link</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <Globe className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>QLDTTX</span>
                  </span>
                )}
              </div>
            </div>

            {/* Card Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-b border-slate-100 text-slate-600">
              {/* Tên đăng nhập */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tên đăng nhập</span>
                <span className="font-mono font-bold text-slate-800 break-all text-[11px] block mt-0.5">
                  {acc.extUsername}
                </span>
              </div>

              {/* Mật khẩu */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Mật khẩu</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-mono text-xs text-slate-800">
                    {isPassVisible ? acc.extPassword || '(Trống)' : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleShowPassword(acc.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    aria-label={isPassVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Trạng thái kết nối */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Trạng thái</span>
                <div className="mt-0.5">
                  {acc.status === 'CONNECTED' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-2.5 h-2.5" /> Đã Liên Kết
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-2.5 h-2.5" /> Lỗi Kết Nối
                    </span>
                  )}
                </div>
              </div>

              {/* Access Token */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Access Token</span>
                <div className="mt-0.5">
                  {acc.token ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewToken(acc)}
                        className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded truncate max-w-[85px] cursor-pointer hover:bg-emerald-100"
                        title="Xem đầy đủ Token"
                      >
                        {acc.token.replace(/^Bearer\s+/i, '').substring(0, 8)}...
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopyToken(acc.token!, acc.id)}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-pointer"
                        title="Sao chép Token"
                      >
                        {isCopied ? (
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Chưa cấp</span>
                  )}
                </div>
              </div>

              {/* SĐT nếu có */}
              {acc.soDienThoai && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">SĐT</span>
                  <a
                    href={`tel:${acc.soDienThoai}`}
                    className="font-mono text-blue-600 font-semibold hover:underline text-[11px] block mt-0.5"
                  >
                    {acc.soDienThoai}
                  </a>
                </div>
              )}

              {/* Cập nhật */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Cập nhật</span>
                <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                  {acc.updatedAt ? new Date(acc.updatedAt).toLocaleDateString('vi-VN') : '—'}
                </span>
              </div>
            </div>

            {/* Sync message if any */}
            {acc.syncMessage && (
              <div
                className={`p-2 rounded-xl text-[11px] leading-tight ${
                  isSyncMessageError(acc.status, acc.syncMessage)
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <span className="font-bold block mb-0.5">Nhật ký:</span>
                <span>{acc.syncMessage}</span>
              </div>
            )}

            {/* Action buttons toolbar on card */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onGetTokenSingle(acc)}
                disabled={isCurrentTesting}
                className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
                title="Lấy Session/Token"
              >
                {isCurrentTesting ? (
                  <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 text-amber-600" />
                )}
                <span>Lấy Token</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(acc)}
                className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-indigo-600" />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(acc)}
                className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                title="Hủy liên kết"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
