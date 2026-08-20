'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import Button from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionVariant?: 'primary' | 'secondary' | 'indigo' | 'amber';
  className?: string;
}

export function EmptyState({
  icon = <Inbox className="w-8 h-8" />,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  actionVariant = 'primary',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-200 ${className}`}
    >
      <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      {description && <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <Button variant={actionVariant} size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
