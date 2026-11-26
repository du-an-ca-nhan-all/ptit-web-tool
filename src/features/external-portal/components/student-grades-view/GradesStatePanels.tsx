import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DataSource, GradesErrorType } from './types';

interface GradesStatePanelsProps {
  dataSource: DataSource;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  errorType: GradesErrorType;
  onRetry: () => void;
  onNavigateToExternalAccounts?: () => void;
}

export function GradesStatePanels({
  dataSource,
  isLoading,
  isRefreshing,
  error,
  errorType,
  onRetry,
  onNavigateToExternalAccounts,
}: GradesStatePanelsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-600">Đang tải bảng điểm và phân tích kết quả học tập...</span>
      </div>
    );
  }

  if (errorType === 'NOT_CONFIGURED') {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {dataSource === 'SLINK'
                ? 'Yêu Cầu Cấu Hình Cổng PTIT S-Link'
                : 'Yêu Cầu Cấu Hình Cổng QLDTTX (PTTC1)'}
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {dataSource === 'SLINK'
              ? 'Chưa Cấu Hình Tài Khoản PTIT S-Link'
              : 'Chưa Cấu Hình Tài Khoản Đào Tạo Từ Xa'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            {dataSource === 'SLINK' ? (
              <>
                Để xem được <b>Bảng Điểm & Kết Quả Học Tập</b> từ S-Link, bạn cần cấu hình thông tin đăng nhập tại Cổng PTIT S-Link (<span className="font-mono text-violet-600">https://slink.ptit.edu.vn/</span>).
              </>
            ) : (
              <>
                Để xem được <b>Bảng Điểm & Kết Quả Học Tập</b> từ nhà trường, bạn cần cấu hình thông tin đăng nhập tại Cổng Quản Lý Đào Tạo Từ Xa (<span className="font-mono text-indigo-600">https://qldttx.pttc1.edu.vn/</span>).
              </>
            )}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 text-left w-full space-y-2">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Các phân tích hữu ích có sẵn khi kết nối:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px]">
            <li>Điểm trung bình tích lũy hệ 4.0 và hệ 10.0 cập nhật thời gian thực</li>
            <li>Chi tiết từng thành phần điểm (Điểm thi, Kiểm tra, Chuyên cần, Bài tập lớn)</li>
            <li>Biểu đồ xu hướng GPA qua từng học kỳ và phân bố điểm chữ A/B/C/D/F</li>
            <li>Bộ mô phỏng mục tiêu tốt nghiệp (Bằng Khá, Giỏi, Xuất sắc)</li>
          </ul>
        </div>

        {onNavigateToExternalAccounts && (
          <button
            onClick={onNavigateToExternalAccounts}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Award className="w-4 h-4" />
            <span>{dataSource === 'SLINK' ? 'Đến Cấu Hình Tài Khoản S-Link Ngay' : 'Đến Cấu Hình Tài Khoản QLDTTX Ngay'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (errorType === 'INVALID_CREDENTIALS') {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{dataSource === 'SLINK' ? 'Lỗi Xác Thực Tài Khoản PTIT S-Link' : 'Lỗi Xác Thực Tài Khoản QLDTTX'}</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {dataSource === 'SLINK'
              ? 'Refresh Token PTIT S-Link Đã Hết Hạn Hoặc Không Hợp Lệ'
              : 'Tài Khoản Hoặc Mật Khẩu Không Chính Xác'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            {dataSource === 'SLINK'
              ? 'Không thể xác thực phiên PTIT S-Link để lấy dữ liệu bảng điểm. Vui lòng cập nhật lại Refresh Token OAuth mới từ slink.ptit.edu.vn.'
              : 'Không thể đăng nhập vào cổng QLDTTX để lấy dữ liệu bảng điểm. Vui lòng kiểm tra lại mã sinh viên và mật khẩu.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{dataSource === 'SLINK' ? 'Cập Nhật Refresh Token S-Link' : 'Cập Nhật Lại Mật Khẩu QLDTTX'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onRetry}
            disabled={isRefreshing}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Thử Lại</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
      <AlertCircle className="w-10 h-10 text-rose-500" />
      <h3 className="text-sm font-bold text-slate-800">Không thể tải kết quả học tập</h3>
      <p className="text-xs text-slate-500 max-w-md">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
      >
        Thử lại
      </button>
    </div>
  );
}
