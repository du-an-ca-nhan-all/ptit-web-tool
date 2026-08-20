'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ExamRecord, SortKey, SortDirection } from '../types/exam.types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type { SortKey, SortDirection };

interface DataTableProps {
  records: ExamRecord[];
  totalRecords?: number;
  currentPage?: number;
  totalPages?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  onSortChange: (config: { key: SortKey; direction: SortDirection } | null) => void;
  onStudentClick: (maSV: string) => void;
  onClassClick: (maLop: string) => void;
  onRowClick?: (record: ExamRecord) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  canEditPostpone?: boolean;
  isLoading?: boolean;
}

export default function DataTable({
  records,
  totalRecords: propTotalRecords,
  currentPage: propCurrentPage,
  totalPages: propTotalPages,
  itemsPerPage: propItemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  sortConfig,
  onSortChange,
  onStudentClick,
  onClassClick,
  onRowClick,
  onTogglePostpone,
  canEditPostpone = false,
  isLoading = false,
}: DataTableProps) {
  const isServerPaginated = Boolean(onPageChange);

  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const localItemsPerPage = propItemsPerPage || 25;

  // Reset page to 1 when records change in local mode
  useEffect(() => {
    if (!isServerPaginated) {
      setLocalCurrentPage(1);
    }
  }, [records, isServerPaginated]);

  const sortedRecords = useMemo(() => {
    if (isServerPaginated) {
      return records;
    }

    let sortableItems = [...records];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'MaSV':
            aValue = a.MaSV || '';
            bValue = b.MaSV || '';
            break;
          case 'Name':
            aValue = `${a.TenSV || ''} ${a.HoLotSV || ''}`.toLowerCase();
            bValue = `${b.TenSV || ''} ${b.HoLotSV || ''}`.toLowerCase();
            break;
          case 'MaLop':
            aValue = a.MaLop || '';
            bValue = b.MaLop || '';
            break;
          case 'MaMH':
            aValue = a.TenMH || '';
            bValue = b.TenMH || '';
            break;
          case 'DateTime':
            const parseDateTime = (dateStr: string, timeStr: string) => {
              if (!dateStr) return 0;

              const parts = dateStr.split(/[\/\-]/);
              let d = 1,
                m = 1,
                y = 1970;

              if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10);
                const p1 = parseInt(parts[1], 10);
                const p2 = parseInt(parts[2], 10);
                y = p2;

                if (p1 > 12) {
                  m = p0;
                  d = p1;
                } else if (p0 > 12) {
                  d = p0;
                  m = p1;
                } else {
                  m = p0;
                  d = p1;
                }
              }

              let hour = 0,
                min = 0;
              if (timeStr) {
                const timeParts = timeStr
                  .toLowerCase()
                  .replace('g', ':')
                  .replace('h', ':')
                  .split(':');
                hour = parseInt(timeParts[0], 10) || 0;
                min = parseInt(timeParts[1], 10) || 0;
              }
              return new Date(y, m - 1, d, hour, min).getTime();
            };
            aValue = parseDateTime(a.NgayThi, a.GioThi);
            bValue = parseDateTime(b.NgayThi, b.GioThi);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [records, sortConfig, isServerPaginated]);

  const activeCurrentPage = isServerPaginated
    ? propCurrentPage || 1
    : localCurrentPage;
  const activeItemsPerPage = propItemsPerPage || (isServerPaginated ? 25 : 20);
  const totalCount = isServerPaginated
    ? propTotalRecords ?? records.length
    : records.length;
  const calculatedTotalPages = Math.max(
    1,
    propTotalPages ?? Math.ceil(totalCount / activeItemsPerPage)
  );

  const startIndex = isServerPaginated
    ? (activeCurrentPage - 1) * activeItemsPerPage
    : (localCurrentPage - 1) * localItemsPerPage;

  const currentRecords = isServerPaginated
    ? sortedRecords
    : sortedRecords.slice(startIndex, startIndex + localItemsPerPage);

  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, calculatedTotalPages));
    if (isServerPaginated && onPageChange) {
      onPageChange(targetPage);
    } else {
      setLocalCurrentPage(targetPage);
    }
  };

  const getHTColor = (ht: string) => {
    switch (ht?.toUpperCase()) {
      case 'TH':
        return 'bg-green-100 text-green-700';
      case 'BCTL':
        return 'bg-purple-100 text-purple-700';
      case 'TL':
        return 'bg-orange-100 text-orange-700';
      case 'TT':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSortChange({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1 text-blue-500" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />
    );
  };

  if (isLoading && records.length === 0) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-sm flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Đang tải danh sách lịch thi...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700 bg-white/95 px-3 py-1 rounded-full shadow-xs border border-slate-200">
            Đang tải dữ liệu...
          </span>
        </div>
      )}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                STT
              </th>
              <th
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('MaSV')}
              >
                <div className="flex items-center">
                  Mã SV <SortIcon columnKey="MaSV" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('Name')}
              >
                <div className="flex items-center">
                  Họ Tên <SortIcon columnKey="Name" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('MaLop')}
              >
                <div className="flex items-center">
                  Lớp <SortIcon columnKey="MaLop" />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('MaMH')}
              >
                <div className="flex items-center">
                  Môn Thi <SortIcon columnKey="MaMH" />
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Phòng
              </th>
              <th
                className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                onClick={() => handleSort('DateTime')}
              >
                <div className="flex items-center">
                  Ngày Thi <SortIcon columnKey="DateTime" />
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Giờ
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
                HT
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
                Trạng thái thi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRecords.map((record, index) => (
              <tr
                key={record.id || `${record.MaSV}-${record.MaMH}-${startIndex + index}`}
                className={`transition-colors ${
                  record.isPostponed
                    ? 'bg-amber-50/40 text-slate-600'
                    : index % 2 === 1
                    ? 'bg-slate-50/30'
                    : ''
                } ${onRowClick ? 'cursor-pointer hover:bg-slate-100' : 'hover:bg-slate-50'}`}
                onClick={() => onRowClick && onRowClick(record)}
              >
                <td className="px-6 py-4 text-sm text-slate-500">{startIndex + index + 1}</td>
                <td
                  className="px-6 py-4 text-sm font-mono text-blue-600 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStudentClick(record.MaSV);
                  }}
                >
                  {record.MaSV}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={record.isPostponed ? 'line-through text-slate-500' : ''}>
                      {record.HoLotSV} {record.TenSV}
                    </span>
                    {record.isPostponed && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.5 rounded uppercase">
                        Hoãn thi
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="px-6 py-4 text-sm text-slate-600 cursor-pointer hover:underline text-blue-600 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClassClick(record.MaLop);
                  }}
                >
                  {record.MaLop}
                </td>
                <td
                  className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate"
                  title={record.TenMH}
                >
                  {record.TenMH}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{record.MAPTHI}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{record.NgayThi}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{record.GioThi}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${getHTColor(
                      record.MaHTThi
                    )}`}
                  >
                    {record.MaHTThi || 'Thi'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {onTogglePostpone && canEditPostpone ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePostpone(record, !record.isPostponed);
                      }}
                      title={
                        record.isPostponed
                          ? 'Bấm để chuyển về Dự thi (sẽ tính tiền)'
                          : 'Bấm để đánh dấu Hoãn thi / Không thi (không tính chia tiền)'
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        record.isPostponed
                          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                      }`}
                    >
                      {record.isPostponed ? '✕ Hoãn thi' : '✓ Dự thi'}
                    </button>
                  ) : (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                        record.isPostponed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {record.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị {startIndex + 1} đến {Math.min(startIndex + activeItemsPerPage, totalCount)} trên{' '}
            <strong className="text-slate-700 font-bold">{totalCount}</strong> bản ghi
          </span>
          {onItemsPerPageChange && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>(Xem:</span>
              <select
                value={activeItemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>/ trang)</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 items-center">
          <button
            onClick={() => goToPage(1)}
            disabled={activeCurrentPage === 1}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            Đầu
          </button>
          <button
            onClick={() => goToPage(activeCurrentPage - 1)}
            disabled={activeCurrentPage === 1}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            Trước
          </button>
          <span className="px-2 sm:px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded shadow-xs">
            {activeCurrentPage} / {calculatedTotalPages}
          </span>
          <button
            onClick={() => goToPage(activeCurrentPage + 1)}
            disabled={activeCurrentPage === calculatedTotalPages}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            Sau
          </button>
          <button
            onClick={() => goToPage(calculatedTotalPages)}
            disabled={activeCurrentPage === calculatedTotalPages}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-xs text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            Cuối
          </button>
        </div>
      </div>
    </div>
  );
}
