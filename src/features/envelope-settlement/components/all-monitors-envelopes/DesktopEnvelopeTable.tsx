import React from 'react';
import { Users, Edit3, Tag, Clock } from 'lucide-react';
import { LoginUser } from '../../../../types';
import { calculateRoomPrice, getDefaultRoomPrice, formatCurrency } from '../../../../config/pricingConfig';
import { EnhancedExamSession } from './types';
import DesktopResponsibilityCell from './DesktopResponsibilityCell';

interface DesktopEnvelopeTableProps {
  paginatedSessions: EnhancedExamSession[];
  page: number;
  pageSize: number;
  monitorClasses: Set<string>;
  userClass: string;
  loginUsers: LoginUser[];
  loadingClaimId: string | null;
  onOpenRoomStudents: (session: EnhancedExamSession, classFilter?: string) => void;
  onQuickEditSession: (session: EnhancedExamSession) => void;
  onOpenAssignModal: (session: EnhancedExamSession, initialClass?: string) => void;
  onCancelClaim: (sessionId: string) => void;
}

export default function DesktopEnvelopeTable({
  paginatedSessions,
  page,
  pageSize,
  monitorClasses,
  userClass,
  loginUsers,
  loadingClaimId,
  onOpenRoomStudents,
  onQuickEditSession,
  onOpenAssignModal,
  onCancelClaim,
}: DesktopEnvelopeTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[960px]">
        <thead className="bg-slate-50 border-b border-slate-200 shadow-2xs">
          <tr>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center align-top">STT</th>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 align-top">Thời gian</th>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-60 align-top">Phòng & Môn</th>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px] align-top">Cơ cấu sinh viên</th>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 whitespace-nowrap align-top">
              <div className="flex items-center gap-1">
                <span>Kinh phí nước</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(sửa)</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-[360px] min-w-[320px] align-top">Trách nhiệm phụ trách</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedSessions.map((session, index) => {
            const itemIndex = (page - 1) * pageSize + index + 1;
            const roomPrice = calculateRoomPrice(
              session.subject,
              session.subjectCode,
              session.room,
              session.examFormat,
              session.id
            );
            const defaultRoomPrice = getDefaultRoomPrice(
              session.subject,
              session.subjectCode,
              session.room,
              session.examFormat
            );
            const isCustomPrice = roomPrice !== defaultRoomPrice;

            return (
              <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-4 text-xs text-slate-400 font-semibold text-center align-top">{itemIndex}</td>

                {/* Date & Time */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">{session.date}</span>
                    <span className="text-blue-600 font-bold text-xs mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {session.time}
                    </span>
                  </div>
                </td>

                {/* Room & Subject */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col">
                    <span className="font-bold text-rose-600 text-sm">Phòng {session.room}</span>
                    <span
                      className="text-slate-800 font-medium text-xs sm:text-sm mt-0.5 break-words whitespace-normal"
                      title={session.subject}
                    >
                      {session.subject}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-400 text-xs font-mono">{session.subjectCode}</span>
                      {session.examFormat && (
                        <span className="font-sans font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px]">
                          {session.examFormat}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenRoomStudents(session)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-1.5 w-fit cursor-pointer"
                      title="Xem danh sách sinh viên trong phòng này"
                    >
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>Xem DS sinh viên ({session.totalStudents || session.classCounts.reduce((sum: number, c: any) => sum + c.count, 0)})</span>
                    </button>
                  </div>
                </td>

                {/* Student class counts */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {session.classCounts.map((c) => {
                      const isMonitorClass = monitorClasses.has(c.className);
                      const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                      return (
                        <button
                          key={c.className}
                          type="button"
                          onClick={() => onOpenRoomStudents(session, c.className)}
                          className={`text-xs px-2.5 py-0.5 rounded-md font-bold border flex gap-1.5 items-center transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-2xs ${
                            isMyClass
                              ? 'bg-blue-600 text-white border-blue-600'
                              : isMonitorClass
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={`Bấm để xem danh sách ${c.count} sinh viên lớp ${c.className} trong phòng`}
                        >
                          <span>{c.className}</span>
                          <span
                            className={`w-px h-3 ${
                              isMyClass ? 'bg-blue-400' : isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'
                            }`}
                          ></span>
                          <span>{c.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </td>

                {/* Room Price */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <button
                      type="button"
                      onClick={() => onQuickEditSession(session)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-2xs group ${
                        isCustomPrice
                          ? 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title="Bấm để chỉnh sửa mức giá tiền cho phòng này"
                    >
                      <span>{formatCurrency(roomPrice)}</span>
                      <Edit3 className="w-3 h-3 text-amber-600 group-hover:scale-110 transition-transform" />
                    </button>
                    {isCustomPrice && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                        <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Tùy chỉnh (Chuẩn: {formatCurrency(defaultRoomPrice)})</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* RESPONSIBILITY (Desktop Table) */}
                <DesktopResponsibilityCell
                  session={session}
                  loginUsers={loginUsers}
                  userClass={userClass}
                  loadingClaimId={loadingClaimId}
                  onOpenAssignModal={onOpenAssignModal}
                  onCancelClaim={onCancelClaim}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
