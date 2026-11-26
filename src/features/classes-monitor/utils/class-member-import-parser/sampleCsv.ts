export function downloadClassMembersSampleCsv(
  classCode: string,
  sampleStudents: Array<{
    MaSV: string;
    HoLotSV?: string;
    TenSV?: string;
    PHAI?: string;
    NgaySinhC?: string;
    phone?: string;
    note?: string;
  }>
) {
  const headers = ['STT', 'Mã SV', 'Họ lót', 'Tên', 'Giới tính', 'Ngày sinh', 'SĐT', 'Ghi chú'];
  const rows =
    sampleStudents.length > 0
      ? sampleStudents.slice(0, 5).map((s, idx) => [
          idx + 1,
          s.MaSV,
          s.HoLotSV || '',
          s.TenSV || '',
          s.PHAI || 'Nam',
          s.NgaySinhC || '',
          s.phone || '',
          s.note || '',
        ])
      : [
          [1, 'B21DCCN001', 'Nguyễn Văn', 'An', 'Nam', '01/01/2003', '0912345678', ''],
          [2, 'B21DCCN002', 'Trần Thị', 'Bình', 'Nữ', '15/05/2003', '0987654321', ''],
          [3, 'B21DCCN003', 'Lê Minh', 'Cường', 'Nam', '20/10/2003', '', ''],
        ];

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Mau_Import_ThanhVien_Lop_${classCode}.csv`;
  link.click();
}
