'use client';

import React from 'react';
import { Crown, GraduationCap, ChevronDown, Check } from 'lucide-react';

interface RoleSwitcherProps {
  userRoles: string[];
  activeRole: string;
  isRoleDropdownOpen: boolean;
  setIsRoleDropdownOpen: (open: boolean) => void;
  onSelectRole: (role: string) => void;
}

export function RoleSwitcher({
  userRoles,
  activeRole,
  isRoleDropdownOpen,
  setIsRoleDropdownOpen,
  onSelectRole,
}: RoleSwitcherProps) {
  return (
    <div className="relative">
      <button
        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        title="Nhấp để chuyển đổi vai trò sử dụng"
      >
        {activeRole === 'admin' ? (
          <>
            <Crown className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Quản Trị Viên</span>
          </>
        ) : activeRole === 'lop_truong' ? (
          <>
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Lớp Trưởng</span>
          </>
        ) : (
          <>
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Sinh Viên</span>
          </>
        )}
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isRoleDropdownOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-40 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setIsRoleDropdownOpen(false)}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-slate-100">
            Chọn vai trò sử dụng:
          </div>
          {userRoles.map((r) => {
            const isActive = activeRole === r;
            return (
              <button
                key={r}
                onClick={() => {
                  onSelectRole(r);
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-black'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {r === 'admin' ? (
                    <Crown className="w-3.5 h-3.5 text-rose-600" />
                  ) : r === 'lop_truong' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>
                    {r === 'admin'
                      ? 'Quản Trị Viên'
                      : r === 'lop_truong'
                      ? 'Lớp Trưởng'
                      : 'Sinh Viên'}
                  </span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
