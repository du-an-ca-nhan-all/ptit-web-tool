import { prisma } from '@/src/lib/prisma';
import { enqueueSingleGlobalJobType } from './enqueue';

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
      if (!rec.rawData) continue;
      try {
        const parsed = JSON.parse(rec.rawData);
        const rawExams = parsed?.exams || parsed?.data?.ds_lich_thi || (Array.isArray(parsed) ? parsed : []) || [];

        // Kiểm tra xem sinh viên có môn thi hôm nay không
        const hasExamToday = rawExams.some((ex: any) => {
          const examDateStr = (ex.ngay_thi || ex.ngayThi || ex.NgayThi || '').trim();
          const examDateIso = (ex.dateIso || '').trim();
          return examDateStr === todayVnStr || examDateIso === todayIsoStr;
        });

        if (!hasExamToday) continue;

        // Tính chu kỳ quét ngẫu nhiên 20 đến 30 phút (phân bổ ngẫu nhiên theo hash username)
        let hash = 0;
        for (let i = 0; i < rec.username.length; i++) {
          hash = (hash << 5) - hash + rec.username.charCodeAt(i);
          hash |= 0;
        }
        const randomIntervalMinutes = 20 + (Math.abs(hash) % 11); // 20, 21, 22, ..., 30 phút
        const randomIntervalMs = randomIntervalMinutes * 60 * 1000;

        const lastPulledMs = rec.lastPulledAt ? new Date(rec.lastPulledAt).getTime() : 0;
        const timeSinceLastPull = Date.now() - lastPulledMs;

        if (timeSinceLastPull >= randomIntervalMs) {
          // Kiểm tra xem đã có task QUEUED hoặc RUNNING cho user này trong queue chưa
          const activeTask = await prisma.globalSyncQueueItem.findFirst({
            where: {
              username: rec.username,
              jobType: { in: ['SYNC_EXAMS', 'SYNC_TODAY_EXAMS'] },
              status: { in: ['QUEUED', 'RUNNING'] },
            },
          });

          if (!activeTask) {
            dueUsernames.push(rec.username);
          }
        }
      } catch {}
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
