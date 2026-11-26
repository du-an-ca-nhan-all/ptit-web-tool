export interface CourseComponentGrade {
  code: string; // e.g. "T1", "K1", "B1", "K2", "K3"
  name: string; // e.g. "Điểm thi", "Trung bình kiểm tra", "Bài tập lớn", "Chuyên cần"
  weight: number; // e.g. 70, 30, 10 (%)
  score: number | null; // e.g. 8.5
}

export interface StudentCourseGrade {
  id: string;
  subjectCode: string;
  subjectName: string;
  group: string;
  credits: number;
  examScore: number | null; // Điểm thi (T1)
  midtermScore: number | null; // Điểm giữa kỳ (K1)
  finalScore10: number | null; // Điểm tổng kết hệ 10
  finalScore4: number | null; // Điểm tổng kết hệ 4
  letterGrade: string; // A+, A, B+, B, C+, C, D+, D, F
  isPassed: boolean | null; // true: Đạt (ket_qua = 1), false: Rớt (ket_qua = 0), null: Chưa có điểm (-1)
  isCalculatedInGpa: boolean; // false nếu là môn điều kiện, môn cải thiện hoặc chưa nhập điểm
  isAccumulatedOfficial?: boolean; // true nếu đã được chốt tích lũy chính thức (cờ tichLuy S-Link)
  reasonNotCalculated?: string;
  components: CourseComponentGrade[];
  semesterId: string;
  semesterName: string;
}

export interface SemesterGradeSummary {
  semesterId: string;
  semesterName: string;
  gpa10Semester: number | null;
  gpa4Semester: number | null;
  gpa10Cumulative: number | null;
  gpa4Cumulative: number | null;
  gpa10CumulativeExpected?: number | null; // GPA tích lũy dự kiến hệ 10
  gpa4CumulativeExpected?: number | null;  // GPA tích lũy dự kiến hệ 4
  creditsPassedSemester: number; // Tổng số tín chỉ môn đạt trong kỳ
  creditsCumulative: number; // Tín chỉ tích lũy lũy kế
  creditsAccumulatedSemester?: number; // Tín chỉ đã chốt chính thức trong kỳ
  creditsAccumulatedExpectedSemester?: number; // Tín chỉ dự kiến đạt trong kỳ (tất cả môn đạt tính GPA)
  creditsPendingSemester?: number; // Tín chỉ chưa chốt / chờ chốt trong kỳ
  creditsAccumulatedCumulativeOfficial?: number; // Lũy kế đã chốt chính thức
  creditsAccumulatedCumulativeExpected?: number; // Lũy kế dự kiến toàn bộ môn đạt
  creditsRegisteredSemester: number;
  creditsDebtSemester?: number;
  classificationSemester: string;
  courses: StudentCourseGrade[];
}

export interface GpaTrendItem {
  semesterId: string;
  semesterName: string;
  gpa10: number | null;
  gpa4: number | null;
  gpaCumulative10: number | null;
  gpaCumulative4: number | null;
  gpaCumulativeExpected10?: number | null; // GPA tích lũy dự kiến hệ 10
  gpaCumulativeExpected4?: number | null;  // GPA tích lũy dự kiến hệ 4
  creditsSemester: number;
  creditsAccumulatedSemester?: number;
  creditsPendingSemester?: number;
  creditsCumulative: number;
  creditsCumulativeExpected?: number;
}

export interface GradeDistributionBucket {
  grade: string;
  count: number;
  credits: number;
  percentage: number;
  description: string;
  colorClass: string;
}

export interface AcademicTargetGoal {
  label: string; // "Bằng Khá", "Bằng Giỏi", "Bằng Xuất sắc"
  targetGpa4: number; // 2.5, 3.2, 3.6
  targetGpa10?: number; // 7.0, 8.0, 9.0
  isAchievable: boolean;
  requiredGpaOnRemaining: number | null;
  requiredGpa10OnRemaining?: number | null;
  status: 'ACHIEVED' | 'POSSIBLE' | 'CHALLENGING' | 'UNACHIEVABLE';
  note: string;
}

export interface StudentGradesResult {
  success: boolean;
  username: string;
  isConfigured: boolean;
  hasLinkedAccount: boolean;
  isLiveSync: boolean;
  isCachedDb?: boolean;
  lastSyncAt: string | null;
  summary: {
    gpa10: number | null;
    gpa4: number | null;
    gpa10Expected?: number | null; // GPA hệ 10 dự kiến (toàn bộ môn Đạt + isCalculatedInGpa, kể cả chưa chốt)
    gpa4Expected?: number | null;  // GPA hệ 4 dự kiến (toàn bộ môn Đạt + isCalculatedInGpa, kể cả chưa chốt)
    totalCreditsAccumulated: number; // Tín chỉ tích lũy chính thức (Đã chốt)
    totalCreditsAccumulatedExpected?: number; // Tín chỉ tích lũy dự kiến (Toàn bộ môn đạt tính vào GPA)
    totalPassedCredits: number; // Tổng tín chỉ các môn đã đạt
    totalCreditsRegistered: number; // Tổng số tín chỉ đã đăng ký
    totalInProgressCredits: number; // Tổng số tín chỉ đang học
    totalCreditsDebt?: number; // Số tín chỉ nợ / chưa tích lũy
    classification: string;
    totalPassedSubjects: number;
    totalFailedSubjects: number;
    totalInProgressSubjects: number;
    totalSubjects: number;
    passRate: number; // 0..100
    curriculumTargetCredits: number; // Tổng số tín chỉ CTĐT (VD: 150)
    graduationProgressRate: number; // % tiến độ theo tín chỉ chính thức đã chốt
    graduationProgressRateExpected?: number; // % tiến độ theo tín chỉ dự kiến (môn đạt)
    academicYearLevel?: string; // Ví dụ: "Năm nhất"
    curriculumName?: string; // Tên chương trình đào tạo
  };
  gradeDistribution: {
    buckets: GradeDistributionBucket[];
    highestGradeCount: number;
    averageLetter: string;
  };
  gpaProgression: GpaTrendItem[];
  semesters: SemesterGradeSummary[];
  topCourses: StudentCourseGrade[];
  improvementCourses: StudentCourseGrade[];
  inProgressCourses: StudentCourseGrade[];
  targetGoals: AcademicTargetGoal[];
  errorType?: 'NOT_CONFIGURED' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR';
  error?: string;
}

export interface GradeBuildOptions {
  isConfigured: boolean;
  isLiveSync: boolean;
  isCachedDb: boolean;
  lastSyncAt: string | null;
}

export type GradeCountsMap = Record<string, { count: number; credits: number }>;
