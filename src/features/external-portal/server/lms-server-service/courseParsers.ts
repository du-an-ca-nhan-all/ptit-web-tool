import { LMS_BASE_URL } from './constants';
import type { LmsCourseOverviewItem, LmsDashboardOverview } from './types';

/**
 * Phân tích mã môn và tên môn học từ chuỗi tiêu đề Moodle
 * Ví dụ: "INT1450 - Quản lý dự án phần mềm - 2503 - Nhóm 7"
 */
export function parseCourseTitle(rawTitle: string): { courseCode: string; courseName: string; category: string } {
  const clean = rawTitle
    .replace(/^Tên khóa học\s+/i, '')
    .replace(/^Khoá học\s+/i, '')
    .replace(/^Actions for course\s+/i, '')
    .trim();
  const parts = clean.split('-').map((s) => s.trim());

  if (parts.length >= 3) {
    return {
      courseCode: parts[0],
      courseName: parts[1],
      category: parts.slice(2).join(' - '),
    };
  } else if (parts.length === 2) {
    return {
      courseCode: parts[0],
      courseName: parts[1],
      category: '',
    };
  }
  return {
    courseCode: clean.slice(0, 10),
    courseName: clean,
    category: '',
  };
}

export function extractDashboardUserAndStats(
  myHtml: string,
  fallbackUsername: string
): { userFullName: string; stats: LmsDashboardOverview['stats'] } {
  const nameMatch =
    myHtml.match(/Chào mừng quay trở lại,\s*([^!]+)!/i) || myHtml.match(/class="usertext[^>]*>([^<]+)/i);
  const userFullName = nameMatch ? nameMatch[1].trim() : fallbackUsername;

  const enrolledMatch =
    myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Khóa học đã đăng ký/i) ||
    myHtml.match(/(\d+)\s*Khóa học đã đăng ký/i);
  const completedActMatch =
    myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Hoạt động đã hoàn thành/i) ||
    myHtml.match(/(\d+)\s*Hoạt động đã hoàn thành/i);
  const completedCoursesMatch =
    myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Khóa học đã hoàn thành/i) ||
    myHtml.match(/(\d+)\s*Khóa học đã hoàn thành/i);
  const dueActMatch =
    myHtml.match(/(\d+)\s*<\/div>\s*<[^>]+>\s*Hoạt động đến hạn/i) || myHtml.match(/(\d+)\s*Hoạt động đến hạn/i);

  return {
    userFullName,
    stats: {
      enrolledCourses: enrolledMatch ? parseInt(enrolledMatch[1]) : 0,
      completedActivities: completedActMatch ? parseInt(completedActMatch[1]) : 0,
      completedCourses: completedCoursesMatch ? parseInt(completedCoursesMatch[1]) : 0,
      dueActivities: dueActMatch ? parseInt(dueActMatch[1]) : 0,
    },
  };
}

export function parseGradesOverviewHtml(gradeHtml: string): Map<string, string> {
  const gradeMap = new Map<string, string>();
  const gradeRowRegex =
    /href="https:\/\/lms\.pttc1\.edu\.vn\/course\/user\.php\?mode=grade&amp;id=(\d+)[^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/g;
  let gMatch: RegExpExecArray | null;
  while ((gMatch = gradeRowRegex.exec(gradeHtml)) !== null) {
    const cId = gMatch[1];
    const rawGrade = gMatch[3].replace(/<[^>]+>/g, '').trim();
    if (rawGrade && rawGrade !== '-') {
      gradeMap.set(cId, rawGrade);
    }
  }
  return gradeMap;
}

export function mapRemuiCourses(
  remuiList: any[],
  seenIds: Set<string>,
  gradeMap: Map<string, string>
): LmsCourseOverviewItem[] {
  const courses: LmsCourseOverviewItem[] = [];
  remuiList.forEach((c: any) => {
    const id = String(c.id);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const rawFullName = c.fullname || c.fullnamedisplay || `Khóa học ${id}`;
    const { courseCode, courseName, category: parsedCat } = parseCourseTitle(rawFullName);
    const category = c.coursecategory || parsedCat || '';

    const progressPercent = typeof c.progress === 'number' ? Math.round(c.progress) : 0;

    let completedActivities = 0;
    let totalActivities = 0;
    if (c.activitydata && typeof c.activitydata === 'string') {
      const actMatch = c.activitydata.match(/(\d+)\s+trong\s+(\d+)/i);
      if (actMatch) {
        completedActivities = parseInt(actMatch[1]);
        totalActivities = parseInt(actMatch[2]);
      }
    }

    if (progressPercent === 100 && totalActivities === 0) {
      completedActivities = 1;
      totalActivities = 1;
    }

    let instructor = '';
    let instructorImg = '';
    if (c.instructor) {
      if (typeof c.instructor === 'string' && c.instructor.startsWith('{')) {
        try {
          const instObj = JSON.parse(c.instructor);
          instructor = instObj.name || '';
          instructorImg = instObj.picture || '';
        } catch {}
      } else if (typeof c.instructor === 'object') {
        instructor = c.instructor.name || '';
        instructorImg = c.instructor.picture || '';
      } else if (typeof c.instructor === 'string') {
        instructor = c.instructor;
      }
    }

    const grade = gradeMap.get(id) || null;

    courses.push({
      id,
      courseCode,
      courseName,
      fullName: rawFullName,
      instructor,
      instructorImg,
      category,
      progressPercent,
      completedActivities,
      totalActivities,
      grade,
      url: c.viewurl || `${LMS_BASE_URL}/course/view.php?id=${id}`,
      isCompleted: progressPercent === 100,
    });
  });
  return courses;
}

export function mapCoreCourses(
  coreList: any[],
  seenIds: Set<string>,
  gradeMap: Map<string, string>
): LmsCourseOverviewItem[] {
  const courses: LmsCourseOverviewItem[] = [];
  coreList.forEach((c: any) => {
    const id = String(c.id);
    if (seenIds.has(id)) return;
    seenIds.add(id);

    const rawFullName = c.fullname || `Khóa học ${id}`;
    const { courseCode, courseName, category: parsedCat } = parseCourseTitle(rawFullName);
    const progressPercent = typeof c.progress === 'number' ? Math.round(c.progress) : 0;
    const grade = gradeMap.get(id) || null;

    courses.push({
      id,
      courseCode,
      courseName,
      fullName: rawFullName,
      category: c.coursecategory || parsedCat || '',
      progressPercent,
      completedActivities: progressPercent === 100 ? 1 : 0,
      totalActivities: 1,
      grade,
      url: c.viewurl || `${LMS_BASE_URL}/course/view.php?id=${id}`,
      isCompleted: progressPercent === 100,
    });
  });
  return courses;
}

export function parseCoursesHtml(
  coursesHtml: string,
  seenIds: Set<string>,
  gradeMap: Map<string, string>
): LmsCourseOverviewItem[] {
  const courses: LmsCourseOverviewItem[] = [];
  const courseCardRegex = /<div[^>]*data-course-id="(\d+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let cMatch: RegExpExecArray | null;

  while ((cMatch = courseCardRegex.exec(coursesHtml)) !== null) {
    const id = cMatch[1];
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const cardContent = cMatch[2];
    const titleMatch =
      cardContent.match(/class="[^"]*coursename[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      cardContent.match(/href="https:\/\/lms\.pttc1\.edu\.vn\/course\/view\.php\?id=\d+"[^>]*>([\s\S]*?)<\/a>/i);
    const rawFullName = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Khóa học ${id}`;
    const { courseCode, courseName, category } = parseCourseTitle(rawFullName);

    const teacherMatch =
      cardContent.match(/class="[^"]*course-instructors[^"]*"[^>]*>([\s\S]*?)<\/h6>/i) ||
      cardContent.match(/title="([^"]+)"[^>]*>\s*<img/i);
    const instructor = teacherMatch ? teacherMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const actProgressMatch = cardContent.match(/(\d+)\s+trong\s+(\d+)\s+hoạt động đã hoàn thành/i);
    const completedActivities = actProgressMatch ? parseInt(actProgressMatch[1]) : 0;
    const totalActivities = actProgressMatch ? parseInt(actProgressMatch[2]) : 0;

    const percentMatch =
      cardContent.match(/aria-valuenow="(\d+)"/i) || cardContent.match(/(\d+)%\s+Khóa học đã hoàn thành/i);
    const progressPercent = percentMatch
      ? parseInt(percentMatch[1])
      : totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    const grade = gradeMap.get(id) || null;

    courses.push({
      id,
      courseCode,
      courseName,
      fullName: rawFullName,
      instructor,
      category,
      progressPercent,
      completedActivities,
      totalActivities,
      grade,
      url: `${LMS_BASE_URL}/course/view.php?id=${id}`,
      isCompleted: progressPercent === 100,
    });
  }

  return courses;
}
