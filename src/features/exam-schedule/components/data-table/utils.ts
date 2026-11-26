import { ExamRecord } from '../../types/exam.types';
import { SortConfig } from './types';

export function parseExamDateTime(dateStr: string, timeStr: string): number {
  if (!dateStr) return 0;

  const parts = dateStr.split(/[\/\-]/);
  let d = 1;
  let m = 1;
  let y = 1970;

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

  let hour = 0;
  let min = 0;
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
}

export function sortExamRecords(
  records: ExamRecord[],
  sortConfig: SortConfig
): ExamRecord[] {
  const sortableItems = [...records];
  if (sortConfig !== null) {
    sortableItems.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

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
          aValue = parseExamDateTime(a.NgayThi, a.GioThi);
          bValue = parseExamDateTime(b.NgayThi, b.GioThi);
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
}

export function getHTColor(ht: string): string {
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
}
