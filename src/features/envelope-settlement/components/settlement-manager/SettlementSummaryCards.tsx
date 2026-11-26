import React from 'react';
import { DollarSign, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../../../config/pricingConfig';
import { SettlementData } from './types';

interface SettlementSummaryCardsProps {
  data: SettlementData;
}

export function SettlementSummaryCards({ data }: SettlementSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng phải thu</p>
          <p className="text-base sm:text-lg md:text-xl font-extrabold text-emerald-700 mt-0.5 whitespace-nowrap">
            {formatCurrency(data.totalReceive)}
          </p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-5 h-5 text-rose-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng phải trả</p>
          <p className="text-base sm:text-lg md:text-xl font-extrabold text-rose-700 mt-0.5 whitespace-nowrap">
            {formatCurrency(data.totalPay)}
          </p>
        </div>
      </div>
      <div className={`border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3 sm:gap-3.5 shadow-2xs ${data.netTotal >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${data.netTotal >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
          <DollarSign className={`w-5 h-5 ${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${data.netTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {data.netTotal >= 0 ? 'Thực nhận sau cùng' : 'Thực chi sau cùng'}
          </p>
          <p className={`text-base sm:text-lg md:text-xl font-extrabold mt-0.5 whitespace-nowrap ${data.netTotal >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
            {formatCurrency(Math.abs(data.netTotal))}
          </p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Số phòng liên quan</p>
          <p className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 mt-0.5 whitespace-nowrap">
            {data.involvedRoomsCount} <span className="text-xs font-medium text-slate-400">phòng</span>
          </p>
        </div>
      </div>
    </div>
  );
}
