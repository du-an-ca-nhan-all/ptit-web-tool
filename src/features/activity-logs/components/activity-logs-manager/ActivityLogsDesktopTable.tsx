import React from 'react';
import { Clock, Eye, Info } from 'lucide-react';
import { ACTION_CONFIGS } from './actionConfigs';
import { ActivityLogItem } from './types';
import { formatDateTime } from './utils';

interface ActivityLogsDesktopTableProps {
  logs: ActivityLogItem[];
  onSelectLog: (log: ActivityLogItem) => void;
}

export function ActivityLogsDesktopTable({ logs, onSelectLog }: ActivityLogsDesktopTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
          <tr>
            <th className="py-3.5 px-4">Thời Gian</th>
            <th className="py-3.5 px-4">Hành Động</th>
            <th className="py-3.5 px-4">Người Thực Hiện</th>
            <th className="py-3.5 px-4">Đối Tượng</th>
            <th className="py-3.5 px-4 min-w-[300px]">Mô Tả Chi Tiết</th>
            <th className="py-3.5 px-4 text-center">IP / Thiết Bị</th>
            <th className="py-3.5 px-4 text-right">Chi Tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
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
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Time */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </td>

                {/* Action Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${actConfig.bg} ${actConfig.text} ${actConfig.border}`}
                  >
                    <ActIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{actConfig.label}</span>
                  </span>
                </td>

                {/* User */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.username || 'sys'}`}
                        alt={log.username || 'System'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 font-mono text-xs">
                        {log.username || 'Hệ Thống'}
                      </span>
                      {log.userRole && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {log.userRole.includes('admin')
                            ? '👑 Admin'
                            : log.userRole.includes('lop_truong')
                            ? '🛡️ Lớp Trưởng'
                            : '🎓 Sinh Viên'}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Target */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {log.targetId ? (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg font-mono font-bold text-[11px]">
                      {log.targetId}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">-</span>
                  )}
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 text-slate-800 text-xs leading-relaxed">
                  {log.description}
                </td>

                {/* IP / User Agent */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span
                    className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                    title={log.userAgent || 'Không rõ trình duyệt'}
                  >
                    {log.ipAddress || 'Internal'}
                  </span>
                </td>

                {/* Metadata Action */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectLog(log)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border border-indigo-200/60"
                    title="Xem chi tiết toàn bộ dữ liệu hoạt động"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi Tiết</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
