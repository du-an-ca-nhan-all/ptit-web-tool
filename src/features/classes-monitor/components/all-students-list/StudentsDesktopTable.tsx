import React from 'react';
import {
  GraduationCap,
  Phone,
  Calendar,
  KeyRound,
  UserCheck,
  Crown,
  Lock,
} from 'lucide-react';
import { ResetTarget, StudentItem } from './types';
import { StudentStatusBadge } from './StudentStatusBadge';

interface StudentsDesktopTableProps {
  students: StudentItem[];
  currentPage: number;
  pageSize: number;
  isAdmin: boolean;
  onSelectStudentSchedule?: (studentId: string) => void;
  onImpersonate?: (username: string) => void;
  onClassClick?: (classCode: string) => void;
  onOpenResetModal: (target: ResetTarget) => void;
}

export function StudentsDesktopTable({
  students,
  currentPage,
  pageSize,
  isAdmin,
  onSelectStudentSchedule,
  onImpersonate,
  onClassClick,
  onOpenResetModal,
}: StudentsDesktopTableProps) {
  return (
    <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">STT</th>
              <th className="py-3.5 px-4">Sinh Viên / Mã SV</th>
              <th className="py-3.5 px-4">Giới Tính</th>
              {isAdmin && <th className="py-3.5 px-4">Ngày Sinh</th>}
              <th className="py-3.5 px-4">Lớp Học</th>
              <th className="py-3.5 px-4">Trạng Thái</th>

              {/* ADMIN FULL COLUMNS */}
              {isAdmin && (
                <>
                  <th className="py-3.5 px-4">SĐT Liên Hệ</th>
                  <th className="py-3.5 px-4">Tài Khoản</th>
                  <th className="py-3.5 px-4">Môn Thi</th>
                  <th className="py-3.5 px-4">Ghi Chú</th>
                </>
              )}

              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {students.map((student, idx) => {
              const serialNumber = (currentPage - 1) * pageSize + idx + 1;
              const isFemale = student.gioiTinh === 'Nữ';

              return (
                <tr
                  key={student.maSV}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-[11px]">
                    {serialNumber}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isFemale
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}
                      >
                        {student.ten ? student.ten.charAt(0) : student.hoTen.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>{student.hoTen}</span>
                          {isAdmin && student.user?.role?.includes('lop_truong') && (
                            <span title="Lớp trưởng" className="text-amber-500">
                              <Crown className="w-3.5 h-3.5 fill-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                          {student.maSV}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isFemale
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}
                    >
                      {student.gioiTinh || 'Nam'}
                    </span>
                  </td>

                  {isAdmin && (
                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium font-mono">
                      {student.ngaySinh || '—'}
                    </td>
                  )}

                  <td className="py-3.5 px-4">
                    {student.maLop ? (
                      <button
                        type="button"
                        onClick={() => onClassClick && onClassClick(student.maLop)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                        title="Xem chi tiết lớp này"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                        <span>{student.maLop}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Chưa phân lớp</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <StudentStatusBadge status={student.trangThai} />
                  </td>

                  {/* ADMIN-ONLY DATA CELLS */}
                  {isAdmin && (
                    <>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {student.soDienThoai ? (
                          <a
                            href={`tel:${student.soDienThoai}`}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 font-bold"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student.soDienThoai}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {student.user ? (
                          <div className="flex flex-col gap-0.5">
                            {student.user.hasPassword ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Lock className="w-2.5 h-2.5" /> Có MK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Chưa đặt MK
                              </span>
                            )}
                            {student.user.role !== 'sinh_vien' && (
                              <span className="text-[10px] font-mono text-indigo-600 font-bold">
                                @{student.user.role}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa tạo user</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {typeof student.examCount === 'number' && student.examCount > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectStudentSchedule && onSelectStudentSchedule(student.maSV)
                            }
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Xem lịch thi của sinh viên này"
                          >
                            {student.examCount} môn
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td
                        className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate"
                        title={student.ghiChu || ''}
                      >
                        {student.ghiChu || <span className="text-slate-400 italic">—</span>}
                      </td>
                    </>
                  )}

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Tra cứu lịch thi của sinh viên */}
                      {onSelectStudentSchedule && (
                        <button
                          type="button"
                          onClick={() => onSelectStudentSchedule(student.maSV)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title={`Xem lịch thi & môn học của ${student.maSV}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      )}

                      {/* ADMIN ONLY ACTIONS */}
                      {isAdmin && (
                        <>
                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() =>
                              onOpenResetModal({
                                username: student.maSV,
                                fullName: student.hoTen,
                                lop: student.maLop,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            title={`Đặt lại mật khẩu cho sinh viên ${student.maSV}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Impersonate */}
                          {onImpersonate && (
                            <button
                              type="button"
                              onClick={() => onImpersonate(student.maSV)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                              title={`Đăng nhập giả lập với tư cách ${student.maSV}`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
