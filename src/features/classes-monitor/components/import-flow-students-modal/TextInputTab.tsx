'use client';

import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { TextExamplePreset } from './types';

interface TextInputTabProps {
  rawText: string;
  selectedExampleIndex: number | null;
  textExamples: TextExamplePreset[];
  onRawTextChange: (value: string) => void;
  onClearText: () => void;
  onApplyExample: (exampleIndex: number) => void;
}

export function TextInputTab({
  rawText,
  selectedExampleIndex,
  textExamples,
  onRawTextChange,
  onClearText,
  onApplyExample,
}: TextInputTabProps) {
  return (
    <div className="space-y-4">
      {/* Presets Quick Insert Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Chèn Nhanh Dữ Liệu Mẫu (Nhấp để thử ngay):
          </span>
          {rawText && (
            <button
              type="button"
              onClick={onClearText}
              className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Xóa nội dung
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {textExamples.map((ex, idx) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onApplyExample(idx)}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedExampleIndex === idx
                  ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-2 ring-amber-400/40'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span className="font-bold text-slate-800 text-[11px] block">{ex.title}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-1">{ex.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <textarea
          rows={6}
          value={rawText}
          onChange={(e) => onRawTextChange(e.target.value)}
          placeholder="Dán danh sách mã sinh viên vào đây (mỗi dòng 1 mã sinh viên hoặc phân cách bằng dấu phẩy)...&#10;Ví dụ:&#10;B21DCCN001&#10;B21DCCN002&#10;B21DCCN003"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-y leading-relaxed shadow-inner"
        />
      </div>
    </div>
  );
}
