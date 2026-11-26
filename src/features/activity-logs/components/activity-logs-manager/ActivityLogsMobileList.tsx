import React from 'react';
import { Clock, Eye, Info } from 'lucide-react';
import { ACTION_CONFIGS } from './actionConfigs';
import { ActivityLogItem } from './types';
import { formatDateTime } from './utils';

interface ActivityLogsMobileListProps {
  logs: ActivityLogItem[];
  onSelectLog: (log: ActivityLogItem) => void;
}

export function ActivityLogsMobileList({ logs, onSelectLog }: ActivityLogsMobileListProps) {
  return (
    <div className="block md:hidden divide-y divide-slate-100 p-2.5 sm:p-4 space-y-2.5">
      {logs.map((log) => {
        const actConfig = ACTION_CONFIGS[log.action] || {
          label: log.action,
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: Info,
        };
        const ActIcon = actConfig.icon;

        return (
          <div
            key={log.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs space-y-2.5 hover:border-indigo-200 transition-all"
          >
            {/* Header: Action badge and Time */}
            <div className="flex items-start justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${actConfig.bg} ${actConfig.text} ${actConfig.border}`}
              >
                <ActIcon className="w-3 h-3 shrink-0" />
                <span>{actConfig.label}</span>
              </span>

              <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
            </div>

            {/* User & Target info */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.username || 'sys'}`}
                    alt={log.username || 'System'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 font-mono text-xs truncate block">
                    {log.username || 'Hệ Thống'}
                  </span>
                </div>
                {log.userRole && (
                  <span className="text-[10px] text-slate-500 font-medium shrink-0">
                    {log.userRole.includes('admin')
                      ? '👑 Admin'
                      : log.userRole.includes('lop_truong')
                      ? '🛡️ LT'
                      : '🎓 SV'}
                  </span>
                )}
              </div>

              {log.targetId && (
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    {log.targetId}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {log.description}
            </p>

            {/* Card Footer: IP / Device & Detail Button */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
              <span
                className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-[150px]"
                title={log.userAgent || ''}
              >
                {log.ipAddress || 'Internal'}
              </span>

              <button
                type="button"
                onClick={() => onSelectLog(log)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs border border-indigo-200/60"
              >
                <Eye className="w-3 h-3" />
                <span>Chi Tiết</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
