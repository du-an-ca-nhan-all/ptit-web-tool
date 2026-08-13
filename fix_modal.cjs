const fs = require('fs');
let code = fs.readFileSync('src/components/SettlementManager.tsx', 'utf8');

// Add X icon
code = code.replace(
  "CheckCircle2, User } from 'lucide-react';",
  "CheckCircle2, User, X, Mail } from 'lucide-react';"
);

// Add selectedDetail state
code = code.replace(
  "const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());",
  "const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());\n  const [selectedDetail, setSelectedDetail] = useState<DebtDetail | null>(null);"
);

// Add cursor-pointer and onClick to rows in OweUs
code = code.replace(
  /<tr key=\{idx\} className="hover:bg-slate-50">/g,
  `<tr key={idx} className="hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setSelectedDetail(d)}>`
);

// We need to add the modal at the end of the return
const modalBlock = `
      {selectedDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Chi Tiết Phân Bổ Chi Phí Phòng Thi
              </h3>
              <button onClick={() => setSelectedDetail(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {/* General Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Môn & Phòng</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.room}</p>
                  <p className="text-sm font-medium text-slate-600">{selectedDetail.session.subject} ({selectedDetail.session.subjectCode})</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Thời gian thi</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.time}</p>
                  <p className="text-sm font-medium text-slate-600">{selectedDetail.session.date}</p>
                </div>
              </div>

              {/* Cost Calculation */}
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <DollarSign className="w-5 h-5" />
                  Bài toán chia tiền
                </h4>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Tổng định mức phong bì phòng thi:</span>
                    <span className="font-bold text-base">{formatCurrency(selectedDetail.totalRoomPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Số SV tham gia chia tiền (thuộc các lớp có LT):</span>
                    <span className="font-bold text-base">{selectedDetail.totalRoomPrice / selectedDetail.pricePerStudent} SV</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                    <span className="font-semibold">Đơn giá trên mỗi Sinh Viên:</span>
                    <span className="font-bold text-rose-600 text-base">{formatCurrency(selectedDetail.pricePerStudent)}/SV</span>
                  </div>
                </div>
              </div>

              {/* Class Distribution */}
              <div>
                <h4 className="font-bold text-slate-700 mb-3">Phân bổ sinh viên trong phòng</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Tên Lớp</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200 text-center">Số SV</th>
                        <th className="px-4 py-2 font-semibold border-b border-slate-200">Trạng thái Lớp Trưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetail.session.classCounts.map((c: any, i: number) => {
                        const hasMonitor = monitorClassList.includes(c.className);
                        const isResponsible = c.className === selectedDetail.toClass;
                        const isPaying = c.className === selectedDetail.fromClass;
                        
                        return (
                          <tr key={i} className={isResponsible ? 'bg-emerald-50' : isPaying ? 'bg-rose-50' : 'bg-white'}>
                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                              {c.className}
                              {isResponsible && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">Đại diện lấy PB</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{c.count}</td>
                            <td className="px-4 py-3">
                              {hasMonitor ? (
                                <span className="text-blue-600 text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Có tham gia chia
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Không có LT / Miễn chia</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Final Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <span className="font-bold">Kết luận cho cặp lớp này: </span>
                Lớp <span className="font-bold">{selectedDetail.fromClass}</span> có {selectedDetail.studentsCount} SV. 
                Cần gửi cho lớp đại diện <span className="font-bold">{selectedDetail.toClass}</span> số tiền là: 
                <span className="font-bold text-rose-600 ml-1">{selectedDetail.studentsCount} x {formatCurrency(selectedDetail.pricePerStudent)} = {formatCurrency(selectedDetail.amount)}</span>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(
  /    <\/div>\n  \);\n\}/,
  modalBlock + "\n}"
);

fs.writeFileSync('src/components/SettlementManager.tsx', code);
