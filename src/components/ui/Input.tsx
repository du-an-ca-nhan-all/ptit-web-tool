'use client';

import React, { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      className = '',
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-bold text-slate-700 select-none">{label}</label>}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            value={value}
            disabled={disabled}
            className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon || (clearable && value) ? 'pr-10' : ''} ${
              error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200'
            } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''} ${className}`}
            {...props}
          />

          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {!clearable && rightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearchChange?: (val: string) => void;
}

export function SearchInput({ value, onChange, onSearchChange, onClear, placeholder = 'Tìm kiếm...', ...props }: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <Input
      leftIcon={<Search className="w-4 h-4" />}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      clearable
      onClear={() => {
        if (onClear) onClear();
        if (onSearchChange) onSearchChange('');
      }}
      {...props}
    />
  );
}
