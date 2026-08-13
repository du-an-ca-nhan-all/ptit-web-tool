import React, { useMemo } from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, XCircle, Info, X, Users, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface CourseCompareProps {
  data: {
    main: any;
    subAccount: any;
    allSubAccounts?: any[];
  } | null;
}

export default function CourseCompare({ data }: CourseCompareProps) {
  const [selectedCourse, setSelectedCourse] = useState<{type: 'missing' | 'diffGroup', courseCode: string, courseName: string, monitorGroup: string, myGroup?: string} | null>(null);

  const popupStats = useMemo(() => {
    if (!selectedCourse || !data?.allSubAccounts) return null;
    const { courseCode, monitorGroup, myGroup } = selectedCourse;
    
    let totalAnalyzed = 0;
    const missingUsers: any[] = [];
    const groupMap = new Map<string, any[]>();

    data.allSubAccounts.forEach(acc => {
      // Bỏ qua lớp trưởng
      if (acc.username.toLowerCase() === data.main.username.toLowerCase()) return;

      const courses = acc.data?.data?.ds_kqdkmh?.map((item: any) => item.to_hoc) || [];
      const course = courses.find((c: any) => c.ma_mon === courseCode);
      
      totalAnalyzed++;
      if (!course) {
        missingUsers.push(acc.username);
      } else {
        const grp = course.nhom_to;
        if (!groupMap.has(grp)) groupMap.set(grp, []);
        groupMap.get(grp)!.push(acc.username);
      }
    });

    return {
      totalAnalyzed,
      missingUsers,
      groupMap
    };
  }, [selectedCourse, data]);

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
              <h3 className="font-bold text-rose-800 flex items-center gap-2">Môn học bị thiếu (Cần bổ sung) <span className="text-xs font-normal text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Ấn vào để xem chi tiết</span></h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.missing.map((c: any) => (
                <div key={c.ma_mon} onClick={() => setSelectedCourse({type: 'missing', courseCode: c.ma_mon, courseName: c.ten_mon, monitorGroup: c.nhom_to})} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors">
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
              <h3 className="font-bold text-amber-800 flex items-center gap-2">Khác nhóm tổ với Lớp trưởng <span className="text-xs font-normal text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Ấn vào để xem chi tiết</span></h3>
            </div>
            <div className="divide-y divide-slate-100">
              {comparison.diffGroup.map(({ monitor, mine }: any) => (
                <div key={monitor.ma_mon} onClick={() => setSelectedCourse({type: 'diffGroup', courseCode: monitor.ma_mon, courseName: monitor.ten_mon, monitorGroup: monitor.nhom_to, myGroup: mine.nhom_to})} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors">
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

      {selectedCourse && popupStats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-none">{selectedCourse.courseName}</h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedCourse.courseCode} • Phân tích sinh viên trong lớp</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <div className="text-2xl font-bold text-slate-800">{popupStats.totalAnalyzed}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">SV (Trừ LT)</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{popupStats.groupMap.get(selectedCourse.monitorGroup)?.length || 0}</div>
                  <div className="text-xs font-medium text-emerald-600 mt-1">Nhóm {selectedCourse.monitorGroup} (Giống LT)</div>
                </div>
                {selectedCourse.type === 'diffGroup' && selectedCourse.myGroup && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                    <div className="text-2xl font-bold text-amber-700">{popupStats.groupMap.get(selectedCourse.myGroup)?.length || 0}</div>
                    <div className="text-xs font-medium text-amber-600 mt-1">Nhóm {selectedCourse.myGroup} (Giống bạn)</div>
                  </div>
                )}
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
                  <div className="text-2xl font-bold text-rose-700">{popupStats.missingUsers.length}</div>
                  <div className="text-xs font-medium text-rose-600 mt-1">Chưa ĐK</div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Giống LT */}
                {(popupStats.groupMap.get(selectedCourse.monitorGroup)?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-emerald-800 flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4" /> 
                      SV học Nhóm {selectedCourse.monitorGroup} (Cùng Lớp trưởng)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popupStats.groupMap.get(selectedCourse.monitorGroup)?.map(user => (
                        <span key={user} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-100">
                          {user.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Giống bạn (nếu có) */}
                {selectedCourse.type === 'diffGroup' && selectedCourse.myGroup && (popupStats.groupMap.get(selectedCourse.myGroup)?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" /> 
                      SV học Nhóm {selectedCourse.myGroup} (Cùng với bạn)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popupStats.groupMap.get(selectedCourse.myGroup)?.map(user => (
                        <span key={user} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-100">
                          {user.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Các nhóm khác */}
                {Array.from(popupStats.groupMap.entries()).filter(([grp]) => grp !== selectedCourse.monitorGroup && grp !== selectedCourse.myGroup).map(([grp, users]) => (
                  <div key={grp}>
                    <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" /> 
                      SV học Nhóm {grp}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {users.map(user => (
                        <span key={user} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                          {user.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Chưa ĐK */}
                {popupStats.missingUsers.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-rose-800 flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4" /> 
                      SV chưa đăng ký môn này
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popupStats.missingUsers.map(user => (
                        <span key={user} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg border border-rose-100">
                          {user.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
