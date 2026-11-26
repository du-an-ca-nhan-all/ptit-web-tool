import React from 'react';
import { Award, Flame } from 'lucide-react';
import {
  AcademicTargetGoal,
  GradeDistributionBucket,
  StudentCourseGrade,
} from '../../server/studentGradesServerService';

interface GradeDistributionTabProps {
  buckets: GradeDistributionBucket[];
}

export function GradeDistributionTab({ buckets }: GradeDistributionTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {buckets.map((b) => (
          <div key={b.grade} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-sm shadow-xs ${b.colorClass}`}>
                  {b.grade}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{b.description}</span>
                  <span className="text-[10px] text-slate-400">{b.credits} Tín chỉ</span>
                </div>
              </div>
              <span className="text-base font-black font-mono text-slate-800">{b.count} môn</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-1.5 bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${b.percentage}%` }}
              />
            </div>
            <div className="text-[10px] text-right font-mono text-slate-400 mt-1">
              {b.percentage.toFixed(1)}% tổng số môn
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AdvisingTabProps {
  topCourses: StudentCourseGrade[];
  improvementCourses: StudentCourseGrade[];
}

export function AdvisingTab({ topCourses, improvementCourses }: AdvisingTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Achieving Courses */}
        <div className="border border-emerald-200 bg-emerald-50/30 rounded-3xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
            <h4 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Môn Đạt Điểm Xuất Sắc (A / A+) ({topCourses.length || 0})</span>
            </h4>
            <span className="text-[11px] font-bold text-emerald-700">Điểm cao</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
            {topCourses.map((c) => (
              <div key={c.id} className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{c.subjectName}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.subjectCode} • {c.credits} TC • {c.semesterId}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-lg border border-emerald-300 font-mono">
                    {c.letterGrade} ({c.finalScore10?.toFixed(1)})
                  </span>
                </div>
              </div>
            ))}
            {!topCourses.length && (
              <div className="text-center py-6 text-slate-400 text-xs italic">Chưa có môn nào đạt điểm A/A+.</div>
            )}
          </div>
        </div>

        {/* Improvement Courses */}
        <div className="border border-amber-200 bg-amber-50/30 rounded-3xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-100">
            <h4 className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Cơ Hội Học Cải Thiện Nâng GPA ({improvementCourses.length || 0})</span>
            </h4>
            <span className="text-[11px] font-bold text-amber-700">Điểm C / D / F</span>
          </div>

          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
            {improvementCourses.map((c) => (
              <div key={c.id} className="bg-white p-3 rounded-2xl border border-amber-100 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{c.subjectName}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.subjectCode} • {c.credits} TC • {c.semesterId}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-xs rounded-lg border border-amber-300 font-mono">
                    {c.letterGrade} ({c.finalScore10?.toFixed(1)})
                  </span>
                  <span className="block text-[10px] text-amber-600 font-bold mt-0.5">Có thể học cải thiện</span>
                </div>
              </div>
            ))}
            {!improvementCourses.length && (
              <div className="text-center py-6 text-emerald-600 text-xs font-bold">Tuyệt vời! Không có môn nào điểm thấp cần cải thiện.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TargetSimulatorTabProps {
  targetGoals: AcademicTargetGoal[];
}

export function TargetSimulatorTab({ targetGoals }: TargetSimulatorTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {targetGoals.map((goal, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-5 border flex flex-col justify-between transition-all ${
              goal.status === 'ACHIEVED'
                ? 'bg-emerald-50/50 border-emerald-300'
                : goal.status === 'POSSIBLE'
                ? 'bg-blue-50/50 border-blue-300'
                : goal.status === 'CHALLENGING'
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-rose-50/50 border-rose-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">{goal.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    goal.status === 'ACHIEVED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : goal.status === 'POSSIBLE'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : goal.status === 'CHALLENGING'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {goal.status === 'ACHIEVED'
                    ? 'Đã Đạt'
                    : goal.status === 'POSSIBLE'
                    ? 'Khả Thi Cao'
                    : goal.status === 'CHALLENGING'
                    ? 'Cần Nỗ Lực'
                    : 'Khó Đạt'}
                </span>
              </div>

              <div className="my-3 space-y-1.5">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">GPA Yêu Cầu Các Kỳ Tới</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <div className="text-2xl font-black font-mono text-slate-800">
                    {goal.requiredGpaOnRemaining !== null ? (
                      <span className={goal.requiredGpaOnRemaining <= 3.2 ? 'text-blue-600' : 'text-amber-600'}>
                        {goal.requiredGpaOnRemaining.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-600">Đã Hoàn Thành</span>
                    )}
                    {goal.requiredGpaOnRemaining !== null && (
                      <span className="text-xs text-slate-400 font-normal ml-1">/ 4.0</span>
                    )}
                  </div>

                  {goal.requiredGpa10OnRemaining !== null && goal.requiredGpa10OnRemaining !== undefined && (
                    <div className="text-xs font-bold font-mono text-slate-700 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-500">Hệ 10: </span>
                      <span className={goal.requiredGpa10OnRemaining <= 8.0 ? 'text-blue-600 font-black' : 'text-amber-600 font-black'}>
                        {goal.requiredGpa10OnRemaining.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal"> / 10.0</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 italic bg-white/70 p-3 rounded-2xl border border-slate-200/60 mt-2">
              {goal.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
