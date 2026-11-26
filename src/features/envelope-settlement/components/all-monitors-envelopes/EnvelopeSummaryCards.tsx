import React from 'react';
import { MapPin, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../../config/pricingConfig';

interface EnvelopeSummaryCardsProps {
  isFilterActive: boolean;
  displayedCount: number;
  totalEnhancedCount: number;
  totalExpectedMoney: number;
  claimedCountInDisplayed: number;
}

export default function EnvelopeSummaryCards({
  isFilterActive,
  displayedCount,
  totalEnhancedCount,
  totalExpectedMoney,
  claimedCountInDisplayed,
}: EnvelopeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
            {isFilterActive ? 'Phòng lọc được' : 'Tổng phòng thi'}
          </p>
          <p className="text-base sm:text-2xl font-extrabold text-slate-800 mt-0.5 leading-none">
            {displayedCount}{' '}
            <span className="text-xs sm:text-sm font-medium text-slate-400">/ {totalEnhancedCount}</span>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/70 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-amber-700 font-bold uppercase tracking-wider truncate">
            Tổng kinh phí nước & hỗ trợ
          </p>
          <p className="text-xs sm:text-xl font-extrabold text-amber-950 mt-0.5 leading-none truncate">
            {formatCurrency(totalExpectedMoney)}
          </p>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-2xs">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
            Tiến độ nhận phụ trách
          </p>
          <p className="text-base sm:text-2xl font-extrabold text-emerald-700 mt-0.5 leading-none">
            {claimedCountInDisplayed}{' '}
            <span className="text-xs sm:text-sm font-medium text-slate-400">
              / {displayedCount} ({displayedCount > 0 ? Math.round((claimedCountInDisplayed / displayedCount) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
