'use client';

import React from 'react';
import { Database, X } from 'lucide-react';

interface SidebarHeaderProps {
  onCloseMobileMenu: () => void;
}

export function SidebarHeader({ onCloseMobileMenu }: SidebarHeaderProps) {
  return (
    <div className="p-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-500/30">
          P
        </div>
        <div>
          <h1 className="text-white font-bold text-base tracking-tight">PTIT EduSync</h1>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <Database className="w-2.5 h-2.5" /> PostgreSQL Server-Side
          </div>
        </div>
      </div>

      <button
        className="md:hidden text-slate-400 hover:text-white"
        onClick={onCloseMobileMenu}
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
