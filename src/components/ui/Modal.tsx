'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  hideCloseButton?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-[95vw] md:max-w-[90vw] h-[90vh]',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'lg',
  closeOnEsc = true,
  closeOnOutsideClick = true,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  headerClassName = '',
  hideCloseButton = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${maxWidthMap[maxWidth]} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] ${className}`}
      >
        {/* Modal Header */}
        {(title || icon || !hideCloseButton) && (
          <div
            className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70 ${headerClassName}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {icon && <div className="shrink-0">{icon}</div>}
              <div className="min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
