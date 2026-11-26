import React from 'react';
import { User, Phone, Calendar, KeyRound, UserCheck, Crown, Lock } from 'lucide-react';
import { ResetTarget, StudentItem } from './types';
import { StudentStatusBadge } from './StudentStatusBadge';

interface StudentsMobileCardsProps {
  students: StudentItem[];
  isAdmin: boolean;
  onSelectStudentSchedule?: (studentId: string) => void;
  onImpersonate?: (username: string) => void;
  onClassClick?: (classCode: string) => void;
  onOpenResetModal: (target: ResetTarget) => void;
}

export function StudentsMobileCards({
  students,
  isAdmin,
  onSelectStudentSchedule,
  onImpersonate,
  onClassClick,
  onOpenResetModal,
}: StudentsMobileCardsProps) {
  return (
    <div className="block md:hidden space-y-3">
      {students.map((student) => {
        const isFemale = student.gioiTinh === 'Nữ';

        return (
          <div
            key={student.maSV}
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
                  {student.ten ? student.ten.charAt(0) : student.hoTen.charAt(0)}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Big Student Name */}
                  <h3 className="text-base font-black text-slate-900 leading-snug flex items-center gap-1.5">
                    <span>{student.hoTen}</span>
                    {isAdmin && student.user?.role?.includes('lop_truong') && (
                      <span title="Lớp trưởng" className="text-amber-500 shrink-0">
                        <Crown className="w-3.5 h-3.5 fill-amber-400" />
                      </span>
                    )}
                  </h3>

                  {/* Student ID & Class Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <button
                      type="button"
                      onClick={() => onSelectStudentSchedule && onSelectStudentSchedule(student.maSV)}
                      className="font-mono text-xs font-black text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg cursor-pointer hover:underline"
                    >
                      {student.maSV}
                    </button>

                    {student.maLop ? (
                      <button
                        type="button"
                        onClick={() => onClassClick && onClassClick(student.maLop)}
                        className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg cursor-pointer hover:underline truncate max-w-[130px]"
                      >
                        {student.maLop}
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Chưa phân lớp</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <StudentStatusBadge status={student.trangThai} />
              </div>
            </div>

            {/* 2x2 Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-sky-500" /> Giới Tính
                </span>
                <div className="font-bold text-slate-800 text-xs">
                  {student.gioiTinh || 'Nam'}
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" /> Ngày Sinh
                  </span>
                  <div className="font-mono font-bold text-slate-800 text-xs">
                    {student.ngaySinh || '—'}
                  </div>
                </div>
              )}

              {/* ADMIN INFO CELLS */}
              {isAdmin && (
                <>
                  <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" /> SĐT Liên Hệ
                    </span>
                    {student.soDienThoai ? (
                      <a
                        href={`tel:${student.soDienThoai}`}
                        className="font-mono font-bold text-emerald-700 hover:underline text-xs"
                      >
                        {student.soDienThoai}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">—</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-purple-500" /> Tài Khoản
                    </span>
                    {student.user ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {student.user.hasPassword ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Có MK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa đặt MK
                          </span>
                        )}
                        {student.user.role !== 'sinh_vien' && (
                          <span className="text-[9px] font-mono text-indigo-600 font-bold">
                            @{student.user.role}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Chưa tạo</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Card Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
              {onSelectStudentSchedule && (
                <button
                  type="button"
                  onClick={() => onSelectStudentSchedule(student.maSV)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {typeof student.examCount === 'number' && student.examCount > 0
                      ? `Xem Lịch Thi (${student.examCount} môn)`
                      : 'Xem Lịch Thi'}
                  </span>
                </button>
              )}

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenResetModal({
                        username: student.maSV,
                        fullName: student.hoTen,
                        lop: student.maLop,
                      })
                    }
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    title={`Đặt lại mật khẩu cho ${student.maSV}`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Reset MK</span>
                  </button>

                  {onImpersonate && (
                    <button
                      type="button"
                      onClick={() => onImpersonate(student.maSV)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 border border-purple-200 rounded-xl transition cursor-pointer"
                      title={`Giả lập ${student.maSV}`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
