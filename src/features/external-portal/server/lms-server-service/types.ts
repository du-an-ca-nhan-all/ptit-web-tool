export interface LmsCourseOverviewItem {
  id: string;
  courseCode: string;
  courseName: string;
  fullName: string;
  instructor?: string;
  instructorImg?: string;
  category?: string;
  progressPercent: number;
  completedActivities: number;
  totalActivities: number;
  grade?: string | null;
  url: string;
  isCompleted: boolean;
}

export interface LmsDashboardOverview {
  userFullName: string;
  username: string;
  stats: {
    enrolledCourses: number;
    completedActivities: number;
    completedCourses: number;
    dueActivities: number;
  };
  courses: LmsCourseOverviewItem[];
  lastSyncAt: string;
  isCachedDb?: boolean;
  isLiveSync?: boolean;
  syncWarning?: string;
}

export interface LmsActivityItem {
  id: string;
  type: string;
  name: string;
  url: string;
  isCompleted?: boolean;
}

export interface LmsSectionItem {
  id?: string;
  title: string;
  activities: LmsActivityItem[];
}

export interface LmsLoginResult {
  token: string;
  sesskey: string;
  username: string;
  cookieHeader: string;
}
