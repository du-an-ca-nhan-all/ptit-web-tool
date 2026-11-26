'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  GitBranch,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import {
  AnalyzedExamRoom,
  StudentScope,
  formatGroupLabel,
} from '../types/roomAnalysis.types';

interface RoomAnalysisRoomsListProps {
  rooms: AnalyzedExamRoom[];
  scope: StudentScope;
  onStudentClick?: (maSV: string) => void;
}

export default function RoomAnalysisRoomsList({
  rooms,
  scope,
  onStudentClick,
}: RoomAnalysisRoomsListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  const toggleExpand = (roomKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(roomKey)) {
        next.delete(roomKey);
      } else {
        next.add(roomKey);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedKeys(new Set(rooms.map((r) => r.roomKey)));
  const collapseAll = () => setExpandedKeys(new Set());

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16 px-4 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-10 h-10 text-slate-300" />
        <p className="text-sm font-bold text-slate-600">Không có phòng thi nào khớp điều kiện</p>
        <p className="text-xs text-slate-400">
          Thử điều chỉnh ngưỡng số lượng thành viên (&gt; / &lt; N) hoặc bộ lọc môn thi.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      <div className="px-4 py-2.5 bg-slate-50/70 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">
          Hiển thị <strong className="text-slate-800">{rooms.length}</strong> phòng thi phù hợp
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Mở rộng tất cả
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {rooms.map((room) => {
        const isExpanded = expandedKeys.has(room.roomKey);
        const scopeLabel = scope === 'REVIEW' ? 'AE ôn tập' : 'SV lớp';

        return (
          <div key={room.roomKey} className="bg-white">
            <button
              type="button"
              onClick={() => toggleExpand(room.roomKey)}
              className="w-full px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 text-slate-400 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                        room.isMonitorRoom
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : room.hasMonitorExamForSubject
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {room.mapThi || 'Chưa rõ phòng'}
                    </span>

                    {room.isMonitorRoom ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Crown className="w-3 h-3" /> Phòng Lớp Trưởng
                      </span>
                    ) : room.hasMonitorExamForSubject ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Phòng tách (LT: {room.monitorRoomForSubject})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        LT không thi môn này
                      </span>
                    )}

                    {room.splitSameGroupCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        {room.splitSameGroupCount} cùng tổ/nhóm bị tách
                      </span>
                    )}

                    {room.splitDiffGroupCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <GitBranch className="w-3 h-3" />
                        {room.splitDiffGroupCount} khác tổ/nhóm
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
                    <span className="font-bold text-slate-800">
                      {room.tenMH}{' '}
                      <span className="font-mono font-normal text-slate-400">({room.maMH})</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {room.ngayThi || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {room.gioThi || '—'}
                    </span>
                    {room.maHTThi && (
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                        {room.maHTThi}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-7 lg:pl-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-xs">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {room.scopeCount} {scopeLabel}
                  </span>
                </div>

                {scope === 'CLASS' && room.reviewCount > 0 && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px]">
                    {room.reviewCount} ôn tập
                  </span>
                )}

                {scope === 'REVIEW' && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px]">
                    {room.classCount} cả lớp
                  </span>
                )}

                {room.roomTotalCount > 0 && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-[11px] font-mono">
                    Tổng: {room.roomTotalCount}
                  </span>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 bg-slate-50/50 border-t border-slate-100">
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-10">STT</th>
                        <th className="py-2.5 px-3">Mã SV</th>
                        <th className="py-2.5 px-3">Họ và Tên</th>
                        <th className="py-2.5 px-3">SĐT</th>
                        <th className="py-2.5 px-3">Tổ / Nhóm</th>
                        <th className="py-2.5 px-3">Ôn tập</th>
                        <th className="py-2.5 px-3">So với Lớp Trưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {room.members.map((m, idx) => (
                        <tr key={`${room.roomKey}-${m.maSV}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                            {onStudentClick ? (
                              <button
                                type="button"
                                onClick={() => onStudentClick(m.maSV)}
                                className="hover:underline cursor-pointer"
                              >
                                {m.maSV}
                              </button>
                            ) : (
                              m.maSV
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {m.hoTen}
                            {m.isPostponed && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                                Hoãn thi
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {m.soDienThoai ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {m.soDienThoai}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-medium">
                            {formatGroupLabel(m)}
                          </td>
                          <td className="py-2 px-3">
                            {m.isReviewRegistered ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <BookOpenCheck className="w-3 h-3" /> Có
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {m.splitStatus === 'SPLIT_SAME_GROUP' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Cùng tổ/nhóm · Bị tách
                              </span>
                            )}
                            {m.splitStatus === 'SPLIT_DIFF_GROUP' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Khác tổ/nhóm · Bị tách
                              </span>
                            )}
                            {m.splitStatus === 'SAME_ROOM' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Cùng phòng LT
                              </span>
                            )}
                            {m.splitStatus === 'NO_MONITOR_EXAM' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                LT không thi
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
      })}
    </div>
  );
}
