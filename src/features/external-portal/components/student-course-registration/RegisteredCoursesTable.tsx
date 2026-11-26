import React from 'react';
import {
  BookOpen,
  Zap,
  Search,
  Clock,
  Check,
  X,
  Video,
} from 'lucide-react';

interface RegisteredCoursesTableProps {
  courses: any[];
  filteredCourses: any[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedSemester: string;
  selectedSemesterName: string;
  isLoading: boolean;
  isPulling: boolean;
  isExternalAccountConfigured: boolean;
  onPullFromQLDTTX: () => void;
  onSelectCourseDetail: (course: any) => void;
}

export default function RegisteredCoursesTable({
  courses,
  filteredCourses,
  searchQuery,
  onSearchQueryChange,
  selectedSemester,
  selectedSemesterName,
  isLoading,
  isPulling,
  isExternalAccountConfigured,
  onPullFromQLDTTX,
  onSelectCourseDetail,
}: RegisteredCoursesTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Search Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo tên môn, mã môn, nhóm tổ, TKB, giảng viên..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-bold self-end sm:self-center">
          Hiển thị: <strong className="text-blue-600">{filteredCourses.length}</strong> / {courses.length} môn học ({selectedSemesterName})
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Đang tải danh sách môn học...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu môn học cho học kỳ này</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {isExternalAccountConfigured
                ? 'Bấm nút "Đồng Bộ Từ QLDTTX (Gồm Kỳ Cũ)" phía trên để kéo toàn bộ môn học của các kỳ về máy.'
                : 'Vui lòng liên kết tài khoản cổng QLĐT Từ Xa để tải môn học.'}
            </p>
            {isExternalAccountConfigured && (
              <button
                onClick={onPullFromQLDTTX}
                disabled={isPulling}
                className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Đồng Bộ Toàn Bộ Kỳ Ngay</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">STT</th>
                <th className="px-4 py-3.5">Mã Môn</th>
                <th className="px-4 py-3.5">Tên Môn Học</th>
                <th className="px-4 py-3.5 text-center">Số TC</th>
                <th className="px-4 py-3.5 text-center">Nhóm / Tổ</th>
                <th className="px-4 py-3.5">Lớp Học Phần</th>
                <th className="px-4 py-3.5">Thời Khóa Biểu (TKB)</th>
                <th className="px-4 py-3.5">Giảng Viên / Phòng</th>
                <th className="px-4 py-3.5 text-center">Học Online</th>
                <th className="px-4 py-3.5 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.map((item, index) => {
                const toHoc = item.to_hoc || item || {};
                const maMon = toHoc.ma_mon || item.ma_mon;
                const tenMon = toHoc.ten_mon || item.ten_mon;
                const soTC = toHoc.so_tc || toHoc.so_tc_hp || item.so_tc || 0;
                const nhomTo = toHoc.nhom_to || item.nhom_to || '—';
                const lop = toHoc.lop || item.lop || toHoc.ten_lop || '—';
                const tkb = toHoc.tkb || item.tkb || '';
                const phong = toHoc.phong || item.phong || '';
                const gv = toHoc.gv || item.gv || '';
                const dtGv = toHoc.dt_gv || item.dt_gv || '';
                const linkOnline = toHoc.link_hoc_online || item.link_hoc_online || '';

                return (
                  <tr
                    key={item.id_kqdk || item.id_to_hoc || index}
                    onClick={() => onSelectCourseDetail(item)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs">
                        {maMon}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 text-sm">{tenMon}</span>
                      {item.semesterName && selectedSemester === 'ALL' && (
                        <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.semesterName}
                        </span>
                      )}
                      {item.ngay_dang_ky && (
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Đăng ký: {new Date(item.ngay_dang_ky).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                        {soTC} TC
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-mono font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                        {nhomTo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px] max-w-[150px] truncate" title={lop}>
                      {lop}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      {tkb ? (
                        <div
                          className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: tkb }}
                        />
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chưa xếp TKB</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {gv ? (
                        <div>
                          <span className="font-bold block">{gv}</span>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            {phong && <span>{phong}</span>}
                            {dtGv && <span>• {dtGv}</span>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{phong || 'Chưa phân công'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {linkOnline ? (
                        <a
                          href={linkOnline}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          title="Vào phòng học Zoom"
                        >
                          <Video className="w-3 h-3" /> Zoom
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3" /> Đã Đăng Ký
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
