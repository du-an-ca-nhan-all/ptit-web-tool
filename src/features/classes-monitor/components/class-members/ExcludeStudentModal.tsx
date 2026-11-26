import React from 'react';
import { X, UserMinus, ArrowRightLeft, PauseCircle, XCircle, Check } from 'lucide-react';
import { ExcludeType } from './types';

interface ExcludeStudentModalProps {
  studentToExclude: any | null;
  selectedClass: string;
  classes: string[];
  excludeType: ExcludeType;
  onExcludeTypeChange: (type: ExcludeType) => void;
  excludeTargetClass: string;
  onExcludeTargetClassChange: (cls: string) => void;
  excludeReason: string;
  onExcludeReasonChange: (reason: string) => void;
  isProcessingAction: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ExcludeStudentModal({
  studentToExclude,
  selectedClass,
  classes,
  excludeType,
  onExcludeTypeChange,
  excludeTargetClass,
  onExcludeTargetClassChange,
  excludeReason,
  onExcludeReasonChange,
  isProcessingAction,
  onClose,
  onSubmit,
}: ExcludeStudentModalProps) {
  if (!studentToExclude) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Điều Chuyển / Biến Động Sĩ Số</h3>
              <p className="text-xs text-slate-500">
                Cập nhật trạng thái bảo lưu, nghỉ học hoặc chuyển lớp cho sinh viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {/* Student Info Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Sinh viên:</span>
              <span className="font-bold text-slate-800 text-sm">
                {studentToExclude.HoLotSV} {studentToExclude.TenSV}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 block">
                {studentToExclude.MaSV}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Lớp {selectedClass}</span>
            </div>
          </div>

          {/* Action Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Hình thức biến động / Lý do điều chuyển *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                  excludeType === 'BAO_LUU'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="excludeType"
                  value="BAO_LUU"
                  checked={excludeType === 'BAO_LUU'}
                  onChange={() => onExcludeTypeChange('BAO_LUU')}
                  className="hidden"
                />
                <PauseCircle className={`w-4 h-4 ${excludeType === 'BAO_LUU' ? 'text-amber-600' : 'text-slate-400'}`} />
                Bảo lưu kết quả
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                  excludeType === 'CHUYEN_LOP'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="excludeType"
                  value="CHUYEN_LOP"
                  checked={excludeType === 'CHUYEN_LOP'}
                  onChange={() => onExcludeTypeChange('CHUYEN_LOP')}
                  className="hidden"
                />
                <ArrowRightLeft
                  className={`w-4 h-4 ${excludeType === 'CHUYEN_LOP' ? 'text-blue-600' : 'text-slate-400'}`}
                />
                Chuyển sang lớp khác
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                  excludeType === 'NGHI_HOC'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="excludeType"
                  value="NGHI_HOC"
                  checked={excludeType === 'NGHI_HOC'}
                  onChange={() => onExcludeTypeChange('NGHI_HOC')}
                  className="hidden"
                />
                <XCircle className={`w-4 h-4 ${excludeType === 'NGHI_HOC' ? 'text-rose-600' : 'text-slate-400'}`} />
                Nghỉ học / Thôi học
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-all ${
                  excludeType === 'LOAI_BO'
                    ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="excludeType"
                  value="LOAI_BO"
                  checked={excludeType === 'LOAI_BO'}
                  onChange={() => onExcludeTypeChange('LOAI_BO')}
                  className="hidden"
                />
                <UserMinus className={`w-4 h-4 ${excludeType === 'LOAI_BO' ? 'text-slate-700' : 'text-slate-400'}`} />
                Loại khỏi lớp quản lý
              </label>
            </div>
          </div>

          {/* Target Class Selector (if CHUYEN_LOP) */}
          {excludeType === 'CHUYEN_LOP' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Chọn lớp chuyển đến *
              </label>
              <select
                required
                value={excludeTargetClass}
                onChange={(e) => onExcludeTargetClassChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="">-- Chọn lớp tiếp nhận --</option>
                {classes
                  .filter((c) => c !== selectedClass)
                  .map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Reason / Decision text */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Lý do / Số quyết định (tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Quyết định bảo lưu HK2 2025-2026..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              value={excludeReason}
              onChange={(e) => onExcludeReasonChange(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isProcessingAction || (excludeType === 'CHUYEN_LOP' && !excludeTargetClass)}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-rose-200 flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessingAction ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Xác Nhận Cập Nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
