'use client';

import React from 'react';
import { Clock, RefreshCw, Check, X } from 'lucide-react';
import { getFlowActionDefinition } from '../../types/flow.types';
import { FlowQueueJobItem } from './types';

interface FlowQueueMobileCardsProps {
  items: FlowQueueJobItem[];
}

export function FlowQueueMobileCards({ items }: FlowQueueMobileCardsProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100">
      {items.map((item, idx) => {
        const actionDef = getFlowActionDefinition(item.flowAction);
        return (
          <div key={item.id} className="p-3.5 space-y-2 hover:bg-slate-50/70 transition-colors">
            {/* Top: Index + Student + Status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px] shrink-0">
                  {item.followerUsername}
                </span>
                <strong className="text-slate-800 text-xs truncate">{item.followerName || item.followerUsername}</strong>
              </div>
              <div className="shrink-0">
                {item.status === 'RUNNING' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Chạy
                  </span>
                ) : item.status === 'QUEUED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-2.5 h-2.5" /> Chờ
                  </span>
                ) : item.status === 'SUCCESS' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-2.5 h-2.5" /> OK
                  </span>
                ) : item.status === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                    <X className="w-2.5 h-2.5" /> Lỗi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    Hủy
                  </span>
                )}
              </div>
            </div>

            {/* Bottom: Action + Course + Time */}
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${actionDef.badgeStyle.bg} ${actionDef.badgeStyle.text} border ${actionDef.badgeStyle.border}`}
                >
                  {actionDef.name}
                </span>
                {item.flowAction.includes('SYNC') ? (
                  <span className="text-emerald-700 font-bold truncate">Tất cả môn LT</span>
                ) : (
                  <span className="text-slate-700 font-bold truncate">
                    {item.ten_mon || item.ma_mon || 'Môn'}
                    {item.nhom_to && <span className="text-amber-700 ml-1">(Nhóm {item.nhom_to})</span>}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                {item.finishedAt
                  ? new Date(item.finishedAt).toLocaleTimeString('vi-VN')
                  : new Date(item.createdAt).toLocaleTimeString('vi-VN')}
              </span>
            </div>

            {/* Result Message */}
            {item.resultMessage && (
              <p className="text-[10px] text-slate-500 truncate bg-slate-50 rounded-lg px-2 py-1 border border-slate-100" title={item.resultMessage}>
                {item.resultMessage}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
