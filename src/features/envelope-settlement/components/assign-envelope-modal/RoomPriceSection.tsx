import React from 'react';
import { DollarSign, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../../config/pricingConfig';
import { PRESET_PRICES } from './constants';

interface RoomPriceSectionProps {
  defaultPrice: number;
  currentPriceVal: number;
  isCustomPrice: boolean;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectPresetPrice: (amount: number) => void;
  onResetDefaultPrice: () => void;
}

export function RoomPriceSection({
  defaultPrice,
  currentPriceVal,
  isCustomPrice,
  onPriceChange,
  onSelectPresetPrice,
  onResetDefaultPrice,
}: RoomPriceSectionProps) {
  return (
    <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          <span>Định Mức Nước Uống / Kinh Phí Phòng</span>
        </label>
        {isCustomPrice ? (
          <button
            type="button"
            onClick={onResetDefaultPrice}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục chuẩn ({formatCurrency(defaultPrice)})</span>
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
            Chuẩn: {formatCurrency(defaultPrice)}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={currentPriceVal > 0 ? currentPriceVal.toLocaleString('vi-VN') : ''}
          onChange={onPriceChange}
          placeholder="Nhập số tiền VNĐ..."
          className="w-full pl-3 pr-12 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-800 outline-none focus:border-amber-500 shadow-2xs"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
          VNĐ
        </span>
      </div>

      {/* Quick presets */}
      <div className="flex items-center gap-1 flex-wrap pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">Chọn nhanh:</span>
        {PRESET_PRICES.map((amt) => {
          const isSelected = currentPriceVal === amt;
          return (
            <button
              key={amt}
              type="button"
              onClick={() => onSelectPresetPrice(amt)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-600 bg-amber-100 text-amber-900 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}k`}
            </button>
          );
        })}
      </div>

      {isCustomPrice && (
        <p className="text-[11px] text-amber-800 font-medium">
          ⚠️ Định mức sẽ được lưu tùy chỉnh là <strong>{formatCurrency(currentPriceVal)}</strong> (khác mức chuẩn {formatCurrency(defaultPrice)}).
        </p>
      )}
    </div>
  );
}
