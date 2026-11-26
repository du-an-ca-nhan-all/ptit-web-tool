import React from 'react';
import { Users, Search, X } from 'lucide-react';
import { ExamRecord } from '../../../../types';
import { DebtDetail } from './types';

interface SettlementDetailStudentListProps {
  studentListRef: React.RefObject<HTMLDivElement | null>;
  selectedDetail: DebtDetail;
  currentRoomRecords: ExamRecord[];
  filteredStudentRecords: ExamRecord[];
  excludedCountForModal: number;
  studentClassFilter: string;
  onSelectClassFilter: (cls: string) => void;
  studentSearchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isStudentExcluded: (sessionId: string, r: ExamRecord) => boolean;
  onToggleStudentExclusion: (session: any, r: ExamRecord) => void;
  onClearSessionExclusions: (session: any) => void;
}

export function SettlementDetailStudentList({
  studentListRef,
  selectedDetail,
  currentRoomRecords,
  filteredStudentRecords,
  excludedCountForModal,
  studentClassFilter,
  onSelectClassFilter,
  studentSearchQuery,
  onSearchQueryChange,
  isStudentExcluded,
  onToggleStudentExclusion,
  onClearSessionExclusions,
}: SettlementDetailStudentListProps) {
  return (
    <div ref={studentListRef} className="border border-slate-200 rounded-xl bg-slate-50/50 p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Users className="w-5 h-5 text-blue-600 shrink-0" />
          <h4 className="font-bold text-slate-800 text-sm">
            Danh Sách Sinh Viên Dự Thi
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({filteredStudentRecords.length} / {currentRoomRecords.length} SV)
            </span>
          </h4>
          {excludedCountForModal > 0 && (
            <>
              <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">
                {excludedCountForModal} bị loại khỏi chia tiền
              </span>
              <button
                onClick={() => onClearSessionExclusions(selectedDetail.session)}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline underline-offset-2 cursor-pointer"
              >
                Đặt lại tất cả
              </button>
            </>
          )}
        </div>

        {/* Search box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc MSSV..."
            value={studentSearchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          />
          {studentSearchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Class Filter Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Lớp:</span>
        <button
          onClick={() => onSelectClassFilter('ALL')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${
            studentClassFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
          }`}
        >
          Tất cả ({currentRoomRecords.length})
        </button>
        {selectedDetail.session.classCounts.map((c: any) => (
          <button
            key={c.className}
            onClick={() => onSelectClassFilter(c.className)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors border ${
              studentClassFilter === c.className
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
            }`}
          >
            {c.className} ({c.count})
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto bg-white shadow-inner">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-3 py-2 font-semibold w-10">STT</th>
              <th className="px-3 py-2 font-semibold">Mã SV</th>
              <th className="px-3 py-2 font-semibold">Họ và Tên</th>
              <th className="px-3 py-2 font-semibold">Phái</th>
              <th className="px-3 py-2 font-semibold">Lớp</th>
              <th className="px-3 py-2 font-semibold">Tổ/Nhóm thi</th>
              <th className="px-3 py-2 font-semibold text-center">Phân bổ chia tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudentRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">
                  Không tìm thấy sinh viên phù hợp.
                </td>
              </tr>
            ) : (
              filteredStudentRecords.map((r, idx) => {
                const excluded = isStudentExcluded(selectedDetail.session.id, r);
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${excluded ? 'bg-amber-50/60 opacity-60' : 'hover:bg-blue-50/50'}`}
                  >
                    <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-700">
                      {r.MaSV}
                      {excluded && <span className="ml-1 text-[9px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded font-bold uppercase">Hoãn thi</span>}
                    </td>
                    <td className={`px-3 py-2 font-semibold ${excluded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {r.HoLotSV} {r.TenSV}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{r.PHAI || '—'}</td>
                    <td className="px-3 py-2 font-bold text-blue-700">{r.MaLop}</td>
                    <td className="px-3 py-2 text-slate-500">{r['To thi'] || r.NhomThi || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => onToggleStudentExclusion(selectedDetail.session, r)}
                        title={excluded ? 'Thêm lại vào chia tiền (Dự thi)' : 'Loại khỏi chia tiền (hoãn thi, không thi...)'}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          excluded
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 shadow-xs'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                        }`}
                      >
                        {excluded ? '↩ Thêm lại' : '✕ Hoãn / Bỏ ra'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
