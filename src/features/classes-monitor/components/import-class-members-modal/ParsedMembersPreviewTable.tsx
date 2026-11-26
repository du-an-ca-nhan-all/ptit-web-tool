'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { ImportClassMemberRow } from '../../utils/classMemberImportParser';

interface ParsedMembersPreviewTableProps {
  parsedItems: ImportClassMemberRow[];
  duplicateCount: number;
  skippedCount: number;
  onRemoveItem: (maSV: string) => void;
}

export default function ParsedMembersPreviewTable({
  parsedItems,
  duplicateCount,
  skippedCount,
  onRemoveItem,
}: ParsedMembersPreviewTableProps) {
  if (parsedItems.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-slate-800">
            Đã đọc được {parsedItems.length} sinh viên
          </span>
          {duplicateCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px]">
              Bỏ qua {duplicateCount} dòng trùng Mã SV
            </span>
          )}
          {skippedCount > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
              Bỏ qua {skippedCount} dòng không hợp lệ
            </span>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
            <tr>
              <th className="px-3 py-2 text-center w-10">STT</th>
              <th className="px-3 py-2">Mã SV</th>
              <th className="px-3 py-2">Họ và Tên</th>
              <th className="px-3 py-2">Giới tính</th>
              <th className="px-3 py-2">Ngày sinh</th>
              <th className="px-3 py-2">SĐT</th>
              <th className="px-3 py-2 text-center w-10">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parsedItems.map((item, idx) => (
              <tr key={item.maSV} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                <td className="px-3 py-2 font-mono font-bold text-blue-700">{item.maSV}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">
                  {item.hoTen || <span className="text-slate-400 italic">Theo dữ liệu hệ thống</span>}
                </td>
                <td className="px-3 py-2 text-slate-600">{item.gioiTinh || '—'}</td>
                <td className="px-3 py-2 text-slate-500">{item.ngaySinh || '—'}</td>
                <td className="px-3 py-2 text-slate-500">{item.soDienThoai || '—'}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.maSV)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Xóa khỏi danh sách import"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
