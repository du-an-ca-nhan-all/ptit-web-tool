import React from 'react';
import { Calendar } from 'lucide-react';
import { ExamRecord } from '../../types/class.types';

interface StudentDetailExamListProps {
  exams?: ExamRecord[];
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  onUpdateExamPostponed: (exam: ExamRecord, nextStatus: boolean) => void;
}

export default function StudentDetailExamList({
  exams,
  onTogglePostpone,
  onUpdateExamPostponed,
}: StudentDetailExamListProps) {
  const handleToggle = async (ex: ExamRecord) => {
    if (!onTogglePostpone) return;
    const nextStatus = !ex.isPostponed;
    await onTogglePostpone(ex, nextStatus);
    onUpdateExamPostponed(ex, nextStatus);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          Lịch Thi Đã Đăng Ký ({exams?.length || 0} môn)
        </h4>
      </div>

      {!exams || exams.length === 0 ? (
        <p className="text-slate-400 italic text-xs py-4 text-center border border-dashed rounded-xl">
          Không có lịch thi nào được tìm thấy cho sinh viên này.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Mobile Exam Cards inside Modal */}
          <div className="block sm:hidden space-y-2 max-h-72 overflow-y-auto pr-1">
            {exams.map((ex: ExamRecord, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  ex.isPostponed ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5
                      className={`text-xs font-black ${
                        ex.isPostponed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {ex.TenMH}
                    </h5>
                    <span className="font-mono text-[10px] text-blue-600 font-bold">{ex.MaMH}</span>
                  </div>

                  {onTogglePostpone ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(ex)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer shrink-0 ${
                        ex.isPostponed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ex.isPostponed ? '✕ Hoãn' : '✓ Dự thi'}
                    </button>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                        ex.isPostponed
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ex.isPostponed ? 'Hoãn' : 'Dự thi'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] p-2 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Ngày: </span>
                    <span className="font-bold text-slate-800">{ex.NgayThi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Giờ: </span>
                    <span className="font-bold text-blue-600">{ex.GioThi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Phòng: </span>
                    <span className="font-bold text-emerald-700">{ex.MAPTHI || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tổ: </span>
                    <span className="font-bold text-slate-700">{ex['To thi'] || ex.NhomThi || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table inside Modal */}
          <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Ngày thi</th>
                  <th className="px-3 py-2.5">Giờ thi</th>
                  <th className="px-3 py-2.5">Tên môn học</th>
                  <th className="px-3 py-2.5 text-center">Phòng</th>
                  <th className="px-3 py-2.5 text-center">Tổ/Nhóm</th>
                  <th className="px-3 py-2.5 text-center">Trạng thái thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((ex: ExamRecord, idx: number) => (
                  <tr key={idx} className={`hover:bg-blue-50/50 ${ex.isPostponed ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-3 py-2.5 font-bold text-slate-700">{ex.NgayThi}</td>
                    <td className="px-3 py-2.5 text-blue-600 font-medium">{ex.GioThi}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className={ex.isPostponed ? 'line-through text-slate-400' : ''}>{ex.TenMH}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({ex.MaMH})</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{ex.MAPTHI || '—'}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{ex['To thi'] || ex.NhomThi || '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      {onTogglePostpone ? (
                        <button
                          onClick={() => handleToggle(ex)}
                          title={
                            ex.isPostponed
                              ? 'Bấm để chuyển về Dự thi'
                              : 'Bấm để đánh dấu Hoãn thi (không chia tiền)'
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            ex.isPostponed
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-xs'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300'
                          }`}
                        >
                          {ex.isPostponed ? '✕ Hoãn thi' : '✓ Dự thi'}
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ex.isPostponed
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {ex.isPostponed ? 'Hoãn thi' : 'Dự thi'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
