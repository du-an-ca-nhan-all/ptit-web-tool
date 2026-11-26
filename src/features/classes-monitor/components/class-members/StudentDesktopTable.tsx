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
import { LoginUser } from '../../types/class.types';
import { ActiveTab } from './types';

interface StudentDesktopTableProps {
  students: any[];
  activeTab: ActiveTab;
  hasExamSchedule: boolean;
  canManageClass: boolean;
  isAdmin: boolean;
  classMonitor: LoginUser | null;
  onSelectStudentDetail: (student: any) => void;
  onEditStudent: (student: any) => void;
  onExcludeStudent: (student: any) => void;
  onResetPassword: (student: any) => void;
  onOpenAssignMonitorModal: (preselectedMaSV?: string | null) => void;
  onImpersonate?: (username: string) => void;
  onRestoreStudent: (student: any) => void;
}

export default function StudentDesktopTable({
  students,
  activeTab,
  hasExamSchedule,
  canManageClass,
  isAdmin,
  classMonitor,
  onSelectStudentDetail,
  onEditStudent,
  onExcludeStudent,
  onResetPassword,
  onOpenAssignMonitorModal,
  onImpersonate,
  onRestoreStudent,
}: StudentDesktopTableProps) {
  return (
    <div className="hidden md:block flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100/80 text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs font-bold uppercase tracking-wider">
          <tr>
            <th className="px-4 sm:px-6 py-3.5 w-12 text-center">STT</th>
            <th className="px-4 sm:px-6 py-3.5">Mã SV</th>
            <th className="px-4 sm:px-6 py-3.5">Họ và Tên</th>
            <th className="px-4 sm:px-6 py-3.5 text-center">Phái</th>
            <th className="px-4 sm:px-6 py-3.5">Ngày sinh</th>
            {hasExamSchedule && <th className="px-4 sm:px-6 py-3.5 text-center">Môn thi</th>}
            <th className="px-4 sm:px-6 py-3.5">SĐT & Ghi chú</th>
            <th className="px-4 sm:px-6 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {students.map((student, index) => {
            const isFemale =
              (student.PHAI || '').toLowerCase().includes('nữ') ||
              (student.PHAI || '').toLowerCase().includes('nu');

            return (
              <tr key={student.MaSV} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 sm:px-6 py-3.5 text-center text-slate-400 font-medium text-xs">{index + 1}</td>
                <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-blue-600">
                  <button
                    onClick={() => onSelectStudentDetail(student)}
                    className="hover:underline flex items-center gap-1 text-left cursor-pointer"
                  >
                    {student.MaSV}
                  </button>
                </td>
                <td className="px-4 sm:px-6 py-3.5 font-semibold text-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      {student.HoLotSV}{' '}
                      <span className="font-extrabold text-slate-900">{student.TenSV}</span>
                    </span>

                    {student.isMonitor && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600" /> Lớp trưởng
                      </span>
                    )}

                    {student.isTransferred && (
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" /> Chuyển đến
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3.5 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isFemale
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}
                  >
                    {student.PHAI || 'Nam'}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3.5 text-slate-600 text-xs font-medium">{student.NgaySinhC || '—'}</td>
                {hasExamSchedule && (
                  <td className="px-4 sm:px-6 py-3.5 text-center">
                    <button
                      onClick={() => onSelectStudentDetail(student)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-slate-200 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {student.examCount || 0} môn
                    </button>
                  </td>
                )}
                <td className="px-4 sm:px-6 py-3.5">
                  <div className="flex flex-col gap-1 max-w-[280px]">
                    {student.phone && (
                      <span className="text-[11px] font-mono text-slate-700 flex items-center gap-1 font-semibold">
                        <Phone className="w-3 h-3 text-slate-400" /> {student.phone}
                      </span>
                    )}
                    {student.note ? (
                      <span className="text-xs text-slate-600 line-clamp-1 italic" title={student.note}>
                        "{student.note}"
                      </span>
                    ) : !student.phone ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {activeTab === 'ACTIVE' ? (
                      <>
                        <button
                          onClick={() => onSelectStudentDetail(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title={hasExamSchedule ? 'Xem lịch thi & chi tiết' : 'Xem thông tin chi tiết'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onImpersonate && (
                          <button
                            onClick={() => onImpersonate(student.MaSV)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title={`Đăng nhập với tư cách ${student.MaSV} (${student.TenSV})`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onResetPassword(student)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title={`Đặt lại mật khẩu cho sinh viên ${student.MaSV}`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {student.MaSV === classMonitor?.username ? (
                              <span
                                className="p-1.5 text-amber-600 bg-amber-50 rounded-lg cursor-default"
                                title="Đang là Lớp Trưởng"
                              >
                                <Crown className="w-4 h-4 fill-amber-400 text-amber-600" />
                              </span>
                            ) : (
                              <button
                                onClick={() => onOpenAssignMonitorModal(student.MaSV)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title={`Chỉ định ${student.HoLotSV} ${student.TenSV} làm Lớp Trưởng`}
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {canManageClass && (
                          <>
                            <button
                              onClick={() => onEditStudent(student)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa SĐT & ghi chú"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Button Điều chuyển / Loại khỏi lớp */}
                            <button
                              onClick={() => onExcludeStudent(student)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Điều chuyển / Bảo lưu / Loại khỏi lớp"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : /* Actions for Excluded Students: Restore button */
                    canManageClass ? (
                      <button
                        onClick={() => onRestoreStudent(student)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer shadow-sm"
                        title="Khôi phục lại vào danh sách lớp"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi Phục
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chỉ xem</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
