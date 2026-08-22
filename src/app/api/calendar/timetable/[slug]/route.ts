import { NextRequest, NextResponse } from 'next/server';
import { getStudentTimetableCalendar } from '@/src/features/external-portal/server/studentTimetableServerService';
import { generateStudentTimetableIcs } from '@/src/features/external-portal/server/timetableIcsService';
import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Public REST Endpoint: /api/calendar/timetable/[slug]
 * Ví dụ:
 * - /api/calendar/timetable/K25DTCN402.ics
 * - /api/calendar/timetable/k25dtcn402.ics
 * - /api/calendar/timetable/K25DTCN402
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug || '').trim();
    
    // Tách bỏ đuôi .ics nếu có
    const targetUsername = cleanSlug.replace(/\.ics$/i, '').toUpperCase();

    if (!targetUsername) {
      return new NextResponse('Mã sinh viên không hợp lệ', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const { searchParams } = new URL(req.url);
    const alarmParam = searchParams.get('alarm');
    const alarmMinutes = alarmParam ? parseInt(alarmParam, 10) : 30;

    // 1. Kiểm tra tài khoản sinh viên và Cổng QLDTTX
    const [extAccount, studentInfo] = await Promise.all([
      prisma.externalAccount.findFirst({
        where: {
          username: targetUsername,
          systemKey: 'QLDTTX_PTTC1',
        },
      }),
      prisma.student.findUnique({
        where: { maSV: targetUsername },
        select: { hoTen: true, hoLot: true, ten: true },
      }),
    ]);

    // Nếu chưa liên kết QLDTTX
    if (!extAccount || (!extAccount.extPassword && !extAccount.token)) {
      const notConfiguredIcs = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PTIT Web Tool//Student Timetable Sync//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:Lịch Học PTIT - ${targetUsername}`,
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
        'BEGIN:VEVENT',
        `UID:NOT-LINKED-${targetUsername}@ptit.webtool`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTSTART;TZID=Asia/Ho_Chi_Minh:${new Date().toISOString().slice(0, 10).replace(/-/g, '')}T080000`,
        `DTEND;TZID=Asia/Ho_Chi_Minh:${new Date().toISOString().slice(0, 10).replace(/-/g, '')}T090000`,
        `SUMMARY:[PTIT] Chưa liên kết Cổng QLĐT (${targetUsername})`,
        `DESCRIPTION:Sinh viên ${targetUsername} chưa liên kết tài khoản Cổng Quản Lý Đào Tạo trên PTIT Web Tool. Vui lòng vào Cài đặt -> Tài khoản cổng trường để liên kết và tự động đồng bộ lịch học.`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      return new NextResponse(notConfiguredIcs, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `inline; filename="timetable_${targetUsername}.ics"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Lấy dữ liệu thời khóa biểu
    const timetableData = await getStudentTimetableCalendar(targetUsername, {
      forceRefresh: false,
    });

    const studentFullName = studentInfo?.hoTen || studentInfo ? `${studentInfo.hoLot || ''} ${studentInfo.ten || ''}`.trim() : targetUsername;

    // 3. Tạo chuỗi iCalendar
    const icsContent = generateStudentTimetableIcs(targetUsername, timetableData, {
      studentFullName,
      alarmMinutesBefore: isNaN(alarmMinutes) ? 30 : alarmMinutes,
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="timetable_${targetUsername}.ics"`,
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[/api/calendar/timetable/[slug]] Lỗi:', error);
    return new NextResponse(`Lỗi máy chủ khi tạo lịch học: ${error?.message || 'Unknown error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
