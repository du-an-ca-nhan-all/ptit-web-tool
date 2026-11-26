'use client';

import React from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import type { ClassMemberImportPreview } from '../../server/classMemberImportService';
import type { DetailTab } from './types';
import { formatStatusLabel } from './utils';

interface ConfirmDetailTablesProps {
  preview: ClassMemberImportPreview;
  activeTab: DetailTab;
}

export default function ConfirmDetailTables({ preview, activeTab }: ConfirmDetailTablesProps) {
  return (
    <div className="max-h-72 overflow-y-auto">
      {activeTab === 'DROPPED' && (
        preview.droppedOut.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Không có sinh viên nào bị chuyển sang Thôi học.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2">Mã SV</th>
                <th className="px-3 py-2">Họ và Tên</th>
                <th className="px-3 py-2">Ngày sinh</th>
                <th className="px-3 py-2">Thay đổi trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.droppedOut.map((st, idx) => (
                <tr key={st.maSV} className="hover:bg-rose-50/40">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{st.maSV}</span>
                      {st.isMonitor && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Lớp trưởng
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{st.hoTen}</td>
                  <td className="px-3 py-2 text-slate-500">{st.ngaySinh || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                      <span className="text-emerald-700">Đang học</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Thôi học</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === 'TRANSFERRED' && (
        preview.transferred.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Không có sinh viên nào chuyển từ lớp khác sang.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2">Mã SV</th>
                <th className="px-3 py-2">Họ và Tên</th>
                <th className="px-3 py-2">Chuyển lớp</th>
                <th className="px-3 py-2">Trạng thái cũ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.transferred.map((st, idx) => (
                <tr key={st.maSV} className="hover:bg-amber-50/40">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-800">{st.maSV}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{st.hoTen}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{st.fromClass}</span>
                      <ArrowRight className="w-3 h-3 text-amber-600" />
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">{preview.classCode}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatStatusLabel(st.previousStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === 'NEW' && (
        preview.newStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Không có sinh viên mới hoàn toàn cần tạo trong hệ thống.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2">Mã SV</th>
                <th className="px-3 py-2">Họ và Tên</th>
                <th className="px-3 py-2">Giới tính</th>
                <th className="px-3 py-2">Ngày sinh</th>
                <th className="px-3 py-2">SĐT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.newStudents.map((st, idx) => (
                <tr key={st.maSV} className="hover:bg-emerald-50/40">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-800">{st.maSV}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{st.hoTen}</td>
                  <td className="px-3 py-2 text-slate-600">{st.gioiTinh}</td>
                  <td className="px-3 py-2 text-slate-500">{st.ngaySinh || '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{st.soDienThoai || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === 'RESTORED' && (
        preview.restored.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Không có sinh viên nào được khôi phục từ trạng thái bảo lưu / thôi học.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2">Mã SV</th>
                <th className="px-3 py-2">Họ và Tên</th>
                <th className="px-3 py-2">Khôi phục trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.restored.map((st, idx) => (
                <tr key={st.maSV} className="hover:bg-blue-50/40">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-800">{st.maSV}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{st.hoTen}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                      <span className="text-slate-500">{formatStatusLabel(st.previousStatus)}</span>
                      <ArrowRight className="w-3 h-3 text-blue-500" />
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Đang học
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === 'UNCHANGED' && (
        preview.unchanged.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            Không có sinh viên nào giữ nguyên trong lớp.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-10">STT</th>
                <th className="px-3 py-2">Mã SV</th>
                <th className="px-3 py-2">Họ và Tên</th>
                <th className="px-3 py-2">Giới tính</th>
                <th className="px-3 py-2">Ngày sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.unchanged.map((st, idx) => (
                <tr key={st.maSV} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{st.maSV}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{st.hoTen}</td>
                  <td className="px-3 py-2 text-slate-600">{st.gioiTinh}</td>
                  <td className="px-3 py-2 text-slate-500">{st.ngaySinh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
