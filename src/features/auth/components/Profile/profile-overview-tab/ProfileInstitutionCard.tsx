'use client';

import React from 'react';
import { Award, ExternalLink } from 'lucide-react';

export function ProfileInstitutionCard() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-3.5 sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <Award className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-slate-800 text-xs sm:text-sm truncate sm:whitespace-normal">Học Viện Công Nghệ Bưu Chính Viễn Thông</h4>
          <p className="text-[10px] sm:text-[11px] text-slate-500">Hệ Đào Tạo Từ Xa (PTTC1)</p>
        </div>
      </div>

      <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-100">
        Cổng tiện ích học tập, đối chiếu môn học & tra cứu lịch thi trực tuyến PTIT EduSync. Dữ liệu được đồng bộ trực tiếp từ cổng trường.
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs font-bold">
        <div className="flex items-center justify-between text-indigo-600">
          <span>Cổng QLĐT:</span>
          <a
            href="https://qldttx.pttc1.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-mono flex items-center gap-1"
          >
            qldttx.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center justify-between text-sky-600">
          <span>Cổng LMS:</span>
          <a
            href="https://lms.pttc1.edu.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-mono flex items-center gap-1"
          >
            lms.pttc1.edu.vn <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
