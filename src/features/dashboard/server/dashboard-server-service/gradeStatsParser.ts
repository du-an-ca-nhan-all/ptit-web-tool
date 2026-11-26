export function parseSlinkRichStats(record: any) {
  if (!record) return null;
  let latestSemester: any = null;
  let totalSemesters = 0;
  const gradeDist = { aCount: 0, bCount: 0, cCount: 0, dCount: 0, fCount: 0 };
  let inProgressCount = record.totalInProgress || 0;

  if (record.rawData) {
    try {
      const raw = typeof record.rawData === 'string' ? JSON.parse(record.rawData) : record.rawData;
      const courses: any[] = Array.isArray(raw.courses) ? raw.courses : [];
      const semesters: any[] = Array.isArray(raw.semesters) ? raw.semesters : [];
      totalSemesters = semesters.length;

      // Find latest semester with grades
      if (semesters.length > 0) {
        const sorted = [...semesters].sort((a, b) => {
          const aKey = String(a.maHocKy || a.hocKy?.ma || '');
          const bKey = String(b.maHocKy || b.hocKy?.ma || '');
          return bKey.localeCompare(aKey, undefined, { numeric: true });
        });
        const sem = sorted[0];
        const semName = sem.hocKy?.ten || sem.tenHocKy || (sem.maHocKy ? `Học kỳ ${sem.maHocKy}` : undefined);
        const semGpa4 =
          sem.trungBinhHocKyThang4 !== undefined && sem.trungBinhHocKyThang4 !== null
            ? parseFloat(sem.trungBinhHocKyThang4)
            : undefined;
        const semGpa10 =
          sem.trungBinhHocKy !== undefined && sem.trungBinhHocKy !== null
            ? parseFloat(sem.trungBinhHocKy)
            : undefined;
        const semCredits =
          sem.tongSoTinChiHocKy || sem.tongSoTinChiDangKyHocKy || sem.tongSoTinChiTichLuyHocKy || 0;
        if (semName) {
          latestSemester = {
            name: semName,
            gpa4: semGpa4 !== undefined && !isNaN(semGpa4) ? semGpa4 : null,
            gpa10: semGpa10 !== undefined && !isNaN(semGpa10) ? semGpa10 : null,
            credits: Number(semCredits) || 0,
          };
        }
      }

      // Count grade distribution from courses
      for (const c of courses) {
        const letter = String(c.diemChuLan1 || c.diemChu || '').trim().toUpperCase();
        if (letter === 'A+' || letter === 'A') gradeDist.aCount++;
        else if (letter === 'B+' || letter === 'B') gradeDist.bCount++;
        else if (letter === 'C+' || letter === 'C') gradeDist.cCount++;
        else if (letter === 'D+' || letter === 'D') gradeDist.dCount++;
        else if (letter === 'F' || letter === 'KĐ' || letter === 'KHÔNG ĐẠT') gradeDist.fCount++;
        else if (!letter || letter === 'X' || letter === 'IN_PROGRESS' || letter === 'CHUA_CO')
          inProgressCount++;
      }
    } catch (e) {
      console.warn(`[gradeStatsParser] Non-fatal error:`, e);
    }
  }

  const passed = record.totalPassed || 0;
  const failed = record.totalFailed || 0;
  const total = record.totalSubjects || 0;
  const gradedTotal = passed + failed;
  const passRate = gradedTotal > 0 ? Math.round((passed / gradedTotal) * 100) : total > 0 ? 100 : 0;
  const regCredits = record.creditsReg || 0;
  const passedCredits = record.creditsPassed || record.creditsAcc || 0;
  const creditPassRate =
    regCredits > 0 ? Math.min(100, Math.round((passedCredits / regCredits) * 100)) : 100;

  return {
    latestSemester,
    totalSemesters,
    gradeDistribution:
      gradeDist.aCount + gradeDist.bCount + gradeDist.cCount + gradeDist.dCount + gradeDist.fCount > 0
        ? gradeDist
        : null,
    passRate,
    creditPassRate,
    inProgressCount,
  };
}

export function parseQlhtRichStats(record: any) {
  if (!record) return null;
  let latestSemester: any = null;
  let totalSemesters = 0;
  const gradeDist = { aCount: 0, bCount: 0, cCount: 0, dCount: 0, fCount: 0 };
  let inProgressCount = record.totalInProgress || 0;

  if (record.rawData) {
    try {
      const raw = typeof record.rawData === 'string' ? JSON.parse(record.rawData) : record.rawData;
      const semesters: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.semesters)
        ? raw.semesters
        : Array.isArray(raw.ds_diem_hoc_ky)
        ? raw.ds_diem_hoc_ky
        : [];
      totalSemesters = semesters.length;

      if (semesters.length > 0) {
        const sem = semesters[semesters.length - 1] || semesters[0];
        const semName = sem.ten_hoc_ky || (sem.hoc_ky ? `Học kỳ ${sem.hoc_ky}` : undefined);
        const semGpa4 =
          sem.diem_tb_hk_he_4 !== undefined && sem.diem_tb_hk_he_4 !== null
            ? parseFloat(sem.diem_tb_hk_he_4)
            : undefined;
        const semGpa10 =
          sem.diem_tb_hk_he_10 !== undefined && sem.diem_tb_hk_he_10 !== null
            ? parseFloat(sem.diem_tb_hk_he_10)
            : undefined;
        const semCredits = sem.so_tin_chi_hk || sem.so_tin_chi_dat_hk || 0;
        if (semName) {
          latestSemester = {
            name: semName,
            gpa4: semGpa4 !== undefined && !isNaN(semGpa4) ? semGpa4 : null,
            gpa10: semGpa10 !== undefined && !isNaN(semGpa10) ? semGpa10 : null,
            credits: Number(semCredits) || 0,
          };
        }

        // Loop over all courses in all semesters
        for (const s of semesters) {
          const courses: any[] = Array.isArray(s.ds_diem_mon_hoc)
            ? s.ds_diem_mon_hoc
            : Array.isArray(s.courses)
            ? s.courses
            : [];
          for (const c of courses) {
            const letter = String(c.diem_tk_chu || c.letterGrade || '').trim().toUpperCase();
            if (letter === 'A+' || letter === 'A') gradeDist.aCount++;
            else if (letter === 'B+' || letter === 'B') gradeDist.bCount++;
            else if (letter === 'C+' || letter === 'C') gradeDist.cCount++;
            else if (letter === 'D+' || letter === 'D') gradeDist.dCount++;
            else if (letter === 'F' || letter === 'KĐ' || letter === 'KHÔNG ĐẠT') gradeDist.fCount++;
            else if (!letter || letter === 'N/A' || letter === '-') inProgressCount++;
          }
        }
      }
    } catch (e) {
      console.warn(`[gradeStatsParser] Non-fatal error:`, e);
    }
  }

  const passed = record.totalPassed || 0;
  const failed = record.totalFailed || 0;
  const total = record.totalSubjects || 0;
  const gradedTotal = passed + failed;
  const passRate = gradedTotal > 0 ? Math.round((passed / gradedTotal) * 100) : total > 0 ? 100 : 0;
  const regCredits = record.creditsReg || 0;
  const passedCredits = record.creditsPassed || record.creditsAcc || 0;
  const creditPassRate =
    regCredits > 0 ? Math.min(100, Math.round((passedCredits / regCredits) * 100)) : 100;

  return {
    latestSemester,
    totalSemesters,
    gradeDistribution:
      gradeDist.aCount + gradeDist.bCount + gradeDist.cCount + gradeDist.dCount + gradeDist.fCount > 0
        ? gradeDist
        : null,
    passRate,
    creditPassRate,
    inProgressCount,
  };
}
