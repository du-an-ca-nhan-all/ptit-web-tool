'use client';

import React from 'react';
import { Users, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { ReviewSummary } from './types';

interface ReviewSummaryCardsProps {
  summary: ReviewSummary;
}

export function ReviewSummaryCards({ summary }: ReviewSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sĩ Số Lớp</p>
          <p className="text-2xl font-black text-slate-800">{summary.total} SV</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-4 ring-1 ring-emerald-500/10">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Đăng Ký Ôn Tập</p>
          <p className="text-2xl font-black text-emerald-700">{summary.registered} SV</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chưa Đăng Ký</p>
          <p className="text-2xl font-black text-slate-700">{summary.unregistered} SV</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Có Lịch Thi Đợt Này</p>
          <p className="text-2xl font-black text-indigo-700">{summary.withExams} SV</p>
        </div>
      </div>
    </div>
  );
}
