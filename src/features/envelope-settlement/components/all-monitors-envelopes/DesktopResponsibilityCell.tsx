import React from 'react';
import { CheckCircle2, Hand, UserCheck, Users, Sparkles } from 'lucide-react';
import { LoginUser, isUserMonitor } from '../../../../types';
import { EnhancedExamSession } from './types';

interface DesktopResponsibilityCellProps {
  session: EnhancedExamSession;
  loginUsers: LoginUser[];
  userClass: string;
  loadingClaimId: string | null;
  onOpenAssignModal: (session: EnhancedExamSession, initialClass?: string) => void;
  onCancelClaim: (sessionId: string) => void;
}

export default function DesktopResponsibilityCell({
  session,
  loginUsers,
  userClass,
  loadingClaimId,
  onOpenAssignModal,
  onCancelClaim,
}: DesktopResponsibilityCellProps) {
  return (
    <td className="px-4 py-4 align-top">
      <div className="flex flex-col gap-2">
        {session.responsibleClasses.map((cls) => {
          const cleanCls = cls.trim().toUpperCase();
          const monitorUser = loginUsers.find(
            (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
          );
          const isMyClass = userClass && cleanCls === userClass.trim().toUpperCase();

          if (session.isClaimedManual) {
            return (
              <div
                key={cls}
                className="flex flex-col gap-1.5 items-start bg-emerald-50/90 border border-emerald-300 p-2.5 rounded-xl shadow-2xs"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-xs">
                    <span className="bg-emerald-600 text-white p-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm font-bold text-emerald-950">Lớp {cls}</span>
                    {isMyClass && (
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        Lớp bạn
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-tight">
                    Đã nhận
                  </span>
                </div>

                <div className="flex flex-col w-full gap-1 pt-1.5 border-t border-emerald-200">
                  {session.assignmentInfo?.assistantStudentName ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        SV hỗ trợ: <strong>{session.assignmentInfo.assistantStudentName}</strong> (
                        {session.assignmentInfo.assistantStudentId})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-2 py-1 rounded-lg">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        LT:{' '}
                        <strong>
                          {session.assignmentInfo?.claimedByName ||
                            monitorUser?.fullName ||
                            monitorUser?.username ||
                            'Lớp trưởng'}
                        </strong>
                      </span>
                    </div>
                  )}

                  {session.assignmentInfo?.note && (
                    <p className="text-[10px] text-slate-500 italic bg-white/70 px-2 py-0.5 rounded border border-slate-200 truncate">
                      Ghi chú: {session.assignmentInfo.note}
                    </p>
                  )}

                  <div className="flex flex-col w-full gap-1.5 mt-1 pt-1.5 border-t border-emerald-200/70">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenAssignModal(session, cls)}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                        >
                          Đổi người
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelClaim(session.id)}
                          disabled={loadingClaimId === session.id}
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                          title="Hủy nhận, trở về gợi ý tự động"
                        >
                          {loadingClaimId === session.id ? 'Đang hủy...' : 'Hủy nhận'}
                        </button>
                      </div>
                    </div>

                    {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-100/70">
                        <span className="text-[10px] text-slate-500 font-medium">Chuyển sang:</span>
                        {session.classCounts
                          .filter((c) => c.className !== cls)
                          .map((c) => (
                            <button
                              key={c.className}
                              type="button"
                              onClick={() => onOpenAssignModal(session, c.className)}
                              disabled={loadingClaimId === session.id}
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              title={`Chuyển trách nhiệm sang lớp ${c.className}`}
                            >
                              {c.className}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          const suggestedClassCount = session.classCounts.find((c) => c.className === cls)?.count || 0;
          return (
            <div
              key={cls}
              className="flex flex-col gap-2 items-start bg-amber-50/40 border border-dashed border-amber-300 p-2.5 rounded-xl shadow-2xs"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Chưa nhận
                    </span>
                    <span className="font-bold text-slate-800 text-sm truncate">Lớp {cls}</span>
                    <span className="text-xs text-slate-500 font-semibold shrink-0">
                      ({suggestedClassCount} SV)
                    </span>
                    {isMyClass && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                        Lớp bạn
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                    Đông SV nhất phòng (chưa ai nhận)
                  </span>
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
                  title="Xác nhận nhận phòng thi này hoặc gán sinh viên hỗ trợ"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>
                    {loadingClaimId === session.id ? 'Đang lưu...' : 'Nhận chuẩn bị nước'}
                  </span>
                </button>
              </div>

              {session.classCounts.filter((c) => c.className !== cls).length > 0 && (
                <div className="w-full pt-1.5 border-t border-amber-200/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Lớp khác:</span>
                  {session.classCounts
                    .filter((c) => c.className !== cls)
                    .map((c) => {
                      const isOtherMyClass =
                        userClass && c.className.trim().toUpperCase() === userClass.trim().toUpperCase();
                      return (
                        <button
                          key={c.className}
                          type="button"
                          onClick={() => onOpenAssignModal(session, c.className)}
                          disabled={loadingClaimId === session.id}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isOtherMyClass
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                          }`}
                          title={`Nhận phòng này cho lớp ${c.className}`}
                        >
                          <Hand className="w-3 h-3" />
                          <span>{isOtherMyClass ? `Nhận cho lớp tôi (${c.className})` : c.className}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </td>
  );
}
