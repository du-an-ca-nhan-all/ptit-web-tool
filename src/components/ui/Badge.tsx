'use client';

import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'indigo'
  | 'neutral';

export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-50 text-blue-700 border-blue-200',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-blue-500',
  secondary: 'bg-slate-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  indigo: 'bg-indigo-500',
  neutral: 'bg-slate-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] font-semibold',
  sm: 'px-2 py-0.5 text-xs font-semibold',
  md: 'px-2.5 py-1 text-xs font-bold',
};

export default function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
