import { prisma } from '@/src/lib/prisma';
import { enqueueSingleGlobalJobType } from './enqueue';

function computeUsernameIntervalMs(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const randomIntervalMinutes = 20 + (Math.abs(hash) % 11);
  return randomIntervalMinutes * 60 * 1000;
}

async function isStudentDueForTodayExamSync(params: {
  rec: { username: string; rawData: string | null; lastPulledAt: Date | null };
  todayVnStr: string;
  todayIsoStr: string;
}): Promise<boolean> {
  const { rec, todayVnStr, todayIsoStr } = params;
  if (!rec.rawData) return false;
  try {
    const parsed = JSON.parse(rec.rawData);
    const rawExams = parsed?.exams || parsed?.data?.ds_lich_thi || (Array.isArray(parsed) ? parsed : []) || [];
    const hasExamToday = rawExams.some((ex: any) => {
      const examDateStr = (ex.ngay_thi || ex.ngayThi || ex.NgayThi || '').trim();
      const examDateIso = (ex.dateIso || '').trim();
      return examDateStr === todayVnStr || examDateIso === todayIsoStr;
    });
    if (!hasExamToday) return false;

    const lastPulledMs = rec.lastPulledAt ? new Date(rec.lastPulledAt).getTime() : 0;
    if (Date.now() - lastPulledMs < computeUsernameIntervalMs(rec.username)) return false;

    const activeTask = await prisma.globalSyncQueueItem.findFirst({
      where: {
        username: rec.username,
        jobType: { in: ['SYNC_EXAMS', 'SYNC_TODAY_EXAMS'] },
        status: { in: ['QUEUED', 'RUNNING'] },
      },
    });
    return !activeTask;
  } catch (caughtError) {
    console.warn(`[todayExamsSync] Non-fatal error:`, caughtError);
    return false;
  }
}

/**
 * Quét và kiểm tra các sinh viên có ca thi HÔM NAY.
 * Định kỳ 20 đến 30 phút (ngẫu nhiên hóa theo từng sinh viên) sẽ cho vào hàng đợi Global
 * để worker quét và kiểm tra dần dần (rate limit), tránh dồn ồ ạt lên máy chủ QLDTTX.
 */
export async function checkAndQueueTodayExamsSync(
  currentDateStr: string,
  nowVN: Date
): Promise<{ queuedCount: number; usernames: string[] }> {
  try {
    const d = String(nowVN.getDate()).padStart(2, '0');
    const m = String(nowVN.getMonth() + 1).padStart(2, '0');
    const y = nowVN.getFullYear();
    const todayVnStr = `${d}/${m}/${y}`;
    const todayIsoStr = currentDateStr; // YYYY-MM-DD

    // Lấy toàn bộ danh sách StudentQldtExamRecord đã lưu
    const allRecords = await prisma.studentQldtExamRecord.findMany({
      select: {
        username: true,
        rawData: true,
        lastPulledAt: true,
      },
    });

    const dueUsernames: string[] = [];

    for (const rec of allRecords) {
      if (await isStudentDueForTodayExamSync({ rec, todayVnStr, todayIsoStr })) {
        dueUsernames.push(rec.username);
      }
    }

    if (dueUsernames.length > 0) {
      console.log(
        `🔥 [Today Exams Sync] Phát hiện ${dueUsernames.length} sinh viên có ca thi hôm nay đến hạn quét lại (20-30 phút):`,
        dueUsernames
      );
      await enqueueSingleGlobalJobType({
        jobType: 'SYNC_TODAY_EXAMS',
        title: `Quét biến động ca thi hôm nay (${dueUsernames.length} SV có lịch thi)`,
        triggeredBy: 'SYSTEM_CRON',
        targetUsernames: dueUsernames,
      });
    }

    return { queuedCount: dueUsernames.length, usernames: dueUsernames };
  } catch (err: any) {
    console.error('[checkAndQueueTodayExamsSync] Lỗi quét ca thi hôm nay:', err);
    return { queuedCount: 0, usernames: [] };
  }
}
