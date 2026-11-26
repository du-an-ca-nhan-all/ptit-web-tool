import {
  AnalyzedExamRoom,
  AnalyzedStudentRecord,
  ReferenceStudentInfo,
  RoomCountOperator,
  StudentScope,
  formatGroupLabel,
} from '../../types/roomAnalysis.types';
import { OPERATOR_LABELS } from './constants';

const escapeCsvCell = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

export function buildSplitStudentsCopyText(params: {
  selectedClass: string;
  selectedBatchCode: string;
  scope: StudentScope;
  referenceStudent: ReferenceStudentInfo | null;
  filteredRecords: AnalyzedStudentRecord[];
}): string {
  const { selectedClass, selectedBatchCode, scope, referenceStudent, filteredRecords } = params;
  const scopeLabel = scope === 'REVIEW' ? 'AE Ôn Tập' : 'Cả Lớp';
  const header = `DANH SÁCH SV BỊ TÁCH PHÒNG - LỚP ${selectedClass} (${scopeLabel})\nĐợt thi: ${selectedBatchCode} | Chuẩn LT: ${
    referenceStudent ? `${referenceStudent.hoTen} (${referenceStudent.maSV})` : '—'
  }\nTổng: ${filteredRecords.length} lượt thi\n`;

  const lines = filteredRecords.map((r, i) => {
    const statusLabel =
      r.splitStatus === 'SPLIT_SAME_GROUP'
        ? 'Cùng tổ/nhóm bị tách'
        : r.splitStatus === 'SPLIT_DIFF_GROUP'
        ? 'Khác tổ/nhóm bị tách'
        : r.splitStatus === 'SAME_ROOM'
        ? 'Cùng phòng LT'
        : 'LT không thi';
    return `${i + 1}. ${r.maSV} - ${r.hoTen} | ${r.tenMH} | Phòng: ${r.mapThi} (${r.ngayThi} ${r.gioThi}) | Phòng LT: ${
      r.monitorRoom || '—'
    } | ${statusLabel}`;
  });
  return `${header}\n${lines.join('\n')}`;
}

export function buildRoomsCopyText(params: {
  selectedClass: string;
  selectedBatchCode: string;
  scope: StudentScope;
  roomCountOp: RoomCountOperator;
  roomCountN: number;
  filteredRooms: AnalyzedExamRoom[];
}): string {
  const { selectedClass, selectedBatchCode, scope, roomCountOp, roomCountN, filteredRooms } =
    params;
  const scopeLabel = scope === 'REVIEW' ? 'AE Ôn Tập' : 'Cả Lớp';
  const condText =
    roomCountOp === 'ALL' ? 'Mọi sĩ số' : `${OPERATOR_LABELS[roomCountOp]} ${roomCountN}`;
  const header = `DANH SÁCH PHÒNG THI LỚP ${selectedClass} (${scopeLabel} · ${condText})\nĐợt thi: ${selectedBatchCode} | Tổng: ${filteredRooms.length} phòng\n`;

  const lines = filteredRooms.map((room, i) => {
    const memberNames = room.members.map((m) => `${m.maSV} ${m.hoTen}`).join(', ');
    const tag = room.isMonitorRoom
      ? '[Phòng LT]'
      : room.hasMonitorExamForSubject
      ? `[Tách khỏi LT: ${room.monitorRoomForSubject}]`
      : '[LT không thi]';
    return `${i + 1}. Phòng ${room.mapThi} ${tag} - ${room.tenMH} (${room.ngayThi} ${room.gioThi}) - ${room.scopeCount} SV:\n   ${memberNames}`;
  });
  return `${header}\n${lines.join('\n\n')}`;
}

export function buildSplitStudentsCsv(filteredRecords: AnalyzedStudentRecord[]): string {
  const headers = [
    'STT',
    'Mã SV',
    'Họ và Tên',
    'SĐT',
    'Đăng ký ôn tập',
    'Mã MH',
    'Tên môn thi',
    'Phòng SV',
    'Ngày thi SV',
    'Giờ thi SV',
    'Sĩ số trong phòng',
    'Phòng Lớp Trưởng',
    'Ngày/Giờ LT',
    'Tổ/Nhóm SV',
    'Tổ/Nhóm LT',
    'Trạng thái',
  ];
  const rows = filteredRecords.map((r, i) => [
    i + 1,
    r.maSV,
    r.hoTen,
    r.soDienThoai,
    r.isReviewRegistered ? 'Có' : 'Không',
    r.maMH,
    r.tenMH,
    r.mapThi,
    r.ngayThi,
    r.gioThi,
    r.scopeRoomCount,
    r.monitorRoom || '',
    r.monitorRoom ? `${r.monitorDate} ${r.monitorTime}` : '',
    formatGroupLabel(r),
    r.monitorRoom
      ? formatGroupLabel({
          nhomHoc: r.monitorNhomHoc,
          toThi: r.monitorToThi,
          nhomThi: r.monitorNhomThi,
        })
      : '',
    r.splitStatus,
  ]);

  return [headers.join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
}

export function buildRoomsCsv(filteredRooms: AnalyzedExamRoom[]): string {
  const headers = [
    'STT',
    'Phòng thi',
    'Mã MH',
    'Tên môn thi',
    'Ngày thi',
    'Giờ thi',
    'Phòng Lớp Trưởng',
    'Là phòng LT',
    'SL theo bộ lọc',
    'SL Cả lớp',
    'SL AE ôn tập',
    'Tổng phòng',
    'Danh sách SV',
  ];
  const rows = filteredRooms.map((room, i) => [
    i + 1,
    room.mapThi,
    room.maMH,
    room.tenMH,
    room.ngayThi,
    room.gioThi,
    room.monitorRoomForSubject || '',
    room.isMonitorRoom ? 'Có' : 'Không',
    room.scopeCount,
    room.classCount,
    room.reviewCount,
    room.roomTotalCount,
    room.members.map((m) => `${m.maSV} - ${m.hoTen}`).join('; '),
  ]);

  return [headers.join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
}

export function downloadCsvFile(csv: string, filename: string): void {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
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
