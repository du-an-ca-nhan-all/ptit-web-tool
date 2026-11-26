import { ActiveTab, ClassMemberStats, GenderFilter } from './types';

export function normalizeString(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function filterStudents(
  currentList: any[],
  search: string,
  genderFilter: GenderFilter
): any[] {
  const searchStr = normalizeString(search);

  return currentList.filter((s) => {
    // Gender filter
    if (genderFilter === 'NAM') {
      const phai = (s.PHAI || '').toLowerCase();
      if (phai !== 'nam' && phai !== '1') return false;
    } else if (genderFilter === 'NU') {
      const phai = (s.PHAI || '').toLowerCase();
      if (phai !== 'nữ' && phai !== 'nu' && phai !== '0') return false;
    }

    // Text search
    if (!searchStr) return true;
    const id = normalizeString(s.MaSV);
    const name = normalizeString(`${s.HoLotSV} ${s.TenSV}`);
    const phone = normalizeString(s.phone);
    const note = normalizeString(s.note);

    return (
      id.includes(searchStr) ||
      name.includes(searchStr) ||
      phone.includes(searchStr) ||
      note.includes(searchStr)
    );
  });
}

export function calculateClassStats(activeStudents: any[]): ClassMemberStats {
  const total = activeStudents.length;
  let maleCount = 0;
  let femaleCount = 0;
  let totalExams = 0;

  activeStudents.forEach((s) => {
    const p = (s.PHAI || '').toLowerCase();
    if (p === 'nữ' || p === 'nu' || p === '0') femaleCount++;
    else maleCount++;
    totalExams += s.examCount || 0;
  });

  const avgExams = total > 0 ? (totalExams / total).toFixed(1) : '0';

  return { total, maleCount, femaleCount, totalExams, avgExams };
}

export interface ExportClassMembersCsvParams {
  filteredStudents: any[];
  activeTab: ActiveTab;
  selectedClass: string;
  hasExamSchedule: boolean;
}

export function exportClassMembersCsv({
  filteredStudents,
  activeTab,
  selectedClass,
  hasExamSchedule,
}: ExportClassMembersCsvParams): void {
  if (filteredStudents.length === 0) return;
  const headers = [
    'STT',
    'Mã SV',
    'Họ lót',
    'Tên',
    'Giới tính',
    'Ngày sinh',
    'SĐT',
    'Ghi chú',
    ...(hasExamSchedule ? ['Số môn thi'] : []),
  ].join(',');

  const rows = filteredStudents
    .map((s, index) =>
      [
        index + 1,
        s.MaSV,
        s.HoLotSV,
        s.TenSV,
        s.PHAI,
        s.NgaySinhC,
        s.phone || '',
        s.note || '',
        ...(hasExamSchedule ? [s.examCount || 0] : []),
      ]
        .map((val) => `"${val || ''}"`)
        .join(',')
    )
    .join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `DanhSach_${activeTab === 'ACTIVE' ? 'ThanhVien' : 'BienDong'}_Lop_${selectedClass}.csv`;
  link.click();
}
