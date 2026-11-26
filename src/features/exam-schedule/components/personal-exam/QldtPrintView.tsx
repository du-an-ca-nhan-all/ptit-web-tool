import React from 'react';
import { Printer } from 'lucide-react';
import type { StudentQldtExamItem } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { LoginUser } from '../../types/exam.types';

interface QldtPrintViewProps {
  currentUser: LoginUser;
  semesterName?: string;
  exams: StudentQldtExamItem[];
  onPrint: () => void;
}

export default function QldtPrintView({
  currentUser,
  semesterName,
  exams,
  onPrint,
}: QldtPrintViewProps) {
  const now = new Date();

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-slate-800">
            Phiếu Báo Dự Thi Cá Nhân (Mẫu In Chuẩn)
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Định dạng A4 phù hợp để in giấy hoặc xuất file PDF lưu trữ
          </p>
        </div>
        <button
          onClick={onPrint}
          className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Printer className="w-4 h-4" />
          <span>In Phiếu / Lưu PDF</span>
        </button>
      </div>

      <div className="block sm:hidden text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        💡 <span className="font-bold">Mẹo trên Mobile:</span> Vuốt ngang bảng bên dưới để xem
        toàn bộ thông tin hoặc nhấn <b>&quot;In Phiếu / Lưu PDF&quot;</b>.
      </div>

      <div className="border border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center text-center gap-4 pb-4 border-b border-slate-300">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG
            </div>
            <div className="text-xs font-black uppercase text-indigo-700 mt-0.5">
              TRUNG TÂM ĐÀO TẠO ĐẠI HỌC TỪ XA
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="text-xs font-bold text-slate-600 underline mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
            PHIẾU BÁO LỊCH THI HỌC KỲ
          </h2>
          <p className="text-xs font-bold text-indigo-700 uppercase">
            {semesterName || 'HỌC KỲ THI'}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Họ và tên:</span>{' '}
            <strong className="text-slate-900 font-bold uppercase">
              {currentUser.fullName || currentUser.username}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Mã số sinh viên (MSSV):</span>{' '}
            <strong className="text-slate-900 font-mono font-bold">{currentUser.username}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Lớp sinh viên:</span>{' '}
            <strong className="text-slate-900 font-bold">
              {currentUser.lop || 'Chưa cập nhật'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Tổng số môn thi:</span>{' '}
            <strong className="text-indigo-700 font-bold">{exams.length} môn</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold text-center border-b border-slate-300">
                <th className="border border-slate-300 p-2 w-10">STT</th>
                <th className="border border-slate-300 p-2 w-24">Mã Môn</th>
                <th className="border border-slate-300 p-2 text-left">Tên Môn Học</th>
                <th className="border border-slate-300 p-2 w-24">Ngày Thi</th>
                <th className="border border-slate-300 p-2 w-20">Giờ Thi</th>
                <th className="border border-slate-300 p-2 w-24">Hình Thức</th>
                <th className="border border-slate-300 p-2 w-20">Phòng Thi</th>
                <th className="border border-slate-300 p-2 w-20">Tổ / SBD</th>
                <th className="border border-slate-300 p-2 text-left">Địa Điểm Thi</th>
                <th className="border border-slate-300 p-2 w-20">Ký Nộp</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, idx) => (
                <tr key={exam.id} className="border-b border-slate-300">
                  <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {exam.maMon}
                  </td>
                  <td className="border border-slate-300 p-2 font-bold">{exam.tenMon}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono">
                    {exam.ngayThi}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono">
                    {exam.gioBatDau}
                  </td>
                  <td className="border border-slate-300 p-2 text-center">{exam.hinhThucThi}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                    {exam.maPhong}
                  </td>
                  <td className="border border-slate-300 p-2 text-center font-mono">
                    Tổ {exam.toThi || '-'}
                  </td>
                  <td className="border border-slate-300 p-2 text-[11px] leading-tight">
                    {exam.diaDiemThi || '-'}
                  </td>
                  <td className="border border-slate-300 p-2 text-center"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
          <div>
            <div className="font-bold uppercase text-slate-600">Thí Sinh Dự Thi</div>
            <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
            <div className="h-16" />
            <div className="font-bold">{currentUser.fullName || currentUser.username}</div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 italic mb-1">
              Hà Nội, ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
            </div>
            <div className="font-bold uppercase text-slate-800">Cán Bộ Lập Bảng</div>
            <div className="text-[10px] text-slate-400 italic">(Ký, đóng dấu xác nhận)</div>
            <div className="h-16" />
            <div className="font-bold">HỆ THỐNG PTIT EDUSYNC</div>
          </div>
        </div>
      </div>
    </div>
  );
}
