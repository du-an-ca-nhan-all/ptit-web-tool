import { prisma } from '@/src/lib/prisma';
import { fetchStudentTimetableFromQLDTTX } from '@/src/features/external-portal/server/qldttxServerService';
import { isSessionOnDate, parseTkbString } from './tkbParser';
import { parseSessionFromApiItem } from './timetableItemParser';
import type { ParsedClassSession } from './types';

/**
 * Lấy toàn bộ danh sách ca học trong học kỳ của sinh viên từ API cổng QLDTTX
 * (https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky)
 * và fallback sang cơ sở dữ liệu CourseRegistration nếu cần.
 */
export async function getStudentAllSemesterSessions(username: string): Promise<any[]> {
  // 1. Thử gọi trực tiếp API QLDTTX nếu sinh viên đã cấu hình tài khoản ExternalAccount
  try {
    const extAccount = await prisma.externalAccount.findFirst({
      where: {
        username,
        systemKey: 'QLDTTX_PTTC1',
      },
    });

    if (extAccount && (extAccount.token || extAccount.extPassword)) {
      const fetched = await fetchStudentTimetableFromQLDTTX({
        username: extAccount.extUsername || username,
        password: extAccount.extPassword,
        token: extAccount.token,
      });

      // Cập nhật token mới nếu có làm mới
      if (fetched.newToken && fetched.newToken !== extAccount.token) {
        await prisma.externalAccount
          .update({
            where: { id: extAccount.id },
            data: {
              token: fetched.newToken,
              lastSyncAt: new Date(),
              status: 'CONNECTED',
              syncMessage: 'Đã cập nhật Token QLDTTX từ API TKB.',
            },
          })
          .catch(() => {});
      }

      if (Array.isArray(fetched.rawList) && fetched.rawList.length > 0) {
        // Lưu vào DB StudentTimetableRecord
        await prisma.studentTimetableRecord
          .upsert({
            where: { username },
            create: {
              username,
              rawData: JSON.stringify(fetched),
              semesterId: fetched.currentSemester || null,
              totalEvents: fetched.rawList.length,
              lastPulledAt: new Date(),
            },
            update: {
              rawData: JSON.stringify(fetched),
              semesterId: fetched.currentSemester || null,
              totalEvents: fetched.rawList.length,
              lastPulledAt: new Date(),
            },
          })
          .catch(() => {});

        return fetched.rawList;
      }
    }
  } catch (apiErr: any) {
    console.warn(`[getStudentAllSemesterSessions] Không thể gọi API TKB QLDTTX cho ${username}:`, apiErr?.message || apiErr);
  }

  // 2. Fallback sang bảng StudentTimetableRecord trong CSDL
  try {
    const cachedRecord = await prisma.studentTimetableRecord.findUnique({
      where: { username },
    });

    if (cachedRecord && cachedRecord.rawData) {
      const parsed = JSON.parse(cachedRecord.rawData);
      const list =
        parsed?.rawList ||
        parsed?.data?.ds_thoi_khoa_bieu ||
        parsed?.data?.ds_tkb_tuan ||
        parsed?.data?.ds_kqdkmh ||
        parsed?.ds_kqdkmh ||
        [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (dbErr: any) {
    console.error(`[getStudentAllSemesterSessions] Lỗi truy vấn DB StudentTimetableRecord cho ${username}:`, dbErr);
  }

  // 3. Fallback sang bảng CourseRegistration trong CSDL
  try {
    const dbCourseReg = await prisma.courseRegistration.findFirst({
      where: { username },
    });

    if (dbCourseReg && dbCourseReg.data) {
      const parsed = JSON.parse(dbCourseReg.data);
      const list =
        parsed?.data?.ds_thoi_khoa_bieu ||
        parsed?.data?.ds_tkb_tuan ||
        parsed?.data?.ds_kqdkmh ||
        parsed?.ds_kqdkmh ||
        [];
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (dbErr: any) {
    console.error(`[getStudentAllSemesterSessions] Lỗi truy vấn DB CourseRegistration cho ${username}:`, dbErr);
  }

  return [];
}

/**
 * Lấy tất cả ca học của sinh viên vào ngày cụ thể.
 * Tự động phân tích từ danh sách TKB học kỳ (API QLDTTX hoặc DB fallback).
 */
export async function getStudentClassSessionsForDate(
  username: string,
  targetDateVN: Date,
  cachedRawList?: any[]
): Promise<ParsedClassSession[]> {
  const rawList = cachedRawList || (await getStudentAllSemesterSessions(username));
  const sessionsToday: ParsedClassSession[] = [];

  for (const item of rawList) {
    const toHoc = item.to_hoc;
    if (toHoc && toHoc.tkb) {
      const parsedTkb = parseTkbString(toHoc.tkb);
      for (const seg of parsedTkb) {
        if (isSessionOnDate(seg, targetDateVN)) {
          sessionsToday.push({
            subjectName: toHoc.ten_mon || toHoc.ten_mon_hoc || 'Môn học',
            subjectCode: toHoc.ma_mon || toHoc.ma_mon_hoc || '',
            group: toHoc.nhom_to || toHoc.nhom || '',
            classCode: toHoc.lop || toHoc.ma_lop || '',
            dayOfWeekStr: seg.dayOfWeekStr,
            dayOfWeekNum: seg.dayOfWeekNum,
            periodStr: seg.periodStr,
            startPeriod: seg.startPeriod,
            endPeriod: seg.endPeriod,
            startTime: seg.startTime,
            endTime: seg.endTime,
            startMinutes: seg.startMinutes,
            room: seg.room,
            startDate: seg.startDate,
            endDate: seg.endDate,
          });
        }
      }
    } else {
      const parsedDirect = parseSessionFromApiItem(item, targetDateVN);
      sessionsToday.push(...parsedDirect);
    }
  }

  // Khử trùng lặp ca học nếu xuất hiện nhiều lần
  const uniqueSessions: ParsedClassSession[] = [];
  const seenKeys = new Set<string>();

  for (const s of sessionsToday) {
    const key = `${s.subjectCode}_${s.startPeriod}_${s.room}_${s.dayOfWeekNum}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueSessions.push(s);
    }
  }

  // Sắp xếp ca học theo thời gian bắt đầu
  uniqueSessions.sort((a, b) => a.startMinutes - b.startMinutes);
  return uniqueSessions;
}
