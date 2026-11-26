'use client';

import React from 'react';
import {
  Clock,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  GraduationCap,
  Award,
  UserCheck,
} from 'lucide-react';
import { GlobalNightlySyncConfigValue } from '@/src/lib/globalConfig';
import { GlobalJobType } from '../../types/globalSyncQueue.types';

interface QuickActionTriggerCardsProps {
  config: GlobalNightlySyncConfigValue;
  isSubmitting: boolean;
  onEnqueueJob: (options: { jobType: GlobalJobType }) => void;
}

interface TriggerJobCardSpec {
  number: string;
  jobType: GlobalJobType;
  portalLabel: string;
  scheduleTime: string;
  title: string;
  description: React.ReactNode;
  buttonLabel: string;
  icon: React.ReactNode;
  cardClass: string;
  badgeClass: string;
  portalBadgeClass: string;
  timeBadgeClass: string;
  buttonClass: string;
}

export function QuickActionTriggerCards({
  config,
  isSubmitting,
  onEnqueueJob,
}: QuickActionTriggerCardsProps) {
  const jobCards: TriggerJobCardSpec[] = [
    {
      number: '1',
      jobType: 'SYNC_TIMETABLE',
      portalLabel: 'QLHT',
      scheduleTime: config?.timetableJob?.scheduleTime || '22:00',
      title: 'Job 1: Lịch Học & TKB',
      description: (
        <>
          Kéo TKB học kỳ cho các sinh viên <strong>đã liên kết Cổng QLDTTX (QLHT)</strong>.
        </>
      ),
      buttonLabel: 'Đồng Bộ Lịch Học',
      icon: <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-indigo-50 to-blue-50/50 border-indigo-100',
      badgeClass: 'bg-indigo-600',
      portalBadgeClass: 'bg-indigo-100 text-indigo-700',
      timeBadgeClass: 'bg-amber-100 text-amber-800',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
    },
    {
      number: '2',
      jobType: 'SYNC_GRADES',
      portalLabel: 'QLHT',
      scheduleTime: config?.gradesJob?.scheduleTime || '22:00',
      title: 'Job 2: Điểm QLDTTX',
      description: (
        <>
          Kéo bảng điểm &amp; GPA cho các sinh viên <strong>đã liên kết Cổng QLDTTX (QLHT)</strong>.
        </>
      ),
      buttonLabel: 'Đồng Bộ Điểm QLHT',
      icon: <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100',
      badgeClass: 'bg-emerald-600',
      portalBadgeClass: 'bg-emerald-100 text-emerald-700',
      timeBadgeClass: 'bg-amber-100 text-amber-800',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
    },
    {
      number: '3',
      jobType: 'SYNC_LMS',
      portalLabel: 'LMS',
      scheduleTime: config?.lmsJob?.scheduleTime || '22:00',
      title: 'Job 3: Khóa Học LMS',
      description: (
        <>
          Kéo tiến độ % môn học cho các sinh viên <strong>đã liên kết LMS PTTC1</strong>.
        </>
      ),
      buttonLabel: 'Đồng Bộ LMS',
      icon: <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-purple-50 to-pink-50/50 border-purple-100',
      badgeClass: 'bg-purple-600',
      portalBadgeClass: 'bg-purple-100 text-purple-700',
      timeBadgeClass: 'bg-amber-100 text-amber-800',
      buttonClass: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800',
    },
    {
      number: '4',
      jobType: 'SYNC_EXAMS',
      portalLabel: 'QLHT',
      scheduleTime: config?.examsJob?.scheduleTime || '07:00',
      title: 'Job 4: Lịch Thi QLDTTX',
      description: 'Đồng bộ lịch thi, phòng thi & báo biến động. Quét 20-30p nếu có ca thi hôm nay.',
      buttonLabel: 'Đồng Bộ Lịch Thi',
      icon: <Calendar className="w-4 h-4 text-amber-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200',
      badgeClass: 'bg-amber-600',
      portalBadgeClass: 'bg-amber-100 text-amber-800',
      timeBadgeClass: 'bg-amber-200 text-amber-900',
      buttonClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
    },
    {
      number: '5',
      jobType: 'SYNC_SLINK_GRADES',
      portalLabel: 'S-Link',
      scheduleTime: config?.slinkGradesJob?.scheduleTime || '23:00',
      title: 'Job 5: Điểm S-Link',
      description: (
        <>
          Kéo kết quả học tập &amp; bảng điểm cho SV <strong>đã liên kết PTIT S-Link</strong>.
        </>
      ),
      buttonLabel: 'Đồng Bộ S-Link',
      icon: <Award className="w-4 h-4 text-violet-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-violet-50 to-purple-50/50 border-violet-200',
      badgeClass: 'bg-violet-600',
      portalBadgeClass: 'bg-violet-100 text-violet-800',
      timeBadgeClass: 'bg-violet-200 text-violet-900',
      buttonClass: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
    },
    {
      number: '6',
      jobType: 'SYNC_PROFILE',
      portalLabel: 'QLHT',
      scheduleTime: config?.profileJob?.scheduleTime || '22:30',
      title: 'Job 6: Hồ Sơ SV QLHT',
      description:
        'Đồng bộ ngày sinh, giới tính, SĐT, CMND, Email 1/2, nơi sinh & quốc tịch từ QLHT.',
      buttonLabel: 'Đồng Bộ Hồ Sơ SV',
      icon: <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />,
      cardClass: 'bg-gradient-to-br from-sky-50 to-cyan-50/50 border-sky-200',
      badgeClass: 'bg-sky-600',
      portalBadgeClass: 'bg-sky-100 text-sky-800',
      timeBadgeClass: 'bg-amber-100 text-amber-800',
      buttonClass: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
      {jobCards.map((card) => (
        <div
          key={card.jobType}
          className={`p-3.5 sm:p-4 ${card.cardClass} border rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${card.badgeClass} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
              >
                {card.number}
              </span>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 ${card.portalBadgeClass} rounded-md`}>
                  {card.portalLabel}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${card.timeBadgeClass} rounded-md flex items-center gap-0.5`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  {card.scheduleTime}
                </span>
              </div>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {card.icon}
              <span>{card.title}</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2">
              {card.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnqueueJob({ jobType: card.jobType })}
            disabled={isSubmitting}
            className={`mt-3 sm:mt-4 w-full py-2 ${card.buttonClass} text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98`}
          >
            <Zap className="w-3.5 h-3.5" /> {card.buttonLabel}
          </button>
        </div>
      ))}

      {/* ALL 6 JOBS */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 rounded-2xl flex flex-col justify-between hover:shadow-xs transition-all">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              ★
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md">
              Tất Cả 6 Job
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Đồng Bộ Toàn Diện</span>
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-1 line-clamp-2">
            Tự động đồng bộ Lịch học, Điểm QLDTTX, Khóa học LMS, Lịch thi, Điểm S-Link và Hồ sơ SV.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEnqueueJob({ jobType: 'SYNC_ALL' })}
          disabled={isSubmitting}
          className="mt-3 sm:mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:from-blue-700 active:to-indigo-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
        >
          <Sparkles className="w-3.5 h-3.5" /> Kích Hoạt Cả 6 Job
        </button>
      </div>
    </div>
  );
}
