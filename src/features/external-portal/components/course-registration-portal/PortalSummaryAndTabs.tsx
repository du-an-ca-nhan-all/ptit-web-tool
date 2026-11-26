'use client';

import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  DollarSign,
  HelpCircle,
  Flame,
} from 'lucide-react';
import {
  CourseRegistrationHookResult,
  CourseRegistrationSubTab,
  GroupedSubject,
} from './types';

interface PortalSummaryAndTabsProps {
  openCourses: CourseRegistrationHookResult['openCourses'];
  registeredCourses: CourseRegistrationHookResult['registeredCourses'];
  groupedOpenCourses: GroupedSubject[];
  sniperTargetsCount: number;
  activeSubTab: CourseRegistrationSubTab;
  setActiveSubTab: (tab: CourseRegistrationSubTab) => void;
}

export function PortalSummaryAndTabs({
  openCourses,
  registeredCourses,
  groupedOpenCourses,
  sniperTargetsCount,
  activeSubTab,
  setActiveSubTab,
}: PortalSummaryAndTabsProps) {
  return (
    <>
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Groups */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Môn Đang Mở ĐK</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {openCourses.ds_mon_hoc?.length || groupedOpenCourses.length || 0}{' '}
              <span className="text-xs font-normal text-slate-400">
                môn ({openCourses.ds_nhom_to?.length || 0} nhóm tổ)
              </span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Kỳ ĐKMH hiện tại</div>
          </div>
        </div>

        {/* Card 2: Registered Courses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Môn Đã Đăng Ký</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}{' '}
              <span className="text-xs font-normal text-slate-400">môn học</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Đã ghi nhận trong TKB</div>
          </div>
        </div>

        {/* Card 3: Total Credits */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Tín Chỉ (TC)</div>
            <div className="text-2xl font-black text-blue-600 mt-0.5">
              {registeredCourses.totalCredits}{' '}
              <span className="text-xs font-normal text-slate-400">tín chỉ</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">Khối lượng học tập</div>
          </div>
        </div>

        {/* Card 4: Tuition Fee */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Học Phí Tạm Tính</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {Number(registeredCourses.tuitionFee || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-bold text-slate-400">đ</span>
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-0.5">Theo biểu giá PTTC1</div>
          </div>
        </div>
      </div>

      {/* Subtabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveSubTab('OPEN_COURSES')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'OPEN_COURSES'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh Sách Môn Học Mở</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubTab === 'OPEN_COURSES' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {openCourses.ds_nhom_to?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('REGISTERED_COURSES')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'REGISTERED_COURSES'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Môn Đã Đăng Ký</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeSubTab === 'REGISTERED_COURSES' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {registeredCourses.totalCourses || (registeredCourses.ds_kqdkmh || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('SNIPER_BOT')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'SNIPER_BOT'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 fill-current text-amber-200" />
          <span>Auto Canh Slot (Sniper)</span>
          {sniperTargetsCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[11px] font-black animate-pulse">
              {sniperTargetsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('GUIDE')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'GUIDE'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Hướng Dẫn & Mẹo</span>
        </button>
      </div>
    </>
  );
}
