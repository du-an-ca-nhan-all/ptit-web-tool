'use client';

import React from 'react';
import {
  User as UserIcon,
  Phone,
  Calendar,
  Award,
  Edit3,
  Check,
  LogOut,
  ExternalLink,
  ChevronRight,
  CalendarDays,
  Globe,
} from 'lucide-react';
import { LoginUser } from '../../types/auth.types';

interface ProfileOverviewTabProps {
  currentUser: LoginUser & { student?: any };
  maSV: string;
  fullName: string;
  gioiTinh: string;
  ngaySinh: string;
  maLop: string;
  phone: string;
  setPhone: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  isSaving: boolean;
  onSaveProfile: (e: React.FormEvent) => void;
  onLogout: () => void;
  hasExamSchedule?: boolean;
  onNavigateTab?: (tab: string) => void;
  onSelectSubTab: (subTab: any) => void;
}

export function ProfileOverviewTab({
  currentUser,
  maSV,
  fullName,
  gioiTinh,
  ngaySinh,
  maLop,
  phone,
  setPhone,
  note,
  setNote,
  isEditing,
  setIsEditing,
  isSaving,
  onSaveProfile,
  onLogout,
  hasExamSchedule = false,
  onNavigateTab,
  onSelectSubTab,
}: ProfileOverviewTabProps) {
  const student = currentUser?.student || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Main Personal Info Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">Hồ Sơ & Lý Lịch Học Tập</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Thông tin cá nhân trích xuất từ cơ sở dữ liệu sinh viên</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl sm:rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa SĐT / Ghi Chú</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={onSaveProfile} className="flex flex-col gap-4 sm:gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Mã sinh viên:</span>
                <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
              </div>
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase block mb-1">Lớp học chính:</span>
                <span className="font-bold text-blue-600 text-sm sm:text-base">{maLop}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại liên hệ</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl px-4 py-2.5 text-base sm:text-sm font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú cá nhân / Ghi chú ban cán sự</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm ghi chú cá nhân, phân công, trực nhật..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-base sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setPhone(student?.soDienThoai || currentUser?.phoneNumber || '');
                  setNote(student?.ghiChu || '');
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-colors cursor-pointer text-center justify-center flex items-center"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Mã sinh viên</span>
              <span className="font-mono font-black text-slate-800 text-sm sm:text-base">{maSV}</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Họ và Tên</span>
              <span className="font-black text-slate-800 text-sm sm:text-base">{fullName}</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Giới tính</span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">{gioiTinh}</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ngày sinh</span>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">{ngaySinh}</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Lớp biên chế</span>
              <span className="font-bold text-blue-600 text-xs sm:text-sm">{maLop}</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-50/80 hover:bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100/80 transition-colors">
              <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Số điện thoại</span>
              <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
              </span>
            </div>

            {note && (
              <div className="sm:col-span-2 p-3.5 sm:p-4 bg-amber-50/50 rounded-xl sm:rounded-2xl border border-amber-200/60">
                <span className="text-amber-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider block mb-1">Ghi chú cá nhân</span>
                <p className="text-slate-700 text-xs italic break-words">"{note}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side Info Cards */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Institution Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate sm:whitespace-normal">Học Viện Công Nghệ Bưu Chính Viễn Thông</h4>
              <p className="text-[10px] sm:text-[11px] text-slate-500">Hệ Đào Tạo Từ Xa (PTTC1)</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100">
            Cổng tiện ích học tập, đối chiếu môn học & tra cứu lịch thi trực tuyến PTIT EduSync. Dữ liệu được đồng bộ trực tiếp từ cổng trường.
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs font-bold">
            <div className="flex items-center justify-between text-indigo-600">
              <span>Cổng QLĐT:</span>
              <a
                href="https://qldttx.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-mono flex items-center gap-1"
              >
                qldttx.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between text-sky-600">
              <span>Cổng LMS:</span>
              <a
                href="https://lms.pttc1.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-mono flex items-center gap-1"
              >
                lms.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-2.5 sm:gap-3">
          <h4 className="font-black text-slate-800 text-xs sm:text-sm mb-1">Truy Cập Nhanh</h4>

          <button
            onClick={() => onSelectSubTab('SCHEDULE')}
            className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Lịch Học & Thời Khóa Biểu</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
          </button>

          <button
            onClick={() => onSelectSubTab('GRADES')}
            className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Award className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Xem Điểm & Bảng Điểm Học Tập</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
          </button>

          <button
            onClick={() => onSelectSubTab('EXTERNAL_ACCOUNTS')}
            className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-indigo-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">Cấu Hình Tài Khoản QLDTTX</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
          </button>

          {hasExamSchedule && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('personal_schedule')}
              className="w-full p-2.5 sm:p-3 bg-slate-50 hover:bg-blue-50 active:scale-98 border border-slate-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 truncate">Xem Toàn Bộ Lịch Thi</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full p-2.5 sm:p-3 bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-200 rounded-xl sm:rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer text-rose-700 mt-1"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">Đăng Xuất Khỏi Hệ Thống</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
