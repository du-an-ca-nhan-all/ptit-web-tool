import React from 'react';
import { CheckCircle, ExternalLink, ListOrdered, User } from 'lucide-react';
import { LmsCourseOverviewItem } from '../../server/lmsServerService';

interface LmsCourseCardProps {
  course: LmsCourseOverviewItem;
  onOpenDetails: (course: LmsCourseOverviewItem) => void;
}

export function LmsCourseCard({ course, onOpenDetails }: LmsCourseCardProps) {
  const isFinished = course.progressPercent === 100;
  const progressColor = isFinished
    ? 'bg-emerald-500'
    : course.progressPercent >= 50
    ? 'bg-sky-500'
    : course.progressPercent > 0
    ? 'bg-amber-500'
    : 'bg-slate-300';

  return (
    <div
      className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:shadow-md ${
        isFinished
          ? 'bg-slate-50/60 border-emerald-200 hover:border-emerald-300'
          : 'bg-white border-slate-200 hover:border-sky-300'
      }`}
    >
      {/* Course Top Info */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-100">
            {course.courseCode}
          </span>

          {isFinished ? (
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> Đã Hoàn Thành
            </span>
          ) : course.progressPercent > 0 ? (
            <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
              Đang học ({course.progressPercent}%)
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
              Chưa học (0%)
            </span>
          )}
        </div>

        <h3
          className="font-black text-slate-800 text-sm sm:text-base leading-snug line-clamp-2"
          title={course.fullName}
        >
          {course.courseName || course.fullName}
        </h3>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          {course.instructor ? (
            <div className="flex items-center gap-1.5 truncate">
              {course.instructorImg ? (
                <img
                  src={course.instructorImg}
                  alt={course.instructor}
                  className="w-4 h-4 rounded-full shrink-0"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate">{course.instructor}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] italic">LMS PTTC1</span>
          )}

          {course.category && (
            <span className="text-[10px] text-slate-400 font-bold truncate max-w-[130px] shrink-0 bg-slate-100 px-2 py-0.5 rounded-md">
              {course.category}
            </span>
          )}
        </div>
      </div>

      {/* Progress Data & Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {course.totalActivities > 0 ? (
              <>
                <strong className="text-slate-800">{course.completedActivities}</strong> /{' '}
                {course.totalActivities} hoạt động
              </>
            ) : (
              'Đã ghi danh'
            )}
          </span>

          <div className="flex items-center gap-2">
            {course.grade && (
              <span className="font-bold text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                ⭐ Điểm: <strong>{course.grade}</strong>
              </span>
            )}
            <span className="font-black text-slate-800 font-mono">{course.progressPercent}%</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
            style={{ width: `${course.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Course Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onOpenDetails(course)}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Xem Chi Tiết Bài Học</span>
        </button>

        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl transition-colors cursor-pointer shrink-0"
          title="Mở môn học trên hệ thống LMS"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
