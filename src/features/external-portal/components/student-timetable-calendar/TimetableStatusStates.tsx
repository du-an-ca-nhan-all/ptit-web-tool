import React from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Info,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Edit3,
  Globe,
} from 'lucide-react';
import { TimetableErrorType } from './types';

interface TimetableStatusStatesProps {
  isLoading: boolean;
  errorType: TimetableErrorType;
  error: string | null;
  isEmpty: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigateToExternalAccounts?: () => void;
}

export default function TimetableStatusStates({
  isLoading,
  errorType,
  error,
  isEmpty,
  isRefreshing,
  onRefresh,
  onNavigateToExternalAccounts,
}: TimetableStatusStatesProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[300px] sm:min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-600">Đang tải lịch học và thời khóa biểu...</span>
      </div>
    );
  }

  if (errorType === 'NOT_CONFIGURED') {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-5 sm:gap-6 max-w-2xl mx-auto my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
          <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Yêu Cầu Cấu Hình Cổng QLDTTX (PTTC1)</span>
          </div>
          <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
            Chưa Cấu Hình Tài Khoản Đào Tạo Từ Xa
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Để xem được <b>Thời Khóa Biểu & Lịch Học Cá Nhân</b> được cập nhật chính xác từ trường, bạn cần cấu hình thông tin đăng nhập tại Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-indigo-600">https://qldttx.pttc1.edu.vn/</span>).
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-slate-600 text-left w-full space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Quyền lợi sau khi kết nối tài khoản QLDTTX:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px]">
            <li>Tự động tải lịch học, phòng học và giảng viên học kỳ hiện tại</li>
            <li>Hiển thị lịch trực quan theo dạng Tháng, Tuần và Lịch biểu chi tiết</li>
            <li>Nhận thông báo nhắc lịch học ca tối qua Kênh/Nhóm Telegram cá nhân</li>
          </ul>
        </div>

        {onNavigateToExternalAccounts && (
          <button
            onClick={onNavigateToExternalAccounts}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Globe className="w-4 h-4" />
            <span>Đến Cấu Hình Tài Khoản QLDTTX Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (errorType === 'INVALID_CREDENTIALS') {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center gap-5 sm:gap-6 max-w-2xl mx-auto my-2 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Lỗi Xác Thực Tài Khoản QLDTTX</span>
          </div>
          <h3 className="text-base sm:text-xl font-black text-slate-800 tracking-tight">
            Tài Khoản Hoặc Mật Khẩu Không Chính Xác
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Hệ thống không thể kết nối tới Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-rose-600">https://qldttx.pttc1.edu.vn/</span>) do thông tin đăng nhập sai hoặc mật khẩu đã bị thay đổi.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-xs text-rose-800 text-left w-full space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-rose-600" />
            <span>Nguyên nhân có thể do:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-700 space-y-1">
            • Bạn vừa đổi mật khẩu trên cổng QLDTTX nhưng chưa cập nhật tại đây.<br />
            • Mã sinh viên hoặc mật khẩu nhập chưa chính xác.<br />
            • Phiên đăng nhập (Token) của trường đã hết hạn.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center w-full">
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Edit3 className="w-4 h-4" />
              <span>Cập Nhật Lại Mật Khẩu QLDTTX</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Thử Lại</span>
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-9 h-9 text-rose-500" />
        <h3 className="text-sm font-bold text-slate-800">Không thể tải lịch học</h3>
        <p className="text-xs text-slate-500 max-w-md">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4">
        <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">Chưa có dữ liệu thời khóa biểu cho học kỳ này</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Hệ thống chưa tìm thấy lịch học của bạn. Nếu bạn vừa đăng ký môn học hoặc liên kết tài khoản QLDTTX, vui lòng bấm &quot;Làm Mới Từ QLĐT&quot;.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Đồng Bộ Lịch Học Ngay</span>
        </button>
      </div>
    );
  }

  return null;
}
