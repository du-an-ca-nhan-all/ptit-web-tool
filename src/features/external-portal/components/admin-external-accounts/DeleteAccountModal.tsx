import React from 'react';
import { Trash2 } from 'lucide-react';
import { ExternalAccountAdminItem } from './types';

interface DeleteAccountModalProps {
  account: ExternalAccountAdminItem;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  account,
  onCancel,
  onConfirm,
}: DeleteAccountModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-w-sm w-full border border-slate-200">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          Hủy Liên Kết Tài Khoản?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-5">
          Bạn có chắc chắn muốn hủy liên kết tài khoản của sinh viên{' '}
          <strong>{account.hoTen}</strong> (Mã SV:{' '}
          <span className="font-mono font-bold text-indigo-600">{account.username}</span>)?
        </p>
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Đồng Ý Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
