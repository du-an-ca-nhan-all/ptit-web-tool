import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DeleteLogsMode } from './types';

interface DeleteActivityLogsModePanelProps {
  deleteMode: DeleteLogsMode;
  totalLogs: number;
  deleteCount: number;
  onChangeDeleteCount: (count: number) => void;
  customCountInput: string;
  onChangeCustomCountInput: (val: string) => void;
  deleteDays: number;
  onChangeDeleteDays: (days: number) => void;
  confirmAllText: string;
  onChangeConfirmAllText: (text: string) => void;
}

export function DeleteActivityLogsModePanel({
  deleteMode,
  totalLogs,
  deleteCount,
  onChangeDeleteCount,
  customCountInput,
  onChangeCustomCountInput,
  deleteDays,
  onChangeDeleteDays,
  confirmAllText,
  onChangeConfirmAllText,
}: DeleteActivityLogsModePanelProps) {
  if (deleteMode === 'COUNT') {
    return (
      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Số lượng bản ghi cũ cần xoá:</span>
          <span className="text-[11px] text-slate-500">
            Hiện có: <b>{totalLogs}</b> bản ghi
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[50, 100, 200, 500, 1000, 5000].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                onChangeDeleteCount(num);
                onChangeCustomCountInput('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deleteCount === num && !customCountInput
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 active:bg-slate-200'
              }`}
            >
              {num.toLocaleString('vi-VN')}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-200/80">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            Hoặc nhập số lượng tùy chọn N:
          </label>
          <input
            type="number"
            min="1"
            max={totalLogs || 999999}
            value={customCountInput}
            onChange={(e) => {
              onChangeCustomCountInput(e.target.value);
              if (e.target.value) {
                onChangeDeleteCount(parseInt(e.target.value, 10) || 0);
              }
            }}
            placeholder={`Nhập số bản ghi cần xoá (ví dụ: ${deleteCount})...`}
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
          💡 Hệ thống sẽ tự động quét và xoá đi <strong>{customCountInput ? parseInt(customCountInput, 10) || 0 : deleteCount}</strong> bản ghi được tạo sớm nhất, giữ lại toàn bộ bản ghi mới nhất.
        </p>
      </div>
    );
  }

  if (deleteMode === 'DAYS') {
    return (
      <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-800">
          Xoá các bản ghi được ghi nhận trước:
        </span>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {[
            { days: 7, label: '7 ngày trước (1 tuần)' },
            { days: 14, label: '14 ngày trước (2 tuần)' },
            { days: 30, label: '30 ngày trước (1 tháng)' },
            { days: 60, label: '60 ngày trước (2 tháng)' },
            { days: 90, label: '90 ngày trước (3 tháng)' },
          ].map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => onChangeDeleteDays(item.days)}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deleteDays === item.days
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 active:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] sm:text-[11px] text-slate-500 italic">
          💡 Toàn bộ các nhật ký hoạt động có thời điểm tạo trước <strong>{deleteDays} ngày</strong> sẽ được dọn dẹp khỏi cơ sở dữ liệu.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 p-3.5 sm:p-4 rounded-2xl border border-rose-300 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>CẢNH BÁO NGUY HIỂM: XOÁ TOÀN BỘ NHẬT KÝ</span>
      </div>

      <p className="text-[10px] sm:text-[11px] text-rose-900 leading-relaxed">
        Hành động này sẽ xoá <strong>toàn bộ {totalLogs.toLocaleString('vi-VN')} bản ghi</strong> nhật ký hoạt động trong hệ thống và không thể khôi phục.
      </p>

      <div className="pt-2 border-t border-rose-200">
        <label className="block text-[10px] sm:text-[11px] font-bold text-rose-800 mb-1">
          Nhập chữ <code className="font-mono text-rose-900 bg-rose-200 px-1 py-0.5 rounded">XÓA TẤT CẢ</code> để xác nhận:
        </label>
        <input
          type="text"
          value={confirmAllText}
          onChange={(e) => onChangeConfirmAllText(e.target.value)}
          placeholder="Gõ XÓA TẤT CẢ..."
          className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>
    </div>
  );
}
