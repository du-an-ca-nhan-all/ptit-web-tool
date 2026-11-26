'use client';

import React from 'react';
import { SidebarNavButtonProps } from './types';

const INACTIVE_CLASS =
  'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent';

export function SidebarNavButton({
  isActive,
  activeClassName,
  onClick,
  children,
}: SidebarNavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
        isActive ? activeClassName : INACTIVE_CLASS
      }`}
    >
      {children}
    </button>
  );
}
