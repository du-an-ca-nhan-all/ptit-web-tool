'use client';

import React from 'react';
import {
  CalendarDays,
  User,
  BookOpen,
  ArrowLeftRight,
  Crown,
  GraduationCap,
  Send,
  Shield,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface QuickActionGridProps {
  onNavigateTab: (tab: string, subTab?: string) => void;
}

export default function QuickActionGrid({ onNavigateTab }: QuickActionGridProps) {
  const actions = [
    {
      title: 'Đăng Ký Môn Học (QLHT)',
      desc: 'Cổng ĐKMH trực tiếp & Auto Canh Slot (Sniper)',
      icon: <Zap className="w-5 h-5 text-amber-500 fill-current" />,
      bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-200 hover:border-amber-300',
      badge: 'Auto ĐKMH',
      badgeColor: 'bg-amber-100 text-amber-800 font-black',
      onClick: () => onNavigateTab('course_registration'),
    },
    {
      title: 'Lịch Thi Cá Nhân',
      desc: 'Tra cứu môn thi, SBD, phòng thi & đếm ngược',
      icon: <User className="w-5 h-5 text-sky-500" />,
      bg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-100 hover:border-sky-200',
      badge: 'Cá nhân',
      badgeColor: 'bg-sky-100 text-sky-700',
      onClick: () => onNavigateTab('personal_schedule'),
    },
    {
      title: 'Lịch Thi Tổng Hợp',
      desc: 'Toàn bộ danh sách phòng thi theo đợt thi',
      icon: <CalendarDays className="w-5 h-5 text-indigo-500" />,
      bg: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-200',
      badge: 'Tổng hợp',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      onClick: () => onNavigateTab('schedule'),
    },
    {
      title: 'Môn Học & Lịch Học',
      desc: 'Xem môn đã đăng ký và thời khóa biểu tuần',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200',
      badge: 'Học vụ',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      onClick: () => onNavigateTab('registered_courses'),
    },
    {
      title: 'Học Tập Trực Tuyến LMS',
      desc: 'Theo dõi tiến độ bài giảng & điểm quá trình Moodle',
      icon: <GraduationCap className="w-5 h-5 text-sky-500" />,
      bg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-100 hover:border-sky-200',
      badge: 'LMS PTTC1',
      badgeColor: 'bg-sky-100 text-sky-700',
      onClick: () => onNavigateTab('profile', 'LMS'),
    },
    {
      title: 'So Sánh ĐKMH',
      desc: 'Đối chiếu môn học giữa tài khoản chính & phụ',
      icon: <ArrowLeftRight className="w-5 h-5 text-cyan-500" />,
      bg: 'bg-cyan-50/70 hover:bg-cyan-50 border-cyan-100 hover:border-cyan-200',
      badge: 'Tiện ích',
      badgeColor: 'bg-cyan-100 text-cyan-700',
      onClick: () => onNavigateTab('course_compare'),
    },
    {
      title: 'Danh Sách Lớp Trưởng',
      desc: 'Tra cứu thông tin liên hệ lớp trưởng các lớp',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-100 hover:border-amber-200',
      badge: 'Danh bạ',
      badgeColor: 'bg-amber-100 text-amber-800',
      onClick: () => onNavigateTab('monitors_list'),
    },
    {
      title: 'Toàn Bộ Sinh Viên',
      desc: 'Tra cứu sinh viên và lịch thi theo mã SV',
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      bg: 'bg-indigo-50/70 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-200',
      badge: 'Tra cứu',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      onClick: () => onNavigateTab('all_students'),
    },
    {
      title: 'Nhắc Lịch Telegram',
      desc: 'Cấu hình Bot tự động nhắc giờ thi & giờ học',
      icon: <Send className="w-5 h-5 text-sky-500" />,
      bg: 'bg-sky-50/70 hover:bg-sky-50 border-sky-100 hover:border-sky-200',
      badge: 'Tự động',
      badgeColor: 'bg-sky-100 text-sky-700',
      onClick: () => onNavigateTab('profile', 'TELEGRAM'),
    },
    {
      title: 'Hồ Sơ & Bảo Mật',
      desc: 'Đổi mật khẩu, quản lý tài khoản & bảo mật',
      icon: <Shield className="w-5 h-5 text-rose-500" />,
      bg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-100 hover:border-rose-200',
      badge: 'Cá nhân',
      badgeColor: 'bg-rose-100 text-rose-700',
      onClick: () => onNavigateTab('profile', 'SECURITY'),
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">Trung Tâm Phím Tắt & Tiện Ích</h3>
          <p className="text-xs text-slate-500">Truy cập nhanh các chức năng chính trên hệ thống</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => (
          <button
            key={act.title}
            type="button"
            onClick={act.onClick}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${act.bg}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {act.icon}
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${act.badgeColor}`}>
                  {act.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{act.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{act.desc}</p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors pt-2 border-t border-slate-200/50">
              <span>Mở tính năng</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
