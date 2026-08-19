import { prisma } from './prisma';
import {
  fetchStudentTimetableFromQLDTTX,
} from './qldttx-service';
import { parseTkbDate, parseTkbString } from './telegram-dispatcher';

export interface TimetableCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeekStr: string; // "Thứ 2", "Thứ 3", ... "Chủ Nhật"
  dayOfWeekNum: number; // 2..8
  subjectName: string;
  subjectCode: string;
  group: string;
  classCode: string;
  periodStr: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string; // "19:00"
  endTime: string; // "21:50"
  startMinutes: number;
  room: string;
  onlineLink?: string;
  lecturer?: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  colorIndex: number;
  rawSession?: any;
}

export interface TimetableSubjectSummary {
  subjectCode: string;
  subjectName: string;
  group: string;
  classCode: string;
  room: string;
  credits?: number;
  tuitionFee?: number;
  totalSessions: number;
  startDate: string;
  endDate: string;
  dayOfWeekStr: string;
  periodStr: string;
  colorIndex: number;
}

export interface StudentTimetableCalendarResult {
  success: boolean;
  username: string;
  semesterId: number;
  semesterName?: string;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  lastSyncAt: string | null;
  totalCredits?: number;
  tuitionFee?: number;
  totalEvents: number;
  uniqueSubjectsCount: number;
  subjects: TimetableSubjectSummary[];
  events: TimetableCalendarEvent[];
  upcomingEvents: TimetableCalendarEvent[];
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}

const PERIOD_TIMES: Record<number, { start: string; end: string; startMin: number }> = {
  1: { start: '07:00', end: '07:50', startMin: 7 * 60 },
  2: { start: '07:55', end: '08:45', startMin: 7 * 60 + 55 },
  3: { start: '08:50', end: '09:40', startMin: 8 * 60 + 50 },
  4: { start: '09:45', end: '10:35', startMin: 9 * 60 + 45 },
  5: { start: '10:40', end: '11:30', startMin: 10 * 60 + 40 },
  6: { start: '11:35', end: '12:25', startMin: 11 * 60 + 35 },
  7: { start: '12:30', end: '13:20', startMin: 12 * 60 + 30 },
  8: { start: '13:25', end: '14:15', startMin: 13 * 60 + 25 },
  9: { start: '14:20', end: '15:10', startMin: 14 * 60 + 20 },
  10: { start: '15:15', end: '16:05', startMin: 15 * 60 + 15 },
  11: { start: '16:10', end: '17:00', startMin: 16 * 60 + 10 },
  12: { start: '17:05', end: '17:55', startMin: 17 * 60 + 5 },
  13: { start: '19:00', end: '19:50', startMin: 19 * 60 },
  14: { start: '20:00', end: '20:50', startMin: 20 * 60 },
  15: { start: '21:00', end: '21:50', startMin: 21 * 60 },
  16: { start: '21:55', end: '22:45', startMin: 21 * 60 + 55 },
};

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getShift(startPeriod: number, startMinutes: number): 'MORNING' | 'AFTERNOON' | 'EVENING' {
  if (startPeriod >= 13 || startMinutes >= 18 * 60) return 'EVENING';
  if (startPeriod >= 7 || startMinutes >= 12 * 60) return 'AFTERNOON';
  return 'MORNING';
}

function getColorIndexForSubject(subjectCode: string, colorMap: Map<string, number>): number {
  if (!colorMap.has(subjectCode)) {
    const nextIdx = colorMap.size % 9;
    colorMap.set(subjectCode, nextIdx);
  }
  return colorMap.get(subjectCode)!;
}

/**
 * Lấy dữ liệu Thời Khóa Biểu học kỳ và chuẩn hóa thành danh sách Calendar Events
 */
export async function getStudentTimetableCalendar(
  username: string,
  options?: { forceRefresh?: boolean; semesterId?: number }
): Promise<StudentTimetableCalendarResult> {
  const cleanUsername = username.trim().toUpperCase();
  let rawList: any[] = [];
  let isLiveSync = false;
  let hasLinkedAccount = false;
  let lastSyncAt: string | null = null;
  let currentSemester = options?.semesterId || 20261;

  // 1. Kiểm tra tài khoản ExternalAccount QLDTTX
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      systemKey: 'QLDTTX_PTTC1',
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));
  hasLinkedAccount = isConfigured;

  // Nếu CHƯA CẤU HÌNH tài khoản QLDTTX -> Chặn truy cập và trả về errorType NOT_CONFIGURED
  if (!isConfigured) {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      isConfigured: false,
      hasLinkedAccount: false,
      isLiveSync: false,
      lastSyncAt: null,
      totalEvents: 0,
      uniqueSubjectsCount: 0,
      subjects: [],
      events: [],
      upcomingEvents: [],
      errorType: 'NOT_CONFIGURED',
      error: 'Chưa cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX PTTC1). Vui lòng cấu hình tài khoản để xem Thời Khóa Biểu & Lịch Học Cá Nhân.',
    };
  }

  if (extAccount?.lastSyncAt) {
    lastSyncAt = extAccount.lastSyncAt.toISOString();
  }

  // 2. Thử lấy live từ QLDTTX
  let authErrorDetected = false;
  let authErrorMessage = '';

  try {
    const fetched = await fetchStudentTimetableFromQLDTTX({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
      idHocKy: options?.semesterId || null,
    });

    if (fetched.currentSemester) {
      currentSemester = fetched.currentSemester;
    }

    if (Array.isArray(fetched.rawList) && fetched.rawList.length > 0) {
      rawList = fetched.rawList;
      isLiveSync = true;

      // Cập nhật trạng thái kết nối CONNECTED thành công
      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            ...(fetched.newToken ? { token: fetched.newToken } : {}),
            lastSyncAt: new Date(),
            status: 'CONNECTED',
            syncMessage: 'Đồng bộ TKB thành công từ QLDTTX.',
          },
        })
        .catch(() => {});
    }
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentTimetableCalendar] Lỗi kết nối QLDTTX cho ${cleanUsername}:`, err?.message);

    // Kiểm tra lỗi xác thực: sai username/password, token hết hạn, 401, 403
    if (
      errMsg.includes('401') ||
      errMsg.includes('403') ||
      errMsg.includes('không thành công') ||
      errMsg.includes('mật khẩu') ||
      errMsg.includes('tài khoản') ||
      errMsg.includes('đăng nhập') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('forbidden') ||
      errMsg.includes('không đúng') ||
      errMsg.includes('user không tồn tại')
    ) {
      authErrorDetected = true;
      authErrorMessage = err.message || 'Tài khoản hoặc mật khẩu QLDTTX không chính xác.';

      // Cập nhật trạng thái ERROR trong DB
      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Đăng nhập thất bại: Tài khoản hoặc mật khẩu không chính xác.',
          },
        })
        .catch(() => {});
    }
  }

  // Nếu SAI USERNAME / PASSWORD -> Chặn truy cập và trả về errorType INVALID_CREDENTIALS
  if (authErrorDetected || extAccount?.status === 'ERROR') {
    return {
      success: false,
      username: cleanUsername,
      semesterId: currentSemester,
      semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
      isConfigured: true,
      hasLinkedAccount: true,
      isLiveSync: false,
      lastSyncAt,
      totalEvents: 0,
      uniqueSubjectsCount: 0,
      subjects: [],
      events: [],
      upcomingEvents: [],
      errorType: 'INVALID_CREDENTIALS',
      error: authErrorMessage || 'Tài khoản hoặc mật khẩu Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) không chính xác hoặc đã bị đổi. Vui lòng kiểm tra và cập nhật lại thông tin đăng nhập.',
    };
  }

  // 3. Fallback sang dữ liệu đã lưu trong bảng CourseRegistration nếu không có lỗi xác thực
  if (rawList.length === 0) {
    try {
      const dbCourseReg = await prisma.courseRegistration.findFirst({
        where: { username: cleanUsername },
        orderBy: { updatedAt: 'desc' },
      });

      if (dbCourseReg && dbCourseReg.data) {
        const parsed = JSON.parse(dbCourseReg.data);
        const list =
          parsed?.data?.ds_thoi_khoa_bieu ||
          parsed?.data?.ds_tkb_tuan ||
          parsed?.data?.ds_kqdkmh ||
          parsed?.ds_kqdkmh ||
          parsed?.data ||
          [];

        if (Array.isArray(list) && list.length > 0) {
          rawList = list;
          if (dbCourseReg.updatedAt) {
            lastSyncAt = dbCourseReg.updatedAt.toISOString();
          }
        }
      }
    } catch (dbErr) {
      console.error(`[getStudentTimetableCalendar] Lỗi đọc DB CourseRegistration:`, dbErr);
    }
  }

  // 4. Trích xuất tất cả các buổi học thành Calendar Events
  const events: TimetableCalendarEvent[] = [];
  const subjectMap = new Map<string, TimetableSubjectSummary>();
  const colorMap = new Map<string, number>();
  const seenEventKeys = new Set<string>();

  const dowMap: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ Nhật',
  };

  for (const item of rawList) {
    const subjectName =
      item.ten_mon ||
      item.ten_mon_hoc ||
      item.ten_hp ||
      item.to_hoc?.ten_mon ||
      item.to_hoc?.ten_mon_hoc ||
      'Môn học';

    const subjectCode = (
      item.ma_mon ||
      item.ma_mon_hoc ||
      item.ma_hp ||
      item.to_hoc?.ma_mon ||
      item.to_hoc?.ma_mon_hoc ||
      'MH'
    ).toUpperCase();

    const group =
      item.ma_nhom ||
      item.nhom_to ||
      item.nhom ||
      item.nhom_hoc ||
      item.to_hoc?.nhom_to ||
      item.to_hoc?.nhom ||
      '01';

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
      'Phòng học môn'
    )
      .toString()
      .replace(/^Ph\s*/i, '')
      .trim();

    const onlineLink = item.link_hoc_online || item.online_link || item.link_zoom || item.zoom_link || '';
    const lecturer = item.giang_vien || item.ten_giang_vien || item.gv || '';
    const colorIndex = getColorIndexForSubject(subjectCode, colorMap);

    // XỬ LÝ 1: Chuỗi tkb trong to_hoc.tkb hoặc item.tkb (VD: "Thứ 2 (tiết 13->15) từ 02/03/2026 đến 18/05/2026 Ph.Online")
    const tkbStr = item.tkb || item.to_hoc?.tkb;
    if (tkbStr && typeof tkbStr === 'string') {
      const parsedSegments = parseTkbString(tkbStr);
      for (const seg of parsedSegments) {
        if (!seg.startDate || !seg.endDate) continue;

        // Cập nhật subject summary
        if (!subjectMap.has(subjectCode)) {
          subjectMap.set(subjectCode, {
            subjectCode,
            subjectName,
            group,
            classCode,
            room: seg.room || room,
            totalSessions: 0,
            startDate: formatIsoDate(seg.startDate),
            endDate: formatIsoDate(seg.endDate),
            dayOfWeekStr: seg.dayOfWeekStr,
            periodStr: seg.periodStr,
            colorIndex,
          });
        }

        // Tạo sự kiện cho từng ngày trong khoảng [startDate, endDate]
        const curDate = new Date(seg.startDate.getTime());
        const endDateObj = new Date(seg.endDate.getTime());

        while (curDate <= endDateObj) {
          const jsDay = curDate.getDay();
          const curDow = jsDay === 0 ? 8 : jsDay + 1;

          if (curDow === seg.dayOfWeekNum) {
            const dateStr = formatIsoDate(curDate);
            const eventKey = `${subjectCode}_${dateStr}_${seg.startPeriod}_${seg.room}`;

            if (!seenEventKeys.has(eventKey)) {
              seenEventKeys.add(eventKey);
              const ev: TimetableCalendarEvent = {
                id: `ev_${dateStr}_${subjectCode}_${seg.startPeriod}_${Math.random().toString(36).slice(2, 6)}`,
                date: dateStr,
                dayOfWeekStr: seg.dayOfWeekStr,
                dayOfWeekNum: seg.dayOfWeekNum,
                subjectName,
                subjectCode,
                group,
                classCode,
                periodStr: seg.periodStr,
                startPeriod: seg.startPeriod,
                endPeriod: seg.endPeriod,
                startTime: seg.startTime,
                endTime: seg.endTime,
                startMinutes: seg.startMinutes,
                room: seg.room || room,
                onlineLink: onlineLink || undefined,
                lecturer: lecturer || undefined,
                shift: getShift(seg.startPeriod, seg.startMinutes),
                colorIndex,
                rawSession: item,
              };
              events.push(ev);

              const subRec = subjectMap.get(subjectCode);
              if (subRec) subRec.totalSessions++;
            }
          }

          curDate.setDate(curDate.getDate() + 1);
        }
      }
    } else {
      // XỬ LÝ 2: Item dạng đối tượng JSON trực tiếp (có ngay_hoc hoặc tuan_tu_ngay)
      let itemDate: Date | null = null;
      const rawDateStr = item.ngay_hoc || item.ngay_hoc_chuan || item.ngay_day || item.date;
      if (rawDateStr) {
        itemDate = parseTkbDate(String(rawDateStr));
      }

      const startRangeStr = item.tu_ngay || item.ngay_bat_dau || item.tuan_tu_ngay;
      const endRangeStr = item.den_ngay || item.ngay_ket_thuc || item.tuan_den_ngay;
      let startDate = startRangeStr ? parseTkbDate(String(startRangeStr)) : null;
      let endDate = endRangeStr ? parseTkbDate(String(endRangeStr)) : null;

      let dayOfWeekNum = 2;
      const rawThu = item.thu_kieu_so ?? item.thu ?? item.day_of_week;
      if (rawThu !== undefined && rawThu !== null) {
        const thuStr = String(rawThu).trim();
        if (thuStr === '8' || thuStr.toLowerCase().includes('cn') || thuStr.toLowerCase().includes('chủ')) {
          dayOfWeekNum = 8;
        } else {
          const parsedNum = parseInt(thuStr.replace(/\D/g, ''), 10);
          if (parsedNum >= 2 && parsedNum <= 8) dayOfWeekNum = parsedNum;
          else if (parsedNum === 1) dayOfWeekNum = 8;
        }
      }

      let startPeriod = Number(item.tiet_bat_dau ?? item.tiet_bd ?? item.tiet_dau ?? item.start_period) || 13;
      let endPeriod = Number(item.tiet_ket_thuc ?? item.tiet_kt ?? item.end_period);
      if (!endPeriod || isNaN(endPeriod)) {
        const soTiet = Number(item.so_tiet) || 3;
        endPeriod = startPeriod + soTiet - 1;
      }

      const startTime = item.gio_bat_dau || item.gio_bd || PERIOD_TIMES[startPeriod]?.start || '19:00';
      const endTime = item.gio_ket_thuc || item.gio_kt || PERIOD_TIMES[endPeriod]?.end || '21:50';
      let startMinutes = PERIOD_TIMES[startPeriod]?.startMin || 19 * 60;
      if (item.gio_bat_dau || item.gio_bd) {
        const tm = String(item.gio_bat_dau || item.gio_bd).match(/(\d+)[h:](\d+)/i);
        if (tm) {
          startMinutes = parseInt(tm[1], 10) * 60 + parseInt(tm[2], 10);
        }
      }

      const periodStr = item.tiet_hoc || item.periodStr || `Tiết ${startPeriod}->${endPeriod}`;
      const dayOfWeekStr = item.thu_chu || dowMap[dayOfWeekNum] || `Thứ ${dayOfWeekNum}`;

      // Nếu có ngày học cụ thể
      if (itemDate) {
        const dateStr = formatIsoDate(itemDate);
        const eventKey = `${subjectCode}_${dateStr}_${startPeriod}_${room}`;

        if (!seenEventKeys.has(eventKey)) {
          seenEventKeys.add(eventKey);
          events.push({
            id: `ev_${dateStr}_${subjectCode}_${startPeriod}_${Math.random().toString(36).slice(2, 6)}`,
            date: dateStr,
            dayOfWeekStr,
            dayOfWeekNum,
            subjectName,
            subjectCode,
            group,
            classCode,
            periodStr,
            startPeriod,
            endPeriod,
            startTime,
            endTime,
            startMinutes,
            room,
            onlineLink: onlineLink || undefined,
            lecturer: lecturer || undefined,
            shift: getShift(startPeriod, startMinutes),
            colorIndex,
            rawSession: item,
          });

          if (!subjectMap.has(subjectCode)) {
            subjectMap.set(subjectCode, {
              subjectCode,
              subjectName,
              group,
              classCode,
              room,
              totalSessions: 1,
              startDate: dateStr,
              endDate: dateStr,
              dayOfWeekStr,
              periodStr,
              colorIndex,
            });
          } else {
            subjectMap.get(subjectCode)!.totalSessions++;
          }
        }
      } else if (startDate && endDate) {
        // Lặp qua khoảng ngày
        const curDate = new Date(startDate.getTime());
        const endDateObj = new Date(endDate.getTime());

        if (!subjectMap.has(subjectCode)) {
          subjectMap.set(subjectCode, {
            subjectCode,
            subjectName,
            group,
            classCode,
            room,
            totalSessions: 0,
            startDate: formatIsoDate(startDate),
            endDate: formatIsoDate(endDate),
            dayOfWeekStr,
            periodStr,
            colorIndex,
          });
        }

        while (curDate <= endDateObj) {
          const jsDay = curDate.getDay();
          const curDow = jsDay === 0 ? 8 : jsDay + 1;

          if (curDow === dayOfWeekNum) {
            const dateStr = formatIsoDate(curDate);
            const eventKey = `${subjectCode}_${dateStr}_${startPeriod}_${room}`;

            if (!seenEventKeys.has(eventKey)) {
              seenEventKeys.add(eventKey);
              events.push({
                id: `ev_${dateStr}_${subjectCode}_${startPeriod}_${Math.random().toString(36).slice(2, 6)}`,
                date: dateStr,
                dayOfWeekStr,
                dayOfWeekNum,
                subjectName,
                subjectCode,
                group,
                classCode,
                periodStr,
                startPeriod,
                endPeriod,
                startTime,
                endTime,
                startMinutes,
                room,
                onlineLink: onlineLink || undefined,
                lecturer: lecturer || undefined,
                shift: getShift(startPeriod, startMinutes),
                colorIndex,
                rawSession: item,
              });

              subjectMap.get(subjectCode)!.totalSessions++;
            }
          }

          curDate.setDate(curDate.getDate() + 1);
        }
      }
    }
  }

  // Sắp xếp các sự kiện theo ngày và giờ bắt đầu
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startMinutes - b.startMinutes;
  });

  // Lọc các ca học sắp diễn ra (từ ngày hôm nay)
  const todayStr = formatIsoDate(new Date());
  const upcomingEvents = events.filter((e) => e.date >= todayStr).slice(0, 20);

  const subjects = Array.from(subjectMap.values()).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  const calculatedCredits = subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
  const calculatedTuitionFee = subjects.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);

  return {
    success: true,
    username: cleanUsername,
    semesterId: currentSemester,
    semesterName: `Học kỳ ${String(currentSemester).slice(-1)} Năm học ${String(currentSemester).slice(0, 4)}`,
    isConfigured,
    hasLinkedAccount,
    isLiveSync,
    lastSyncAt,
    totalCredits: calculatedCredits,
    tuitionFee: calculatedTuitionFee,
    totalEvents: events.length,
    uniqueSubjectsCount: subjects.length,
    subjects,
    events,
    upcomingEvents,
  };
}
