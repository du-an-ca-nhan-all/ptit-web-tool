'use client';

import React from 'react';
import { BookOpen, Globe, GraduationCap, Smartphone } from 'lucide-react';

interface SystemIconProps {
  iconKey?: string;
  isConnected?: boolean;
}

export function SystemIcon({ iconKey, isConnected = false }: SystemIconProps) {
  if (iconKey === 'BookOpen') {
    return (
      <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-sky-50 text-sky-600'}`}>
        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    );
  }
  if (iconKey === 'GraduationCap') {
    return (
      <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-50 text-emerald-600'}`}>
        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    );
  }
  if (iconKey === 'Smartphone' || iconKey === 'Bell') {
    return (
      <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-purple-50 text-purple-600'}`}>
        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    );
  }
  return (
    <div className={`p-2.5 rounded-2xl shrink-0 ${isConnected ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-indigo-50 text-indigo-600'}`}>
      <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
}
