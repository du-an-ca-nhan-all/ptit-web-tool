import React from 'react';
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { ModalTestStatus } from './types';

interface AccountFormTestBannerProps {
  isTestPassed: boolean;
  modalTestStatus: ModalTestStatus;
  modalTestError: string;
}

export function AccountFormTestBanner({
  isTestPassed,
  modalTestStatus,
  modalTestError,
}: AccountFormTestBannerProps) {
  if (isTestPassed) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <strong className="font-bold block text-emerald-950">Kiểm tra kết nối thành công!</strong>
          <span className="text-[11px] text-emerald-700">Tài khoản hợp lệ. Đã mở khóa nút Lưu.</span>
        </div>
      </div>
    );
  }

  if (modalTestStatus === 'FAILED') {
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-900 animate-in fade-in">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
        <div className="flex-1">
          <strong className="font-bold block text-rose-950">Kiểm tra kết nối thất bại!</strong>
          <span className="text-[11px] text-rose-700">
            {modalTestError || 'Tên đăng nhập hoặc mật khẩu không chính xác.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
      <div className="flex-1">
        <strong className="font-bold block text-amber-950">Yêu cầu kiểm tra kết nối</strong>
        <span className="text-[11px] text-amber-800">
          Vui lòng bấm <strong>&quot;Kiểm Tra Kết Nối&quot;</strong> thành công trước để mở khóa nút Lưu.
        </span>
      </div>
    </div>
  );
}
