import type { QldtExamChangeItem } from '@/src/features/telegram/server/telegramDispatcher';
import {
  getExamUniqueKey,
  normalizeExamAddressStr,
  normalizeExamBanStatus,
  normalizeExamCode,
  normalizeExamDateStr,
  normalizeExamFormatStr,
  normalizeExamGroupStr,
  normalizeExamRoomStr,
  normalizeExamTimeStr,
} from './examNormalizer';

/**
 * So sánh và phát hiện biến động lịch thi giữa dữ liệu cũ và dữ liệu mới (hỗ trợ tất cả các học kỳ)
 */
export function detectExamScheduleChanges(
  oldRawExams: any[],
  newRawExams: any[]
): QldtExamChangeItem[] {
  const changes: QldtExamChangeItem[] = [];
  if (!Array.isArray(oldRawExams) || !Array.isArray(newRawExams)) return changes;

  const oldMap = new Map<string, any>();
  oldRawExams.forEach((item) => {
    const key = getExamUniqueKey(item);
    if (key) oldMap.set(key, item);
  });

  const newMap = new Map<string, any>();
  newRawExams.forEach((item) => {
    const key = getExamUniqueKey(item);
    if (key) newMap.set(key, item);
  });

  // 1. Kiểm tra môn thi mới hoặc bị thay đổi trong newRawExams
  newRawExams.forEach((newEx) => {
    const key = getExamUniqueKey(newEx);
    const code = normalizeExamCode(newEx);
    if (!key || !code) return;

    const baseName = newEx.ten_mon || newEx.tenMon || newEx.TenMH || 'Môn thi';
    const semName = newEx.ten_hoc_ky || (newEx.hoc_ky ? `HK ${newEx.hoc_ky}` : '');
    const tenMon = semName ? `${baseName} (${semName})` : baseName;

    const oldEx = oldMap.get(key);

    if (!oldEx) {
      // Môn thi mới được xếp lịch
      const diffs: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];
      const newDate = normalizeExamDateStr(newEx);
      const newTime = normalizeExamTimeStr(newEx);
      const newRoom = normalizeExamRoomStr(newEx);
      const newFormat = newEx.hinh_thuc_thi || newEx.hinhThucThi || '';
      const newAddress = normalizeExamAddressStr(newEx);

      if (newDate) diffs.push({ field: 'ngayThi', label: 'Ngày thi', oldVal: '', newVal: newDate });
      if (newTime) diffs.push({ field: 'gioBatDau', label: 'Giờ thi', oldVal: '', newVal: newTime });
      if (newRoom) diffs.push({ field: 'maPhong', label: 'Phòng thi', oldVal: '', newVal: newRoom });
      if (newFormat) diffs.push({ field: 'hinhThucThi', label: 'Hình thức', oldVal: '', newVal: newFormat });
      if (newAddress) diffs.push({ field: 'diaDiemThi', label: 'Địa điểm', oldVal: '', newVal: newAddress });

      changes.push({
        maMon: code,
        tenMon,
        type: 'NEW',
        diffs,
      });
    } else {
      // So sánh các trường thông tin quan trọng sau khi chuẩn hoá
      const diffs: Array<{ field: string; label: string; oldVal: string; newVal: string }> = [];

      const oldDate = normalizeExamDateStr(oldEx);
      const newDate = normalizeExamDateStr(newEx);
      if (oldDate !== newDate && (oldDate || newDate)) {
        diffs.push({ field: 'ngayThi', label: 'Ngày thi', oldVal: oldDate || 'Chưa có', newVal: newDate || 'Chưa có' });
      }

      const oldTime = normalizeExamTimeStr(oldEx);
      const newTime = normalizeExamTimeStr(newEx);
      if (oldTime !== newTime && (oldTime || newTime)) {
        diffs.push({ field: 'gioBatDau', label: 'Giờ thi', oldVal: oldTime || 'Chưa có', newVal: newTime || 'Chưa có' });
      }

      const oldRoom = normalizeExamRoomStr(oldEx);
      const newRoom = normalizeExamRoomStr(newEx);
      if (oldRoom !== newRoom && (oldRoom || newRoom)) {
        diffs.push({ field: 'maPhong', label: 'Phòng thi', oldVal: oldRoom || 'Chưa xếp', newVal: newRoom || 'Chưa xếp' });
      }

      const oldAddress = normalizeExamAddressStr(oldEx);
      const newAddress = normalizeExamAddressStr(newEx);
      if (oldAddress !== newAddress && (oldAddress || newAddress)) {
        diffs.push({ field: 'diaDiemThi', label: 'Địa điểm thi', oldVal: oldAddress || 'Chưa có', newVal: newAddress || 'Chưa có' });
      }

      const oldFormat = normalizeExamFormatStr(oldEx);
      const newFormat = normalizeExamFormatStr(newEx);
      if (oldFormat !== newFormat && (oldFormat || newFormat)) {
        const rawOldF = oldEx.hinh_thuc_thi || oldEx.hinhThucThi || 'Trắc nghiệm';
        const rawNewF = newEx.hinh_thuc_thi || newEx.hinhThucThi || 'Trắc nghiệm';
        diffs.push({ field: 'hinhThucThi', label: 'Hình thức thi', oldVal: rawOldF, newVal: rawNewF });
      }

      const oldGroup = normalizeExamGroupStr(oldEx);
      const newGroup = normalizeExamGroupStr(newEx);
      if (oldGroup !== newGroup && (oldGroup !== '|' || newGroup !== '|')) {
        const [oldTo, oldNhom] = oldGroup.split('|');
        const [newTo, newNhom] = newGroup.split('|');
        diffs.push({
          field: 'toThi',
          label: 'Tổ / Nhóm thi',
          oldVal: `Tổ ${oldTo || '0'} - Nhóm ${oldNhom || '0'}`,
          newVal: `Tổ ${newTo || '0'} - Nhóm ${newNhom || '0'}`,
        });
      }

      const oldBan = normalizeExamBanStatus(oldEx);
      const newBan = normalizeExamBanStatus(newEx);
      if (oldBan !== newBan) {
        diffs.push({
          field: 'camThi',
          label: 'Trạng thái cấm thi',
          oldVal: oldBan ? 'Bị cấm thi' : 'Được dự thi',
          newVal: newBan ? 'Bị cấm thi' : 'Được dự thi',
        });
      }

      if (diffs.length > 0) {
        changes.push({
          maMon: code,
          tenMon,
          type: 'MODIFIED',
          diffs,
        });
      }
    }
  });

  // 2. Kiểm tra môn thi bị huỷ (có trong cũ nhưng biến mất trong mới)
  oldRawExams.forEach((oldEx) => {
    const key = getExamUniqueKey(oldEx);
    const code = normalizeExamCode(oldEx);
    if (!key || !code) return;

    if (!newMap.has(key)) {
      const baseName = oldEx.ten_mon || oldEx.tenMon || oldEx.TenMH || 'Môn thi';
      const semName = oldEx.ten_hoc_ky || (oldEx.hoc_ky ? `HK ${oldEx.hoc_ky}` : '');
      const tenMon = semName ? `${baseName} (${semName})` : baseName;
      const oldDate = normalizeExamDateStr(oldEx);
      const oldTime = normalizeExamTimeStr(oldEx);

      changes.push({
        maMon: code,
        tenMon,
        type: 'CANCELLED',
        diffs: [
          {
            field: 'status',
            label: 'Trạng thái',
            oldVal: oldDate ? `Lịch ngày ${oldDate} (${oldTime || ''})` : 'Đã xếp lịch',
            newVal: 'Đã rút khỏi lịch thi',
          },
        ],
      });
    }
  });

  return changes;
}
