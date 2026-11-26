import React from 'react';
import { CheckCircle2, Users, Edit3, Sparkles } from 'lucide-react';
import { LoginUser } from '../../../../types';
import { calculateRoomPrice, formatCurrency } from '../../../../config/pricingConfig';
import { EnhancedExamSession } from './types';
import MobileResponsibilitySection from './MobileResponsibilitySection';

interface MobileEnvelopeListProps {
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

export default function MobileEnvelopeList({
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
}: MobileEnvelopeListProps) {
  return (
    <div className="block md:hidden p-3 space-y-3.5">
      {paginatedSessions.map((session, index) => {
        const itemIndex = (page - 1) * pageSize + index + 1;
        const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);

        return (
          <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col gap-3">
            {/* Header: Room & Date/Time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-400">#{itemIndex}</span>
                <span className="inline-flex items-center font-bold text-rose-600 bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 rounded-lg text-sm truncate">
                  Phòng {session.room}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0">
                <span>{session.date}</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-700 font-bold">{session.time}</span>
              </div>
            </div>

            {/* Subject */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">{session.subject}</h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Mã MH: <span className="font-semibold text-slate-700">{session.subjectCode}</span>
                {session.examFormat && (
                  <span className="ml-2 font-sans font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    {session.examFormat}
                  </span>
                )}
              </p>
            </div>

            {/* Class Student Counts */}
            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cơ cấu sinh viên ({session.classCounts.reduce((sum, c) => sum + c.count, 0)} SV)
                </p>
                <button
                  type="button"
                  onClick={() => onOpenRoomStudents(session)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  title="Xem toàn bộ danh sách sinh viên trong phòng này"
                >
                  <Users className="w-3 h-3" />
                  <span>Xem danh sách SV</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {session.classCounts.map((c) => {
                  const isMonitorClass = monitorClasses.has(c.className);
                  const isMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                  return (
                    <button
                      key={c.className}
                      type="button"
                      onClick={() => onOpenRoomStudents(session, c.className)}
                      className={`text-xs px-2 py-0.5 rounded-md font-bold border flex gap-1 items-center transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-2xs ${
                        isMyClass
                          ? 'bg-blue-600 text-white border-blue-600'
                          : isMonitorClass
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                      title={`Xem danh sách ${c.count} SV lớp ${c.className}`}
                    >
                      <span>{c.className}</span>
                      <span className={`w-px h-2.5 ${isMyClass ? 'bg-blue-400' : isMonitorClass ? 'bg-blue-300' : 'bg-slate-300'}`}></span>
                      <span className="font-extrabold">{c.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Kinh phí nước</span>
                <button
                  type="button"
                  onClick={() => onQuickEditSession(session)}
                  className="inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-lg text-xs border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <span>{formatCurrency(roomPrice)}</span>
                  <Edit3 className="w-3 h-3 text-amber-600" />
                </button>
              </div>
              <div>
                {session.isClaimedManual ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã nhận
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Chưa nhận
                  </span>
                )}
              </div>
            </div>

            {/* RESPONSIBILITY SECTION (Mobile) */}
            <MobileResponsibilitySection
              session={session}
              loginUsers={loginUsers}
              userClass={userClass}
              loadingClaimId={loadingClaimId}
              onOpenAssignModal={onOpenAssignModal}
              onCancelClaim={onCancelClaim}
            />
          </div>
        );
      })}
    </div>
  );
}
