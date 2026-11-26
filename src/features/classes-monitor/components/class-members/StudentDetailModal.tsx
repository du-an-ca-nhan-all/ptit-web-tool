import React from 'react';
import { Calendar, X } from 'lucide-react';
import { ExamRecord } from '../../types/class.types';
import StudentDetailExamList from './StudentDetailExamList';

interface StudentDetailModalProps {
  student: any | null;
  selectedClass: string;
  hasExamSchedule: boolean;
  onClose: () => void;
  onSelectStudentSchedule?: (studentId: string) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  onUpdateStudentDetail: React.Dispatch<React.SetStateAction<any | null>>;
}

export default function StudentDetailModal({
  student,
  selectedClass,
  hasExamSchedule,
  onClose,
  onSelectStudentSchedule,
  onTogglePostpone,
  onUpdateStudentDetail,
}: StudentDetailModalProps) {
  if (!student) return null;

  const handleUpdateExamPostponed = (ex: ExamRecord, nextStatus: boolean) => {
    onUpdateStudentDetail((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        exams: prev.exams.map((e: ExamRecord) =>
          (ex.id && e.id === ex.id) ||
          (e.MaMH === ex.MaMH && e.MAPTHI === ex.MAPTHI && e.NgayThi === ex.NgayThi && e.GioThi === ex.GioThi)
            ? { ...e, isPostponed: nextStatus }
            : e
        ),
      };
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
              {student.TenSV ? student.TenSV.charAt(0) : 'S'}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {student.HoLotSV} {student.TenSV}
                <span className="text-xs font-mono font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                  {student.MaSV}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Lớp {selectedClass}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 min-h-0">
          {/* Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Giới tính:</span>
              <span className="font-bold text-slate-800">{student.PHAI || 'Nam'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Ngày sinh:</span>
              <span className="font-bold text-slate-800">{student.NgaySinhC || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Lớp:</span>
              <span className="font-bold text-blue-600">{selectedClass}</span>
            </div>
            {student.phone && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">SĐT liên hệ:</span>
                <span className="font-mono font-bold text-slate-800">{student.phone}</span>
              </div>
            )}
            {student.note && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Ghi chú:</span>
                <span className="text-slate-700 italic">"{student.note}"</span>
              </div>
            )}
          </div>

          {/* Exam Schedule Section (Only when exam schedule is active) */}
          {hasExamSchedule && (
            <StudentDetailExamList
              exams={student.exams}
              onTogglePostpone={onTogglePostpone}
              onUpdateExamPostponed={handleUpdateExamPostponed}
            />
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {onSelectStudentSchedule ? (
            <button
              type="button"
              onClick={() => {
                const id = student.MaSV;
                onClose();
                onSelectStudentSchedule(id);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-200 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> Xem Lịch Thi Chi Tiết
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
