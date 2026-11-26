import React from 'react';
import { Coffee, Hand, UserCheck, Users, Sparkles } from 'lucide-react';
import { LoginUser, isUserMonitor } from '../../../../types';
import { EnhancedExamSession } from './types';

interface MobileResponsibilitySectionProps {
  session: EnhancedExamSession;
  loginUsers: LoginUser[];
  userClass: string;
  loadingClaimId: string | null;
  onOpenAssignModal: (session: EnhancedExamSession, initialClass?: string) => void;
  onCancelClaim: (sessionId: string) => void;
}

export default function MobileResponsibilitySection({
  session,
  loginUsers,
  userClass,
  loadingClaimId,
  onOpenAssignModal,
  onCancelClaim,
}: MobileResponsibilitySectionProps) {
  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
      {session.responsibleClasses.map((cls) => {
        const cleanCls = cls.trim().toUpperCase();
        const monitorUser = loginUsers.find(
          (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
        );
        const isMyClass = userClass && cleanCls === userClass.trim().toUpperCase();

        if (session.isClaimedManual) {
          return (
            <div key={cls} className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-900">
                  <Coffee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Lớp phụ trách: <strong className="text-sm">{cls}</strong></span>
                  {isMyClass && (
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold">Lớp bạn</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(session, cls)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Đổi người
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => onCancelClaim(session.id)}
                    disabled={loadingClaimId === session.id}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                    title="Hủy nhận, trả về gợi ý tự động"
                  >
                    {loadingClaimId === session.id ? '...' : 'Hủy nhận'}
                  </button>
                </div>
              </div>

              {session.assignmentInfo?.assistantStudentName ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>SV hỗ trợ: <strong>{session.assignmentInfo.assistantStudentName}</strong> ({session.assignmentInfo.assistantStudentId})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>LT: <strong>{session.assignmentInfo?.claimedByName || monitorUser?.fullName || monitorUser?.username || 'Lớp trưởng'}</strong></span>
                </div>
              )}

              {session.assignmentInfo?.note && (
                <p className="text-[10px] text-slate-500 italic bg-white/80 px-2 py-0.5 rounded border border-slate-200 truncate">
                  Ghi chú: {session.assignmentInfo.note}
                </p>
              )}
            </div>
          );
        }

        const suggestedClassCount = session.classCounts.find((c) => c.className === cls)?.count || 0;
        return (
          <div key={cls} className="bg-amber-50/50 border border-dashed border-amber-300 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Gợi ý: <strong className="text-amber-900 text-sm">{cls}</strong> ({suggestedClassCount} SV)</span>
                  {isMyClass && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold ml-1">Lớp bạn</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Lớp có đông SV nhất phòng (chưa ai nhận)</p>
              </div>

              <button
                type="button"
                onClick={() => onOpenAssignModal(session, cls)}
                disabled={loadingClaimId === session.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 inline-flex items-center gap-1.5 ${
                  isMyClass
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận chuẩn bị nước'}</span>
              </button>
            </div>

            {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lớp khác nhận:</span>
                {session.classCounts
                  .filter((c) => c.className !== cls)
                  .map((c) => {
                    const isOtherMyClass = userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                    return (
                      <button
                        key={c.className}
                        type="button"
                        onClick={() => onOpenAssignModal(session, c.className)}
                        disabled={loadingClaimId === session.id}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          isOtherMyClass
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                        title={`Chuyển nhận phòng cho lớp ${c.className}`}
                      >
                        <Hand className="w-3 h-3 inline mr-0.5" />
                        <span>{isOtherMyClass ? `Lớp tôi (${c.className}) nhận` : `Lớp ${c.className} nhận`}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
