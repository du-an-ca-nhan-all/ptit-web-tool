import React, { useState, useEffect } from 'react';
import {
  PricingConfig,
  DEFAULT_PRICING_CONFIG,
  getPricingConfig,
  savePricingConfig,
  resetPricingConfig,
  getSessionPriceOverrides,
  removeSessionPriceOverride,
  clearAllSessionPriceOverrides,
  fetchPricingFromBackend,
  formatCurrency,
} from '../../../config/pricingConfig';
import { Settings, X, RotateCcw, Check, DollarSign, Info, Trash2, Tag, Database, ShieldAlert } from 'lucide-react';

interface PricingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function PricingConfigModal({ isOpen, onClose, isAdmin }: PricingConfigModalProps) {
  const [commonRoomInput, setCommonRoomInput] = useState<string>('600000');
  const [englishOralRoomInput, setEnglishOralRoomInput] = useState<string>('2000000');
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, number>>({});
  const [savedMsg, setSavedMsg] = useState<string>('');

  const effectiveIsAdmin = React.useMemo(() => {
    if (typeof isAdmin === 'boolean') return isAdmin;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      if (!saved) return false;
      const u = JSON.parse(saved);
      return Boolean(u?.isAdmin || u?.role === 'admin' || u?.activeRole === 'admin');
    } catch {
      return false;
    }
  }, [isAdmin]);

  const loadCurrentSettings = () => {
    const cfg = getPricingConfig();
    setCommonRoomInput(String(cfg.commonRoom));
    setEnglishOralRoomInput(String(cfg.englishOralRoom));
    setSessionOverrides(getSessionPriceOverrides());
  };

  useEffect(() => {
    if (isOpen && effectiveIsAdmin) {
      loadCurrentSettings();
      setSavedMsg('');
      fetchPricingFromBackend().then(() => {
        loadCurrentSettings();
      }).catch(() => {});
    }
  }, [isOpen, effectiveIsAdmin]);

  if (!isOpen || !effectiveIsAdmin) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const commonVal = parseInt(commonRoomInput.replace(/\D/g, ''), 10);
    const oralVal = parseInt(englishOralRoomInput.replace(/\D/g, ''), 10);

    const saved = savePricingConfig({
      commonRoom: !isNaN(commonVal) && commonVal >= 0 ? commonVal : DEFAULT_PRICING_CONFIG.commonRoom,
      englishOralRoom: !isNaN(oralVal) && oralVal >= 0 ? oralVal : DEFAULT_PRICING_CONFIG.englishOralRoom,
    });

    setCommonRoomInput(String(saved.commonRoom));
    setEnglishOralRoomInput(String(saved.englishOralRoom));
    setSavedMsg('Đã lưu cấu hình định mức kinh phí phòng thành công!');
    setTimeout(() => {
      setSavedMsg('');
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục định mức kinh phí phòng về mặc định (600.000đ cho phòng thường & 2.000.000đ cho tiếng Anh vấn đáp)?')) {
      const reset = resetPricingConfig();
      setCommonRoomInput(String(reset.commonRoom));
      setEnglishOralRoomInput(String(reset.englishOralRoom));
      setSavedMsg('Đã khôi phục cài đặt định mức về mặc định!');
      setTimeout(() => setSavedMsg(''), 2500);
    }
  };

  const handleRemoveOverride = (key: string) => {
    removeSessionPriceOverride(key);
    setSessionOverrides(getSessionPriceOverrides());
  };

  const handleClearAllOverrides = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ định mức tùy chỉnh của từng phòng thi riêng lẻ và dùng theo định mức mặc định?')) {
      clearAllSessionPriceOverrides();
      setSessionOverrides({});
    }
  };

  const overrideEntries = Object.entries(sessionOverrides);
  const commonRoomNum = parseInt(commonRoomInput.replace(/\D/g, ''), 10) || 0;
  const englishOralRoomNum = parseInt(englishOralRoomInput.replace(/\D/g, ''), 10) || 0;

  const presetsCommon = [500000, 600000, 700000, 800000];
  const presetsEnglish = [1500000, 2000000, 2500000, 3000000];

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
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Định Mức Nước Uống Phòng Thông Thường
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {formatCurrency(commonRoomNum)}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={commonRoomInput}
                  onChange={(e) => setCommonRoomInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="600000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500 mr-1">Mức nhanh:</span>
                {presetsCommon.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCommonRoomInput(String(preset))}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      commonRoomNum === preset
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Phòng Tiếng Anh vấn đáp */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-purple-600" />
                  Định Mức Nước Uống Tiếng Anh Vấn Đáp (Oral)
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded-lg border border-purple-200">
                  {formatCurrency(englishOralRoomNum)}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={englishOralRoomInput}
                  onChange={(e) => setEnglishOralRoomInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="2000000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">VNĐ</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-slate-500 mr-1">Mức nhanh:</span>
                {presetsEnglish.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEnglishOralRoomInput(String(preset))}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      englishOralRoomNum === preset
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Danh sách phòng ghi đè riêng (nếu có) */}
            {overrideEntries.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Các phòng có mức giá tùy chỉnh riêng ({overrideEntries.length})
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllOverrides}
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
                          onClick={() => handleRemoveOverride(key)}
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
            )}
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
