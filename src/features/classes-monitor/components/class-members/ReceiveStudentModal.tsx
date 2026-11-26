import React from 'react';
import { Search, X, UserPlus, Check } from 'lucide-react';

interface ReceiveStudentModalProps {
  isOpen: boolean;
  selectedClass: string;
  hasExamSchedule: boolean;
  searchGlobalQuery: string;
  onSearchGlobalQueryChange: (query: string) => void;
  globalSearchResults: any[];
  isSearchingGlobal: boolean;
  selectedStudentToReceive: any | null;
  onSelectStudentToReceive: (student: any) => void;
  receiveReason: string;
  onReceiveReasonChange: (reason: string) => void;
  isProcessingAction: boolean;
  onClose: () => void;
  onConfirmReceive: (student: any) => void;
}

export default function ReceiveStudentModal({
  isOpen,
  selectedClass,
  hasExamSchedule,
  searchGlobalQuery,
  onSearchGlobalQueryChange,
  globalSearchResults,
  isSearchingGlobal,
  selectedStudentToReceive,
  onSelectStudentToReceive,
  receiveReason,
  onReceiveReasonChange,
  isProcessingAction,
  onClose,
  onConfirmReceive,
}: ReceiveStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Tiếp Nhận Sinh Viên Vào Lớp {selectedClass}
              </h3>
              <p className="text-xs text-slate-500">
                Tìm kiếm sinh viên từ lớp khác hoặc nhập mã sinh viên để quản lý
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 min-h-0">
          {/* Search Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tìm kiếm sinh viên toàn trường (Mã SV, Họ tên, Lớp cũ...)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Nhập Mã SV (ví dụ: B24DTCN...) hoặc Họ tên sinh viên..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchGlobalQuery}
                onChange={(e) => onSearchGlobalQueryChange(e.target.value)}
              />
              {isSearchingGlobal && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          {/* Search Results List */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Kết quả tìm kiếm ({globalSearchResults.length})
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                {searchGlobalQuery.trim().length >= 2 ? (
                  <div>
                    <p className="font-semibold text-slate-600 mb-1">
                      Không tìm thấy sinh viên nào khớp với "{searchGlobalQuery}"
                    </p>
                    <p className="text-[11px]">
                      Bạn có thể tiếp nhận trực tiếp bằng cách nhập Mã SV và nhấn Tiếp Nhận.
                    </p>
                    <button
                      onClick={() => {
                        onConfirmReceive({
                          maSV: searchGlobalQuery.trim().toUpperCase(),
                          hoTen: searchGlobalQuery.trim().toUpperCase(),
                          ten: searchGlobalQuery.trim().toUpperCase(),
                          maLop: 'Chưa rõ',
                        });
                      }}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                    >
                      + Tiếp nhận trực tiếp Mã SV "{searchGlobalQuery.trim().toUpperCase()}"
                    </button>
                  </div>
                ) : (
                  'Nhập ít nhất 2 ký tự để tìm kiếm sinh viên...'
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                {globalSearchResults.map((st) => (
                  <div
                    key={st.maSV}
                    className={`p-3.5 flex items-center justify-between hover:bg-indigo-50/40 transition-colors ${
                      selectedStudentToReceive?.maSV === st.maSV ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                          {st.maSV}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{st.hoTen}</span>
                        <span className="text-[11px] text-slate-400">({st.gioiTinh})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>
                          Lớp hiện tại: <strong className="text-slate-700">{st.maLop}</strong>
                        </span>
                        {hasExamSchedule && (
                          <>
                            <span>•</span>
                            <span>{st.examCount || 0} môn thi</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectStudentToReceive(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        selectedStudentToReceive?.maSV === st.maSV
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                      }`}
                    >
                      {selectedStudentToReceive?.maSV === st.maSV ? 'Đã Chọn ✓' : 'Chọn SV Này'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receive Reason / Note */}
          {selectedStudentToReceive && (
            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Sinh viên được chọn:{' '}
                  <strong className="text-indigo-700">
                    {selectedStudentToReceive.hoTen} ({selectedStudentToReceive.maSV})
                  </strong>
                </span>
                <span className="text-slate-500">
                  Chuyển từ lớp: <strong>{selectedStudentToReceive.maLop}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Lý do tiếp nhận / Ghi chú điều chuyển (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chuyển biên chế theo quyết định khoa / Học ghép..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={receiveReason}
                  onChange={(e) => onReceiveReasonChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            disabled={!selectedStudentToReceive || isProcessingAction}
            onClick={() => onConfirmReceive(selectedStudentToReceive)}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
          >
            {isProcessingAction ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Xác Nhận Tiếp Nhận Vào Lớp
          </button>
        </div>
      </div>
    </div>
  );
}
