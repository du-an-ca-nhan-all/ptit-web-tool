import React from 'react';
import { Users } from 'lucide-react';
import { ExamRecord } from '../../../../types';
import { getStudentFullName } from './utils';

interface RoomStudentsTableProps {
  students: ExamRecord[];
  searchQuery: string;
  userClass: string;
}

export default function RoomStudentsTable({
  students,
  searchQuery,
  userClass,
}: RoomStudentsTableProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700 text-sm">Không tìm thấy sinh viên nào</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác hoặc bỏ lọc lớp' : 'Phòng thi này chưa có dữ liệu sinh viên'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center w-12">STT</th>
                <th className="px-4 py-3 w-32">Mã SV</th>
                <th className="px-4 py-3 min-w-[180px]">Họ và Tên</th>
                <th className="px-3 py-3 w-20 text-center">Phái</th>
                <th className="px-3 py-3 w-28">Ngày sinh</th>
                <th className="px-4 py-3 w-32">Lớp</th>
                <th className="px-3 py-3 w-24 text-center">Tổ thi</th>
                <th className="px-3 py-3 w-28 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {students.map((student, idx) => {
                const fullName = getStudentFullName(student);
                const isMyClass =
                  userClass && (student.MaLop || '').trim().toUpperCase() === userClass.trim().toUpperCase();

                return (
                  <tr
                    key={student.id || `${student.MaSV}-${idx}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isMyClass ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-center text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{student.MaSV}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                      <span>{fullName || student.MaSV}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500">
                      {student.PHAI || (student as any).Phai || '-'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {student.NgaySinhC || (student as any).NgaySinh || '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] border ${
                          isMyClass
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {student.MaLop || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                      {student['To thi'] || student.ToThi || student.NhomThi || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {student.isPostponed ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                          Hoãn thi
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Dự thi
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
