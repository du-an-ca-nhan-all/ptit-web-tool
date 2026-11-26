import React from 'react';
import { BookOpen, Clock, Calendar, X, Video, Phone } from 'lucide-react';

interface CourseDetailModalProps {
  course: any | null;
  onClose: () => void;
}

export default function CourseDetailModal({ course, onClose }: CourseDetailModalProps) {
  if (!course) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {course.to_hoc?.ten_mon || course.ten_mon}
              </h3>
              <p className="text-xs text-blue-100 font-mono mt-0.5">
                Mã môn: {course.to_hoc?.ma_mon || course.ma_mon} • Nhóm tổ:{' '}
                {course.to_hoc?.nhom_to || course.nhom_to}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-0.5">Số tín chỉ:</span>
              <span className="font-bold text-slate-800 text-sm">
                {course.to_hoc?.so_tc || course.to_hoc?.so_tc_hp || course.so_tc} TC
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-slate-400 font-bold block mb-0.5">Lớp học phần:</span>
              <span className="font-bold text-indigo-700 text-xs font-mono">
                {course.to_hoc?.lop || course.lop || '—'}
              </span>
            </div>
          </div>

          {/* Lecturer details */}
          {(course.to_hoc?.gv || course.gv) && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">Giảng viên phụ trách:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {course.to_hoc?.gv || course.gv}
                </span>
                {(course.to_hoc?.phong || course.phong) && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Phòng học: {course.to_hoc?.phong || course.phong}
                  </div>
                )}
              </div>

              {(course.to_hoc?.dt_gv || course.dt_gv) && (
                <a
                  href={`tel:${course.to_hoc?.dt_gv || course.dt_gv}`}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{course.to_hoc?.dt_gv || course.dt_gv}</span>
                </a>
              )}
            </div>
          )}

          {/* Online class link */}
          {(course.to_hoc?.link_hoc_online || course.link_hoc_online) && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-blue-900 font-bold block">Phòng Học Trực Tuyến (Zoom):</span>
                  <span className="text-blue-700 text-[11px] font-mono truncate block max-w-[240px]">
                    {course.to_hoc?.link_hoc_online || course.link_hoc_online}
                  </span>
                </div>
              </div>

              <a
                href={course.to_hoc?.link_hoc_online || course.link_hoc_online}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shrink-0"
              >
                Tham Gia →
              </a>
            </div>
          )}

          {/* Schedule details */}
          {(course.to_hoc?.tkb || course.tkb) && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-800 font-bold block mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Lịch học / Thời khóa biểu:
              </span>
              <div
                className="text-slate-700 leading-relaxed font-sans text-xs"
                dangerouslySetInnerHTML={{
                  __html: course.to_hoc?.tkb || course.tkb,
                }}
              />
            </div>
          )}

          {course.ngay_dang_ky && (
            <div className="text-slate-500 text-[11px] flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Thời gian đăng ký hệ thống:{' '}
                <strong>{new Date(course.ngay_dang_ky).toLocaleString('vi-VN')}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
