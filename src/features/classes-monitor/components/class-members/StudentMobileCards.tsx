import React from 'react';
import {
  Calendar,
  Edit3,
  Phone,
  Crown,
  UserCheck,
  Eye,
  UserMinus,
  RotateCcw,
  ArrowRightLeft,
  KeyRound,
} from 'lucide-react';
import { ActiveTab } from './types';

interface StudentMobileCardsProps {
  students: any[];
  activeTab: ActiveTab;
  hasExamSchedule: boolean;
  canManageClass: boolean;
  isAdmin: boolean;
  onSelectStudentDetail: (student: any) => void;
  onSelectStudentSchedule?: (studentId: string) => void;
  onEditStudent: (student: any) => void;
  onExcludeStudent: (student: any) => void;
  onResetPassword: (student: any) => void;
  onImpersonate?: (username: string) => void;
  onRestoreStudent: (student: any) => void;
}

export default function StudentMobileCards({
  students,
  activeTab,
  hasExamSchedule,
  canManageClass,
  isAdmin,
  onSelectStudentDetail,
  onSelectStudentSchedule,
  onEditStudent,
  onExcludeStudent,
  onResetPassword,
  onImpersonate,
  onRestoreStudent,
}: StudentMobileCardsProps) {
  return (
    <div className="block md:hidden p-3.5 space-y-3">
      {students.map((student, index) => {
        const isFemale =
          (student.PHAI || '').toLowerCase().includes('nữ') ||
          (student.PHAI || '').toLowerCase().includes('nu');

        return (
          <div
            key={student.MaSV}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-3 relative overflow-hidden active:scale-98"
          >
            {/* Header: Avatar, Big Name & Status */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 ${
                    isFemale
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}
                >
                  {student.TenSV ? student.TenSV.charAt(0) : student.HoLotSV ? student.HoLotSV.charAt(0) : 'S'}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Big Student Name */}
                  <h3 className="text-base font-black text-slate-900 leading-snug flex items-center gap-1.5 flex-wrap">
                    <span>
                      {student.HoLotSV} {student.TenSV}
                    </span>
                    {student.isMonitor && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                        <Crown className="w-3 h-3 text-amber-600 fill-amber-400" /> Lớp trưởng
                      </span>
                    )}
                    {student.isTransferred && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 shrink-0">
                        <ArrowRightLeft className="w-3 h-3" /> Chuyển đến
                      </span>
                    )}
                  </h3>

                  {/* Student ID & Gender Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <button
                      type="button"
                      onClick={() => onSelectStudentDetail(student)}
                      className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg cursor-pointer hover:underline"
                    >
                      {student.MaSV}
                    </button>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        isFemale
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}
                    >
                      {student.PHAI || 'Nam'}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
                #{index + 1}
              </span>
            </div>

            {/* 2x2 Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-500" /> Ngày Sinh
                </span>
                <div className="font-mono font-bold text-slate-800 text-xs">{student.NgaySinhC || '—'}</div>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-500" /> SĐT Liên Hệ
                </span>
                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    className="font-mono font-bold text-emerald-700 hover:underline text-xs"
                  >
                    {student.phone}
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">—</span>
                )}
              </div>

              {hasExamSchedule && (
                <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" /> Đăng Ký Thi
                  </span>
                  <div className="font-bold text-slate-800 text-xs">{student.examCount || 0} môn thi</div>
                </div>
              )}

              {student.note && (
                <div
                  className={`flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60 ${
                    hasExamSchedule ? '' : 'col-span-2'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-purple-500" /> Ghi Chú
                  </span>
                  <span className="text-xs text-slate-600 italic line-clamp-2">"{student.note}"</span>
                </div>
              )}
            </div>

            {/* Card Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap text-xs">
              {activeTab === 'ACTIVE' ? (
                <>
                  {hasExamSchedule && onSelectStudentSchedule ? (
                    <button
                      type="button"
                      onClick={() => onSelectStudentSchedule(student.MaSV)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Lịch Thi ({student.examCount || 0} môn)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectStudentDetail(student)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Chi Tiết</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => onSelectStudentDetail(student)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition cursor-pointer"
                      title="Xem thông tin chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canManageClass && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl transition cursor-pointer"
                          title="Chỉnh sửa SĐT & ghi chú"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onExcludeStudent(student)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer"
                          title="Điều chuyển / Bảo lưu"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onResetPassword(student)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title={`Đặt lại mật khẩu cho ${student.MaSV}`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onImpersonate && (
                      <button
                        type="button"
                        onClick={() => onImpersonate(student.MaSV)}
                        className="p-1.5 text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title={`Giả lập ${student.MaSV}`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                canManageClass && (
                  <button
                    type="button"
                    onClick={() => onRestoreStudent(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục Vào Lớp
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
