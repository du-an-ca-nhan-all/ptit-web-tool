import React from 'react';
import { DollarSign, CheckCircle2, Users, Settings } from 'lucide-react';
import { AvailableClasses, SettlementScope } from './types';

interface SettlementHeaderProps {
  effectiveIsAdmin: boolean;
  onOpenPricingModal: () => void;
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  availableClasses: AvailableClasses;
  getMonitorName: (cls: string) => string;
  settlementScope: SettlementScope;
  onSelectScope: (scope: SettlementScope) => void;
  totalClaimedRoomsAll: number;
  totalSessionsCount: number;
}

export function SettlementHeader({
  effectiveIsAdmin,
  onOpenPricingModal,
  selectedClass,
  onSelectClass,
  availableClasses,
  getMonitorName,
  settlementScope,
  onSelectScope,
  totalClaimedRoomsAll,
  totalSessionsCount,
}: SettlementHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Sổ Quỹ Bù Trừ Cá Nhân
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Xem chi tiết bù trừ kinh phí nước uống & hỗ trợ của lớp bạn với các lớp khác.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {effectiveIsAdmin && (
            <button
              type="button"
              onClick={onOpenPricingModal}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Tùy chỉnh định mức kinh phí phòng thi"
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Cấu hình kinh phí phòng</span>
            </button>
          )}

          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <span className="text-sm font-semibold text-slate-600 pl-2">Lớp của bạn:</span>
            <select
              value={selectedClass}
              onChange={(e) => onSelectClass(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
            >
              {availableClasses.monClasses.length > 0 && (
                <optgroup label="Lớp có Lớp Trưởng">
                  {availableClasses.monClasses.map((c) => (
                    <option key={c} value={c}>
                      {c} (LT: {getMonitorName(c)})
                    </option>
                  ))}
                </optgroup>
              )}
              {availableClasses.otherClasses.length > 0 && (
                <optgroup label="Lớp chưa có Lớp Trưởng">
                  {availableClasses.otherClasses.map((c) => (
                    <option key={c} value={c}>
                      {c} (Chưa có LT)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Scope Filter Bar & Explanation */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ sở tính toán:</span>
          <button
            type="button"
            onClick={() => onSelectScope('CLAIMED_ONLY')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              settlementScope === 'CLAIMED_ONLY'
                ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chỉ tính phòng đã có lớp nhận ({totalClaimedRoomsAll} phòng)</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectScope('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              settlementScope === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs shadow-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tính tất cả (bao gồm gợi ý: {totalSessionsCount} phòng)</span>
          </button>
        </div>

        <div className="text-xs text-slate-600 font-medium flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
          {settlementScope === 'CLAIMED_ONLY' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Chính thức: Chỉ tính tiền khi phòng thi đã có Lớp trưởng nhận.</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>Tạm tính: Tự động phân bổ theo gợi ý phân công cả các phòng chưa ai nhận.</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}
