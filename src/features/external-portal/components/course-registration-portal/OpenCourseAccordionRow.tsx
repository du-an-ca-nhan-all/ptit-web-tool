'use client';

import React from 'react';
import { Check, Plus, Flame, Lock } from 'lucide-react';
import { MonitorFlowConfigInfo } from '../../hooks/useCourseRegistration';
import { CourseRegistrationHookResult, CourseRegistrationSubTab } from './types';
import { sanitizeHtml } from '@/src/lib/htmlSanitizer';

interface OpenCourseAccordionRowProps {
  group: any;
  isRegistered: boolean;
  registeredGroup?: string;
  registeringIds: Record<string, boolean>;
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  handleRegister: CourseRegistrationHookResult['handleRegister'];
  addSniperTarget: CourseRegistrationHookResult['addSniperTarget'];
  setConfirmCancelGroup: (group: any | null) => void;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function OpenCourseAccordionRow({
  group,
  isRegistered,
  registeredGroup,
  registeringIds,
  monitorFlowConfig,
  handleRegister,
  addSniperTarget,
  setConfirmCancelGroup,
  setActiveSubTab,
}: OpenCourseAccordionRowProps) {
  const isThisGroupRegistered = isRegistered && group.nhom_to === registeredGroup;
  const isRegistering = registeringIds[group.id_to_hoc];
  const isAvailable = group.enable && group.sl_cl > 0;
  const percentFull =
    group.sl_cp > 0 ? Math.min(100, Math.round((group.sl_dk / group.sl_cp) * 100)) : 0;

  return (
    <tr
      className={`hover:bg-indigo-50/30 transition-colors ${
        isThisGroupRegistered ? 'bg-emerald-50/50' : ''
      }`}
    >
      {/* Nhóm tổ */}
      <td className="px-4 py-3.5 text-center">
        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-xs">
          {group.nhom_to}
        </span>
      </td>

      {/* Lớp */}
      <td className="px-4 py-3.5 font-mono text-slate-600 text-xs">
        {group.lop || '—'}
      </td>

      {/* Sĩ số & slot */}
      <td className="px-4 py-3.5 text-center min-w-[120px]">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <span className={group.sl_cl > 0 ? 'text-emerald-700' : 'text-rose-600'}>
              Còn {group.sl_cl}
            </span>
            <span className="text-slate-400">/ {group.sl_cp}</span>
            <span className="text-slate-500 text-[10px]">({group.sl_dk} đã ĐK)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentFull >= 100
                  ? 'bg-rose-500'
                  : percentFull > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentFull}%` }}
            />
          </div>
        </div>
      </td>

      {/* TKB */}
      <td className="px-4 py-3.5 max-w-xs">
        {group.tkb ? (
          <div
            className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(group.tkb) }}
          />
        ) : (
          <span className="text-slate-400 italic text-[11px]">Chưa xếp lịch</span>
        )}
      </td>

      {/* Học phí */}
      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
        {Number(group.phai_dong || group.hoc_phi_tam_tinh || 0).toLocaleString('vi-VN')} đ
      </td>

      {/* Trạng thái */}
      <td className="px-4 py-3.5 text-center">
        {isThisGroupRegistered ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3" /> Đã Đăng Ký
          </span>
        ) : group.enable ? (
          group.sl_cl > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Có thể ĐK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Hết chỗ
            </span>
          )
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
            title={group.gc_enable}
          >
            {group.gc_enable || 'Khóa'}
          </span>
        )}
      </td>

      {/* Thao tác */}
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {isThisGroupRegistered ? (
            <button
              onClick={() => setConfirmCancelGroup(group)}
              disabled={monitorFlowConfig?.isEnabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                monitorFlowConfig?.isEnabled
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer'
              }`}
              title={
                monitorFlowConfig?.isEnabled
                  ? 'Tính năng hủy môn tạm khóa do đang bật Flow theo Lớp trưởng'
                  : 'Hủy đăng ký môn học này'
              }
            >
              {monitorFlowConfig?.isEnabled ? 'Đã ĐK (Flow LT)' : 'Hủy Môn'}
            </button>
          ) : monitorFlowConfig?.isEnabled ? (
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-xs"
              title="Tài khoản đang bật Flow theo Lớp trưởng - Đăng ký do Lớp trưởng điều phối"
            >
              <Lock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Khóa bởi Flow LT</span>
            </span>
          ) : (
            <>
              <button
                onClick={() => handleRegister(group.id_to_hoc)}
                disabled={!isAvailable || isRegistering}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isAvailable
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isRegistering ? (
                  <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                <span>Đăng Ký</span>
              </button>

              {/* Nút thêm vào Auto Sniper */}
              <button
                onClick={() => {
                  addSniperTarget({
                    maMon: group.ma_mon,
                    tenMon: group.ten_mon,
                    idToHoc: group.id_to_hoc,
                    nhomTo: group.nhom_to,
                    autoAnyGroup: false,
                  });
                  setActiveSubTab('SNIPER_BOT');
                }}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 cursor-pointer"
                title="Thêm tổ này vào Auto Canh Slot (Sniper)"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
