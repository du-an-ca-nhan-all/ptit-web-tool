import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_PRICING_CONFIG,
  getPricingConfig,
  savePricingConfig,
  resetPricingConfig,
  getSessionPriceOverrides,
  removeSessionPriceOverride,
  clearAllSessionPriceOverrides,
  fetchPricingFromBackend,
} from '../../../../config/pricingConfig';
import { PricingConfigModalProps } from './types';

export function usePricingConfigModal({ isOpen, onClose, isAdmin }: PricingConfigModalProps) {
  const [commonRoomInput, setCommonRoomInput] = useState<string>('600000');
  const [englishOralRoomInput, setEnglishOralRoomInput] = useState<string>('2000000');
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, number>>({});
  const [savedMsg, setSavedMsg] = useState<string>('');

  const effectiveIsAdmin = useMemo(() => {
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
      }).catch((err) => console.warn("[usePricingConfigModal] Non-fatal async error:", err));
    }
  }, [isOpen, effectiveIsAdmin]);

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

  return {
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
  };
}
