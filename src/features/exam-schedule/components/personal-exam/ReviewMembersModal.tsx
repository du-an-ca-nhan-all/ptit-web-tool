import React from 'react';
import { Users, X } from 'lucide-react';
import type { ExamRecord, LoginUser } from '../../types/exam.types';

interface ReviewMembersModalProps {
  record: ExamRecord;
  currentUser: LoginUser;
  onClose: () => void;
  onViewAllRoomMembers: (record: ExamRecord) => void;
}

export default function ReviewMembersModal({
  record,
  currentUser,
  onClose,
  onViewAllRoomMembers,
}: ReviewMembersModalProps) {
  const currentUsername = String(currentUser.username || '').trim().toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-5 text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 shrink-0" />
              <span>Danh Sách Ôn Tập • Phòng {record.MAPTHI || '—'}</span>
            </h3>
            <p className="text-emerald-100 text-xs mt-1">
              <b className="text-white">{record.TenMH || record.MaMH}</b>
              {record.NgayThi ? ` • ${record.NgayThi}` : ''}
              {record.GioThi ? ` (${record.GioThi})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Lớp mình ({record.MaLop || currentUser.lop || 'Cùng lớp'})
              </h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {record.roomReviewSameClassMembers?.length ??
                  record.roomReviewSameClassCount ??
                  0}{' '}
                SV
              </span>
            </div>

            {record.roomReviewSameClassMembers && record.roomReviewSameClassMembers.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-emerald-100 bg-emerald-50/30 overflow-hidden">
                {record.roomReviewSameClassMembers.map((member, idx) => {
                  const isMe = member.maSV.toUpperCase() === currentUsername;
                  return (
                    <div
                      key={member.maSV}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{member.hoTen}</span>
                        {isMe && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                            Bạn
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-indigo-700 text-[11px] shrink-0">
                        {member.maSV}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl p-3 border border-slate-100">
                Không có sinh viên lớp mình đăng ký ôn tập trong phòng này.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Lớp khác
              </h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {record.roomReviewOtherClassMembers?.length ??
                  record.roomReviewOtherClassCount ??
                  0}{' '}
                SV
              </span>
            </div>

            {record.roomReviewOtherClassMembers &&
            record.roomReviewOtherClassMembers.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-teal-100 bg-teal-50/20 overflow-hidden">
                {record.roomReviewOtherClassMembers.map((member, idx) => (
                  <div
                    key={member.maSV}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{member.hoTen}</div>
                        {member.maLop && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded">
                            {member.maLop}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-slate-600 text-[11px] shrink-0">
                      {member.maSV}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl p-3 border border-slate-100">
                Không có sinh viên lớp khác đăng ký ôn tập trong phòng này.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewAllRoomMembers(record)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Xem toàn bộ phòng thi &rarr;
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
