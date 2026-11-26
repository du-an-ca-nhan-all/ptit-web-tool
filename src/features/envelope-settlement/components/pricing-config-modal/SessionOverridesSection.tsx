import React from 'react';
import { Trash2, Tag } from 'lucide-react';
import { formatCurrency } from '../../../../config/pricingConfig';

interface SessionOverridesSectionProps {
  overrideEntries: [string, number][];
  onRemoveOverride: (key: string) => void;
  onClearAllOverrides: () => void;
}

export function SessionOverridesSection({
  overrideEntries,
  onRemoveOverride,
  onClearAllOverrides,
}: SessionOverridesSectionProps) {
  if (overrideEntries.length === 0) return null;

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          Các phòng có mức giá tùy chỉnh riêng ({overrideEntries.length})
        </div>
        <button
          type="button"
          onClick={onClearAllOverrides}
          className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
        >
          Xóa tất cả tùy chỉnh
        </button>
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
        {overrideEntries.map(([key, price]) => (
          <div
            key={key}
            className="bg-white px-3 py-2 rounded-xl border border-amber-200 text-xs flex items-center justify-between shadow-2xs"
          >
            <div className="min-w-0 pr-2">
              <div className="font-mono text-slate-700 font-bold truncate text-[11px]">{key}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-bold text-amber-700">{formatCurrency(price)}</span>
              <button
                type="button"
                onClick={() => onRemoveOverride(key)}
                title="Xóa mức giá này và dùng theo giá mặc định"
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
