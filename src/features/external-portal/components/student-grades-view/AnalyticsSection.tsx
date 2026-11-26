import React from 'react';
import { BarChart3, Flame, PieChart, Target, TrendingUp } from 'lucide-react';
import { StudentGradesResult } from '../../server/studentGradesServerService';
import { AnalyticsTab, GpaModeView, GpaScaleView } from './types';
import { GpaProgressionTab } from './GpaProgressionTab';
import {
  AdvisingTab,
  GradeDistributionTab,
  TargetSimulatorTab,
} from './AnalyticsOtherTabs';

interface AnalyticsSectionProps {
  data: StudentGradesResult | null;
  activeAnalyticsTab: AnalyticsTab;
  setActiveAnalyticsTab: (tab: AnalyticsTab) => void;
  gpaScaleView: GpaScaleView;
  setGpaScaleView: (view: GpaScaleView) => void;
  gpaModeView: GpaModeView;
  setGpaModeView: (mode: GpaModeView) => void;
}

export function AnalyticsSection({
  data,
  activeAnalyticsTab,
  setActiveAnalyticsTab,
  gpaScaleView,
  setGpaScaleView,
  gpaModeView,
  setGpaModeView,
}: AnalyticsSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
      {/* Analytics Sub-tabs header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Phân Tích Chuyên Sâu & Xu Hướng Học Tập</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Thống kê tiến trình GPA, ma trận phân bố điểm chữ và mô phỏng mục tiêu tốt nghiệp
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveAnalyticsTab('PROGRESSION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeAnalyticsTab === 'PROGRESSION'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tiến Trình GPA</span>
          </button>

          <button
            onClick={() => setActiveAnalyticsTab('DISTRIBUTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeAnalyticsTab === 'DISTRIBUTION'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Phân Bố Điểm Chữ</span>
          </button>

          <button
            onClick={() => setActiveAnalyticsTab('ADVISING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeAnalyticsTab === 'ADVISING'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Môn Cần Cải Thiện</span>
          </button>

          <button
            onClick={() => setActiveAnalyticsTab('SIMULATOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeAnalyticsTab === 'SIMULATOR'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-purple-500" />
            <span>Dự Báo Mục Tiêu</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GPA PROGRESSION CHART / TIMELINE */}
      {activeAnalyticsTab === 'PROGRESSION' && (
        <GpaProgressionTab
          gpaProgression={data?.gpaProgression || []}
          gpaScaleView={gpaScaleView}
          setGpaScaleView={setGpaScaleView}
          gpaModeView={gpaModeView}
          setGpaModeView={setGpaModeView}
        />
      )}

      {/* TAB 2: GRADE DISTRIBUTION */}
      {activeAnalyticsTab === 'DISTRIBUTION' && (
        <GradeDistributionTab buckets={data?.gradeDistribution.buckets || []} />
      )}

      {/* TAB 3: SMART ADVISING & IMPROVEMENT COURSES */}
      {activeAnalyticsTab === 'ADVISING' && (
        <AdvisingTab
          topCourses={data?.topCourses || []}
          improvementCourses={data?.improvementCourses || []}
        />
      )}

      {/* TAB 4: GRADUATION TARGET SIMULATOR */}
      {activeAnalyticsTab === 'SIMULATOR' && (
        <TargetSimulatorTab targetGoals={data?.targetGoals || []} />
      )}
    </div>
  );
}
