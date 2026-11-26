import React from 'react';
import { formatCurrency } from '../../../../config/pricingConfig';

type AccentTheme = 'blue' | 'purple';

const ACCENT_STYLES: Record<
  AccentTheme,
  {
    badge: string;
    focusRing: string;
    activePreset: string;
  }
> = {
  blue: {
    badge: 'text-blue-700 bg-blue-100/70 border-blue-200',
    focusRing: 'focus:ring-blue-500',
    activePreset: 'bg-blue-600 text-white shadow-xs',
  },
  purple: {
    badge: 'text-purple-700 bg-purple-100/70 border-purple-200',
    focusRing: 'focus:ring-purple-500',
    activePreset: 'bg-purple-600 text-white shadow-xs',
  },
};

interface PricingRoomFieldProps {
  icon: React.ReactNode;
  label: string;
  accent: AccentTheme;
  inputValue: string;
  numericValue: number;
  placeholder: string;
  presets: number[];
  onChange: (value: string) => void;
}

export function PricingRoomField({
  icon,
  label,
  accent,
  inputValue,
  numericValue,
  placeholder,
  presets,
  onChange,
}: PricingRoomFieldProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          {icon}
          {label}
        </label>
        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${styles.badge}`}>
          {formatCurrency(numericValue)}
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${styles.focusRing} bg-white font-mono`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-slate-500 mr-1">Mức nhanh:</span>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(String(preset))}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              numericValue === preset
                ? styles.activePreset
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {formatCurrency(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
