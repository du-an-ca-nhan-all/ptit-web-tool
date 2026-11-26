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

interface DesktopAccountsTableProps {
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

export function DesktopAccountsTable({
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
}: DesktopAccountsTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-4 py-3.5 text-center w-12">STT</th>
            <th className="px-4 py-3.5">Sinh Viên</th>
            <th className="px-4 py-3.5">Lớp</th>
            <th className="px-4 py-3.5">Hệ Thống</th>
            <th className="px-4 py-3.5">Tên Đăng Nhập</th>
            <th className="px-4 py-3.5">Mật Khẩu</th>
            <th className="px-4 py-3.5">Access Token</th>
            <th className="px-4 py-3.5 text-center">Trạng Thái</th>
            <th className="px-4 py-3.5 text-center">Cập Nhật</th>
            <th className="px-4 py-3.5 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.map((acc, index) => {
            const isPassVisible = !!visiblePasswords[acc.id];
            const isCurrentTesting = testingId === acc.id;
            const isCopied = copiedTokenId === acc.id;

            return (
              <tr key={acc.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                <td className="px-4 py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {acc.username}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{acc.hoTen}</span>
                    </div>
                    {acc.soDienThoai && (
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <span>SĐT: {acc.soDienThoai}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {acc.maLop}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {acc.systemKey === 'LMS_PTTC1' ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>LMS PTTC1</span>
                    </span>
                  ) : acc.systemKey === 'SLINK_PTIT' ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>PTIT S-Link</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Cổng QLDTTX</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {acc.extUsername}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-slate-800">
                      {isPassVisible ? acc.extPassword || '(Trống)' : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleShowPassword(acc.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                      title={isPassVisible ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                    >
                      {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {acc.token ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => onViewToken(acc)}
                        className="font-mono text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg truncate max-w-[140px] cursor-pointer hover:bg-emerald-100 transition-colors"
                        title="Bấm để xem toàn bộ Session / Token"
                      >
                        {acc.token.replace(/^Bearer\s+/i, '').substring(0, 16)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopyToken(acc.token!, acc.id)}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded-md transition-colors cursor-pointer"
                        title="Sao chép Session / Token"
                      >
                        {isCopied ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Chưa cấp</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {acc.status === 'CONNECTED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Check className="w-3 h-3" /> Đã Liên Kết
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-3 h-3" /> Lỗi Kết Nối
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                  {acc.updatedAt ? new Date(acc.updatedAt).toLocaleDateString('vi-VN') : '—'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Get / Refresh Token button */}
                    <button
                      onClick={() => onGetTokenSingle(acc)}
                      disabled={isCurrentTesting}
                      className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      title={
                        acc.systemKey === 'LMS_PTTC1'
                          ? 'Lấy / Làm mới Session LMS'
                          : acc.systemKey === 'SLINK_PTIT'
                          ? 'Lấy / Làm mới Token PTIT S-Link'
                          : 'Lấy / Làm mới Token QLDTTX'
                      }
                    >
                      {isCurrentTesting ? (
                        <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => onEdit(acc)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Sửa thông tin tài khoản"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(acc)}
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hủy liên kết tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
