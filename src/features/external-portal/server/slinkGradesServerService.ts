import { prisma } from '@/src/lib/prisma';
import {
  getValidSlinkTokenOrRefresh,
  SLINK_USER_AGENT,
} from './slinkServerService';
import {
  StudentGradesResult,
  StudentCourseGrade,
  SemesterGradeSummary,
  GpaTrendItem,
  GradeDistributionBucket,
  AcademicTargetGoal,
  CourseComponentGrade,
} from './studentGradesServerService';

export const SLINK_QLDT_API_BASE = 'https://gwdu.ptit.edu.vn/qldt';

export const SLINK_COMPONENT_NAMES: Record<number, { code: string; name: string }> = {
  1: { code: 'CC', name: 'Chuyên cần' },
  2: { code: 'BTTL', name: 'Bài tập, thảo luận' },
  3: { code: 'TBKT', name: 'Trung bình kiểm tra' },
  4: { code: 'TGK', name: 'Thi giữa học phần' },
  5: { code: 'TNTH', name: 'Thí nghiệm, thực hành' },
  6: { code: 'ĐGQTH', name: 'Điểm ĐGTK trong quá trình học' },
  7: { code: 'TP7', name: 'Điểm thành phần 7' },
  8: { code: 'TP8', name: 'Điểm thành phần 8' },
  9: { code: 'TP9', name: 'Điểm thành phần 9' },
  10: { code: 'TP10', name: 'Điểm thành phần 10' },
};

function parseScore(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Gọi API S-Link lấy toàn bộ thông tin kết quả học tập của sinh viên
 */
export async function fetchStudentGradesFromSlink(credentials: {
  username: string;
  password?: string;
  token?: string | null;
  refreshToken?: string | null;
}): Promise<{
  sinhVien: any;
  khoaNganh: any;
  semesters: any[];
  courses: any[];
  statistics: any;
  newToken?: string;
  newRefreshToken?: string;
  lastPulledAt: string;
}> {
  // Lấy hoặc refresh token
  const authRes = await getValidSlinkTokenOrRefresh({
    username: credentials.username,
    password: credentials.password,
    existingToken: credentials.token,
    refreshToken: credentials.refreshToken,
  });

  const rawToken = authRes.token.replace(/^Bearer\s+/i, '').trim();
  const headers = {
    Authorization: `Bearer ${rawToken}`,
    'x-data-partition-code': 'PTIT',
    'Accept-Language': 'vi',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': SLINK_USER_AGENT,
  };

  // 1. Lấy thông tin sinh viên & ngành
  const resMe = await fetch(`${SLINK_QLDT_API_BASE}/sinh-vien/me`, {
    headers,
  });
  if (!resMe.ok) {
    throw new Error(`Gọi API thông tin sinh viên S-Link thất bại (HTTP ${resMe.status})`);
  }
  const dataMe = await resMe.json();
  const sinhVien = dataMe?.data || null;

  // 2. Lấy thông tin khóa ngành
  let khoaNganh = null;
  try {
    const resKhoaNganh = await fetch(`${SLINK_QLDT_API_BASE}/sinh-vien/me/khoa-nganh`, {
      headers,
    });
    if (resKhoaNganh.ok) {
      const dataKhoaNganh = await resKhoaNganh.json();
      khoaNganh = dataKhoaNganh?.data || null;
    }
  } catch (err) {
    console.warn('[fetchStudentGradesFromSlink] Lỗi lấy khóa ngành:', err);
  }

  const maKhoaNganh =
    khoaNganh?.khoaNganhChinh?.ma ||
    sinhVien?.maKhoaNganh ||
    sinhVien?.kqhtTichLuyNganh1?.maKhoaNganh ||
    '';

  // 3. Lấy danh sách kết quả học tập theo từng học kỳ
  let semesters: any[] = [];
  if (maKhoaNganh) {
    try {
      const resSem = await fetch(
        `${SLINK_QLDT_API_BASE}/kqht-hoc-ky/me/many/khoa-nganh/${encodeURIComponent(
          maKhoaNganh
        )}?sort=${encodeURIComponent(JSON.stringify({ maHocKy: 1 }))}`,
        { headers }
      );
      if (resSem.ok) {
        const dataSem = await resSem.json();
        semesters = dataSem?.data || [];
      }
    } catch (err) {
      console.warn('[fetchStudentGradesFromSlink] Lỗi lấy danh sách học kỳ:', err);
    }
  }

  // 4. Lấy danh sách toàn bộ điểm học phần
  let courses: any[] = [];
  const courseUrl = maKhoaNganh
    ? `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/sinh-vien/me?maKhoaNganh=${encodeURIComponent(maKhoaNganh)}`
    : `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/sinh-vien/me`;

  const resCourses = await fetch(courseUrl, { headers });
  if (!resCourses.ok) {
    throw new Error(`Gọi API danh sách môn học & điểm S-Link thất bại (HTTP ${resCourses.status})`);
  }
  const dataCourses = await resCourses.json();
  courses = dataCourses?.data || [];

  // 5. Lấy thống kê điểm PI / PLO (tùy chọn)
  let statistics: any = null;
  if (maKhoaNganh) {
    try {
      const resStat = await fetch(
        `${SLINK_QLDT_API_BASE}/diem-hp-sv-hk/thong-ke-diem-pi/me/khoa-nganh/${encodeURIComponent(
          maKhoaNganh
        )}`,
        { headers }
      );
      if (resStat.ok) {
        const dataStat = await resStat.json();
        statistics = dataStat?.data || null;
      }
    } catch (err) {
      console.warn('[fetchStudentGradesFromSlink] Lỗi lấy thống kê PI:', err);
    }
  }

  return {
    sinhVien,
    khoaNganh,
    semesters,
    courses,
    statistics,
    newToken: authRes.isNew ? authRes.token : undefined,
    newRefreshToken: authRes.isNew ? authRes.refreshToken : undefined,
    lastPulledAt: new Date().toISOString(),
  };
}

/**
 * Xây dựng đối tượng kết quả phân tích học tập từ cấu trúc JSON của S-Link
 */
export function buildSlinkGradeResultFromRawData(
  cleanUsername: string,
  fetchedResult: any,
  options: {
    isConfigured: boolean;
    isLiveSync: boolean;
    isCachedDb: boolean;
    lastSyncAt: string | null;
  }
): StudentGradesResult {
  const sinhVien = fetchedResult?.sinhVien || {};
  const accumulated = sinhVien?.kqhtTichLuyNganh1 || {};
  const rawSemesters: any[] = fetchedResult?.semesters || [];
  const rawCourses: any[] = fetchedResult?.courses || [];

  const processedSemesters: SemesterGradeSummary[] = [];
  const allCourses: StudentCourseGrade[] = [];

  const gradeCounts: Record<string, { count: number; credits: number }> = {
    'A+': { count: 0, credits: 0 },
    A: { count: 0, credits: 0 },
    'B+': { count: 0, credits: 0 },
    B: { count: 0, credits: 0 },
    'C+': { count: 0, credits: 0 },
    C: { count: 0, credits: 0 },
    'D+': { count: 0, credits: 0 },
    D: { count: 0, credits: 0 },
    F: { count: 0, credits: 0 },
    IN_PROGRESS: { count: 0, credits: 0 },
  };

  // Gom các môn học theo mã học kỳ (maHocKy)
  const coursesBySemester: Record<string, any[]> = {};
  for (const c of rawCourses) {
    const hkKey = String(c.maHocKy || 'OTHER');
    if (!coursesBySemester[hkKey]) {
      coursesBySemester[hkKey] = [];
    }
    coursesBySemester[hkKey].push(c);
  }

  // Danh sách các học kỳ đã biết
  const semesterMap = new Map<string, any>();
  for (const s of rawSemesters) {
    const sKey = String(s.maHocKy || s.hocKy?.ma || '');
    if (sKey) {
      semesterMap.set(sKey, s);
    }
  }

  // Thêm cả các học kỳ có trong courses nhưng chưa có trong rawSemesters
  for (const hkKey of Object.keys(coursesBySemester)) {
    if (hkKey !== 'OTHER' && !semesterMap.has(hkKey)) {
      semesterMap.set(hkKey, { maHocKy: hkKey, hocKy: { ma: hkKey, ten: `Học kỳ ${hkKey}` } });
    }
  }

  // Sắp xếp các học kỳ theo thứ tự gần nhất đến cũ nhất (descending)
  const sortedSemesterKeys = Array.from(semesterMap.keys()).sort((a, b) => {
    if (a === 'OTHER') return 1;
    if (b === 'OTHER') return -1;
    return b.localeCompare(a, undefined, { numeric: true });
  });

  for (const semesterId of sortedSemesterKeys) {
    const semData = semesterMap.get(semesterId) || {};
    const semesterName =
      semData.hocKy?.ten ||
      semData.tenHocKy ||
      (semesterId ? `Học kỳ ${semesterId}` : 'Khác');

    const semCoursesRaw = coursesBySemester[semesterId] || [];
    const processedCourses: StudentCourseGrade[] = [];

    for (const c of semCoursesRaw) {
      const subjectCode = String(c.maHocPhan || c.hocPhan?.ma || '').trim();
      const subjectName = String(c.hocPhan?.ten || c.tenLopHocPhan || subjectCode).trim();
      const group = String(c.soThuTuLop || c.tenLopHocPhan || '').trim();
      const credits = Number(c.hocPhan?.soTinChi || 0);

      // Điểm tổng kết hệ 10 và 4
      const finalScore10 = parseScore(c.diemTongKetLan1 ?? c.diemTongKet);
      const finalScore4 = parseScore(c.diemThang4Lan1 ?? c.diemThang4);
      let letterGrade = String(c.diemChuLan1 || c.diemChu || '').trim().toUpperCase();
      if (!letterGrade || letterGrade === 'X' || letterGrade === 'CHUA_CO') {
        letterGrade = finalScore10 === null ? 'IN_PROGRESS' : '';
      }

      // Điểm thi
      const examScore = parseScore(c.diemThi1 ?? c.diemKthp);
      const midtermScore = parseScore(c.diemThanhPhan4 ?? c.diemThanhPhan6 ?? c.diemThanhPhan3);

      // Kiểm tra đạt / rớt
      const isPassed =
        c.dat === true ? true : c.dat === false ? false : finalScore10 !== null ? (finalScore10 >= 4.0) : null;

      const isCalculatedInGpa = c.tichLuy !== false && c.hocPhan?.loaiHocPhan?.isTinhDiem !== false || c.hocPhan?.loaiHocPhan?.isTinhSoTinChiTichLuy;

      // Xây dựng danh sách điểm thành phần
      const components: CourseComponentGrade[] = [];

      for (let i = 1; i <= 10; i++) {
        const weightKey = `trongSo${i}`;
        const scoreKey = `diemThanhPhan${i}`;
        const weight = Number(c[weightKey] || 0);
        const score = parseScore(c[scoreKey]);

        if (weight > 0 || score !== null) {
          const def = SLINK_COMPONENT_NAMES[i] || { code: `TP${i}`, name: `Thành phần ${i}` };
          components.push({
            code: def.code,
            name: def.name,
            weight,
            score,
          });
        }
      }

      // Thêm điểm thi kết thúc học phần vào components
      if (c.trongSoThi1 || examScore !== null) {
        components.push({
          code: 'T1',
          name: 'Thi kết thúc học phần',
          weight: Number(c.trongSoThi1 || 0),
          score: examScore,
        });
      }

      const courseObj: StudentCourseGrade = {
        id: String(c._id || `${semesterId}_${subjectCode}`),
        subjectCode,
        subjectName,
        group,
        credits,
        examScore,
        midtermScore,
        finalScore10,
        finalScore4,
        letterGrade: letterGrade || (isPassed ? 'Đạt' : 'Chưa có'),
        isPassed,
        isCalculatedInGpa,
        reasonNotCalculated: !isCalculatedInGpa ? 'Học phần không tính vào GPA tích lũy' : undefined,
        components,
        semesterId,
        semesterName,
      };

      processedCourses.push(courseObj);
      allCourses.push(courseObj);

      // Thống kê phân bố điểm
      if (isPassed === null || finalScore10 === null) {
        gradeCounts.IN_PROGRESS.count++;
        gradeCounts.IN_PROGRESS.credits += credits;
      } else if (gradeCounts[letterGrade]) {
        gradeCounts[letterGrade].count++;
        gradeCounts[letterGrade].credits += credits;
      }
    }

    const gpa10Sem = parseScore(semData.trungBinhHocKy);
    const gpa4Sem = parseScore(semData.trungBinhHocKyThang4);
    const gpa10Cum = parseScore(semData.trungBinhTichLuyToanKhoa);
    const gpa4Cum = parseScore(semData.trungBinhTichLuyToanKhoaThang4);

    const creditsPassedSem = Number(semData.tongSoTinChiTichLuyHocKy || 0);
    const creditsCum = Number(semData.tongSoTinChiTichLuyToanKhoa || 0);
    const creditsRegSem = Number(semData.tongSoTinChiDangKyHocKy || semData.tongSoTinChiHocKy || 0);
    const classSem = String(semData.hocLucHocKy || semData.hocLuc || 'N/A');

    processedSemesters.push({
      semesterId,
      semesterName,
      gpa10Semester: gpa10Sem,
      gpa4Semester: gpa4Sem,
      gpa10Cumulative: gpa10Cum,
      gpa4Cumulative: gpa4Cum,
      creditsPassedSemester: creditsPassedSem,
      creditsCumulative: creditsCum,
      creditsRegisteredSemester: creditsRegSem,
      classificationSemester: classSem,
      courses: processedCourses,
    });
  }

  // Phân tích tiến độ GPA qua từng học kỳ (sắp xếp theo thứ tự thời gian tăng dần từ cũ đến mới cho biểu đồ timeline)
  const progressionSemesters = [...processedSemesters].sort((a, b) =>
    a.semesterId.localeCompare(b.semesterId, undefined, { numeric: true })
  );
  const gpaProgression: GpaTrendItem[] = progressionSemesters.map((s) => ({
    semesterId: s.semesterId,
    semesterName: s.semesterName,
    gpa10: s.gpa10Semester,
    gpa4: s.gpa4Semester,
    gpaCumulative10: s.gpa10Cumulative,
    gpaCumulative4: s.gpa4Cumulative,
    creditsSemester: s.creditsPassedSemester,
    creditsCumulative: s.creditsCumulative,
  }));

  // Phân bố điểm
  const totalGradedCredits = Object.values(gradeCounts).reduce((acc, curr) => acc + curr.credits, 0);
  const buckets: GradeDistributionBucket[] = [
    {
      grade: 'A+',
      count: gradeCounts['A+'].count,
      credits: gradeCounts['A+'].credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts['A+'].credits / totalGradedCredits) * 100 : 0,
      description: 'Xuất sắc (9.0 - 10.0)',
      colorClass: 'bg-emerald-500 text-white',
    },
    {
      grade: 'A',
      count: gradeCounts.A.count,
      credits: gradeCounts.A.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.A.credits / totalGradedCredits) * 100 : 0,
      description: 'Giỏi (8.5 - 8.9)',
      colorClass: 'bg-teal-500 text-white',
    },
    {
      grade: 'B+',
      count: gradeCounts['B+'].count,
      credits: gradeCounts['B+'].credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts['B+'].credits / totalGradedCredits) * 100 : 0,
      description: 'Khá giỏi (8.0 - 8.4)',
      colorClass: 'bg-blue-500 text-white',
    },
    {
      grade: 'B',
      count: gradeCounts.B.count,
      credits: gradeCounts.B.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.B.credits / totalGradedCredits) * 100 : 0,
      description: 'Khá (7.0 - 7.9)',
      colorClass: 'bg-cyan-500 text-white',
    },
    {
      grade: 'C+',
      count: gradeCounts['C+'].count,
      credits: gradeCounts['C+'].credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts['C+'].credits / totalGradedCredits) * 100 : 0,
      description: 'Trung bình khá (6.5 - 6.9)',
      colorClass: 'bg-amber-500 text-white',
    },
    {
      grade: 'C',
      count: gradeCounts.C.count,
      credits: gradeCounts.C.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.C.credits / totalGradedCredits) * 100 : 0,
      description: 'Trung bình (5.5 - 6.4)',
      colorClass: 'bg-orange-500 text-white',
    },
    {
      grade: 'D+',
      count: gradeCounts['D+'].count,
      credits: gradeCounts['D+'].credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts['D+'].credits / totalGradedCredits) * 100 : 0,
      description: 'Trung bình yếu (5.0 - 5.4)',
      colorClass: 'bg-rose-400 text-white',
    },
    {
      grade: 'D',
      count: gradeCounts.D.count,
      credits: gradeCounts.D.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.D.credits / totalGradedCredits) * 100 : 0,
      description: 'Yếu (4.0 - 4.9)',
      colorClass: 'bg-rose-600 text-white',
    },
    {
      grade: 'F',
      count: gradeCounts.F.count,
      credits: gradeCounts.F.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.F.credits / totalGradedCredits) * 100 : 0,
      description: 'Kém (Dưới 4.0 - Học lại)',
      colorClass: 'bg-red-700 text-white',
    },
    {
      grade: 'IN_PROGRESS',
      count: gradeCounts.IN_PROGRESS.count,
      credits: gradeCounts.IN_PROGRESS.credits,
      percentage: totalGradedCredits > 0 ? (gradeCounts.IN_PROGRESS.credits / totalGradedCredits) * 100 : 0,
      description: 'Đang học / Chưa công bố điểm',
      colorClass: 'bg-slate-400 text-white',
    },
  ];

  // Lấy học kỳ mới nhất có điểm tích lũy để fallback nếu thông tin tổng hợp chưa có
  const latestSemesterWithGpa =
    processedSemesters.find((s) => s.gpa4Cumulative !== null || s.gpa10Cumulative !== null) ||
    (processedSemesters.length > 0 ? processedSemesters[0] : null);

  // Tính tổng hợp toàn khóa
  const gpa10 =
    parseScore(accumulated.trungBinh) ??
    (latestSemesterWithGpa ? latestSemesterWithGpa.gpa10Cumulative : null);
  const gpa4 =
    parseScore(accumulated.trungBinhThang4) ??
    (latestSemesterWithGpa ? latestSemesterWithGpa.gpa4Cumulative : null);

  const totalPassedCredits = Number(
    accumulated.tongSoTinChi || (latestSemesterWithGpa ? latestSemesterWithGpa.creditsCumulative : 0)
  );
  const totalCreditsAccumulated = totalPassedCredits;
  const totalCreditsRegistered = Number(accumulated.tongSoTinChiDangKy || totalPassedCredits);
  const totalInProgressCredits = gradeCounts.IN_PROGRESS.credits;

  let classification = String(accumulated.hocLuc || '').trim();
  if (!classification) {
    if (gpa4 !== null) {
      if (gpa4 >= 3.6) classification = 'Xuất sắc';
      else if (gpa4 >= 3.2) classification = 'Giỏi';
      else if (gpa4 >= 2.5) classification = 'Khá';
      else if (gpa4 >= 2.0) classification = 'Trung bình';
      else if (gpa4 >= 1.0) classification = 'Yếu';
      else classification = 'Kém';
    } else {
      classification = 'Chưa xác định';
    }
  }

  const totalPassedSubjects = allCourses.filter((c) => c.isPassed === true).length;
  const totalFailedSubjects = allCourses.filter((c) => c.isPassed === false).length;
  const totalInProgressSubjects = allCourses.filter((c) => c.isPassed === null).length;
  const totalSubjects = allCourses.length;

  const finishedSubjects = totalPassedSubjects + totalFailedSubjects;
  const passRate = finishedSubjects > 0 ? Math.round((totalPassedSubjects / finishedSubjects) * 100) : 100;

  const targetCredits = 130; // Mặc định chương trình đại học ~130 tín chỉ
  const graduationProgressRate = Math.min(100, Math.round((totalPassedCredits / targetCredits) * 100));

  // Top môn học điểm cao
  const topCourses = allCourses
    .filter((c) => c.finalScore10 !== null && c.finalScore10 >= 8.0)
    .sort((a, b) => (b.finalScore10 || 0) - (a.finalScore10 || 0))
    .slice(0, 8);

  // Môn học cần cải thiện (C, D, F)
  const improvementCourses = allCourses
    .filter((c) => c.finalScore10 !== null && c.finalScore10 < 6.5)
    .sort((a, b) => (a.finalScore10 || 0) - (b.finalScore10 || 0));

  // Môn đang học
  const inProgressCourses = allCourses.filter((c) => c.isPassed === null);

  // Mục tiêu học tập (Academic Target Goals)
  const remainingCredits = Math.max(0, targetCredits - totalPassedCredits);
  const targetGoals: AcademicTargetGoal[] = [
    { label: 'Bằng Khá', targetGpa4: 2.5, isAchievable: true, requiredGpaOnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Giỏi', targetGpa4: 3.2, isAchievable: true, requiredGpaOnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Xuất sắc', targetGpa4: 3.6, isAchievable: true, requiredGpaOnRemaining: null, status: 'POSSIBLE', note: '' },
  ];

  targetGoals.forEach((goal) => {
    if (gpa4 !== null && gpa4 >= goal.targetGpa4) {
      goal.status = 'ACHIEVED';
      goal.isAchievable = true;
      goal.note = `Hiện tại bạn đã đạt chuẩn ${goal.label} (GPA ${gpa4.toFixed(2)} >= ${goal.targetGpa4})`;
    } else if (remainingCredits === 0) {
      goal.status = 'UNACHIEVABLE';
      goal.isAchievable = false;
      goal.note = `Đã hoàn thành toàn bộ chương trình đào tạo`;
    } else if (gpa4 !== null) {
      const requiredPoints = goal.targetGpa4 * targetCredits - gpa4 * totalPassedCredits;
      const reqGpa = requiredPoints / remainingCredits;
      goal.requiredGpaOnRemaining = Math.round(reqGpa * 100) / 100;

      if (reqGpa <= 4.0) {
        goal.isAchievable = true;
        goal.status = reqGpa > 3.6 ? 'CHALLENGING' : 'POSSIBLE';
        goal.note = `Cần đạt GPA TB tối thiểu ${goal.requiredGpaOnRemaining.toFixed(2)} cho ${remainingCredits} tín chỉ còn lại`;
      } else {
        goal.isAchievable = false;
        goal.status = 'UNACHIEVABLE';
        goal.note = `Cần GPA ${reqGpa.toFixed(2)} (vượt quá 4.0), không khả thi nếu không học cải thiện`;
      }
    }
  });

  return {
    success: true,
    username: cleanUsername,
    isConfigured: options.isConfigured,
    hasLinkedAccount: options.isConfigured,
    isLiveSync: options.isLiveSync,
    isCachedDb: options.isCachedDb,
    lastSyncAt: options.lastSyncAt,
    summary: {
      gpa10,
      gpa4,
      totalCreditsAccumulated,
      totalPassedCredits,
      totalCreditsRegistered,
      totalInProgressCredits,
      classification,
      totalPassedSubjects,
      totalFailedSubjects,
      totalInProgressSubjects,
      totalSubjects,
      passRate,
      curriculumTargetCredits: targetCredits,
      graduationProgressRate,
    },
    gradeDistribution: {
      buckets,
      highestGradeCount: Math.max(...buckets.map((b) => b.count)),
      averageLetter: buckets.find((b) => b.count > 0)?.grade || 'N/A',
    },
    gpaProgression,
    semesters: processedSemesters,
    topCourses,
    improvementCourses,
    inProgressCourses,
    targetGoals,
  };
}

/**
 * Lấy kết quả học tập từ S-Link của sinh viên (ưu tiên đọc từ DB StudentSlinkGradeRecord nếu chưa yêu cầu refresh)
 */
export async function getStudentSlinkGrades(
  username: string,
  options?: { forceRefresh?: boolean }
): Promise<StudentGradesResult> {
  const cleanUsername = username.trim().toUpperCase();

  // 1. Tìm ExternalAccount S-Link
  const extAccount = await prisma.externalAccount.findFirst({
    where: {
      username: cleanUsername,
      OR: [
        { systemKey: 'SLINK_PTIT' },
        { systemUrl: { contains: 'slink.ptit.edu.vn' } },
      ],
    },
  });

  const isConfigured = !!(extAccount && (extAccount.token || extAccount.extPassword));

  if (!isConfigured) {
    return {
      success: false,
      username: cleanUsername,
      isConfigured: false,
      hasLinkedAccount: false,
      isLiveSync: false,
      lastSyncAt: null,
      summary: {
        gpa10: null,
        gpa4: null,
        totalCreditsAccumulated: 0,
        totalPassedCredits: 0,
        totalCreditsRegistered: 0,
        totalInProgressCredits: 0,
        classification: 'Chưa liên kết',
        totalPassedSubjects: 0,
        totalFailedSubjects: 0,
        totalInProgressSubjects: 0,
        totalSubjects: 0,
        passRate: 0,
        curriculumTargetCredits: 130,
        graduationProgressRate: 0,
      },
      gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
      gpaProgression: [],
      semesters: [],
      topCourses: [],
      improvementCourses: [],
      inProgressCourses: [],
      targetGoals: [],
      errorType: 'NOT_CONFIGURED',
      error: 'Chưa cấu hình tài khoản Cổng Thông Tin PTIT S-Link. Vui lòng cấu hình tài khoản để xem Kết Quả Học Tập từ S-Link.',
    };
  }

  // 2. Nếu KHÔNG yêu cầu forceRefresh -> Kiểm tra cache bảng StudentSlinkGradeRecord trong DB trước
  if (!options?.forceRefresh) {
    try {
      const cachedRecord = await prisma.studentSlinkGradeRecord.findUnique({
        where: { username: cleanUsername },
      });

      if (cachedRecord && cachedRecord.rawData) {
        const parsed = JSON.parse(cachedRecord.rawData);
        if (parsed && (parsed.semesters || parsed.courses || parsed.sinhVien)) {
          const syncTime =
            cachedRecord.lastPulledAt ||
            cachedRecord.updatedAt ||
            cachedRecord.createdAt ||
            extAccount?.lastSyncAt;
          return buildSlinkGradeResultFromRawData(cleanUsername, parsed, {
            isConfigured: true,
            isLiveSync: false,
            isCachedDb: true,
            lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
          });
        }
      }
    } catch (cacheErr) {
      console.warn('[getStudentSlinkGrades] Đọc cache StudentSlinkGradeRecord thất bại, chuyển sang gọi S-Link:', cacheErr);
    }
  }

  // 3. Gọi trực tiếp tới S-Link khi forceRefresh hoặc chưa có cache trong DB
  let fetchedResult: any = null;

  try {
    fetchedResult = await fetchStudentGradesFromSlink({
      username: extAccount!.extUsername || cleanUsername,
      password: extAccount!.extPassword || undefined,
      token: extAccount!.token,
    });

    // Cập nhật token và trạng thái CONNECTED vào ExternalAccount
    await prisma.externalAccount
      .update({
        where: { id: extAccount!.id },
        data: {
          ...(fetchedResult.newToken ? { token: fetchedResult.newToken } : {}),
          lastSyncAt: new Date(),
          status: 'CONNECTED',
          syncMessage: 'Đồng bộ kết quả học tập thành công từ PTIT S-Link.',
        },
      })
      .catch(() => {});

    // Xây dựng dữ liệu hoàn chỉnh
    const resultObj = buildSlinkGradeResultFromRawData(cleanUsername, fetchedResult, {
      isConfigured: true,
      isLiveSync: true,
      isCachedDb: false,
      lastSyncAt: new Date().toISOString(),
    });

    // 4. Lưu / Persist vào bảng StudentSlinkGradeRecord trong Database
    try {
      const maKhoaNganh =
        fetchedResult.khoaNganh?.khoaNganhChinh?.ma ||
        fetchedResult.sinhVien?.maKhoaNganh ||
        null;
      const tenKhoaNganh =
        fetchedResult.khoaNganh?.khoaNganhChinh?.ten ||
        fetchedResult.sinhVien?.nganh?.ten ||
        null;

      await prisma.studentSlinkGradeRecord.upsert({
        where: { username: cleanUsername },
        create: {
          username: cleanUsername,
          rawData: JSON.stringify(fetchedResult),
          gpa10: resultObj.summary.gpa10,
          gpa4: resultObj.summary.gpa4,
          creditsAcc: resultObj.summary.totalCreditsAccumulated,
          creditsPassed: resultObj.summary.totalPassedCredits,
          creditsReg: resultObj.summary.totalCreditsRegistered,
          classification: resultObj.summary.classification,
          totalSubjects: resultObj.summary.totalSubjects,
          totalPassed: resultObj.summary.totalPassedSubjects,
          totalFailed: resultObj.summary.totalFailedSubjects,
          totalInProgress: resultObj.summary.totalInProgressSubjects,
          maKhoaNganh,
          tenKhoaNganh,
          lastPulledAt: new Date(),
        },
        update: {
          rawData: JSON.stringify(fetchedResult),
          gpa10: resultObj.summary.gpa10,
          gpa4: resultObj.summary.gpa4,
          creditsAcc: resultObj.summary.totalCreditsAccumulated,
          creditsPassed: resultObj.summary.totalPassedCredits,
          creditsReg: resultObj.summary.totalCreditsRegistered,
          classification: resultObj.summary.classification,
          totalSubjects: resultObj.summary.totalSubjects,
          totalPassed: resultObj.summary.totalPassedSubjects,
          totalFailed: resultObj.summary.totalFailedSubjects,
          totalInProgress: resultObj.summary.totalInProgressSubjects,
          maKhoaNganh,
          tenKhoaNganh,
          lastPulledAt: new Date(),
        },
      });
    } catch (saveErr) {
      console.warn('[getStudentSlinkGrades] Lưu StudentSlinkGradeRecord thất bại:', saveErr);
    }

    return resultObj;
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    console.warn(`[getStudentSlinkGrades] Lỗi kết nối S-Link cho ${cleanUsername}:`, err?.message);

    const isAuthErr =
      errMsg.includes('401') ||
      errMsg.includes('403') ||
      errMsg.includes('không thành công') ||
      errMsg.includes('mật khẩu') ||
      errMsg.includes('tài khoản') ||
      errMsg.includes('đăng nhập') ||
      errMsg.includes('unauthorized') ||
      errMsg.includes('forbidden') ||
      errMsg.includes('invalid_grant');

    if (isAuthErr) {
      await prisma.externalAccount
        .update({
          where: { id: extAccount!.id },
          data: {
            status: 'ERROR',
            syncMessage: 'Đăng nhập S-Link thất bại: Tài khoản hoặc mật khẩu không chính xác.',
          },
        })
        .catch(() => {});
    }

    // Nếu lỗi mạng / timeout, thử fallback sang StudentSlinkGradeRecord trong DB
    try {
      const fallbackDb = await prisma.studentSlinkGradeRecord.findUnique({
        where: { username: cleanUsername },
      });
      if (fallbackDb && fallbackDb.rawData) {
        const parsed = JSON.parse(fallbackDb.rawData);
        const syncTime =
          fallbackDb.lastPulledAt ||
          fallbackDb.updatedAt ||
          fallbackDb.createdAt ||
          extAccount?.lastSyncAt;
        return buildSlinkGradeResultFromRawData(cleanUsername, parsed, {
          isConfigured: true,
          isLiveSync: false,
          isCachedDb: true,
          lastSyncAt: syncTime ? new Date(syncTime).toISOString() : null,
        });
      }
    } catch (fallbackErr) {
      console.warn('[getStudentSlinkGrades] Đọc fallback DB thất bại:', fallbackErr);
    }

    return {
      success: false,
      username: cleanUsername,
      isConfigured: true,
      hasLinkedAccount: true,
      isLiveSync: false,
      lastSyncAt: extAccount?.lastSyncAt ? extAccount.lastSyncAt.toISOString() : null,
      summary: {
        gpa10: null,
        gpa4: null,
        totalCreditsAccumulated: 0,
        totalPassedCredits: 0,
        totalCreditsRegistered: 0,
        totalInProgressCredits: 0,
        classification: 'Lỗi đồng bộ',
        totalPassedSubjects: 0,
        totalFailedSubjects: 0,
        totalInProgressSubjects: 0,
        totalSubjects: 0,
        passRate: 0,
        curriculumTargetCredits: 130,
        graduationProgressRate: 0,
      },
      gradeDistribution: { buckets: [], highestGradeCount: 0, averageLetter: 'N/A' },
      gpaProgression: [],
      semesters: [],
      topCourses: [],
      improvementCourses: [],
      inProgressCourses: [],
      targetGoals: [],
      errorType: isAuthErr ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR',
      error: `Không thể kéo dữ liệu từ Cổng S-Link: ${err.message || 'Lỗi không xác định'}`,
    };
  }
}
