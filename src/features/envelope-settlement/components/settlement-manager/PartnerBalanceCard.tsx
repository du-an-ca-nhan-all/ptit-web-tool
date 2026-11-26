import React from 'react';
import { ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight, CheckCircle2, User } from 'lucide-react';
import { formatCurrency } from '../../../../config/pricingConfig';
import { DebtDetail, PartnerBalance } from './types';

interface PartnerBalanceCardProps {
  partner: PartnerBalance;
  type: 'receive' | 'pay' | 'settled';
  isExpanded: boolean;
  onToggleExpand: (partnerClass: string) => void;
  onSelectDetail: (detail: DebtDetail) => void;
}

export function PartnerBalanceCard({
  partner: p,
  type,
  isExpanded,
  onToggleExpand,
  onSelectDetail,
}: PartnerBalanceCardProps) {
  const displayAmount = Math.abs(p.netBalance);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => onToggleExpand(p.partnerClass)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 \${
              type === 'receive' ? 'bg-emerald-100 text-emerald-600' : 
              type === 'pay' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
            <User className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-lg">{p.partnerClass}</span>
            <span className="text-sm text-slate-500 font-medium">LT: {p.partnerMonitor}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {type === 'receive' ? 'Họ nợ mình' : type === 'pay' ? 'Mình nợ họ' : 'Đã cấn trừ hết'}
            </span>
            <span className={`text-lg font-bold px-3 py-1 rounded-lg border \${
                type === 'receive' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 
                type === 'pay' ? 'text-rose-700 bg-rose-50 border-rose-200' : 
                'text-slate-700 bg-slate-50 border-slate-200'
              }`}>
              {formatCurrency(displayAmount)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col gap-6">
          {p.detailsOweUs.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2 bg-emerald-100/50 px-3 py-2 rounded-lg border border-emerald-100 inline-flex">
                <ArrowDownLeft className="w-4 h-4" />
                Các phòng họ nợ mình ({p.detailsOweUs.length} phòng)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Phòng & Môn</th>
                      <th className="px-4 py-2 font-semibold text-center">Tiền Phòng</th>
                      <th className="px-4 py-2 font-semibold text-center">Số SV họ có</th>
                      <th className="px-4 py-2 font-semibold text-center">Số tiền/SV</th>
                      <th className="px-4 py-2 font-semibold text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {p.detailsOweUs.map((d, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => onSelectDetail(d)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-700">{d.session.room}</span>
                            {d.session.isClaimedManual ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Đã nhận
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Gợi ý
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">{d.session.subject}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-medium">{formatCurrency(d.totalRoomPrice)}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.studentsCount}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{formatCurrency(d.pricePerStudent)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {p.detailsWeOwe.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2 bg-rose-100/50 px-3 py-2 rounded-lg border border-rose-100 inline-flex">
                <ArrowUpRight className="w-4 h-4" />
                Các phòng mình nợ họ ({p.detailsWeOwe.length} phòng)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-slate-100 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Phòng & Môn</th>
                      <th className="px-4 py-2 font-semibold text-center">Tiền Phòng</th>
                      <th className="px-4 py-2 font-semibold text-center">Số SV mình có</th>
                      <th className="px-4 py-2 font-semibold text-center">Số tiền/SV</th>
                      <th className="px-4 py-2 font-semibold text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {p.detailsWeOwe.map((d, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => onSelectDetail(d)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-700">{d.session.room}</span>
                            {d.session.isClaimedManual ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Đã nhận
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Gợi ý
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">{d.session.subject}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 font-medium">{formatCurrency(d.totalRoomPrice)}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600">{d.studentsCount}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{formatCurrency(d.pricePerStudent)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
