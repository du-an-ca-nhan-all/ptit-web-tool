import { FilterMode, ReviewStudentItem, ReviewSummary } from './types';

export function computeReviewSummary(students: ReviewStudentItem[]): ReviewSummary {
  const total = students.length;
  const registered = students.filter((s) => s.isRegistered).length;
  const withExams = students.filter((s) => s.examCount > 0).length;
  return {
    total,
    registered,
    unregistered: total - registered,
    withExams,
  };
}

export function filterReviewStudents(
  students: ReviewStudentItem[],
  filterMode: FilterMode,
  searchQuery: string
): ReviewStudentItem[] {
  let list = students;
  if (filterMode === 'REGISTERED') {
    list = list.filter((s) => s.isRegistered);
  } else if (filterMode === 'UNREGISTERED') {
    list = list.filter((s) => !s.isRegistered);
  } else if (filterMode === 'HAS_EXAMS') {
    list = list.filter((s) => s.examCount > 0);
  }

  const q = searchQuery.trim().toLowerCase();
  if (!q) return list;

  return list.filter(
    (s) =>
      s.maSV.toLowerCase().includes(q) ||
      s.hoTen.toLowerCase().includes(q) ||
      (s.soDienThoai && s.soDienThoai.toLowerCase().includes(q)) ||
      (s.note && s.note.toLowerCase().includes(q))
  );
}

export function parseQuickImportTokens(text: string): string[] {
  return text
    .split(/[\s,;\t\n\r]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length >= 4);
}

export function buildReviewCsvContent(
  registeredList: ReviewStudentItem[],
  batchLabel: string
): string {
  const headers = [
    'STT',
    'Mã SV',
    'Họ và Tên',
    'Lớp',
    'SĐT',
    'Số môn thi đợt này',
    'Đợt thi',
    'Ghi chú',
  ];
  const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

  const rows = registeredList.map((s, idx) => [
    idx + 1,
    s.maSV,
    s.hoTen,
    s.maLop,
    s.soDienThoai || '',
    s.examCount,
    batchLabel,
    s.note || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

export function buildRegisteredClipboardText(
  registeredList: ReviewStudentItem[],
  selectedClass: string,
  batchLabel: string
): string {
  const header = `DANH SÁCH ĐĂNG KÝ ÔN TẬP - LỚP ${selectedClass}\nĐợt thi: ${batchLabel} (${registeredList.length} SV)\n`;
  const body = registeredList
    .map(
      (s, idx) =>
        `${idx + 1}. ${s.maSV} - ${s.hoTen}${s.note ? ` (${s.note})` : ''}`
    )
    .join('\n');

  return `${header}\n${body}`;
}

export function triggerCsvDownload(csvContent: string, filename: string): void {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
