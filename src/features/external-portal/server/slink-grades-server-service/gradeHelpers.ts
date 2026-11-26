import {
  GradeDistributionBucket,
  AcademicTargetGoal,
} from '../studentGradesServerService';
import { GRADE_BUCKET_SPECS } from './constants';
import { GradeCountMap } from './types';

export function buildGradeDistributionBuckets(gradeCounts: GradeCountMap): GradeDistributionBucket[] {
  const totalGradedCredits = Object.values(gradeCounts).reduce((acc, curr) => acc + curr.credits, 0);
  return GRADE_BUCKET_SPECS.map((spec) => {
    const entry = gradeCounts[spec.grade];
    return {
      grade: spec.grade,
      count: entry.count,
      credits: entry.credits,
      percentage: totalGradedCredits > 0 ? (entry.credits / totalGradedCredits) * 100 : 0,
      description: spec.description,
      colorClass: spec.colorClass,
    };
  });
}

export function resolveClassification(rawHocLuc: any, gpa4: number | null): string {
  const existing = String(rawHocLuc || '').trim();
  if (existing) return existing;
  if (gpa4 !== null) {
    if (gpa4 >= 3.6) return 'Xuất sắc';
    if (gpa4 >= 3.2) return 'Giỏi';
    if (gpa4 >= 2.5) return 'Khá';
    if (gpa4 >= 2.0) return 'Trung bình';
    if (gpa4 >= 1.0) return 'Yếu';
    return 'Kém';
  }
  return 'Chưa xác định';
}

export function buildAcademicTargetGoals(params: {
  gpa4: number | null;
  gpa10: number | null;
  targetCredits: number;
  totalCreditsAccumulated: number;
  totalCreditsAccumulatedExpected: number;
}): AcademicTargetGoal[] {
  const { gpa4, gpa10, targetCredits, totalCreditsAccumulated, totalCreditsAccumulatedExpected } = params;
  const remainingCredits = Math.max(0, targetCredits - totalCreditsAccumulated);
  const targetGoals: AcademicTargetGoal[] = [
    { label: 'Bằng Khá (GPA ≥ 2.50 / Hệ 10 ≥ 7.0)', targetGpa4: 2.5, targetGpa10: 7.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Giỏi (GPA ≥ 3.20 / Hệ 10 ≥ 8.0)', targetGpa4: 3.2, targetGpa10: 8.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'POSSIBLE', note: '' },
    { label: 'Bằng Xuất sắc (GPA ≥ 3.60 / Hệ 10 ≥ 9.0)', targetGpa4: 3.6, targetGpa10: 9.0, isAchievable: true, requiredGpaOnRemaining: null, requiredGpa10OnRemaining: null, status: 'POSSIBLE', note: '' },
  ];

  targetGoals.forEach((goal) => {
    if (gpa4 !== null && gpa4 >= goal.targetGpa4) {
      goal.status = 'ACHIEVED';
      goal.isAchievable = true;
      goal.note = `Hiện tại bạn đã đạt chuẩn ${goal.label} (GPA ${gpa4.toFixed(2)} >= ${goal.targetGpa4}${gpa10 !== null ? ` • Hệ 10: ${gpa10.toFixed(2)}` : ''})`;
    } else if (remainingCredits === 0) {
      goal.status = 'UNACHIEVABLE';
      goal.isAchievable = false;
      goal.note = `Đã hoàn thành toàn bộ chương trình đào tạo`;
    } else if (gpa4 !== null) {
      const requiredPoints = goal.targetGpa4 * targetCredits - gpa4 * totalCreditsAccumulated;
      const reqGpa = remainingCredits > 0 ? requiredPoints / remainingCredits : 0;
      goal.requiredGpaOnRemaining = Math.round(reqGpa * 100) / 100;

      if (goal.targetGpa10 && gpa10 !== null) {
        const requiredPoints10 = goal.targetGpa10 * targetCredits - gpa10 * totalCreditsAccumulated;
        const reqGpa10 = remainingCredits > 0 ? requiredPoints10 / remainingCredits : 0;
        goal.requiredGpa10OnRemaining = Math.round(reqGpa10 * 100) / 100;
      }

      if (reqGpa <= 4.0) {
        goal.isAchievable = true;
        goal.status = reqGpa > 3.6 ? 'CHALLENGING' : 'POSSIBLE';
        const gpa10Part = goal.requiredGpa10OnRemaining !== null && goal.requiredGpa10OnRemaining !== undefined ? ` • Hệ 10: ${goal.requiredGpa10OnRemaining.toFixed(2)}` : '';
        goal.note = `Cần đạt GPA TB tối thiểu ${goal.requiredGpaOnRemaining.toFixed(2)}${gpa10Part} cho ${remainingCredits} TC còn lại (Đã chốt ${totalCreditsAccumulated} TC, dự kiến đạt ${totalCreditsAccumulatedExpected}/${targetCredits} TC)`;
      } else {
        goal.isAchievable = false;
        goal.status = 'UNACHIEVABLE';
        goal.note = `Cần GPA ${reqGpa.toFixed(2)} (vượt quá 4.0), không khả thi nếu không học cải thiện`;
      }
    }
  });

  return targetGoals;
}
