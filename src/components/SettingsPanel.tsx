import React, { useMemo } from 'react';
import { ExamRecord } from '../types';
import { Settings } from 'lucide-react';

interface SettingsPanelProps {
  records: ExamRecord[];
  defaultClass: string;
  onDefaultClassChange: (cls: string) => void;
}

export default function SettingsPanel({ records, defaultClass, onDefaultClassChange }: SettingsPanelProps) {
  const classes = useMemo(() => {
    const cls = new Set(records.map((r) => r.MaLop).filter(Boolean));
    return Array.from(cls).sort();
  }, [records]);

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-hidden h-full">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">Cài Đặt Hệ Thống</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Quản Lý Lớp</h3>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Lớp Mặc Định</label>
          <p className="text-xs text-slate-500 mb-4">
            Lớp này sẽ được tự động chọn khi bạn truy cập vào các công cụ quản lý lớp (Danh sách thành viên, Công cụ lớp trưởng, Phân công phong bì).
          </p>
          <select
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-1/2 bg-slate-50"
            value={defaultClass}
            onChange={(e) => onDefaultClassChange(e.target.value)}
          >
            <option value="">-- Không chọn mặc định --</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
