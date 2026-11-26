'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Crown,
  Loader2,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import type { ClassMemberImportPreview } from '../server/classMemberImportService';

interface ImportClassMembersConfirmViewProps {
  preview: ClassMemberImportPreview;
  isExecuting: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

type DetailTab = 'DROPPED' | 'TRANSFERRED' | 'NEW' | 'RESTORED' | 'UNCHANGED';

function formatStatusLabel(status?: string): string {
  switch (status) {
    case 'DANG_HOC':
      return 'Đang học';
    case 'BAO_LUU':
      return 'Bảo lưu';
    case 'NGHI_HOC':
      return 'Thôi học';
    case 'CHUYEN_LOP':
      return 'Chuyển lớp';
    case 'LOAI_BO':
      return 'Loại khỏi lớp';
    default:
      return status || 'Không rõ';
  }
}

export default function ImportClassMembersConfirmView({
  preview,
  isExecuting,
  error,
  onBack,
  onConfirm,
}: ImportClassMembersConfirmViewProps) {
  const defaultTab = useMemo<DetailTab>(() => {
    if (preview.droppedOut.length > 0) return 'DROPPED';
    if (preview.transferred.length > 0) return 'TRANSFERRED';
    if (preview.newStudents.length > 0) return 'NEW';
    if (preview.restored.length > 0) return 'RESTORED';
    return 'UNCHANGED';
  }, [preview]);

  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);

  const delta = preview.expectedActiveCountAfter - preview.currentActiveCount;
  const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

  const tabs: Array<{
    key: DetailTab;
    label: string;
    count: number;
    activeClass: string;
    badgeClass: string;
  }> = [
    {
      key: 'DROPPED',
      label: 'Chuyển Thôi học',
      count: preview.droppedOut.length,
      activeClass: 'border-rose-600 text-rose-700 bg-rose-50/70',
      badgeClass: 'bg-rose-100 text-rose-700',
    },
    {
      key: 'TRANSFERRED',
      label: 'Chuyển từ lớp khác',
      count: preview.transferred.length,
      activeClass: 'border-amber-600 text-amber-800 bg-amber-50/70',
      badgeClass: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'NEW',
      label: 'Thêm mới',
      count: preview.newStudents.length,
      activeClass: 'border-emerald-600 text-emerald-700 bg-emerald-50/70',
      badgeClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      key: 'RESTORED',
      label: 'Khôi phục',
      count: preview.restored.length,
      activeClass: 'border-blue-600 text-blue-700 bg-blue-50/70',
      badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      key: 'UNCHANGED',
      label: 'Giữ nguyên',
      count: preview.unchanged.length,
      activeClass: 'border-slate-700 text-slate-800 bg-slate-100/80',
      badgeClass: 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
        {/* Confirmation Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-indigo-950">
              Xác Nhận Thay Đổi Trước Khi Import Lớp {preview.classCode}
            </h3>
            <p className="text-xs text-indigo-900/80 leading-relaxed">
              Vui lòng kiểm tra kỹ danh sách biến động bên dưới. Dữ liệu chỉ được cập nhật vào hệ thống sau khi bạn bấm{' '}
              <strong>Xác Nhận Thực Hiện Import</strong>.
            </p>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Sĩ số lớp
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-800">
                {preview.currentActiveCount} → {preview.expectedActiveCountAfter}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                ({deltaText})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-600">
              <UserMinus className="w-3.5 h-3.5" />
              Thôi học
            </div>
            <div className="mt-1 text-lg font-black text-rose-700">{preview.droppedOut.length}</div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-700">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Chuyển lớp sang
            </div>
            <div className="mt-1 text-lg font-black text-amber-800">{preview.transferred.length}</div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-700">
              <UserPlus className="w-3.5 h-3.5" />
              Mới / Khôi phục
            </div>
            <div className="mt-1 text-lg font-black text-emerald-700">
              {preview.newStudents.length + preview.restored.length}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              Giữ nguyên
            </div>
            <div className="mt-1 text-lg font-black text-slate-800">{preview.unchanged.length}</div>
          </div>
        </div>

        {/* Critical Warnings */}
        {preview.hasMonitorInDroppedOut && (
          <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 flex items-start gap-2.5">
            <Crown className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-xs">Cảnh báo: Lớp trưởng hiện tại nằm trong danh sách chuyển Thôi học!</p>
              <p className="text-[11px] mt-0.5 text-rose-800">
                Mã sinh viên lớp trưởng không có trong danh sách import. Hãy kiểm tra lại xem có thiếu dòng hay không trước khi xác nhận.
              </p>
            </div>
          </div>
        )}

        {preview.droppedOut.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Có <strong>{preview.droppedOut.length}</strong> sinh viên đang học trong lớp{' '}
              <strong>{preview.classCode}</strong> không xuất hiện trong danh sách import sẽ được chuyển sang trạng thái{' '}
              <strong className="text-rose-700">Thôi học (NGHI_HOC)</strong> (có thể khôi phục lại trong tab Biến Động nếu cần).
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
            {error}
          </div>
        )}

        {/* Categorized Detail Tabs */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.key
                    ? tab.activeClass
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${tab.badgeClass}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

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
        </div>
      </div>

      {/* Confirmation Footer */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          disabled={isExecuting}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay Lại Chỉnh Sửa
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isExecuting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang Thực Hiện Import...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Xác Nhận Thực Hiện Import ({preview.importedCount} SV)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
