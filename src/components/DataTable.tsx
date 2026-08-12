import React, { useState, useMemo, useEffect } from 'react';
import { ExamRecord } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortKey = 'MaSV' | 'Name' | 'MaLop' | 'MaMH' | 'DateTime' | null;
export type SortDirection = 'asc' | 'desc';

interface DataTableProps {
  records: ExamRecord[];
  sortConfig: { key: SortKey; direction: SortDirection } | null;
  onSortChange: (config: { key: SortKey; direction: SortDirection } | null) => void;
  onStudentClick: (maSV: string) => void;
  onClassClick: (maLop: string) => void;
  onRowClick?: (record: ExamRecord) => void;
}

export default function DataTable({ records, sortConfig, onSortChange, onStudentClick, onClassClick, onRowClick }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page to 1 when records change (e.g., due to filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [records]);

  const sortedRecords = useMemo(() => {
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
              let d = 1, m = 1, y = 1970;
              
              if (parts.length === 3) {
                const p0 = parseInt(parts[0], 10);
                const p1 = parseInt(parts[1], 10);
                const p2 = parseInt(parts[2], 10);
                y = p2;
                
                if (p1 > 12) {
                  // M/D/YYYY format (e.g. 7/18/2026)
                  m = p0; d = p1;
                } else if (p0 > 12) {
                  // D/M/YYYY format (e.g. 18/7/2026)
                  d = p0; m = p1;
                } else {
                  // Fallback to M/D/YYYY based on the CSV context
                  m = p0; d = p1;
                }
              }

              let hour = 0, min = 0;
              if (timeStr) {
                 const timeParts = timeStr.toLowerCase().replace('g', ':').replace('h', ':').split(':');
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
  }, [records, sortConfig]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getHTColor = (ht: string) => {
    switch (ht?.toUpperCase()) {
      case 'TH': return 'bg-green-100 text-green-700';
      case 'BCTL': return 'bg-purple-100 text-purple-700';
      case 'TL': return 'bg-orange-100 text-orange-700';
      case 'TT': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
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
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-500" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  if (records.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">STT</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('MaSV')}>
                <div className="flex items-center">Mã SV <SortIcon columnKey="MaSV" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('Name')}>
                <div className="flex items-center">Họ Tên <SortIcon columnKey="Name" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('MaLop')}>
                <div className="flex items-center">Lớp <SortIcon columnKey="MaLop" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('MaMH')}>
                <div className="flex items-center">Môn Thi <SortIcon columnKey="MaMH" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Phòng</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('DateTime')}>
                <div className="flex items-center">Ngày Thi <SortIcon columnKey="DateTime" /></div>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Giờ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRecords.map((record, index) => (
              <tr 
                key={index} 
                className={`transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''} ${onRowClick ? 'cursor-pointer hover:bg-slate-100' : 'hover:bg-slate-50'}`}
                onClick={() => onRowClick && onRowClick(record)}
              >
                <td className="px-6 py-4 text-sm text-slate-500">{startIndex + index + 1}</td>
                <td 
                  className="px-6 py-4 text-sm font-mono text-blue-600 cursor-pointer hover:underline" 
                  onClick={(e) => { e.stopPropagation(); onStudentClick(record.MaSV); }}
                >
                  {record.MaSV}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                  {record.HoLotSV} {record.TenSV}
                </td>
                <td 
                  className="px-6 py-4 text-sm text-slate-600 cursor-pointer hover:underline text-blue-600 font-medium" 
                  onClick={(e) => { e.stopPropagation(); onClassClick(record.MaLop); }}
                >
                  {record.MaLop}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={record.TenMH}>{record.TenMH}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{record.MAPTHI}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{record.NgayThi}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{record.GioThi}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${getHTColor(record.MaHTThi)}`}>
                    {record.MaHTThi || 'Thi'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 font-medium">
          Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, records.length)} trên {records.length} bản ghi
        </span>
        <div className="flex gap-1">
          <button 
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Đầu
          </button>
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Trước
          </button>
          <span className="px-2 sm:px-3 py-1 text-xs font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Sau
          </button>
          <button 
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 sm:px-3 py-1 bg-white border border-slate-200 rounded shadow-sm text-xs disabled:opacity-50 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cuối
          </button>
        </div>
      </div>
    </div>
  );
}
