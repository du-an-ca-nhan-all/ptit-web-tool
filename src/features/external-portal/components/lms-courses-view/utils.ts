import { LmsCourseOverviewItem } from '../../server/lmsServerService';
import { LmsFilterCounts, LmsSortBy, LmsStatusFilter } from './types';

// Helper định dạng ngày giờ cập nhật chuẩn: "14:58:20 19/08/2026"
export function formatSyncDateTime(isoString?: string | null): string {
  if (!isoString) return 'Chưa cập nhật';
  try {
    const d = new Date(isoString);
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
}

export function extractSemestersList(courses?: LmsCourseOverviewItem[]): string[] {
  if (!courses) return [];
  const set = new Set<string>();
  courses.forEach((c) => {
    if (c.category && c.category.trim()) set.add(c.category.trim());
  });
  return Array.from(set);
}

export function computeFilterCounts(courses?: LmsCourseOverviewItem[]): LmsFilterCounts {
  const all = courses || [];
  const completed = all.filter((c) => c.progressPercent === 100);
  const inProgress = all.filter((c) => c.progressPercent > 0 && c.progressPercent < 100);
  const notStarted = all.filter((c) => c.progressPercent === 0);
  return {
    all: all.length,
    completed: completed.length,
    inProgress: inProgress.length,
    notStarted: notStarted.length,
  };
}

export interface FilterAndSortCoursesParams {
  courses: LmsCourseOverviewItem[] | undefined;
  searchQuery: string;
  statusFilter: LmsStatusFilter;
  selectedSemester: string;
  sortBy: LmsSortBy;
}

export function filterAndSortCourses({
  courses,
  searchQuery,
  statusFilter,
  selectedSemester,
  sortBy,
}: FilterAndSortCoursesParams): LmsCourseOverviewItem[] {
  if (!courses) return [];

  const list = courses.filter((c) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.courseCode.toLowerCase().includes(q) ||
      c.courseName.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q) ||
      (c.instructor && c.instructor.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q));

    // Status
    let matchStatus = true;
    if (statusFilter === 'COMPLETED') matchStatus = c.progressPercent === 100;
    else if (statusFilter === 'IN_PROGRESS') matchStatus = c.progressPercent > 0 && c.progressPercent < 100;
    else if (statusFilter === 'NOT_STARTED') matchStatus = c.progressPercent === 0;

    // Semester
    let matchSem = true;
    if (selectedSemester !== 'ALL') matchSem = c.category?.trim() === selectedSemester.trim();

    return matchSearch && matchStatus && matchSem;
  });

  // Sorting
  list.sort((a, b) => {
    if (sortBy === 'PROGRESS_DESC') return b.progressPercent - a.progressPercent;
    if (sortBy === 'PROGRESS_ASC') {
      // Unfinished first, then by lower progress
      if (a.progressPercent === 100 && b.progressPercent < 100) return 1;
      if (b.progressPercent === 100 && a.progressPercent < 100) return -1;
      return a.progressPercent - b.progressPercent;
    }
    if (sortBy === 'NAME_ASC') return a.courseName.localeCompare(b.courseName, 'vi');
    if (sortBy === 'GRADE_DESC') {
      const gradeA = parseFloat(a.grade?.replace(',', '.') || '0');
      const gradeB = parseFloat(b.grade?.replace(',', '.') || '0');
      return gradeB - gradeA;
    }
    return 0;
  });

  return list;
}
