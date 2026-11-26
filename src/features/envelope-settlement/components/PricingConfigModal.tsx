import React from 'react';
import { Settings, X, RotateCcw, Check, DollarSign, Info, Tag } from 'lucide-react';
import { PricingConfigModalProps } from './pricing-config-modal/types';
import { PRESETS_COMMON, PRESETS_ENGLISH } from './pricing-config-modal/constants';
import { usePricingConfigModal } from './pricing-config-modal/usePricingConfigModal';
import { PricingRoomField } from './pricing-config-modal/PricingRoomField';
import { SessionOverridesSection } from './pricing-config-modal/SessionOverridesSection';

export default function PricingConfigModal({ isOpen, onClose, isAdmin }: PricingConfigModalProps) {
  const {
    effectiveIsAdmin,
    commonRoomInput,
    setCommonRoomInput,
    englishOralRoomInput,
    setEnglishOralRoomInput,
    savedMsg,
    overrideEntries,
    commonRoomNum,
    englishOralRoomNum,
    handleSave,
    handleResetToDefault,
    handleRemoveOverride,
    handleClearAllOverrides,
  } = usePricingConfigModal({ isOpen, onClose, isAdmin });

  if (!isOpen || !effectiveIsAdmin) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md ring-1 ring-white/20">
              <Settings className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cấu Hình Định Mức Kinh Phí Phòng</h3>
              <p className="text-xs text-blue-100/80">Tùy chỉnh định mức nước uống & hỗ trợ dùng trong phân công & quyết toán</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {savedMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              Mặc định hệ thống sử dụng định mức nước uống & hỗ trợ: <b>600.000 ₫</b> cho phòng thi thông thường và <b>2.000.000 ₫</b> cho môn Tiếng Anh thi Vấn đáp. Bạn có thể thay đổi các định mức này bên dưới.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Phòng thi thường */}
            <PricingRoomField
              icon={<DollarSign className="w-4 h-4 text-blue-600" />}
              label="Định Mức Nước Uống Phòng Thông Thường"
              accent="blue"
              inputValue={commonRoomInput}
              numericValue={commonRoomNum}
              placeholder="600000"
              presets={PRESETS_COMMON}
              onChange={setCommonRoomInput}
            />

            {/* 2. Phòng Tiếng Anh vấn đáp */}
            <PricingRoomField
              icon={<Tag className="w-4 h-4 text-purple-600" />}
              label="Định Mức Nước Uống Tiếng Anh Vấn Đáp (Oral)"
              accent="purple"
              inputValue={englishOralRoomInput}
              numericValue={englishOralRoomNum}
              placeholder="2000000"
              presets={PRESETS_ENGLISH}
              onChange={setEnglishOralRoomInput}
            />

            {/* 3. Danh sách phòng ghi đè riêng (nếu có) */}
            <SessionOverridesSection
              overrideEntries={overrideEntries}
              onRemoveOverride={handleRemoveOverride}
              onClearAllOverrides={handleClearAllOverrides}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
