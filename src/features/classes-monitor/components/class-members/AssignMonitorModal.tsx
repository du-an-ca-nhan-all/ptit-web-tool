import React from 'react';
import { Search, Crown, X, AlertCircle, Check } from 'lucide-react';
import { LoginUser } from '../../types/class.types';

interface AssignMonitorModalProps {
  isOpen: boolean;
  selectedClass: string;
  classMonitor: LoginUser | null;
  activeStudentsCount: number;
  candidateList: any[];
  selectedCandidateMaSV: string;
  onSelectCandidate: (maSV: string) => void;
  candidateSearchQuery: string;
  onCandidateSearchQueryChange: (query: string) => void;
  assignReason: string;
  onAssignReasonChange: (reason: string) => void;
  isSubmittingMonitor: boolean;
  monitorModalError: string;
  onClose: () => void;
  onAssignMonitor: (action: 'ASSIGN' | 'TRANSFER' | 'REMOVE') => void;
}

export default function AssignMonitorModal({
  isOpen,
  selectedClass,
  classMonitor,
  activeStudentsCount,
  candidateList,
  selectedCandidateMaSV,
  onSelectCandidate,
  candidateSearchQuery,
  onCandidateSearchQueryChange,
  assignReason,
  onAssignReasonChange,
  isSubmittingMonitor,
  monitorModalError,
  onClose,
  onAssignMonitor,
}: AssignMonitorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmittingMonitor) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-200 border border-white/20">
              <Crown className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {classMonitor ? 'Chuyển Đổi Lớp Trưởng' : 'Chỉ Định Lớp Trưởng'}
              </h3>
              <p className="text-xs text-amber-100/80">
                Lớp <span className="font-bold underline">{selectedClass}</span> • Quyền Quản trị viên
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSubmittingMonitor && onClose()}
            disabled={isSubmittingMonitor}
            className="p-1.5 hover:bg-white/10 rounded-xl text-white/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 min-h-0">
          {/* Error feedback */}
          {monitorModalError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{monitorModalError}</span>
            </div>
          )}

          {/* Current Monitor Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Lớp Trưởng Hiện Tại:
            </span>
            {classMonitor ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Crown className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {classMonitor.fullName || classMonitor.username}
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                      Mã SV: <span className="font-bold text-slate-700">{classMonitor.username}</span>
                      {classMonitor.phoneNumber && ` • SĐT: ${classMonitor.phoneNumber}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAssignMonitor('REMOVE')}
                  disabled={isSubmittingMonitor}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Hủy vai trò Lớp trưởng của sinh viên này mà không chỉ định người mới"
                >
                  Hủy vai trò
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-white p-3 rounded-xl border border-dashed border-slate-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                Lớp này hiện chưa có Lớp trưởng được chỉ định.
              </div>
            )}
          </div>

          {/* Candidate Selection */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn Sinh Viên Làm Lớp Trưởng Mới:
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {activeStudentsCount} thành viên trong lớp
              </span>
            </div>

            {/* Candidate search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo Họ tên hoặc Mã SV trong lớp..."
                value={candidateSearchQuery}
                onChange={(e) => onCandidateSearchQueryChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Candidates List */}
            <div className="border border-slate-200 rounded-2xl overflow-y-auto max-h-56 divide-y divide-slate-100 bg-white">
              {candidateList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy sinh viên phù hợp trong lớp.
                </div>
              ) : (
                candidateList.map((st) => {
                  const isCurrent = classMonitor?.username === st.MaSV;
                  const isSelected = selectedCandidateMaSV === st.MaSV;
                  return (
                    <div
                      key={st.MaSV}
                      onClick={() => !isCurrent && onSelectCandidate(st.MaSV)}
                      className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-50/40 opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-50 border-l-4 border-amber-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : st.TenSV.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {st.HoLotSV} {st.TenSV}
                            {isCurrent && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                Đang là LT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {st.MaSV} {st.phone ? `• ${st.phone}` : ''}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isCurrent
                            ? 'text-slate-400 bg-transparent'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-800'
                        }`}
                      >
                        {isSelected ? 'Đã Chọn' : isCurrent ? 'Hiện tại' : 'Chọn'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Optional Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do chỉ định / chuyển giao (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Bổ nhiệm đầu kỳ, thay đổi theo đề xuất của lớp..."
              value={assignReason}
              onChange={(e) => onAssignReasonChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingMonitor}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => onAssignMonitor(classMonitor ? 'TRANSFER' : 'ASSIGN')}
            disabled={
              isSubmittingMonitor || !selectedCandidateMaSV || selectedCandidateMaSV === classMonitor?.username
            }
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmittingMonitor ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                <span>
                  {classMonitor ? 'Xác Nhận Chuyển Lớp Trưởng' : 'Xác Nhận Chỉ Định Lớp Trưởng'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
