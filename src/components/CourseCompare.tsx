import React, { useMemo } from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface CourseCompareProps {
  data: {
    main: any;
    subAccount: any;
  } | null;
}

export default function CourseCompare({ data }: CourseCompareProps) {
  const monitorCourses = useMemo(() => {
    return data?.main?.data?.data?.ds_kqdkmh?.map((item: any) => item.to_hoc) || [];
  }, [data]);

  const myCourses = useMemo(() => {
    return data?.subAccount?.data?.data?.ds_kqdkmh?.map((item: any) => item.to_hoc) || [];
  }, [data]);

  const comparison = useMemo(() => {
    const monitorMap = new Map<string, any>(monitorCourses.map((c: any) => [c.ma_mon, c]));
    const myMap = new Map<string, any>(myCourses.map((c: any) => [c.ma_mon, c]));

    const exactMatch: any[] = [];
    const diffGroup: { monitor: any, mine: any }[] = [];
    const missing: any[] = [];
    const extra: any[] = [];

    monitorCourses.forEach((mc: any) => {
      const myC = myMap.get(mc.ma_mon);
      if (!myC) {
        missing.push(mc);
      } else if (myC.nhom_to !== mc.nhom_to) {
        diffGroup.push({ monitor: mc, mine: myC });
      } else {
        exactMatch.push(mc);
      }
    });

    myCourses.forEach((myC: any) => {
      if (!monitorMap.has(myC.ma_mon)) {
        extra.push(myC);
      }
    });

    return { exactMatch, diffGroup, missing, extra };
  }, [monitorCourses, myCourses]);

  if (!data) return null;

  return (
    <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 overflow-auto h-full bg-slate-50">
      <div className="shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          So sánh Đăng ký môn học
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Đối chiếu danh sách môn học bạn đã đăng ký với Lớp trưởng ({data.main?.username}).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Trùng khớp</span>
          </div>
          <span className="text-3xl font-bold text-emerald-700">{comparison.exactMatch.length}</span>
          <span className="text-xs text-slate-500 mt-1">Môn học giống LT</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">Khác nhóm tổ</span>
          </div>
          <span className="text-3xl font-bold text-amber-700">{comparison.diffGroup.length}</span>
          <span className="text-xs text-slate-500 mt-1">Cùng môn, khác nhóm</span>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">Thiếu môn</span>
          </div>
          <span className="text-3xl font-bold text-rose-700">{comparison.missing.length}</span>
          <span className="text-xs text-slate-500 mt-1">LT đăng ký nhưng bạn chưa ĐK</span>
        </div>

        <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Info className="w-5 h-5" />
            <span className="font-bold">Đăng ký thêm</span>
          </div>
          <span className="text-3xl font-bold text-purple-700">{comparison.extra.length}</span>
          <span className="text-xs text-slate-500 mt-1">Bạn ĐK nhưng LT không ĐK</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-8">
        {/* Thiếu môn */}
        {comparison.missing.length > 0 && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden shrink-0">
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-rose-800">Môn học bị thiếu (Cần bổ sung)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.missing.map((c: any) => (
                <div key={c.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{c.ten_mon}</div>
                    <div className="text-sm text-slate-500">{c.ma_mon} • {c.so_tc} tín chỉ</div>
                  </div>
                  <div className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start md:self-auto w-fit">
                    Nhóm tổ: {c.nhom_to}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Khác nhóm tổ */}
        {comparison.diffGroup.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden shrink-0">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-800">Khác nhóm tổ với Lớp trưởng</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.diffGroup.map(({ monitor, mine }: any) => (
                <div key={monitor.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{monitor.ten_mon}</div>
                    <div className="text-sm text-slate-500">{monitor.ma_mon} • {monitor.so_tc} tín chỉ</div>
                  </div>
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-xs text-slate-500">Nhóm của bạn</span>
                      <span className="font-bold text-amber-600">Nhóm {mine.nhom_to}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 hidden md:block"></div>
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-slate-500">Nhóm LT</span>
                      <span className="font-bold text-slate-700">Nhóm {monitor.nhom_to}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Đăng ký thêm */}
        {comparison.extra.length > 0 && (
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden shrink-0">
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-800">Môn học bạn đăng ký thêm (LT không đăng ký)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.extra.map((c: any) => (
                <div key={c.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{c.ten_mon}</div>
                    <div className="text-sm text-slate-500">{c.ma_mon} • {c.so_tc} tín chỉ</div>
                  </div>
                  <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start md:self-auto w-fit">
                    Nhóm tổ: {c.nhom_to}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trùng khớp */}
        {comparison.exactMatch.length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden shrink-0">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-800">Môn học trùng khớp hoàn toàn</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.exactMatch.map((c: any) => (
                <div key={c.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{c.ten_mon}</div>
                    <div className="text-sm text-slate-500">{c.ma_mon} • {c.so_tc} tín chỉ</div>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap self-start md:self-auto w-fit">
                    Nhóm tổ: {c.nhom_to}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
