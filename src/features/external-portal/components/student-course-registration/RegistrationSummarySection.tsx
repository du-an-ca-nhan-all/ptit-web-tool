import React from 'react';
import {
  BookOpen,
  Clock,
  GraduationCap,
  DollarSign,
  Globe,
  CalendarDays,
} from 'lucide-react';
import { RegistrationSummary, SemesterInfo } from './types';

interface RegistrationSummarySectionProps {
  summary: RegistrationSummary;
  semesters: SemesterInfo[];
  selectedSemester: string;
  selectedSemesterName: string;
  onSemesterChange: (newSem: string) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function RegistrationSummarySection({
  summary,
  semesters,
  selectedSemester,
  selectedSemesterName,
  onSemesterChange,
  onNavigateTab,
}: RegistrationSummarySectionProps) {
  return (
    <>
      {/* External Account Not Linked Warning */}
      {!summary.externalAccount?.isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Chưa cấu hình tài khoản QLĐT Từ Xa
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Để hệ thống tự động kéo kết quả đăng ký môn học và các kỳ cũ từ cổng trường (https://qldttx.pttc1.edu.vn/), vui lòng liên kết tài khoản trong phần Hồ Sơ.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              Cấu Hình Ngay →
            </button>
          )}
        </div>
      )}

      {/* Semester Selector Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Chọn Học Kỳ Hiển Thị:
            </span>
            <span className="text-[11px] text-slate-400">
              Lọc danh sách môn học theo từng học kỳ từ cổng QLDTTX (/#/tkb-hocky)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[260px]"
          >
            <option value="CURRENT">⚡ Đợt ĐKMH Hiện Tại</option>
            {semesters.map((s) => (
              <option key={s.hoc_ky} value={String(s.hoc_ky)}>
                📅 {s.ten_hoc_ky} ({s.totalCourses} môn - {s.totalCredits} TC)
              </option>
            ))}
            {semesters.length > 0 && <option value="ALL">🌐 Tất Cả Các Học Kỳ Đã Học</option>}
          </select>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Số Môn Đã Đăng Ký</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {summary.totalCourses} <span className="text-xs font-normal text-slate-400">môn học</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5 truncate max-w-[180px]">{selectedSemesterName}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Số Tín Chỉ</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              {summary.totalCredits} <span className="text-xs font-normal text-slate-400">tín chỉ (TC)</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Khối lượng học tập</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Học Phí Tạm Tính</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {summary.tuitionFee > 0 ? `${summary.tuitionFee.toLocaleString('vi-VN')} đ` : 'Đã thanh toán / TKB'}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Theo cổng PTTC1</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đồng Bộ Lần Cuối</div>
            <div className="text-sm font-bold text-slate-800 truncate mt-0.5">
              {summary.lastPulledAt ? new Date(summary.lastPulledAt).toLocaleTimeString('vi-VN') : 'Chưa đồng bộ'}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {summary.lastPulledAt ? new Date(summary.lastPulledAt).toLocaleDateString('vi-VN') : '—'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
