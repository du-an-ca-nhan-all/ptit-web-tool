'use client';

import React from 'react';
import { AlertCircle, Flame, Plus, X } from 'lucide-react';
import { CourseRegistrationHookResult } from './types';

interface CourseRegistrationModalsProps {
  openCourses: CourseRegistrationHookResult['openCourses'];
  showAddSniperModal: boolean;
  setShowAddSniperModal: (show: boolean) => void;
  manualSniperSubjectCode: string;
  setManualSniperSubjectCode: (code: string) => void;
  manualSniperGroupId: string;
  setManualSniperGroupId: (id: string) => void;
  manualSniperAnyGroup: boolean;
  addSniperTarget: CourseRegistrationHookResult['addSniperTarget'];
  confirmCancelGroup: any | null;
  setConfirmCancelGroup: (group: any | null) => void;
  handleCancel: CourseRegistrationHookResult['handleCancel'];
}

export function CourseRegistrationModals({
  openCourses,
  showAddSniperModal,
  setShowAddSniperModal,
  manualSniperSubjectCode,
  setManualSniperSubjectCode,
  manualSniperGroupId,
  setManualSniperGroupId,
  manualSniperAnyGroup,
  addSniperTarget,
  confirmCancelGroup,
  setConfirmCancelGroup,
  handleCancel,
}: CourseRegistrationModalsProps) {
  return (
    <>
      {/* ============================================================= */}
      {/* MODAL: ADD CUSTOM SNIPER TARGET */}
      {/* ============================================================= */}
      {showAddSniperModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddSniperModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 fill-current" />
                <h3 className="text-base font-black">Thêm Môn Vào Auto Canh Slot</h3>
              </div>
              <button
                onClick={() => setShowAddSniperModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã môn học hoặc chọn từ danh sách mở:</label>
                <input
                  type="text"
                  value={manualSniperSubjectCode}
                  onChange={(e) => setManualSniperSubjectCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: TAB1, TT03, BAS1201..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick Select from Open Courses */}
              <div>
                <label className="font-bold text-slate-500 block mb-1 text-[11px]">Hoặc chọn nhanh môn đang mở:</label>
                <select
                  onChange={(e) => {
                    const code = e.target.value;
                    if (code) {
                      setManualSniperSubjectCode(code);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="">-- Chọn môn học từ danh sách mở --</option>
                  {openCourses.ds_mon_hoc?.map((m) => (
                    <option key={m.ma} value={m.ma}>
                      {m.ma} - {m.ten}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                💡 Bot sẽ ưu tiên đăng ký bất kỳ nhóm tổ nào còn slot trống thuộc mã môn này ngay khi phát hiện.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSniperModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!manualSniperSubjectCode.trim()) {
                      alert('Vui lòng nhập mã môn học');
                      return;
                    }
                    const matchedSubj = openCourses.ds_mon_hoc?.find(
                      (m) => m.ma.toUpperCase() === manualSniperSubjectCode.trim().toUpperCase()
                    );
                    addSniperTarget({
                      maMon: manualSniperSubjectCode.trim().toUpperCase(),
                      tenMon: matchedSubj?.ten || manualSniperSubjectCode.trim().toUpperCase(),
                      idToHoc: manualSniperGroupId || undefined,
                      autoAnyGroup: manualSniperAnyGroup,
                    });
                    setManualSniperSubjectCode('');
                    setManualSniperGroupId('');
                    setShowAddSniperModal(false);
                  }}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Hàng Đợi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CONFIRM CANCEL COURSE REGISTRATION */}
      {/* ============================================================= */}
      {confirmCancelGroup && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmCancelGroup(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-black">Xác Nhận Hủy Môn Học</h3>
              </div>
              <button
                onClick={() => setConfirmCancelGroup(null)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-slate-800 text-sm">
                Bạn có chắc chắn muốn hủy đăng ký môn học:{' '}
                <strong className="text-rose-600">
                  {confirmCancelGroup.ten_mon || confirmCancelGroup.ma_mon} (Nhóm {confirmCancelGroup.nhom_to})
                </strong>
                ?
              </p>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Lưu ý: Sau khi hủy môn, slot của bạn sẽ được giải phóng ngay lập tức cho sinh viên khác. Bạn có thể không thể đăng ký lại nếu lớp đã kín chỗ.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmCancelGroup(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Không, Quay Lại
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = confirmCancelGroup.id_to_hoc;
                    setConfirmCancelGroup(null);
                    await handleCancel(id);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Xác Nhận Hủy Môn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
