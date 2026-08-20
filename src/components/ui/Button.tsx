'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'indigo' | 'amber';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 border-transparent',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 border-transparent',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 border-transparent',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 border-transparent',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 border-transparent',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs font-semibold rounded-lg gap-1.5',
  sm: 'px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl gap-2',
  md: 'px-4 py-2 text-sm font-bold rounded-xl gap-2',
  lg: 'px-6 py-2.5 text-base font-bold rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center border transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
