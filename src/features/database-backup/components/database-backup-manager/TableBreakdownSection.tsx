import React from 'react';
import { Layers } from 'lucide-react';
import { DatabaseStats } from './types';

interface TableBreakdownSectionProps {
  stats: DatabaseStats | null;
}

export function TableBreakdownSection({ stats }: TableBreakdownSectionProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="font-bold text-white text-base">
              Chi Tiết {stats?.tableBreakdown?.length ? `${stats.tableBreakdown.length} Bảng` : 'Toàn Bộ Bảng'} Dữ Liệu Trong Database
            </h2>
            <p className="text-xs text-slate-400">
              Thống kê số lượng bản ghi thực tế được bao gồm trong mỗi lần xuất/sao lưu & phục hồi
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Tên Model / Bảng</th>
              <th className="py-3 px-4 font-semibold">Mô Tả & Ý Nghĩa Dữ Liệu</th>
              <th className="py-3 px-4 font-semibold text-right">Số Lượng Bản Ghi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {stats?.tableBreakdown?.map((tbl) => (
              <tr key={tbl.name} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                  {tbl.name}
                  {tbl.label && tbl.label !== tbl.name && (
                    <div className="text-[11px] font-sans font-normal text-slate-400 mt-0.5">{tbl.label}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-400 leading-relaxed">{tbl.description}</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {tbl.count.toLocaleString('vi-VN')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
