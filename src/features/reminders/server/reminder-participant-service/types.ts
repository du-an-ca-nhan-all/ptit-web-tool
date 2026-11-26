export interface FindEnrolledStudentsParams {
  idToHoc?: string | null;
  idMon?: string | null;
  maMon?: string | null;
  nhomTo?: string | null;
  lop?: string | null;
  creatorUsername: string;
}

export interface CourseMatchTarget {
  targetIdToHoc?: string;
  targetMaMon?: string;
  targetNhomTo?: string;
  targetLop?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawCourseRecord = Record<string, any>;
