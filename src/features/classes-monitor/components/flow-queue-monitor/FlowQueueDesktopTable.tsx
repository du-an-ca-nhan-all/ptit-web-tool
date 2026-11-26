'use client';

import React from 'react';
import { Clock, RefreshCw, Check, X } from 'lucide-react';
import { getFlowActionDefinition } from '../../types/flow.types';
import { FlowQueueJobItem } from './types';

interface FlowQueueDesktopTableProps {
  items: FlowQueueJobItem[];
}

export function FlowQueueDesktopTable({ items }: FlowQueueDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-3.5 py-3 text-center w-12">STT</th>
            <th className="px-3.5 py-3">Thành Viên Nhận Flow</th>
            <th className="px-3.5 py-3 text-center">Hành Động</th>
            <th className="px-3.5 py-3">Môn Học / Nhóm Tổ</th>
            <th className="px-3.5 py-3 text-center">Trạng Thái</th>
            <th className="px-3.5 py-3">Chi Tiết Phản Hồi / Lỗi</th>
            <th className="px-3.5 py-3 text-right">Thời Gian</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>

              {/* Follower */}
              <td className="px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px]">
                    {item.followerUsername}
                  </span>
                  <strong className="text-slate-800">{item.followerName || item.followerUsername}</strong>
                </div>
              </td>

              {/* Action */}
              <td className="px-3.5 py-3 text-center">
                {(() => {
                  const actionDef = getFlowActionDefinition(item.flowAction);
                  return (
                    <div className="space-y-0.5">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${actionDef.badgeStyle.bg} ${actionDef.badgeStyle.text} border ${actionDef.badgeStyle.border}`}
                        title={actionDef.description}
                      >
                        {actionDef.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block">
                        {actionDef.categoryName}
                      </span>
                    </div>
                  );
                })()}
              </td>

              {/* Course */}
              <td className="px-3.5 py-3">
                {item.flowAction.includes('SYNC') ? (
                  <span className="text-emerald-700 font-bold text-[11px]">Tất cả môn của Lớp trưởng</span>
                ) : (
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">{item.ten_mon || item.ma_mon || item.id_to_hoc}</span>
                    {item.nhom_to && (
                      <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-1 rounded">
                        Nhóm {item.nhom_to}
                      </span>
                    )}
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="px-3.5 py-3 text-center">
                {item.status === 'RUNNING' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Đang chạy
                  </span>
                ) : item.status === 'QUEUED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3" /> Đang chờ
                  </span>
                ) : item.status === 'SUCCESS' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3 h-3" /> Thành công
                  </span>
                ) : item.status === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                    <X className="w-3 h-3" /> Thất bại
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    Đã hủy
                  </span>
                )}
              </td>

              {/* Message */}
              <td className="px-3.5 py-3 max-w-xs">
                {item.resultMessage ? (
                  <p className="text-[11px] text-slate-600 truncate" title={item.resultMessage}>
                    {item.resultMessage}
                  </p>
                ) : item.status === 'RUNNING' ? (
                  <span className="text-indigo-600 text-[11px] italic">Đang kết nối cổng trường...</span>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">Đang chờ lượt xử lý</span>
                )}
              </td>

              {/* Timing */}
              <td className="px-3.5 py-3 text-right font-mono text-[10px] text-slate-400">
                {item.finishedAt
                  ? new Date(item.finishedAt).toLocaleTimeString('vi-VN')
                  : new Date(item.createdAt).toLocaleTimeString('vi-VN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
