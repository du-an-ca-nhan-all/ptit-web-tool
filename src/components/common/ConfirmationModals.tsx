'use client';

import React from 'react';

interface ConfirmStudentModalProps {
  studentId: string | null;
  onClose: () => void;
  onConfirm: (studentId: string) => void;
}

export function ConfirmStudentModal({
  studentId,
  onClose,
  onConfirm,
}: ConfirmStudentModalProps) {
  if (!studentId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Lọc theo sinh viên</h3>
        <p className="text-slate-600 mb-6">
          Bạn có muốn xem toàn bộ lịch thi của sinh viên có mã <strong>{studentId}</strong>{' '}
          không?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(studentId)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmClassModalProps {
  classCode: string | null;
  onClose: () => void;
  onConfirm: (classCode: string) => void;
}

export function ConfirmClassModal({
  classCode,
  onClose,
  onConfirm,
}: ConfirmClassModalProps) {
  if (!classCode) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Xem thông tin lớp</h3>
        <p className="text-slate-600 mb-6">
          Bạn có muốn xem danh sách thành viên của lớp <strong>{classCode}</strong> không?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(classCode)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}
