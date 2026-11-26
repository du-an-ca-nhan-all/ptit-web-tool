import {
  StudentCourseGrade,
  CourseComponentGrade,
} from '../studentGradesServerService';
import { SLINK_COMPONENT_NAMES } from './constants';
import { GradeCountMap } from './types';

export function parseScore(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? null : num;
}

export function createInitialGradeCounts(): GradeCountMap {
  return {
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
}

export function parseCourseGrade(
  c: any,
  semesterId: string,
  semesterName: string,
  gradeCounts: GradeCountMap
): StudentCourseGrade {
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

  // Quyết định tính tổng tín chỉ và GPA dựa vào isTinhSoTinChiTichLuy của loại học phần
  const isCalculatedInGpa = Boolean(
    c.hocPhan?.loaiHocPhan?.isTinhSoTinChiTichLuy ??
    c.loaiHocPhan?.isTinhSoTinChiTichLuy ??
    c.isTinhSoTinChiTichLuy
  );
  const reasonNotCalculated = !isCalculatedInGpa
    ? 'Học phần không tính vào tín chỉ & GPA tích lũy'
    : undefined;

  // Cờ tích lũy chính thức từ S-Link (đã chốt vào đợt xét)
  const isAccumulatedOfficial = Boolean(c.tichLuy);

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
    isAccumulatedOfficial,
    reasonNotCalculated,
    components,
    semesterId,
    semesterName,
  };

  // Thống kê phân bố điểm
  if (isPassed === null || finalScore10 === null) {
    gradeCounts.IN_PROGRESS.count++;
    gradeCounts.IN_PROGRESS.credits += credits;
  } else if (gradeCounts[letterGrade]) {
    gradeCounts[letterGrade].count++;
    gradeCounts[letterGrade].credits += credits;
  }

  return courseObj;
}
