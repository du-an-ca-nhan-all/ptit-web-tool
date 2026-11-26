import React from 'react';
import { AlarmClock } from 'lucide-react';

interface BackupScheduleSectionProps {
  telAutoBackupEnabled: boolean;
  setTelAutoBackupEnabled: (value: boolean) => void;
  telScheduleTime: string;
  setTelScheduleTime: (value: string) => void;
  telSendSql: boolean;
  setTelSendSql: (value: boolean) => void;
}

export default function BackupScheduleSection({
  telAutoBackupEnabled,
  setTelAutoBackupEnabled,
  telScheduleTime,
  setTelScheduleTime,
  telSendSql,
  setTelSendSql,
}: BackupScheduleSectionProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlarmClock className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Lịch Tự Động Sao Lưu Định Kỳ</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={telAutoBackupEnabled}
              onChange={(e) => setTelAutoBackupEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span>Bật sao lưu tự động</span>
          </label>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500">Giờ:</span>
            <input
              type="time"
              value={telScheduleTime}
              onChange={(e) => setTelScheduleTime(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 font-mono outline-none cursor-pointer"
            />
            <span className="text-[10px] text-indigo-600 font-bold">(VN)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200/60 text-xs font-medium text-slate-700">
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          File đính kèm:
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={telSendSql}
            onChange={(e) => setTelSendSql(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
          />
          <span>Tự động đính kèm file SQL Dump chuẩn PostgreSQL (.sql)</span>
        </label>
      </div>
    </div>
  );
}
