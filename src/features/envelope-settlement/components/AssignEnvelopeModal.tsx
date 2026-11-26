import React from 'react';
import { X, Coffee, Hand } from 'lucide-react';
import { AssignEnvelopeModalProps } from './assign-envelope-modal/types';
import { useAssignEnvelopeForm } from './assign-envelope-modal/useAssignEnvelopeForm';
import { ClassSelectorSection } from './assign-envelope-modal/ClassSelectorSection';
import { AssigneeSelectorSection } from './assign-envelope-modal/AssigneeSelectorSection';
import { RoomPriceSection } from './assign-envelope-modal/RoomPriceSection';

export default function AssignEnvelopeModal({
  isOpen,
  onClose,
  session,
  initialClass,
  records = [],
  loginUsers = [],
  currentAssignment,
  onConfirm,
  isLoading = false,
}: AssignEnvelopeModalProps) {
  const {
    selectedClass,
    setSelectedClass,
    assigneeType,
    setAssigneeType,
    assistantStudentId,
    setAssistantStudentId,
    assistantStudentName,
    setAssistantStudentName,
    studentSearch,
    setStudentSearch,
    note,
    setNote,
    isCustomPrice,
    defaultPrice,
    roomClasses,
    classMonitor,
    filteredStudents,
    currentPriceVal,
    handlePriceChange,
    handleSelectPresetPrice,
    handleResetDefaultPrice,
    handleSubmit,
  } = useAssignEnvelopeForm({
    isOpen,
    onClose,
    session,
    initialClass,
    records,
    loginUsers,
    currentAssignment,
    onConfirm,
  });

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Xác Nhận Phụ Trách Nước Uống & Hỗ Trợ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phòng <strong className="text-rose-600 font-bold">{session.room}</strong> • {session.date} ({session.time})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Subject banner */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Môn thi</span>
            <span className="font-bold text-slate-800 text-sm leading-snug">{session.subject}</span>
            <span className="text-xs text-slate-500 font-mono">Mã môn: {session.subjectCode}</span>
          </div>

          {/* 1. Select Class */}
          <ClassSelectorSection
            roomClasses={roomClasses}
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />

          {/* 2. Assignee: Monitor vs Assistant Student */}
          <AssigneeSelectorSection
            assigneeType={assigneeType}
            onChangeAssigneeType={setAssigneeType}
            classMonitor={classMonitor}
            assistantStudentId={assistantStudentId}
            onChangeAssistantStudentId={setAssistantStudentId}
            assistantStudentName={assistantStudentName}
            onChangeAssistantStudentName={setAssistantStudentName}
            studentSearch={studentSearch}
            onChangeStudentSearch={setStudentSearch}
            filteredStudents={filteredStudents}
          />

          {/* 3. Room Price / Custom Price */}
          <RoomPriceSection
            defaultPrice={defaultPrice}
            currentPriceVal={currentPriceVal}
            isCustomPrice={isCustomPrice}
            onPriceChange={handlePriceChange}
            onSelectPresetPrice={handleSelectPresetPrice}
            onResetDefaultPrice={handleResetDefaultPrice}
          />

          {/* 4. Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đã mua nước trước 15p, sinh viên mua nước ca 2..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-700"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedClass || (assigneeType === 'ASSISTANT' && !assistantStudentId)}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Đang lưu vào CSDL...' : 'Lưu Xác Nhận'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
