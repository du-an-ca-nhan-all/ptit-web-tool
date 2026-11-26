import React from 'react';
import { Check } from 'lucide-react';

interface RoomClassCount {
  className: string;
  count: number;
}

interface ClassSelectorSectionProps {
  roomClasses: RoomClassCount[];
  selectedClass: string;
  onSelectClass: (className: string) => void;
}

export function ClassSelectorSection({
  roomClasses,
  selectedClass,
  onSelectClass,
}: ClassSelectorSectionProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        Lớp Phụ Trách Chuẩn Bị Nước / Hỗ Trợ <span className="text-rose-500">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {roomClasses.map((c) => {
          const isSelected = c.className === selectedClass;
          return (
            <button
              key={c.className}
              type="button"
              onClick={() => onSelectClass(c.className)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
              }`}
            >
              <div>
                <div className="text-sm">{c.className}</div>
                <div className="text-xs text-slate-500 font-normal">{c.count} SV trong phòng</div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
