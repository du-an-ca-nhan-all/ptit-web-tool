import Papa from 'papaparse';
import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import {
  ParsedFlowStudent,
  ParseStudentDefaults,
  TextExamplePreset,
} from './types';

function isTruthyCellValue(raw: unknown): boolean {
  const val = String(raw).trim().toLowerCase();
  return val === '1' || val === 'true' || val === 'có' || val === 'bật' || val === 'yes';
}

export function parseRowsToStudents(
  rows: any[][],
  monitorUsername: string,
  selectedClass: string,
  classStudentMap: Map<string, FollowerStudentItem>,
  defaults: ParseStudentDefaults
): ParsedFlowStudent[] {
  if (!rows || rows.length === 0) return [];

  const normMonitor = monitorUsername.trim().toUpperCase();
  const result: ParsedFlowStudent[] = [];
  const seen = new Set<string>();

  // Detect if first row is header
  let startIndex = 0;
  if (rows.length > 0) {
    const firstRowStr = rows[0].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      firstRowStr.includes('masv') ||
      firstRowStr.includes('mã sv') ||
      firstRowStr.includes('mã sinh viên') ||
      firstRowStr.includes('mssv') ||
      firstRowStr.includes('student')
    ) {
      startIndex = 1;
    }
  }

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Extract MaSV
    const rawMaSV = String(row[0] || '').trim().toUpperCase();
    if (!rawMaSV) continue;

    // Check if it's the monitor themselves
    if (rawMaSV === normMonitor) continue;

    // Deduplicate
    if (seen.has(rawMaSV)) continue;
    seen.add(rawMaSV);

    // Extract HoTen (if available)
    const rawHoTen = row[1] ? String(row[1]).trim() : undefined;

    // Extract permissions if given in columns 2, 3, 4
    let isEnabled = defaults.defaultIsEnabled;
    let allowRegister = defaults.defaultAllowRegister;
    let allowCancel = defaults.defaultAllowCancel;
    let note: string | undefined = undefined;

    if (row.length >= 3 && row[2] !== undefined && row[2] !== '') {
      isEnabled = isTruthyCellValue(row[2]);
    }
    if (row.length >= 4 && row[3] !== undefined && row[3] !== '') {
      allowRegister = isTruthyCellValue(row[3]);
    }
    if (row.length >= 5 && row[4] !== undefined && row[4] !== '') {
      allowCancel = isTruthyCellValue(row[4]);
    }
    if (row.length >= 6 && row[5] !== undefined && row[5] !== '') {
      note = String(row[5]).trim();
    }

    // Check against existing class data
    const matched = classStudentMap.get(rawMaSV);
    const isInClass = Boolean(matched);
    const isLinked = Boolean(matched?.isExternalConfigured);
    const matchedName = matched?.hoTen || rawHoTen;

    result.push({
      maSV: rawMaSV,
      hoTen: matchedName,
      isEnabled,
      allowRegisterCourse: allowRegister,
      allowCancelCourse: allowCancel,
      note,
      isInClass,
      isLinked,
      classCode: matched?.maLop || selectedClass,
      matchedName,
      warning: !isInClass
        ? `Mã SV không thuộc danh sách lớp ${selectedClass}`
        : !isLinked
        ? 'Chưa liên kết tài khoản Cổng QLDTTX'
        : undefined,
    });
  }

  return result;
}

export function parseRawTextToRows(text: string): { rows: any[][] | null; error: string | null } {
  try {
    // First try standard Papa parse with automatic delimiter detection
    const parsed = Papa.parse(text.trim(), {
      skipEmptyLines: true,
    });

    if (parsed.data && parsed.data.length > 0) {
      // If single column with commas/spaces or clean list
      const processedRows: any[][] = [];
      (parsed.data as any[][]).forEach((row) => {
        if (row.length === 1 && typeof row[0] === 'string') {
          const singleCell = row[0].trim();
          // Check if user separated by commas, spaces, or semicolons in one line
          if (singleCell.includes(',') || singleCell.includes(';') || singleCell.includes('\t')) {
            const subItems = singleCell.split(/[,;\t]/).map((s) => s.trim()).filter(Boolean);
            // If all subItems look like student IDs, push each as its own row
            const allAreIds = subItems.every((item) => /^[a-zA-Z0-9_-]{5,15}$/.test(item));
            if (allAreIds) {
              subItems.forEach((id) => processedRows.push([id]));
            } else {
              processedRows.push(subItems);
            }
          } else {
            processedRows.push([singleCell]);
          }
        } else {
          processedRows.push(row);
        }
      });

      return { rows: processedRows, error: null };
    }

    return { rows: null, error: 'Không thể đọc dữ liệu từ văn bản đã nhập.' };
  } catch (err: any) {
    return { rows: null, error: `Lỗi khi xử lý dữ liệu: ${err.message}` };
  }
}

export function downloadSampleCSV(
  selectedClass: string,
  existingClassStudents: FollowerStudentItem[]
): void {
  const headers = [
    'Mã SV',
    'Họ và Tên',
    'Bật Flow (1=Bật/0=Tắt)',
    'Flow Đăng Ký (1=Bật/0=Tắt)',
    'Flow Hủy Môn (1=Bật/0=Tắt)',
    'Ghi Chú',
  ];

  // Pick top 3 actual students from class if available, or use placeholder samples
  const sampleRows =
    existingClassStudents.length > 0
      ? existingClassStudents.slice(0, 5).map((st, i) => [
          st.maSV,
          st.hoTen,
          '1',
          '1',
          i % 2 === 0 ? '1' : '0',
          i === 0 ? 'Học chung 100% môn' : '',
        ])
      : [
          ['B21DCCN001', 'Nguyễn Văn An', '1', '1', '1', 'Học chung nhóm 01'],
          ['B21DCCN002', 'Trần Thị Bình', '1', '1', '0', 'Không tự hủy môn'],
          ['B21DCCN003', 'Lê Văn Cường', '1', '1', '1', ''],
        ];

  const csvRows = [
    headers.join(','),
    ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ].join('\n');

  // UTF-8 BOM for correct Excel Vietnamese character display
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvRows], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Mau_Import_Flow_Lop_${selectedClass}.csv`;
  link.click();
}

export function buildTextExamples(
  existingClassStudents: FollowerStudentItem[]
): TextExamplePreset[] {
  return [
    {
      id: 1,
      title: 'Mẫu 1: Chỉ danh sách Mã SV (Đơn giản nhất)',
      description: 'Mỗi dòng 1 mã sinh viên (phù hợp copy từ Zalo, tin nhắn, danh sách)',
      sample:
        existingClassStudents.length > 0
          ? existingClassStudents
              .slice(0, 4)
              .map((s) => s.maSV)
              .join('\n')
          : 'B21DCCN001\nB21DCCN002\nB21DCCN003\nB21DCCN004',
    },
    {
      id: 2,
      title: 'Mẫu 2: Mã SV & Họ Tên (Copy từ Excel)',
      description: 'Cột Mã SV và Họ tên phân cách bằng phím Tab hoặc dấu phẩy',
      sample:
        existingClassStudents.length > 0
          ? existingClassStudents
              .slice(0, 4)
              .map((s) => `${s.maSV}\t${s.hoTen}`)
              .join('\n')
          : 'B21DCCN001\tNguyễn Văn An\nB21DCCN002\tTrần Thị Bình\nB21DCCN003\tLê Văn Cường',
    },
    {
      id: 3,
      title: 'Mẫu 3: Đầy đủ tùy chọn phân quyền Flow',
      description: 'Mã SV, Họ tên, Bật Flow (1/0), Đăng ký (1/0), Hủy môn (1/0), Ghi chú',
      sample:
        'B21DCCN001, Nguyễn Văn An, 1, 1, 1, Học chung cả kỳ\nB21DCCN002, Trần Thị Bình, 1, 1, 0, Không hủy môn\nB21DCCN003, Lê Văn Cường, 1, 1, 1, Nhóm chính',
    },
  ];
}
