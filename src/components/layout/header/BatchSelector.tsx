'use client';

import React from 'react';
import { Layers, Power } from 'lucide-react';
import { ExamBatchItem } from '../../../types';

interface BatchSelectorProps {
  hasActiveBatch: boolean;
  activeBatch: ExamBatchItem | null;
  examBatches: ExamBatchItem[];
  onBatchChange: (batchCode: string) => void;
}

export function BatchSelector({
  hasActiveBatch,
  activeBatch,
  examBatches,
  onBatchChange,
}: BatchSelectorProps) {
  if (hasActiveBatch) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-xs">
        <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <select
          value={activeBatch?.code || 'ALL'}
          onChange={(e) => onBatchChange(e.target.value)}
          className="bg-transparent font-bold text-indigo-950 focus:outline-none cursor-pointer py-0.5 pr-1 max-w-[220px] truncate"
        >
          <option value="ALL">🌐 Tất cả đợt thi</option>
          {examBatches.map((b) => (
            <option key={b.code} value={b.code}>
              {b.isActive ? '🟢' : '⚪'} {b.name} {b.isActive ? '(Đang mở)' : '(Đã tắt)'}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold text-amber-800 shadow-xs">
      <Power className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <span>Đợt Thi Tạm Đóng</span>
    </div>
  );
}
