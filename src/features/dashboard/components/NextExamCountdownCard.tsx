'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  CalendarCheck2,
} from 'lucide-react';
import { NextExamCountdown } from '../types/dashboard.types';

interface NextExamCountdownCardProps {
  countdown: NextExamCountdown;
  onNavigateToSchedule: () => void;
}

export default function NextExamCountdownCard({
  countdown,
  onNavigateToSchedule,
}: NextExamCountdownCardProps) {
  const { hasExam, exam, totalUpcomingExams } = countdown;

  // Live real-time tick for countdown
  const [timeLeft, setTimeLeft] = useState({
    days: exam?.daysLeft || 0,
    hours: exam?.hoursLeft || 0,
    minutes: exam?.minutesLeft || 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!exam?.isoDateTime) return;

    const updateTimer = () => {
      const target = new Date(exam.isoDateTime!).getTime();
      const now = Date.now();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / (24 * 3600));
      const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [exam?.isoDateTime]);

  if (!hasExam || !exam) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Môn Thi Tiếp Theo</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã hoàn thành
          </span>
        </div>

        <div className="py-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-slate-700">Không có môn thi sắp tới</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Bạn hiện tại không có môn thi nào cần thi trong đợt này hoặc tất cả các môn đã thi xong.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <span>Xem Lịch Thi Đầy Đủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const isUrgent = exam.isToday || (exam.daysLeft === 0 && exam.hoursLeft <= 12);

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between h-full relative overflow-hidden transition-all ${
        isUrgent
          ? 'bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 border-rose-200 shadow-rose-100/50'
          : 'bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/30 border-indigo-100 shadow-indigo-100/40'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isUrgent ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                Môn Thi Sắp Diễn Ra
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Còn lại {totalUpcomingExams} môn cần thi
              </span>
            </div>
          </div>

          {exam.isToday ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              HÔM NAY THI!
            </span>
          ) : exam.isTomorrow ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              NGÀY MAI THI
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sắp tới
            </span>
          )}
        </div>

        {/* Exam Title */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {exam.subjectCode}
            </span>
            {exam.examFormat && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                HT: {exam.examFormat}
              </span>
            )}
            {exam.isPostponed && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Hoãn thi
              </span>
            )}
          </div>

          <h4 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 tracking-tight leading-snug">
            {exam.subjectName}
          </h4>
        </div>

        {/* Countdown Timer Display */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-2.5 text-center shadow-xs">
            <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono leading-none">
              {timeLeft.days}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Ngày</div>
          </div>
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-2.5 text-center shadow-xs">
            <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono leading-none">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Giờ</div>
          </div>
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-2.5 text-center shadow-xs">
            <div className="text-lg sm:text-2xl font-black text-slate-800 font-mono leading-none">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Phút</div>
          </div>
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-2.5 text-center shadow-xs">
            <div className="text-lg sm:text-2xl font-black text-rose-600 font-mono leading-none">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Giây</div>
          </div>
        </div>

        {/* Exam Details Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2 bg-white/60 p-3 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>
              Ngày: <b className="text-slate-800">{exam.examDate || 'Chưa xếp'}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Giờ: <b className="text-slate-800">{exam.examTime || 'Chưa xếp'}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">
              Phòng: <b className="text-slate-800 font-mono">{exam.room || 'Chưa rõ'}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              SBD: <b className="text-slate-800">{exam.studentGroup || 'Theo danh sách'}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 truncate">
          Đợt thi: {exam.batchName || 'Hiện tại'}
        </span>
        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-200 cursor-pointer shrink-0"
        >
          <span>Chi tiết lịch thi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
