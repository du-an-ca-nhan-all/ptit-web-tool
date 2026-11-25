export interface SampleCsvBatchInfo {
  code?: string | null;
  name?: string | null;
}

const EXAM_BATCH_CSV_HEADERS = [
  'MaSV',
  'HoLotSV',
  'TenSV',
  'PHAI',
  'NgaySinhC',
  'NhomThi',
  'MAPTHI',
  'MaMH',
  'TenMH',
  'MaHTThi',
  'NhomHoc',
  'To thi',
  'MaLop',
  'NgayThi',
  'GioThi',
  'SoPhutThi',
  'MaDotThi',
  'TenDotThi',
] as const;

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildExamBatchSampleCsv(batch?: SampleCsvBatchInfo | null): string {
  const batchCode = batch?.code?.trim() || '20252_TX';
  const batchName = batch?.name?.trim() || 'ĐHTX HK2 2025-2026';

  const sampleRows: string[][] = [
    [
      'B22DCCN001',
      'Nguyễn Văn',
      'An',
      'Nam',
      '15/05/2004',
      '01',
      '101-A2',
      'INT1306',
      'Cấu trúc dữ liệu và giải thuật',
      'TN',
      '01',
      '01',
      'D22CQCN01-B',
      '18/07/2026',
      '07:30',
      '60',
      batchCode,
      batchName,
    ],
    [
      'B22DCCN002',
      'Trần Thị',
      'Bình',
      'Nữ',
      '20/08/2004',
      '01',
      '101-A2',
      'INT1306',
      'Cấu trúc dữ liệu và giải thuật',
      'TN',
      '01',
      '01',
      'D22CQCN01-B',
      '18/07/2026',
      '07:30',
      '60',
      batchCode,
      batchName,
    ],
    [
      'B22DCCN003',
      'Lê Hoàng',
      'Cường',
      'Nam',
      '10/11/2004',
      '02',
      '205-A2',
      'INT1332',
      'Lập trình hướng đối tượng',
      'TL',
      '02',
      '01',
      'D22CQCN02-B',
      '19/07/2026',
      '13:30',
      '90',
      batchCode,
      batchName,
    ],
  ];

  return [
    EXAM_BATCH_CSV_HEADERS.join(','),
    ...sampleRows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');
}

export function downloadExamBatchSampleCsv(batch?: SampleCsvBatchInfo | null): string {
  const csvContent = buildExamBatchSampleCsv(batch);
  // UTF-8 BOM ensures Excel opens Vietnamese characters properly
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const safeBatchCode = batch?.code?.trim().replace(/[^A-Za-z0-9_-]/g, '_');
  const fileName = safeBatchCode
    ? `Mau_Import_Lich_Thi_${safeBatchCode}.csv`
    : 'Mau_Import_Lich_Thi_PTIT.csv';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}
