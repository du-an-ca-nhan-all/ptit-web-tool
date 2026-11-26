import React from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Info, XCircle } from 'lucide-react';
import { CourseComparisonResult, SelectedCourseInfo } from './types';

interface ComparisonSectionsProps {
  comparison: CourseComparisonResult;
  onSelectCourse: (course: SelectedCourseInfo) => void;
}

export function ComparisonSections({ comparison, onSelectCourse }: ComparisonSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Thiếu môn */}
      {comparison.missing.length > 0 && (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-black text-rose-900 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Môn Sinh Viên Chưa Đăng Ký ({comparison.missing.length})
            </h3>
            <span className="text-xs text-rose-700 font-medium">Cần kiểm tra để tránh thiếu tín chỉ</span>
          </div>
          <div className="divide-y divide-slate-100">
            {comparison.missing.map((c: any) => {
              const code = c.ma_mon || c.MaMH;
              const name = c.ten_mon || c.TenMH;
              const tc = c.so_tc || c.SoTC;
              const grp = c.nhom_to || c.NhomTo;
              const lop = c.lop || c.Lop;

              return (
                <div
                  key={code}
                  className="p-4 flex items-center justify-between hover:bg-rose-50/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Số TC: {tc}</span>
                      <span>•</span>
                      <span>Nhóm tổ của LT: <strong className="text-indigo-600">{grp}</strong></span>
                      {lop && <span>• Lớp HP: {lop}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onSelectCourse({
                        type: 'missing',
                        courseCode: code,
                        courseName: name,
                        monitorGroup: grp,
                      })
                    }
                    className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Xem thống kê lớp</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Khác nhóm tổ */}
      {comparison.diffGroup.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
            <h3 className="font-black text-amber-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Môn Khác Nhóm Tổ ({comparison.diffGroup.length})
            </h3>
            <span className="text-xs text-amber-700 font-medium">Sinh viên và Lớp trưởng học khác ca/nhóm</span>
          </div>
          <div className="divide-y divide-slate-100">
            {comparison.diffGroup.map(({ monitor: mc, mine: myC }) => {
              const code = mc.ma_mon || mc.MaMH;
              const name = mc.ten_mon || mc.TenMH;
              const monitorGrp = mc.nhom_to || mc.NhomTo;
              const myGrp = myC.nhom_to || myC.NhomTo;

              return (
                <div
                  key={code}
                  className="p-4 flex items-center justify-between hover:bg-amber-50/20 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{name}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                      <span>
                        Nhóm của SV: <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{myGrp}</strong>
                      </span>
                      <span>
                        Nhóm của LT: <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{monitorGrp}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onSelectCourse({
                        type: 'diffGroup',
                        courseCode: code,
                        courseName: name,
                        monitorGroup: monitorGrp,
                        myGroup: myGrp,
                      })
                    }
                    className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Xem thống kê lớp</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trùng khớp */}
      {comparison.exactMatch.length > 0 && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
            <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Môn Trùng Khớp Hoàn Toàn ({comparison.exactMatch.length})
            </h3>
            <span className="text-xs text-emerald-700 font-medium">Học chung nhóm tổ với Lớp trưởng</span>
          </div>
          <div className="divide-y divide-slate-100">
            {comparison.exactMatch.map((c: any) => {
              const code = c.ma_mon || c.MaMH;
              const name = c.ten_mon || c.TenMH;
              const tc = c.so_tc || c.SoTC;
              const grp = c.nhom_to || c.NhomTo;
              const lop = c.lop || c.Lop;

              return (
                <div key={code} className="p-4 flex items-center justify-between hover:bg-emerald-50/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Số TC: {tc}</span>
                      <span>•</span>
                      <span>Nhóm tổ: <strong className="text-emerald-700">{grp}</strong></span>
                      {lop && <span>• Lớp HP: {lop}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    ✓ Cùng nhóm {grp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Đăng ký thêm */}
      {comparison.extra.length > 0 && (
        <div className="bg-white rounded-3xl border border-purple-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between">
            <h3 className="font-black text-purple-900 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600" />
              Môn Đăng Ký Thêm ({comparison.extra.length})
            </h3>
            <span className="text-xs text-purple-700 font-medium">Môn học cải thiện hoặc ngoài chương trình LT</span>
          </div>
          <div className="divide-y divide-slate-100">
            {comparison.extra.map((c: any) => {
              const code = c.ma_mon || c.MaMH;
              const name = c.ten_mon || c.TenMH;
              const tc = c.so_tc || c.SoTC;
              const grp = c.nhom_to || c.NhomTo;

              return (
                <div key={code} className="p-4 flex items-center justify-between hover:bg-purple-50/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">{name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Số TC: {tc}</span>
                      <span>•</span>
                      <span>Nhóm tổ: {grp}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
