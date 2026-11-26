'use client';

import React from 'react';
import {
  User as UserIcon,
  Award,
  Globe,
  Send,
  CalendarDays,
  ShieldCheck,
  Lock,
  BookOpen,
} from 'lucide-react';
import { ProfileSubTab } from '../../../../types/navigation';

interface ProfileSubTabsNavProps {
  activeSubTab: ProfileSubTab;
  configuredCount: number;
  onSelectSubTab: (subTab: ProfileSubTab) => void;
}

export function ProfileSubTabsNav({
  activeSubTab,
  configuredCount,
  onSelectSubTab,
}: ProfileSubTabsNavProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 border border-slate-200 shadow-xs flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none scroll-smooth -mx-1 sm:mx-0 px-2 sm:px-1.5">
      <button
        onClick={() => onSelectSubTab('OVERVIEW')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
          activeSubTab === 'OVERVIEW'
            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Thông Tin Học Vụ</span>
      </button>

      <button
        onClick={() => onSelectSubTab('SCHEDULE')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
          activeSubTab === 'SCHEDULE'
            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Lịch Học & TKB</span>
        {configuredCount === 0 ? (
          <Lock className="w-3 h-3 text-amber-500 opacity-80" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
        )}
      </button>

      <button
        onClick={() => onSelectSubTab('GRADES')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
          activeSubTab === 'GRADES'
            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Bảng Điểm & Kết Quả</span>
        {configuredCount === 0 ? (
          <Lock className="w-3 h-3 text-amber-500 opacity-80" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
        )}
      </button>

      <button
        onClick={() => onSelectSubTab('LMS')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
          activeSubTab === 'LMS'
            ? 'bg-sky-600 text-white shadow-xs shadow-sky-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Học Tập LMS</span>
        {configuredCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-white"></span>
        )}
      </button>

      <button
        onClick={() => onSelectSubTab('EXTERNAL_ACCOUNTS')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
          activeSubTab === 'EXTERNAL_ACCOUNTS'
            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Liên Kết Cổng Trường</span>
        {configuredCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white"></span>
        )}
      </button>

      <button
        onClick={() => onSelectSubTab('TELEGRAM')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap relative ${
          activeSubTab === 'TELEGRAM'
            ? 'bg-sky-600 text-white shadow-xs shadow-sky-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Cấu Hình Telegram</span>
      </button>

      <button
        onClick={() => onSelectSubTab('SECURITY')}
        className={`shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 whitespace-nowrap ${
          activeSubTab === 'SECURITY'
            ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Bảo Mật & Mật Khẩu</span>
      </button>
    </div>
  );
}
