import { DOW_MAP_BY_NUM, PERIOD_TIMES } from './constants';
import { isSessionOnDate, parseTkbDate, parseTkbString } from './tkbParser';
import type { ParsedClassSession } from './types';

/**
 * Phân tích 1 phần tử lịch học từ API QLDTTX (w-locdstkbtuanusertheohocky) hoặc DB
 */
export function parseSessionFromApiItem(item: any, targetDateVN: Date): ParsedClassSession[] {
  const results: ParsedClassSession[] = [];
  if (!item) return results;

  const subjectName =
    item.ten_mon ||
    item.ten_mon_hoc ||
    item.ten_hp ||
    item.to_hoc?.ten_mon ||
    item.ten_mon_hoc_tieng_anh ||
    'Môn học';

  const subjectCode =
    item.ma_mon ||
    item.ma_mon_hoc ||
    item.ma_hp ||
    item.to_hoc?.ma_mon ||
    '';

  const group =
    item.ma_nhom ||
    item.nhom_to ||
    item.nhom ||
    item.nhom_hoc ||
    item.to_hoc?.nhom_to ||
    item.to_hoc?.nhom ||
    '';

  const classCode =
    item.ten_lop ||
    item.lop ||
    item.ma_lop ||
    item.ma_lop_tc ||
    item.to_hoc?.lop ||
    '';

  const room = (
    item.phong ||
    item.ten_phong ||
    item.ma_phong ||
    item.phong_hoc ||
    item.to_hoc?.phong ||
    ''
  )
    .toString()
    .replace(/^Ph\s*/i, '')
    .trim();

  const onlineLink = item.link_hoc_online || item.online_link || item.link_zoom || '';

  // 1. Trường hợp item có chứa chuỗi TKB chuẩn (to_hoc.tkb hoặc tkb)
  const tkbStr = item.tkb || item.to_hoc?.tkb;
  if (tkbStr && typeof tkbStr === 'string') {
    const parsedSegments = parseTkbString(tkbStr);
    for (const seg of parsedSegments) {
      if (isSessionOnDate(seg, targetDateVN)) {
        results.push({
          subjectName,
          subjectCode,
          group: group || seg.raw,
          classCode,
          dayOfWeekStr: seg.dayOfWeekStr,
          dayOfWeekNum: seg.dayOfWeekNum,
          periodStr: seg.periodStr,
          startPeriod: seg.startPeriod,
          endPeriod: seg.endPeriod,
          startTime: seg.startTime,
          endTime: seg.endTime,
          startMinutes: seg.startMinutes,
          room: seg.room || room || 'Phòng học môn',
          onlineLink: onlineLink || undefined,
          startDate: seg.startDate,
          endDate: seg.endDate,
        });
      }
    }
    if (results.length > 0) return results;
  }

  // 2. Trường hợp item có các trường ngày / thứ cụ thể
  const targetYear = targetDateVN.getFullYear();
  const targetMonth = targetDateVN.getMonth();
  const targetDay = targetDateVN.getDate();

  // Kiểm tra ngày học cụ thể
  let itemDate: Date | null = null;
  const rawDateStr = item.ngay_hoc || item.ngay_hoc_chuan || item.ngay_day || item.date;
  if (rawDateStr) {
    itemDate = parseTkbDate(String(rawDateStr));
  }

  // Kiểm tra khoảng thời gian (tu_ngay -> den_ngay)
  const startRangeStr = item.tu_ngay || item.ngay_bat_dau || item.tuan_tu_ngay;
  const endRangeStr = item.den_ngay || item.ngay_ket_thuc || item.tuan_den_ngay;
  const startDate = startRangeStr ? parseTkbDate(String(startRangeStr)) : null;
  const endDate = endRangeStr ? parseTkbDate(String(endRangeStr)) : null;

  // Xác định thứ trong tuần
  let dayOfWeekNum = -1;
  const rawThu = item.thu_kieu_so ?? item.thu ?? item.day_of_week;
  if (rawThu !== undefined && rawThu !== null) {
    const thuStr = String(rawThu).trim();
    if (thuStr === '8' || thuStr.toLowerCase().includes('cn') || thuStr.toLowerCase().includes('chủ')) {
      dayOfWeekNum = 8;
    } else {
      const parsedNum = parseInt(thuStr.replace(/\D/g, ''), 10);
      if (parsedNum >= 2 && parsedNum <= 7) {
        dayOfWeekNum = parsedNum;
      } else if (parsedNum === 1 || parsedNum === 8) {
        dayOfWeekNum = 8;
      }
    }
  }

  let matchesDate = false;
  if (itemDate) {
    matchesDate =
      itemDate.getFullYear() === targetYear &&
      itemDate.getMonth() === targetMonth &&
      itemDate.getDate() === targetDay;
  } else if (startDate && endDate && dayOfWeekNum > 0) {
    matchesDate = isSessionOnDate({ dayOfWeekNum, startDate, endDate }, targetDateVN);
  }

  if (!matchesDate) return [];

  // Tiết học
  const startPeriod = Number(item.tiet_bat_dau ?? item.tiet_bd ?? item.tiet_dau ?? item.start_period) || 13;
  let endPeriod = Number(item.tiet_ket_thuc ?? item.tiet_kt ?? item.end_period);
  if (!endPeriod || isNaN(endPeriod)) {
    const soTiet = Number(item.so_tiet) || 3;
    endPeriod = startPeriod + soTiet - 1;
  }

  const periodStr = item.tiet_hoc || item.periodStr || `Tiết ${startPeriod}->${endPeriod}`;

  const startTime = item.gio_bat_dau || item.gio_bd || PERIOD_TIMES[startPeriod]?.start || '19:00';
  const endTime = item.gio_ket_thuc || item.gio_kt || PERIOD_TIMES[endPeriod]?.end || '21:50';

  let startMinutes = PERIOD_TIMES[startPeriod]?.startMin || 19 * 60;
  if (item.gio_bat_dau || item.gio_bd) {
    const timeMatch = String(item.gio_bat_dau || item.gio_bd).match(/(\d+)[h:](\d+)/i);
    if (timeMatch) {
      startMinutes = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
    }
  }

  const jsDay = targetDateVN.getDay();
  const actualDowNum = jsDay === 0 ? 8 : jsDay + 1;
  const dayOfWeekStr =
    item.thu_chu || DOW_MAP_BY_NUM[dayOfWeekNum > 0 ? dayOfWeekNum : actualDowNum] || `Thứ ${actualDowNum}`;

  results.push({
    subjectName,
    subjectCode,
    group,
    classCode,
    dayOfWeekStr,
    dayOfWeekNum: dayOfWeekNum > 0 ? dayOfWeekNum : actualDowNum,
    periodStr,
    startPeriod,
    endPeriod,
    startTime,
    endTime,
    startMinutes,
    room: room || 'Phòng học môn',
    onlineLink: onlineLink || undefined,
    startDate: startDate || itemDate || targetDateVN,
    endDate: endDate || itemDate || targetDateVN,
  });

  return results;
}
