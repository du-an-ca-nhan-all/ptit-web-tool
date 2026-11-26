'use client';

import React from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  Crown,
  GraduationCap,
  LayoutDashboard,
  User,
  Zap,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { NavigationTab } from '../../../types/navigation';
import { SidebarNavButton } from './SidebarNavButton';

interface StudentNavSectionProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: LoginUser | null;
  hasExamSchedule: boolean;
}

const BLUE_ACTIVE = 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold';

export function StudentNavSection({
  activeTab,
  onTabChange,
  currentUser,
  hasExamSchedule,
}: StudentNavSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 py-1 text-[11px] font-extrabold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
        <span>Sinh Viên & Tra Cứu</span>
      </div>

      {/* Tổng Quan / Dashboard */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'dashboard'}
          activeClassName={BLUE_ACTIVE}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 text-sky-400" /> Tổng Quan
        </SidebarNavButton>
      )}

      {/* Hồ sơ cá nhân */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'profile'}
          activeClassName={BLUE_ACTIVE}
          onClick={() => onTabChange('profile')}
        >
          <User className="w-4 h-4 text-blue-400" /> Hồ Sơ Cá Nhân
        </SidebarNavButton>
      )}

      {/* Lịch thi cá nhân */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'personal_schedule'}
          activeClassName={BLUE_ACTIVE}
          onClick={() => onTabChange('personal_schedule')}
        >
          <User className="w-4 h-4 text-sky-400" /> Lịch Thi Cá Nhân
        </SidebarNavButton>
      )}

      {/* Lịch thi tổng hợp */}
      {hasExamSchedule && (
        <SidebarNavButton
          isActive={activeTab === 'schedule'}
          activeClassName={BLUE_ACTIVE}
          onClick={() => onTabChange('schedule')}
        >
          <CalendarDays className="w-4 h-4 text-indigo-400" /> Lịch Thi Tổng Hợp
        </SidebarNavButton>
      )}

      {/* Đăng ký môn học (QLHT / QLDTTX) */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'course_registration'}
          activeClassName="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm shadow-amber-500/10"
          onClick={() => onTabChange('course_registration')}
        >
          <Zap className="w-4 h-4 text-amber-400 fill-current" /> Đăng Ký Môn Học (QLHT)
        </SidebarNavButton>
      )}

      {/* Môn học đã đăng ký */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'registered_courses' || activeTab === 'course_compare'}
          activeClassName="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold"
          onClick={() => onTabChange('registered_courses')}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" /> Môn Học Đã Đăng Ký
        </SidebarNavButton>
      )}

      {/* Lịch nhắc hẹn & Báo thức */}
      {currentUser && (
        <SidebarNavButton
          isActive={activeTab === 'reminders'}
          activeClassName="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs shadow-amber-500/10"
          onClick={() => onTabChange('reminders')}
        >
          <Bell className="w-4 h-4 text-amber-400" /> Lịch Nhắc Hẹn
        </SidebarNavButton>
      )}

      {/* Danh sách lớp trưởng */}
      <SidebarNavButton
        isActive={activeTab === 'monitors_list'}
        activeClassName="bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold"
        onClick={() => onTabChange('monitors_list')}
      >
        <Crown className="w-4 h-4 text-amber-400" /> Danh Sách Lớp Trưởng
      </SidebarNavButton>

      {/* Toàn bộ sinh viên */}
      <SidebarNavButton
        isActive={activeTab === 'all_students'}
        activeClassName="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold"
        onClick={() => onTabChange('all_students')}
      >
        <GraduationCap className="w-4 h-4 text-indigo-400" /> Toàn Bộ Sinh Viên
      </SidebarNavButton>
    </div>
  );
}
