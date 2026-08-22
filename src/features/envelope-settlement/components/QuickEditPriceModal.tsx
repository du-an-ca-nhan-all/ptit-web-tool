import React, { useState, useEffect } from 'react';
import { X, DollarSign, RotateCcw, Check, Tag, Sparkles } from 'lucide-react';
import { formatCurrency, getDefaultRoomPrice } from '../../../config/pricingConfig';

interface QuickEditPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any | null;
  onSave: (sessionId: string, newPrice: number | null) => Promise<void>;
  isLoading?: boolean;
}

const PRESET_PRICES = [
  500000,
  600000,
  700000,
  800000,
  1000000,
  1200000,
  1500000,
  2000000,
];

export default function QuickEditPriceModal({
  isOpen,
  onClose,
  session,
  onSave,
  isLoading = false,
}: QuickEditPriceModalProps) {
  const [priceInput, setPriceInput] = useState<string>('600000');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const defaultPrice = React.useMemo(() => {
    if (!session) return 600000;
    return getDefaultRoomPrice(
      session.subject || '',
      session.subjectCode || '',
      session.room || '',
      session.examFormat || ''
    );
  }, [session]);

  useEffect(() => {
    if (!isOpen || !session) return;

    const currentPrice = session.customPrice ?? session.price ?? defaultPrice;
    const hasCustom = session.customPrice !== undefined && session.customPrice !== null && session.customPrice !== defaultPrice;

    setIsCustom(hasCustom);
    setPriceInput(String(currentPrice || defaultPrice));
  }, [isOpen, session, defaultPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPriceInput(raw);
    const num = parseInt(raw, 10);
    setIsCustom(!isNaN(num) && num !== defaultPrice);
  };

  const handleSelectPreset = (amount: number) => {
    setPriceInput(String(amount));
    setIsCustom(amount !== defaultPrice);
  };

  const handleResetDefault = () => {
    setPriceInput(String(defaultPrice));
    setIsCustom(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const num = parseInt(priceInput.replace(/\D/g, ''), 10);
    if (isNaN(num) || num < 0) return;

    // If matches default, pass null to remove override
    const priceToSave = isCustom && num !== defaultPrice ? num : null;
    await onSave(session.id, priceToSave);
    onClose();
  };

  if (!isOpen || !session) return null;

  const currentVal = parseInt(priceInput.replace(/\D/g, ''), 10) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Chỉnh Sửa Định Mức Kinh Phí Phòng
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phòng <strong className="text-rose-600 font-bold">{session.room}</strong> • {session.date} ({session.time})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {/* Subject badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Môn thi</span>
            <span className="font-bold text-slate-800 text-sm leading-snug">{session.subject}</span>
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500">Định mức mặc định:</span>
              <span className="font-bold text-slate-700">{formatCurrency(defaultPrice)}</span>
            </div>
          </div>

          {/* Price input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Định Mức Nước Uống / Kinh Phí Cho Phòng Này (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentVal > 0 ? currentVal.toLocaleString('vi-VN') : ''}
                onChange={handleInputChange}
                placeholder="Nhập số tiền VNĐ..."
                className="w-full pl-3.5 pr-14 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-base text-slate-800 outline-none focus:border-amber-500 shadow-2xs"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-600">Chọn nhanh mức giá:</span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mặc định ({formatCurrency(defaultPrice)})</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_PRICES.map((amt) => {
                const isSelected = currentVal === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}k`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status message */}
          {isCustom ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Phòng này sẽ áp dụng <strong>giá tùy chỉnh ({formatCurrency(currentVal)})</strong> thay vì giá mặc định ({formatCurrency(defaultPrice)}).
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Áp dụng <strong>mức giá chuẩn ({formatCurrency(defaultPrice)})</strong>.</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || currentVal <= 0}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Đang lưu...' : 'Lưu Mức Giá'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
