import React from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  Clock,
  Filter,
  Lock,
  Search,
} from 'lucide-react';
import {
  SemesterGradeSummary,
  StudentCourseGrade,
} from '../../server/studentGradesServerService';
import { SemesterCourseCardsMobile } from './SemesterCourseCardsMobile';
import { SemesterCourseTableDesktop } from './SemesterCourseTableDesktop';

interface SemesterGradesSectionProps {
  semesters: SemesterGradeSummary[];
  filteredSemesters: SemesterGradeSummary[];
  selectedSemester: string;
  setSelectedSemester: (value: string) => void;
  selectedGradeFilter: string;
  setSelectedGradeFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSelectCourse: (course: StudentCourseGrade) => void;
}

export function SemesterGradesSection({
  semesters,
  filteredSemesters,
  selectedSemester,
  setSelectedSemester,
  selectedGradeFilter,
  setSelectedGradeFilter,
  searchQuery,
  setSearchQuery,
  onSelectCourse,
}: SemesterGradesSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-black text-slate-800">Bảng Điểm Chi Tiết Từng Môn Học</h3>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Semester filter */}
          <div className="relative min-w-[170px]">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
            >
              <option value="ALL">Tất Cả Học Kỳ ({semesters.length})</option>
              {semesters.map((s) => (
                <option key={s.semesterId} value={s.semesterId}>
                  {s.semesterName}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grade status filter */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
            >
              <option value="ALL">Tất Cả Trạng Thái</option>
              <option value="PASSED">Môn Đã Đạt</option>
              <option value="IN_PROGRESS">Môn Đang Học (Chưa nhập điểm)</option>
              <option value="FAILED">Môn Chưa Đạt (Rớt / F)</option>
              <option value="EXCELLENT">Điểm Cao (A/A+)</option>
              <option value="LOW">Điểm Thấp (C/D/F)</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative min-w-[150px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã / tên môn..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Semester Tables Accordion */}
      <div className="flex flex-col gap-6">
        {filteredSemesters.map((sem) => (
          <div key={sem.semesterId} className="border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {/* Semester Header banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold font-mono text-sm text-indigo-300">
                  {sem.semesterId.slice(-2)}
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">{sem.semesterName}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Mã HK: {sem.semesterId} • {sem.courses.length} học phần
                  </span>
                </div>
              </div>

              {/* Quick Semester Metrics */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                {sem.gpa4Semester !== null && (
                  <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <span className="text-slate-300">GPA Kỳ:</span>
                    <span className="font-mono font-black text-amber-300">{sem.gpa4Semester.toFixed(2)}</span>
                    {sem.gpa10Semester !== null && sem.gpa10Semester !== undefined && (
                      <span className="text-[10px] text-slate-300 font-mono">(H10: {sem.gpa10Semester.toFixed(2)})</span>
                    )}
                  </div>
                )}

                {sem.gpa4Cumulative !== null && (
                  <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <span className="text-slate-300">GPA TL:</span>
                    <span className="font-mono font-black text-emerald-300">{sem.gpa4Cumulative.toFixed(2)}</span>
                    {sem.gpa10Cumulative !== null && sem.gpa10Cumulative !== undefined && (
                      <span className="text-[10px] text-slate-300 font-mono">(H10: {sem.gpa10Cumulative.toFixed(2)})</span>
                    )}
                  </div>
                )}

                <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã chốt:</span>
                  <span className="font-mono text-white">{sem.creditsAccumulatedSemester ?? sem.creditsPassedSemester} TC</span>
                </div>

                {(sem.creditsPendingSemester ?? 0) > 0 && (
                  <div className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chưa chốt:</span>
                    <span className="font-mono text-white">+{sem.creditsPendingSemester} TC</span>
                  </div>
                )}

                <div className="bg-white/10 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <span className="text-slate-300">TC Đạt:</span>
                  <span className="font-mono font-bold text-white">{sem.creditsPassedSemester} TC</span>
                </div>
              </div>
            </div>

            {/* Semester Credits Detailed Info Strip (Phân chia Tín chỉ Đã chốt vs Chưa chốt từng học kỳ) */}
            <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                {/* Tín chỉ đã chốt kỳ này */}
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                    <Lock className="w-3 h-3 text-emerald-700" />
                    <span>Đã chốt kỳ:</span>
                    <b className="font-mono font-black">{sem.creditsAccumulatedSemester ?? sem.creditsPassedSemester} TC</b>
                  </span>
                  {sem.creditsAccumulatedCumulativeOfficial ? (
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Lũy kế chốt: <b className="font-mono text-emerald-700 font-bold">{sem.creditsAccumulatedCumulativeOfficial} TC</b>)
                    </span>
                  ) : null}
                </div>

                {/* Tín chỉ chưa chốt / chờ chốt kỳ này */}
                {(sem.creditsPendingSemester ?? 0) > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-amber-900 font-bold bg-amber-100/90 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Chưa chốt (chờ xét):</span>
                      <b className="font-mono font-black text-amber-800">+{sem.creditsPendingSemester} TC</b>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Dự kiến kỳ: <b className="font-mono text-indigo-700 font-bold">{sem.creditsAccumulatedExpectedSemester ?? sem.creditsPassedSemester} TC</b>
                      {sem.creditsAccumulatedCumulativeExpected ? (
                        <> • Lũy kế dự kiến: <b className="font-mono text-indigo-700 font-bold">{sem.creditsAccumulatedCumulativeExpected} TC</b></>
                      ) : null})
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>100% môn đạt kỳ này đã khóa sổ vào học bạ</span>
                  </div>
                )}
              </div>

              {/* Quick Stats: Đăng ký & Nợ */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium self-end md:self-auto">
                <span>Đăng ký: <b className="text-slate-800 font-mono">{sem.creditsRegisteredSemester || sem.courses.reduce((sum, c) => sum + c.credits, 0)} TC</b></span>
                <span>•</span>
                <span>Tổng Đạt: <b className="text-slate-800 font-mono">{sem.creditsPassedSemester} TC</b></span>
                {sem.creditsDebtSemester ? (
                  <>
                    <span>•</span>
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Nợ kỳ: <b className="font-mono">{sem.creditsDebtSemester} TC</b>
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Mobile Course Cards (Mobile View) */}
            <SemesterCourseCardsMobile
              courses={sem.courses}
              onSelectCourse={onSelectCourse}
            />

            {/* Course Table (Desktop View) */}
            <SemesterCourseTableDesktop
              courses={sem.courses}
              onSelectCourse={onSelectCourse}
            />
          </div>
        ))}

        {!filteredSemesters.length && (
          <div className="py-16 text-center text-slate-400 italic text-xs">
            Không tìm thấy môn học nào phù hợp với bộ lọc đã chọn.
          </div>
        )}
      </div>
    </div>
  );
}
