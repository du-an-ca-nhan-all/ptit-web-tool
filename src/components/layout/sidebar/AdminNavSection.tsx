'use client';

import React from 'react';
import {
  Archive,
  Bot,
  Clock,
  Globe,
  History,
  Layers,
  Megaphone,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { NavigationTab } from '../../../types/navigation';
import { SidebarNavButton } from './SidebarNavButton';

interface AdminNavSectionProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const INDIGO_ACTIVE = 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30 font-bold';
const SKY_ACTIVE = 'bg-sky-600/25 text-sky-400 border border-sky-500/30 font-bold';

export function AdminNavSection({ activeTab, onTabChange }: AdminNavSectionProps) {
  return (
    <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/80">
      <div className="px-3 py-1 text-[11px] font-extrabold text-indigo-400 tracking-wider uppercase flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quản Trị Viên</span>
        </div>
        <span className="px-1.5 py-0.5 bg-indigo-400/10 text-indigo-300 rounded text-[9px] font-mono border border-indigo-400/20">
          Admin
        </span>
      </div>

      {/* Quản lý đợt thi */}
      <SidebarNavButton
        isActive={activeTab === 'batches'}
        activeClassName={INDIGO_ACTIVE}
        onClick={() => onTabChange('batches')}
      >
        <Layers className="w-4 h-4 text-indigo-400" /> Quản Lý Đợt Thi
      </SidebarNavButton>

      {/* Tài khoản QLĐT từ xa */}
      <SidebarNavButton
        isActive={activeTab === 'external_accounts_admin'}
        activeClassName={INDIGO_ACTIVE}
        onClick={() => onTabChange('external_accounts_admin')}
      >
        <Globe className="w-4 h-4 text-indigo-400" /> Tài Khoản QLĐT Từ Xa
      </SidebarNavButton>

      {/* Job Global & Tác Vụ Tự Động */}
      <SidebarNavButton
        isActive={activeTab === 'global_jobs'}
        activeClassName="bg-amber-600/25 text-amber-400 border border-amber-500/30 font-bold"
        onClick={() => onTabChange('global_jobs')}
      >
        <Clock className="w-4 h-4 text-amber-400" /> Job Global / Tác Vụ Tự Động
      </SidebarNavButton>

      {/* Bot Telegram Toàn Cục */}
      <SidebarNavButton
        isActive={activeTab === 'telegram_admin'}
        activeClassName={SKY_ACTIVE}
        onClick={() => onTabChange('telegram_admin')}
      >
        <Bot className="w-4 h-4 text-sky-400" /> Bot Telegram Toàn Cục
      </SidebarNavButton>

      {/* Nhật ký hoạt động */}
      <SidebarNavButton
        isActive={activeTab === 'activity_logs'}
        activeClassName={INDIGO_ACTIVE}
        onClick={() => onTabChange('activity_logs')}
      >
        <History className="w-4 h-4 text-indigo-400" /> Nhật Ký Hoạt Động
      </SidebarNavButton>

      {/* Duyệt Đăng Ký Tài Khoản */}
      <SidebarNavButton
        isActive={activeTab === 'user_registrations'}
        activeClassName="bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 font-bold"
        onClick={() => onTabChange('user_registrations')}
      >
        <UserCheck className="w-4 h-4 text-emerald-400" /> Duyệt Đăng Ký
      </SidebarNavButton>

      {/* Sao Lưu Dữ Liệu DB */}
      <SidebarNavButton
        isActive={activeTab === 'database_backup'}
        activeClassName={INDIGO_ACTIVE}
        onClick={() => onTabChange('database_backup')}
      >
        <Archive className="w-4 h-4 text-indigo-400" /> Sao Lưu Dữ Liệu DB
      </SidebarNavButton>

      {/* Thông Báo Hệ Thống */}
      <SidebarNavButton
        isActive={activeTab === 'announcements_admin'}
        activeClassName={SKY_ACTIVE}
        onClick={() => onTabChange('announcements_admin')}
      >
        <Megaphone className="w-4 h-4 text-sky-400" /> Thông Báo Hệ Thống
      </SidebarNavButton>
    </div>
  );
}
