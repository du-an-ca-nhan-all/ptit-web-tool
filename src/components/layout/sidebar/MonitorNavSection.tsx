'use client';

import React from 'react';
import {
  BookOpenCheck,
  Coffee,
  Crown,
  DollarSign,
  GitFork,
  Split,
  Users,
} from 'lucide-react';
import { NavigationTab } from '../../../types/navigation';
import { SidebarNavButton } from './SidebarNavButton';

interface MonitorNavSectionProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  hasExamSchedule: boolean;
}

const AMBER_ACTIVE = 'bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold';

export function MonitorNavSection({
  activeTab,
  onTabChange,
  hasExamSchedule,
}: MonitorNavSectionProps) {
  return (
    <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/80">
      <div className="px-3 py-1 text-[11px] font-extrabold text-amber-400 tracking-wider uppercase flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Công Cụ Lớp Trưởng</span>
        </div>
        <span className="px-1.5 py-0.5 bg-amber-400/10 text-amber-300 rounded text-[9px] font-mono border border-amber-400/20">
          Lớp Trưởng
        </span>
      </div>

      {/* Danh sách thành viên trong lớp */}
      <SidebarNavButton
        isActive={activeTab === 'members'}
        activeClassName={AMBER_ACTIVE}
        onClick={() => onTabChange('members')}
      >
        <Users className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-left">Danh Sách Thành Viên Trong Lớp</span>
      </SidebarNavButton>

      {/* Cấu hình Flow Action */}
      <SidebarNavButton
        isActive={activeTab === 'monitor_flow'}
        activeClassName={AMBER_ACTIVE}
        onClick={() => onTabChange('monitor_flow')}
      >
        <GitFork className="w-4 h-4 text-amber-400" /> Cấu Hình Flow Lớp Trưởng
      </SidebarNavButton>

      {/* Đăng Ký Ôn Tập Đợt Thi */}
      <SidebarNavButton
        isActive={activeTab === 'exam_review'}
        activeClassName={AMBER_ACTIVE}
        onClick={() => onTabChange('exam_review')}
      >
        <BookOpenCheck className="w-4 h-4 text-amber-400" /> Đăng Ký Ôn Tập
      </SidebarNavButton>

      {/* Lọc Tách Phòng & Sĩ Số Phòng Thi */}
      <SidebarNavButton
        isActive={activeTab === 'room_analysis'}
        activeClassName="bg-rose-600/20 text-rose-400 border border-rose-500/30 font-bold"
        onClick={() => onTabChange('room_analysis')}
      >
        <Split className="w-4 h-4 text-rose-400" /> Lọc Tách Phòng Thi
      </SidebarNavButton>

      {/* Phân Công Nước Uống & Hỗ Trợ */}
      {hasExamSchedule && (
        <SidebarNavButton
          isActive={activeTab === 'envelope_all' || activeTab === 'envelope'}
          activeClassName={AMBER_ACTIVE}
          onClick={() => onTabChange('envelope_all')}
        >
          <Coffee className="w-4 h-4 text-amber-400" /> Phân Công Nước Uống
        </SidebarNavButton>
      )}

      {/* Bù Trừ Qũy Nước & Chi Phí */}
      {hasExamSchedule && (
        <SidebarNavButton
          isActive={activeTab === 'settlement'}
          activeClassName="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold"
          onClick={() => onTabChange('settlement')}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" /> Bù Trừ Qũy & Chi Phí
        </SidebarNavButton>
      )}
    </div>
  );
}
