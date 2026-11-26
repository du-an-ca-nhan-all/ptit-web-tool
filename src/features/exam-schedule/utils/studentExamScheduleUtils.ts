import type { ExamRecord } from '../types/exam.types';
import type {
  RoomClassMatch,
  RoomClassStatsLookupFn,
  TimelineGroup,
} from '../types/studentPersonalExam.types';
import type {
  StudentQldtExamItem,
  StudentQldtExamScheduleResult,
} from '@/src/features/external-portal/server/studentExamScheduleServerService';

export function formatSyncDateTime(isoString?: string | null): string {
  if (!isoString) return 'Chưa đồng bộ';
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return isoString;

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

export function getRelativeSyncTime(isoString?: string | null): string {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return '';

  const diffSec = Math.floor((Date.now() - dateObj.getTime()) / 1000);
  if (diffSec < 10) return 'vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export function getFormatBadgeColor(formatStr: string): string {
  const normalized = (formatStr || '').toLowerCase();
  if (normalized.includes('trắc nghiệm')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (normalized.includes('thực hành') || normalized.includes('máy')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (normalized.includes('tiểu luận') || normalized.includes('báo cáo')) {
    return 'bg-purple-100 text-purple-800 border-purple-200';
  }
  if (normalized.includes('tự luận') || normalized.includes('viết')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getDayOfWeekVietnamese(dateIso: string): string {
  if (!dateIso) return '';
  const [year, month, day] = dateIso.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '';

  const dateObj = new Date(year, month - 1, day);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[dateObj.getDay()] || '';
}

function normalizeDateKey(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return dateStr.trim();
  return `${Number(parts[0])}/${Number(parts[1])}/${Number(parts[2])}`;
}

function normalizeRoomCompact(roomStr?: string): string {
  return String(roomStr || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function buildRoomClassStatsLookup(
  records: ExamRecord[],
  allStudentFileRecords: ExamRecord[]
): RoomClassStatsLookupFn {
  const byFullKey = new Map<string, RoomClassMatch>();
  const byCompactRoomKey = new Map<string, RoomClassMatch>();
  const bySubjectDate = new Map<string, RoomClassMatch>();
  const bySubjectRoom = new Map<string, RoomClassMatch>();

  const combinedRecords = [...records, ...allStudentFileRecords];

  for (const rec of combinedRecords) {
    if (rec.roomClassmateCount === undefined) continue;
    const maMH = String(rec.MaMH || '').trim().toUpperCase();
    const mapThi = String(rec.MAPTHI || '').trim().toUpperCase();
    const compactRoom = normalizeRoomCompact(rec.MAPTHI);
    const ngay = normalizeDateKey(rec.NgayThi);
    const stat: RoomClassMatch = {
      classmates: rec.roomClassmateCount,
      total: rec.roomTotalCount,
      record: rec,
    };

    if (maMH && mapThi && ngay && !byFullKey.has(`${maMH}|${ngay}|${mapThi}`)) {
      byFullKey.set(`${maMH}|${ngay}|${mapThi}`, stat);
    }
    if (maMH && compactRoom && ngay && !byCompactRoomKey.has(`${maMH}|${ngay}|${compactRoom}`)) {
      byCompactRoomKey.set(`${maMH}|${ngay}|${compactRoom}`, stat);
    }
    if (maMH && ngay && !bySubjectDate.has(`${maMH}|${ngay}`)) {
      bySubjectDate.set(`${maMH}|${ngay}`, stat);
    }
    if (maMH && mapThi && !bySubjectRoom.has(`${maMH}|${mapThi}`)) {
      bySubjectRoom.set(`${maMH}|${mapThi}`, stat);
    }
  }

  return (maMon?: string, ngayThi?: string, maPhong?: string): RoomClassMatch | null => {
    const mh = String(maMon || '').trim().toUpperCase();
    if (!mh) return null;

    const rm = String(maPhong || '').trim().toUpperCase();
    const compactRm = normalizeRoomCompact(maPhong);
    const dt = normalizeDateKey(ngayThi);

    return (
      (rm && dt ? byFullKey.get(`${mh}|${dt}|${rm}`) : undefined) ||
      (compactRm && dt ? byCompactRoomKey.get(`${mh}|${dt}|${compactRm}`) : undefined) ||
      (dt ? bySubjectDate.get(`${mh}|${dt}`) : undefined) ||
      (rm ? bySubjectRoom.get(`${mh}|${rm}`) : undefined) ||
      null
    );
  };
}

export function groupExamsByTimeline(exams: StudentQldtExamItem[]): TimelineGroup[] {
  const groupMap: Record<string, TimelineGroup> = {};

  exams.forEach((exam) => {
    const key = exam.ngayThi || 'Chưa xếp ngày';
    if (!groupMap[key]) {
      groupMap[key] = {
        dateStr: key,
        dateIso: exam.dateIso,
        dayOfWeek: getDayOfWeekVietnamese(exam.dateIso),
        daysUntil: exam.daysUntil,
        items: [],
      };
    }
    groupMap[key].items.push(exam);
  });

  Object.values(groupMap).forEach((group) => {
    group.items.sort((a, b) => a.gioBatDau.localeCompare(b.gioBatDau));
  });

  return Object.values(groupMap).sort((a, b) => (a.dateIso || '').localeCompare(b.dateIso || ''));
}

export function exportQldtExamsToCsv(
  qldtData: StudentQldtExamScheduleResult | null,
  username: string
): void {
  if (!qldtData || !qldtData.exams || qldtData.exams.length === 0) return;

  let csv = '\uFEFF';
  csv +=
    'STT,Mã Môn,Tên Môn Học,Ngày Thi,Giờ Thi,Thời Lượng,Hình Thức Thi,Phòng Thi,Cơ Sở,SBD / Tổ Thi,Nhóm Thi,Địa Điểm Thi,Ghi Chú\n';

  qldtData.exams.forEach((ex) => {
    const escapedAddress = ex.diaDiemThi.replace(/"/g, '""');
    csv += `"${ex.stt}","${ex.maMon}","${ex.tenMon}","${ex.ngayThi}","${ex.gioBatDau}","${ex.soPhut}","${ex.hinhThucThi}","${ex.maPhong}","${ex.maCoSo}","${ex.toThi}","${ex.nhomThi}","${escapedAddress}","${ex.ghiChu}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Lich_thi_QLDTTX_${username}_${qldtData.semesterId || ''}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
