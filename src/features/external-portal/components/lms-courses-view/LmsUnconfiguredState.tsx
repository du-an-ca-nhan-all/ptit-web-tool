import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

interface LmsUnconfiguredStateProps {
  onNavigateToExternalAccounts?: () => void;
}

export function LmsUnconfiguredState({ onNavigateToExternalAccounts }: LmsUnconfiguredStateProps) {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-inner">
        <BookOpen className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">
          Chưa Liên Kết Hệ Thống Học Tập Trực Tuyến (LMS)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
          Liên kết tài khoản <strong className="text-sky-600 font-mono">lms.pttc1.edu.vn</strong> để xem toàn bộ danh sách môn học, tiến độ hoàn thành bài giảng và điểm quá trình học tập.
        </p>
      </div>

      <button
        type="button"
        onClick={onNavigateToExternalAccounts}
        className="mt-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-sky-200 flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <span>Liên Kết Tài Khoản LMS Ngay</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
