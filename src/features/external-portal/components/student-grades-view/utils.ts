import { LoginUser } from '../../../../types';
import {
  SemesterGradeSummary,
  StudentGradesResult,
} from '../../server/studentGradesServerService';

// Helper định dạng ngày giờ cập nhật: "14:58:20 19/08/2026"
export const formatSyncDateTime = (dateStr?: string | null) => {
  if (!dateStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Chưa cập nhật';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const secs = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins}:${secs} ${day}/${month}/${year}`;
  } catch {
    return 'Chưa cập nhật';
  }
};

// Helper hiển thị thời gian tương đối: "vừa xong", "5 phút trước", "2 giờ trước", etc.
export const getRelativeSyncTime = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 0) return 'vừa xong';
    if (diffSec < 60) return 'vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return 'hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return '';
  }
};

export const filterSemesters = (
  semesters: SemesterGradeSummary[],
  selectedSemester: string,
  selectedGradeFilter: string,
  searchQuery: string
): SemesterGradeSummary[] => {
  return semesters
    .filter((sem) => selectedSemester === 'ALL' || sem.semesterId === selectedSemester)
    .map((sem) => {
      const filteredCourses = sem.courses.filter((course) => {
        // Grade status filter
        let matchGrade = true;
        if (selectedGradeFilter === 'PASSED') matchGrade = course.isPassed === true;
        else if (selectedGradeFilter === 'FAILED') matchGrade = course.isPassed === false;
        else if (selectedGradeFilter === 'IN_PROGRESS') matchGrade = course.isPassed === null;
        else if (selectedGradeFilter === 'EXCELLENT') matchGrade = course.letterGrade === 'A+' || course.letterGrade === 'A';
        else if (selectedGradeFilter === 'LOW') matchGrade = course.letterGrade === 'C' || course.letterGrade === 'D+' || course.letterGrade === 'D' || course.letterGrade === 'F';

        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchQuery =
          !q ||
          course.subjectName.toLowerCase().includes(q) ||
          course.subjectCode.toLowerCase().includes(q) ||
          course.group.toLowerCase().includes(q);

        return matchGrade && matchQuery;
      });

      return {
        ...sem,
        courses: filteredCourses,
      };
    })
    .filter((sem) => sem.courses.length > 0 || selectedGradeFilter === 'ALL');
};

export const exportGradesCsv = (data: StudentGradesResult, username: string) => {
  if (!data || !data.semesters) return;
  let csv = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese
  csv += 'Học kỳ,Mã MH,Tên môn học,Số tín chỉ,Nhóm/Tổ,Điểm thi,Điểm TK (10),Điểm TK (4),Điểm TK (C),Kết quả,Ghi chú\n';

  data.semesters.forEach((sem) => {
    sem.courses.forEach((c) => {
      const status = c.isPassed === true ? 'Đạt' : c.isPassed === false ? 'Chưa đạt' : 'Đang học';
      const note = c.reasonNotCalculated || (c.isCalculatedInGpa ? 'Tính điểm TB & tích lũy' : 'Không tính điểm TB & tích lũy');
      csv += `"${sem.semesterName}","${c.subjectCode}","${c.subjectName}",${c.credits},"${c.group}","${c.examScore ?? ''}","${c.finalScore10 ?? ''}","${c.finalScore4 ?? ''}","${c.letterGrade}","${status}","${note}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bang_diem_${username}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const buildGradesSummaryText = (
  data: StudentGradesResult,
  currentUser: LoginUser
): string => {
  const s = data.summary;
  const gpa4Exp = s.gpa4Expected !== null && s.gpa4Expected !== undefined ? s.gpa4Expected.toFixed(2) : null;
  const gpa10Exp = s.gpa10Expected !== null && s.gpa10Expected !== undefined ? s.gpa10Expected.toFixed(2) : null;
  return `📊 KẾT QUẢ HỌC TẬP PTIT EDUSYNC - SINH VIÊN ${currentUser.username}
• Họ và tên: ${currentUser.fullName || currentUser.username}
• Điểm TB tích lũy hệ 4: ${s.gpa4 !== null ? s.gpa4.toFixed(2) : '—'} / 4.0${gpa4Exp && gpa4Exp !== s.gpa4?.toFixed(2) ? ` (Dự kiến: ${gpa4Exp})` : ''}
• Điểm TB tích lũy hệ 10: ${s.gpa10 !== null ? s.gpa10.toFixed(2) : '—'} / 10.0${gpa10Exp && gpa10Exp !== s.gpa10?.toFixed(2) ? ` (Dự kiến: ${gpa10Exp})` : ''}
• Xếp loại học lực: ${s.classification}
• Số tín chỉ tích lũy: ${s.totalCreditsAccumulated} / ${s.curriculumTargetCredits} TC (${s.graduationProgressRate}%)${s.totalCreditsAccumulatedExpected ? ` • Dự kiến đạt: ${s.totalCreditsAccumulatedExpected} TC (${s.graduationProgressRateExpected ?? s.graduationProgressRate}%)` : ''}
• Tỉ lệ hoàn thành môn: ${s.passRate}% (${s.totalPassedSubjects} môn đạt, ${s.totalInProgressSubjects} môn đang học)
• Cập nhật lần cuối: ${formatSyncDateTime(data.lastSyncAt)}`;
};
