const fs = require('fs');

let content = fs.readFileSync('src/components/CourseCompare.tsx', 'utf-8');

// Replace imports
content = content.replace(
  "import { BookOpen, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';",
  "import { BookOpen, CheckCircle2, AlertTriangle, XCircle, Info, X, Users, BarChart3 } from 'lucide-react';\nimport { useState } from 'react';"
);

// Update interface
content = content.replace(
  "    subAccount: any;\n  } | null;",
  "    subAccount: any;\n    allSubAccounts?: any[];\n  } | null;"
);

// Update component definition to include state and stats calculation
content = content.replace(
  "export default function CourseCompare({ data }: CourseCompareProps) {",
  `export default function CourseCompare({ data }: CourseCompareProps) {
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
`
);

// Add onClick to missing course rows
content = content.replace(
  '<div key={c.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">',
  '<div key={c.ma_mon} onClick={() => setSelectedCourse({type: \'missing\', courseCode: c.ma_mon, courseName: c.ten_mon, monitorGroup: c.nhom_to})} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors">'
);

// Add onClick to diffGroup rows
content = content.replace(
  '<div key={monitor.ma_mon} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">',
  '<div key={monitor.ma_mon} onClick={() => setSelectedCourse({type: \'diffGroup\', courseCode: monitor.ma_mon, courseName: monitor.ten_mon, monitorGroup: monitor.nhom_to, myGroup: mine.nhom_to})} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors">'
);


// Add Popup render at the end of the return
content = content.replace(
  "      </div>\n    </div>\n  );\n}",
  `      </div>

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
}`
);

fs.writeFileSync('src/components/CourseCompare.tsx', content);
